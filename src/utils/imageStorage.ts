const DB_NAME = 'meallog_images';
const STORE_NAME = 'images';
export interface StoredImage { id: string; dataUrl: string }

const openDB = (): Promise<IDBDatabase> => new Promise((resolve, reject) => {
  const request = indexedDB.open(DB_NAME, 1);
  request.onupgradeneeded = () => {
    if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

const write = async (images: StoredImage[], remove: string[] = [], replace = false): Promise<void> => {
  const db = await openDB();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      if (replace) store.clear();
      remove.forEach(id => store.delete(id));
      images.forEach(image => store.put(image));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error ?? new Error('사진 저장에 실패했습니다.'));
    });
  } finally { db.close(); }
};

export const saveImage = (id: string, dataUrl: string) => write([{ id, dataUrl }]);
export const deleteImage = (id: string) => write([], [id]);
export const replaceImages = (images: StoredImage[]) => write(images, [], true);

export const getAllImages = async (): Promise<StoredImage[]> => {
  const db = await openDB();
  try {
    return await new Promise<StoredImage[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally { db.close(); }
};

export const getImage = async (id: string): Promise<string | null> => {
  const db = await openDB();
  try {
    return await new Promise<string | null>((resolve, reject) => {
      const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(id);
      request.onsuccess = () => resolve(request.result?.dataUrl ?? null);
      request.onerror = () => reject(request.error);
    });
  } finally { db.close(); }
};
