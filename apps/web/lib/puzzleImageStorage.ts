export type StoredPuzzleImage = {
  blob: Blob;
  contentHash?: string;
  height: number;
  id: string;
  name: string;
  size: number;
  type: string;
  updatedAt: number;
  width: number;
};

export type PuzzleImageImport = {
  blob: Blob;
  height: number;
  name: string;
  width: number;
};

export type PuzzleImageImportResult = {
  duplicateCount: number;
  imported: StoredPuzzleImage[];
};

type RemotePuzzleImage = {
  contentHash: string;
  contentType: string;
  height: number;
  id: string;
  name: string;
  size: number;
  updatedAt: string;
  width: number;
};

const DATABASE_NAME = 'sliding-tiles';
const DATABASE_VERSION = 1;
const IMAGE_KEY = 'current';
const SELECTED_IMAGE_KEY = 'selected-image';
const STORE_NAME = 'puzzle-images';

type StoredPuzzleImageSelection = {
  image?: Pick<StoredPuzzleImage, 'height' | 'name' | 'width'> & {
    url: string;
  };
  selectedId?: string;
};

function isStoredPuzzleImage(
  stored: Partial<StoredPuzzleImage> | undefined,
): stored is StoredPuzzleImage {
  return Boolean(
    stored &&
      stored.blob instanceof Blob &&
      stored.name &&
      stored.width &&
      stored.height,
  );
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('Persistent browser storage is unavailable.'));
      return;
    }

    const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onerror = () =>
      reject(request.error ?? new Error('Could not open browser storage.'));
    request.onblocked = () =>
      reject(new Error('Browser storage is blocked by another open page.'));
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

function runTransaction<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDatabase().then(
    (database) =>
      new Promise<T>((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, mode);
        const request = operation(transaction.objectStore(STORE_NAME));
        let result: T;

        request.onsuccess = () => {
          result = request.result;
        };
        request.onerror = () =>
          reject(request.error ?? new Error('Browser storage request failed.'));
        transaction.onabort = () =>
          reject(
            transaction.error ?? new Error('Browser storage transaction failed.'),
          );
        transaction.oncomplete = () => {
          database.close();
          resolve(result);
        };
      }),
  );
}

async function hashBlob(blob: Blob) {
  const digest = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer());
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
}

export async function loadStoredPuzzleImage() {
  const [images, selection] = await Promise.all([
    loadStoredPuzzleImages(),
    runTransaction<StoredPuzzleImageSelection | undefined>(
      'readonly',
      (store) => store.get(SELECTED_IMAGE_KEY),
    ),
  ]);

  return selection?.image ??
    images.find((image) => image.id === selection?.selectedId) ??
    images[0] ??
    null;
}

export async function loadStoredPuzzleImages() {
  const storedImages = await runTransaction<
    Array<Partial<StoredPuzzleImage>>
  >('readonly', (store) => store.getAll());

  return storedImages
    .filter(isStoredPuzzleImage)
    .map((stored) => ({
      ...stored,
      // Images saved before the gallery used the fixed `current` key.
      id: stored.id || IMAGE_KEY,
    }))
    .sort((first, second) => second.updatedAt - first.updatedAt);
}

export function storePuzzleImage(
  blob: Blob,
  metadata: Pick<StoredPuzzleImage, 'height' | 'name' | 'width'>,
) {
  return importStoredPuzzleImages([{ blob, ...metadata }]).then(
    async ({ imported }) => {
      const id =
        imported[0]?.id ??
        (await findStoredPuzzleImageByContents(blob))?.id;
      if (!id) throw new Error('Could not save the puzzle image.');
      await selectStoredPuzzleImage(id);
      return id;
    },
  );
}

async function findStoredPuzzleImageByContents(blob: Blob) {
  const contentHash = await hashBlob(blob);
  const images = await loadStoredPuzzleImages();
  const hashes = await Promise.all(
    images.map(async (image) => image.contentHash ?? hashBlob(image.blob)),
  );
  return images.find((_, index) => hashes[index] === contentHash);
}

