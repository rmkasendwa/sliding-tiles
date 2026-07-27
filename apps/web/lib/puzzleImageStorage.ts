export type StoredPuzzleImage = {
  blob: Blob;
  height: number;
  name: string;
  size: number;
  type: string;
  updatedAt: number;
  width: number;
};

const DATABASE_NAME = 'sliding-tiles';
const DATABASE_VERSION = 1;
const IMAGE_KEY = 'current';
const STORE_NAME = 'puzzle-images';

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
  const stored = await runTransaction<StoredPuzzleImage | undefined>(
    'readonly',
    (store) => store.get(IMAGE_KEY),
  );

  if (
    !stored ||
    !(stored.blob instanceof Blob) ||
    !stored.name ||
    !stored.width ||
    !stored.height
  ) {
    return null;
  }

  return stored;
}

export function storePuzzleImage(
  blob: Blob,
  metadata: Pick<StoredPuzzleImage, 'height' | 'name' | 'width'>,
) {
  const stored: StoredPuzzleImage = {
    blob,
    height: metadata.height,
    name: metadata.name,
    size: blob.size,
    type: blob.type,
    updatedAt: Date.now(),
    width: metadata.width,
  };

  return runTransaction<IDBValidKey>('readwrite', (store) =>
    store.put(stored, IMAGE_KEY),
  ).then(() => undefined);
}
