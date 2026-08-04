import type {
  AuthRecord,
  DisplayRecord,
  HistoryRecord,
  InstalledImage,
  InstalledPack,
  InstalledWorldbookPack,
  SelectionRecord,
  WorkshopSettings,
  WorldbookReplacementRecord,
} from './types';

const DB_NAME = 'cultivation-illustration-workshop';
const WORLDBOOK_DB_NAME = 'cultivation-worldbook-workshop';
const WORLDBOOK_DB_VERSION = 1;

type StoreName = 'packs' | 'images' | 'settings' | 'auth' | 'selections' | 'history' | 'displays';
type WorldbookStoreName = 'worldbooks' | 'worldbook_replacements';

let databasePromise: Promise<IDBDatabase> | null = null;
let activeDatabase: IDBDatabase | null = null;
let worldbookDatabasePromise: Promise<IDBDatabase> | null = null;
let activeWorldbookDatabase: IDBDatabase | null = null;
let lifecycleListenersReady = false;

const DATABASE_UPGRADE_EVENT = 'cultivation-workshop-database-upgrade';
const DATABASE_BLOCK_TIMEOUT_MS = 15_000;

function closeActiveDatabase(): void {
  activeDatabase?.close();
  activeWorldbookDatabase?.close();
  activeDatabase = null;
  activeWorldbookDatabase = null;
  databasePromise = null;
  worldbookDatabasePromise = null;
}

function hostWindow(): Window {
  try {
    return window.parent ?? window;
  } catch {
    return window;
  }
}

function ensureDatabaseLifecycleListeners(): void {
  if (lifecycleListenersReady) return;
  lifecycleListenersReady = true;
  hostWindow().addEventListener(DATABASE_UPGRADE_EVENT, closeActiveDatabase);
  window.addEventListener('pagehide', closeActiveDatabase);
}

function requestOtherInstancesToClose(): void {
  try {
    hostWindow().dispatchEvent(new CustomEvent(DATABASE_UPGRADE_EVENT));
  } catch {
    // versionchange 事件仍可处理大多数跨页面升级场景。
  }
}

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
  ensureDatabaseLifecycleListeners();
  const opening = new Promise<IDBDatabase>((resolve, reject) => {
    // 不再指定更高版本：登录、设置和旧图包继续直接使用玩家已有的 v2/v3 数据库，
    // 世界书功能不会为了增加 object store 而阻塞整个创意工坊。
    const request = idbFactory().open(DB_NAME);
    let settled = false;
    let blockedTimer: number | undefined;
    const clearBlockedTimer = () => {
      if (blockedTimer !== undefined) window.clearTimeout(blockedTimer);
      blockedTimer = undefined;
    };
    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      clearBlockedTimer();
      reject(error);
    };
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
    request.onsuccess = () => {
      clearBlockedTimer();
      if (settled) {
        request.result.close();
        return;
      }
      settled = true;
      activeDatabase = request.result;
      activeDatabase.onversionchange = () => closeActiveDatabase();
      resolve(activeDatabase);
    };
    request.onerror = () => fail(request.error ?? new Error('无法打开创意工坊数据库'));
    request.onblocked = () => {
      console.warn('[创意工坊] 数据库升级正在等待其他页面释放旧连接');
      requestOtherInstancesToClose();
      if (blockedTimer === undefined) {
        blockedTimer = window.setTimeout(
          () => fail(new Error('创意工坊数据库升级超时；请关闭其他酒馆标签页，并刷新当前页面后重试')),
          DATABASE_BLOCK_TIMEOUT_MS,
        );
      }
    };
  });
  databasePromise = opening;
  void opening.catch(() => {
    if (databasePromise === opening) databasePromise = null;
  });
  return opening;
}

