import type {
  AuthRecord,
  DisplayRecord,
  HistoryRecord,
  InstalledImage,
  InstalledPack,
  SelectionRecord,
  WorkshopSettings,
} from './types';

const DB_NAME = 'cultivation-illustration-workshop';
const DB_VERSION = 2;

type StoreName = 'packs' | 'images' | 'settings' | 'auth' | 'selections' | 'history' | 'displays';

let databasePromise: Promise<IDBDatabase> | null = null;

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
    request.onerror = () => reject(request.error ?? new Error('IndexedDB 请求失败'));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB 事务已中止'));
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB 事务失败'));
  });
}

export function openWorkshopDatabase(): Promise<IDBDatabase> {
  if (databasePromise) return databasePromise;
  databasePromise = new Promise((resolve, reject) => {
    const request = idbFactory().open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('packs')) db.createObjectStore('packs', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('images')) db.createObjectStore('images', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'key' });
      if (!db.objectStoreNames.contains('auth')) db.createObjectStore('auth', { keyPath: 'key' });
      if (!db.objectStoreNames.contains('selections')) db.createObjectStore('selections', { keyPath: 'key' });
      if (!db.objectStoreNames.contains('history')) db.createObjectStore('history', { keyPath: 'key' });
      if (!db.objectStoreNames.contains('displays')) db.createObjectStore('displays', { keyPath: 'key' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('无法打开创意工坊数据库'));
    request.onblocked = () => reject(new Error('创意工坊数据库升级被其他页面阻塞'));
  });
  return databasePromise;
}

export async function getRecord<T>(storeName: StoreName, key: IDBValidKey): Promise<T | undefined> {
  const db = await openWorkshopDatabase();
  return (await requestResult(db.transaction(storeName, 'readonly').objectStore(storeName).get(key))) as T | undefined;
}

export async function getAllRecords<T>(storeName: StoreName): Promise<T[]> {
  const db = await openWorkshopDatabase();
  return (await requestResult(db.transaction(storeName, 'readonly').objectStore(storeName).getAll())) as T[];
}

export async function putRecord<T>(storeName: StoreName, value: T): Promise<void> {
  const db = await openWorkshopDatabase();
  const transaction = db.transaction(storeName, 'readwrite');
  transaction.objectStore(storeName).put(value);
  await transactionDone(transaction);
}

export async function deleteRecord(storeName: StoreName, key: IDBValidKey): Promise<void> {
  const db = await openWorkshopDatabase();
  const transaction = db.transaction(storeName, 'readwrite');
  transaction.objectStore(storeName).delete(key);
  await transactionDone(transaction);
}

export async function clearStore(storeName: StoreName): Promise<void> {
  const db = await openWorkshopDatabase();
  const transaction = db.transaction(storeName, 'readwrite');
  transaction.objectStore(storeName).clear();
  await transactionDone(transaction);
}

export async function replaceInstalledPack(pack: InstalledPack, images: InstalledImage[]): Promise<void> {
  const db = await openWorkshopDatabase();
  const transaction = db.transaction(['packs', 'images'], 'readwrite');
  const packStore = transaction.objectStore('packs');
  const imageStore = transaction.objectStore('images');
  const existing = (await requestResult(imageStore.getAll())) as InstalledImage[];
  const desiredIds = new Set(images.map(image => image.id));
  for (const image of existing) {
    if (image.packId === pack.id && !desiredIds.has(image.id)) imageStore.delete(image.id);
  }
  for (const image of images) imageStore.put(image);
  packStore.put(pack);
  await transactionDone(transaction);
}

export async function uninstallPack(packId: string): Promise<void> {
  const db = await openWorkshopDatabase();
  const transaction = db.transaction(['packs', 'images'], 'readwrite');
  transaction.objectStore('packs').delete(packId);
  const imageStore = transaction.objectStore('images');
  const images = (await requestResult(imageStore.getAll())) as InstalledImage[];
  for (const image of images) if (image.packId === packId) imageStore.delete(image.id);
  await transactionDone(transaction);
}

export const getInstalledPacks = (): Promise<InstalledPack[]> => getAllRecords<InstalledPack>('packs');
export const getInstalledImage = (id: string): Promise<InstalledImage | undefined> => getRecord('images', id);
export const getSettingsRecord = (): Promise<WorkshopSettings | undefined> => getRecord('settings', 'main');
export const putSettingsRecord = (settings: WorkshopSettings): Promise<void> => putRecord('settings', settings);
export const getAuthRecord = (): Promise<AuthRecord | undefined> => getRecord('auth', 'session');
export const putAuthRecord = (auth: AuthRecord): Promise<void> => putRecord('auth', auth);
export const clearAuthRecord = (): Promise<void> => deleteRecord('auth', 'session');
export const getSelection = (key: string): Promise<SelectionRecord | undefined> => getRecord('selections', key);
export const putSelection = (record: SelectionRecord): Promise<void> => putRecord('selections', record);
export const clearSelections = (): Promise<void> => clearStore('selections');
export const getHistory = (key: string): Promise<HistoryRecord | undefined> => getRecord('history', key);
export const putHistory = (record: HistoryRecord): Promise<void> => putRecord('history', record);
export const getDisplay = (key: string): Promise<DisplayRecord | undefined> => getRecord('displays', key);
export const putDisplay = (record: DisplayRecord): Promise<void> => putRecord('displays', record);
