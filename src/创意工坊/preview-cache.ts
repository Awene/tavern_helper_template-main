interface CachedPreviewImage {
  id: string;
  blob: Blob;
  storedAt: number;
}

const DATABASE_NAME = 'cultivation-workshop-image-cache';
const DATABASE_VERSION = 1;
const STORE_NAME = 'previews';
const MAX_CACHE_BYTES = 256 * 1024 * 1024;
const MAX_CACHE_ENTRIES = 300;

let databasePromise: Promise<IDBDatabase> | null = null;
let activeDatabase: IDBDatabase | null = null;
let prunePromise: Promise<void> | null = null;
let lastPrunedAt = 0;

function idbFactory(): IDBFactory {
  try {
    return window.parent.indexedDB ?? indexedDB;
  } catch {
    return indexedDB;
  }
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('图片缓存请求失败'));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error ?? new Error('图片缓存事务已中止'));
    transaction.onerror = () => reject(transaction.error ?? new Error('图片缓存事务失败'));
  });
}

function closeDatabase(): void {
  activeDatabase?.close();
  activeDatabase = null;
  databasePromise = null;
}

function openDatabase(): Promise<IDBDatabase> {
  if (databasePromise) return databasePromise;
  const opening = new Promise<IDBDatabase>((resolve, reject) => {
    const request = idbFactory().open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => {
      activeDatabase = request.result;
      activeDatabase.onversionchange = closeDatabase;
      resolve(activeDatabase);
    };
    request.onerror = () => reject(request.error ?? new Error('无法打开图片缓存'));
  });
  databasePromise = opening;
  void opening.catch(() => {
    if (databasePromise === opening) databasePromise = null;
  });
  return opening;
}

export async function getCachedPreviewImage(id: string): Promise<Blob | undefined> {
  const database = await openDatabase();
  const record = (await requestResult(database.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(id))) as
    CachedPreviewImage | undefined;
  return record?.blob;
}

export async function putCachedPreviewImage(id: string, blob: Blob): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, 'readwrite');
  transaction.objectStore(STORE_NAME).put({ id, blob, storedAt: Date.now() } satisfies CachedPreviewImage);
  await transactionDone(transaction);
  schedulePrune();
}

export async function deleteCachedPreviewImage(id: string): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, 'readwrite');
  transaction.objectStore(STORE_NAME).delete(id);
  await transactionDone(transaction);
}

function schedulePrune(): void {
  if (prunePromise || Date.now() - lastPrunedAt < 60_000) return;
  prunePromise = pruneCache()
    .catch(error => console.warn('[创意工坊] 清理图片缓存失败:', error))
    .finally(() => {
      lastPrunedAt = Date.now();
      prunePromise = null;
    });
}

async function pruneCache(): Promise<void> {
  const database = await openDatabase();
  const records = (await requestResult(
    database.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAll(),
  )) as CachedPreviewImage[];
  records.sort((left, right) => right.storedAt - left.storedAt);
  let retainedBytes = 0;
  const expiredIds: string[] = [];
  for (const [index, record] of records.entries()) {
    retainedBytes += record.blob.size;
    if (index >= MAX_CACHE_ENTRIES || retainedBytes > MAX_CACHE_BYTES) expiredIds.push(record.id);
  }
  if (!expiredIds.length) return;
  const transaction = database.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  for (const id of expiredIds) store.delete(id);
  await transactionDone(transaction);
}

window.addEventListener('pagehide', closeDatabase);