function openDedicatedWorldbookDatabase(): Promise<IDBDatabase> {
  if (worldbookDatabasePromise) return worldbookDatabasePromise;
  ensureDatabaseLifecycleListeners();
  const opening = new Promise<IDBDatabase>((resolve, reject) => {
    const request = idbFactory().open(WORLDBOOK_DB_NAME, WORLDBOOK_DB_VERSION);
    let settled = false;
    let blockedTimer: number | undefined;
    const clearBlockedTimer = () => {
      if (blockedTimer !== undefined) window.clearTimeout(blockedTimer);
      blockedTimer = undefined;
    };
    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      clearBlockedTimer();
      reject(error);
    };
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('worldbooks')) db.createObjectStore('worldbooks', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('worldbook_replacements')) {
        db.createObjectStore('worldbook_replacements', { keyPath: 'key' });
      }
    };
    request.onsuccess = () => {
      clearBlockedTimer();
      if (settled) {
        request.result.close();
        return;
      }
      settled = true;
      activeWorldbookDatabase = request.result;
      activeWorldbookDatabase.onversionchange = () => closeActiveDatabase();
      resolve(activeWorldbookDatabase);
    };
    request.onerror = () => fail(request.error ?? new Error('无法打开世界书创意工坊数据库'));
    request.onblocked = () => {
      requestOtherInstancesToClose();
      if (blockedTimer === undefined) {
        blockedTimer = window.setTimeout(
          () => fail(new Error('世界书创意工坊数据库初始化超时；请刷新当前页面后重试')),
          DATABASE_BLOCK_TIMEOUT_MS,
        );
      }
    };
  });
  worldbookDatabasePromise = opening;
  void opening.catch(() => {
    if (worldbookDatabasePromise === opening) worldbookDatabasePromise = null;
  });
  return opening;
}

async function openWorldbookDatabase(): Promise<IDBDatabase> {
  const legacyDatabase = await openWorkshopDatabase();
  if (
    legacyDatabase.objectStoreNames.contains('worldbooks') &&
    legacyDatabase.objectStoreNames.contains('worldbook_replacements')
  ) {
    // 兼容已经成功升级至 v3 并写入过世界书记录的测试环境。
    return legacyDatabase;
  }
  return openDedicatedWorldbookDatabase();
}

async function getAllWorldbookRecords<T>(storeName: WorldbookStoreName): Promise<T[]> {
  const db = await openWorldbookDatabase();
  return (await requestResult(db.transaction(storeName, 'readonly').objectStore(storeName).getAll())) as T[];
}

async function putWorldbookRecord<T>(storeName: WorldbookStoreName, value: T): Promise<void> {
  const db = await openWorldbookDatabase();
  const transaction = db.transaction(storeName, 'readwrite');
  transaction.objectStore(storeName).put(value);
  await transactionDone(transaction);
}

async function deleteWorldbookRecord(storeName: WorldbookStoreName, key: IDBValidKey): Promise<void> {
  const db = await openWorldbookDatabase();
  const transaction = db.transaction(storeName, 'readwrite');
  transaction.objectStore(storeName).delete(key);
  await transactionDone(transaction);
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
export const getInstalledWorldbooks = (): Promise<InstalledWorldbookPack[]> =>
  getAllWorldbookRecords<InstalledWorldbookPack>('worldbooks');
export const putInstalledWorldbook = (pack: InstalledWorldbookPack): Promise<void> =>
  putWorldbookRecord('worldbooks', pack);
export const deleteInstalledWorldbook = (packId: string): Promise<void> =>
  deleteWorldbookRecord('worldbooks', packId);
export const getWorldbookReplacements = (): Promise<WorldbookReplacementRecord[]> =>
  getAllWorldbookRecords<WorldbookReplacementRecord>('worldbook_replacements');
export const putWorldbookReplacement = (record: WorldbookReplacementRecord): Promise<void> =>
  putWorldbookRecord('worldbook_replacements', record);
export const deleteWorldbookReplacement = (key: string): Promise<void> =>
  deleteWorldbookRecord('worldbook_replacements', key);
