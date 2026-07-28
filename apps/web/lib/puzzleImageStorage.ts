export type StoredPuzzleImage = {
  blob: Blob;
  height: number;
  id: string;
  name: string;
  size: number;
  type: string;
  updatedAt: number;
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
  const id =
    typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const stored: StoredPuzzleImage = {
    blob,
    height: metadata.height,
    id,
    name: metadata.name,
    size: blob.size,
    type: blob.type,
    updatedAt: Date.now(),
    width: metadata.width,
  };

  return runTransaction<IDBValidKey>('readwrite', (store) =>
    store.put(stored, id),
  )
    .then(() => selectStoredPuzzleImage(id))
    .then(() => id);
}

export function selectStoredPuzzleImage(id: string) {
  const selection: StoredPuzzleImageSelection = { selectedId: id };

  return runTransaction<IDBValidKey>('readwrite', (store) =>
    store.put(selection, SELECTED_IMAGE_KEY),
  ).then(() => undefined);
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