export async function importStoredPuzzleImages(
  images: PuzzleImageImport[],
): Promise<PuzzleImageImportResult> {
  if (!images.length) return { duplicateCount: 0, imported: [] };

  const existingImages = await loadStoredPuzzleImages();
  const existingHashes = new Set(
    await Promise.all(
      existingImages.map(
        async (image) => image.contentHash ?? hashBlob(image.blob),
      ),
    ),
  );
  const selectedHashes = new Set<string>();
  const imported: StoredPuzzleImage[] = [];
  let duplicateCount = 0;

  for (const image of images) {
    const contentHash = await hashBlob(image.blob);
    if (existingHashes.has(contentHash) || selectedHashes.has(contentHash)) {
      duplicateCount += 1;
      continue;
    }

    selectedHashes.add(contentHash);
    imported.push({
      ...image,
      contentHash,
      id: `sha256-${contentHash}`,
      size: image.blob.size,
      type: image.blob.type,
      updatedAt: Date.now(),
    });
  }

  if (!imported.length) return { duplicateCount, imported };

  await openDatabase().then(
    (database) =>
      new Promise<void>((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        imported.forEach((image) => store.put(image, image.id));
        transaction.onabort = () =>
          reject(
            transaction.error ?? new Error('Browser storage transaction failed.'),
          );
        transaction.onerror = () =>
          reject(
            transaction.error ?? new Error('Browser storage transaction failed.'),
          );
        transaction.oncomplete = () => {
          database.close();
          resolve();
        };
      }),
  );

  return { duplicateCount, imported };
}

let activeSynchronization: Promise<void> | null = null;

/** Reconciles the authenticated user's server library with the IndexedDB cache. */
export function synchronizeStoredPuzzleImages() {
  if (activeSynchronization) return activeSynchronization;
  activeSynchronization = synchronize().finally(() => {
    activeSynchronization = null;
  });
  return activeSynchronization;
}

async function synchronize() {
  const response = await fetch('/api/puzzle-images', { cache: 'no-store' });
  if (response.status === 401) return;
  if (!response.ok) throw new Error('Could not load synchronized puzzle images.');
  const { images: remoteImages, selectedContentHash } = (await response.json()) as {
    images: RemotePuzzleImage[];
    selectedContentHash: string | null;
  };
  const localSelection = await runTransaction<StoredPuzzleImageSelection | undefined>(
    'readonly',
    (store) => store.get(SELECTED_IMAGE_KEY),
  );
  const localImages = await loadStoredPuzzleImages();
  const localHashes = new Set(
    await Promise.all(localImages.map((image) => image.contentHash ?? hashBlob(image.blob))),
  );
  const missingRemoteImages = remoteImages.filter((image) => !localHashes.has(image.contentHash));

  const downloads = await Promise.all(
    missingRemoteImages.map(async (image) => {
      const imageResponse = await fetch(`/api/puzzle-images/${encodeURIComponent(image.id)}`);
      if (!imageResponse.ok) throw new Error('Could not download a synchronized puzzle image.');
      return {
        blob: await imageResponse.blob(),
        height: image.height,
        name: image.name,
        width: image.width,
      };
    }),
  );
  await importStoredPuzzleImages(downloads);

  if (selectedContentHash) {
    const synchronizedImages = await loadStoredPuzzleImages();
    const selectedImage = synchronizedImages.find(
      (image) => image.contentHash === selectedContentHash,
    );
    if (selectedImage) await saveLocalSelection(selectedImage.id);
  }

  const remoteHashes = new Set(remoteImages.map((image) => image.contentHash));
  await Promise.all(
    localImages.map(async (image) => {
      const contentHash = image.contentHash ?? (await hashBlob(image.blob));
      if (remoteHashes.has(contentHash)) return;
      const formData = new FormData();
      formData.set('contentHash', contentHash);
      formData.set('file', image.blob, image.name);
      formData.set('height', String(image.height));
      formData.set('name', image.name);
      formData.set('width', String(image.width));
      const uploadResponse = await fetch('/api/puzzle-images', { body: formData, method: 'POST' });
      if (!uploadResponse.ok && uploadResponse.status !== 401) {
        throw new Error('Could not synchronize a puzzle image.');
      }
    }),
  );

  if (!selectedContentHash && localSelection?.selectedId) {
    const selectedImage = localImages.find(
      (image) => image.id === localSelection.selectedId,
    );
    if (selectedImage) {
      await saveRemoteSelection(
        selectedImage.contentHash ?? (await hashBlob(selectedImage.blob)),
      );
    }
  }
}

function saveLocalSelection(id: string) {
  const selection: StoredPuzzleImageSelection = { selectedId: id };

  return runTransaction<IDBValidKey>('readwrite', (store) =>
    store.put(selection, SELECTED_IMAGE_KEY),
  ).then(() => undefined);
}

async function saveRemoteSelection(contentHash: string) {
  const response = await fetch('/api/puzzle-images', {
    body: JSON.stringify({ contentHash }),
    headers: { 'Content-Type': 'application/json' },
    method: 'PUT',
  });
  if (!response.ok && response.status !== 401) {
    throw new Error('Could not synchronize the selected puzzle image.');
  }
}

export async function selectStoredPuzzleImage(id: string) {
  await saveLocalSelection(id);
  await synchronizeStoredPuzzleImages();
  const image = (await loadStoredPuzzleImages()).find(
    (candidate) => candidate.id === id,
  );
  if (!image) throw new Error('Could not find the selected puzzle image.');
  await saveRemoteSelection(image.contentHash ?? (await hashBlob(image.blob)));
  await saveLocalSelection(id);
}

export function selectExternalPuzzleImage(
  image: Pick<StoredPuzzleImage, 'height' | 'name' | 'width'> & {
    url: string;
  },
) {
  const selection: StoredPuzzleImageSelection = { image };

  return runTransaction<IDBValidKey>('readwrite', (store) =>
    store.put(selection, SELECTED_IMAGE_KEY),
  ).then(() => undefined);
}

export async function deleteStoredPuzzleImage(id: string) {
  const image = (await loadStoredPuzzleImages()).find((candidate) => candidate.id === id);
  await openDatabase().then(
    (database) =>
      new Promise<void>((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const selectionRequest =
          store.get(SELECTED_IMAGE_KEY) as IDBRequest<
            StoredPuzzleImageSelection | undefined
          >;

        store.delete(id);
        selectionRequest.onsuccess = () => {
          if (selectionRequest.result?.selectedId === id) {
            store.delete(SELECTED_IMAGE_KEY);
          }
        };
        transaction.onabort = () =>
          reject(
            transaction.error ?? new Error('Browser storage transaction failed.'),
          );
        transaction.onerror = () =>
          reject(
            transaction.error ?? new Error('Browser storage transaction failed.'),
          );
        transaction.oncomplete = () => {
          database.close();
          resolve();
        };
      }),
  );

  if (!image) return;
  const response = await fetch('/api/puzzle-images', { cache: 'no-store' });
  if (response.status === 401) return;
  if (!response.ok) throw new Error('Could not load synchronized puzzle images.');
  const { images } = (await response.json()) as { images: RemotePuzzleImage[] };
  const contentHash = image.contentHash ?? (await hashBlob(image.blob));
  const remote = images.find((candidate) => candidate.contentHash === contentHash);
  if (!remote) return;
  const deleteResponse = await fetch(`/api/puzzle-images/${encodeURIComponent(remote.id)}`, { method: 'DELETE' });
  if (!deleteResponse.ok && deleteResponse.status !== 404) {
    throw new Error('Could not delete the synchronized puzzle image.');
  }
}
