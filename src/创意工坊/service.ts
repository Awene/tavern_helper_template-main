import { WorkshopApi } from './api';
import { sha256Hex } from './image';
import { createOfflinePack, readOfflinePack } from './offline-pack';
import {
  getAllRecords,
  getAuthRecord,
  getDisplay,
  clearSelections,
  getHistory,
  getInstalledImage,
  getInstalledPacks,
  getSelection,
  getSettingsRecord,
  putHistory,
  putDisplay,
  putRecord,
  putSelection,
  putSettingsRecord,
  replaceInstalledPack,
  uninstallPack as removeInstalledPack,
} from './storage';
import type {
  AuthRecord,
  HistoryRecord,
  InstalledImage,
  InstalledPack,
  MatchRequest,
  MatchedWorkshopImage,
  PackImage,
  PackManifest,
  PackSummary,
  WorkshopSettings,
} from './types';

const DEFAULT_SETTINGS: WorkshopSettings = {
  key: 'main',
  apiBase: 'https://cultivation-illustration-workshop.awenewilly1.workers.dev',
  autoInsert: true,
  maxPerMessage: 1,
  updateIntervalHours: 6,
  lastUpdateCheck: 0,
};

export interface DownloadProgress {
  completed: number;
  total: number;
  bytes: number;
}

export function countOccurrences(text: string, keyword: string): number {
  const source = text.toLocaleLowerCase();
  const needle = keyword.toLocaleLowerCase();
  if (!needle) return 0;
  let count = 0;
  let offset = 0;
  while ((offset = source.indexOf(needle, offset)) >= 0) {
    count += 1;
    offset += Math.max(needle.length, 1);
  }
  return count;
}

export function historyFactor(previousDisplayCount: number): number {
  return previousDisplayCount > 0 ? 0.7 : 1;
}

function stableHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

async function contentHash(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)]
    .slice(0, 12)
    .map(value => value.toString(16).padStart(2, '0'))
    .join('');
}

export class WorkshopService {
  readonly api = new WorkshopApi(async () => (await this.getSettings()).apiBase);

  async initialize(): Promise<void> {
    await this.getSettings();
    try {
      await window.parent.navigator.storage?.persist?.();
    } catch {
      // 浏览器不支持或拒绝持久化时继续使用普通 IndexedDB。
    }
    void this.checkAllUpdates(false).catch(error => console.warn('[创意工坊] 自动更新检查失败:', error));
  }

  async getSettings(): Promise<WorkshopSettings> {
    const stored = await getSettingsRecord();
    if (stored) {
      if (stored.apiBase === 'http://localhost:8787') {
        stored.apiBase = DEFAULT_SETTINGS.apiBase;
        await putSettingsRecord(stored);
      }
      return stored;
    }
    await putSettingsRecord(DEFAULT_SETTINGS);
    return { ...DEFAULT_SETTINGS };
  }

  async updateSettings(patch: Partial<Omit<WorkshopSettings, 'key'>>): Promise<WorkshopSettings> {
    const current = await this.getSettings();
    const next: WorkshopSettings = {
      ...current,
      ...patch,
      key: 'main',
      apiBase: String(patch.apiBase ?? current.apiBase)
        .trim()
        .replace(/\/$/u, ''),
      maxPerMessage: Math.max(1, Math.min(6, Math.round(Number(patch.maxPerMessage ?? current.maxPerMessage)))),
      updateIntervalHours: Math.max(1, Math.min(168, Number(patch.updateIntervalHours ?? current.updateIntervalHours))),
    };
    await putSettingsRecord(next);
    if (next.autoInsert !== current.autoInsert || next.maxPerMessage !== current.maxPerMessage) {
      await clearSelections();
      this.notifyLibraryChanged();
    }
    return next;
  }

  private notifyLibraryChanged(): void {
    try {
      window.parent.dispatchEvent(new CustomEvent('cultivation-workshop-library-changed'));
    } catch {
      // 正文 iframe 不存在时无需通知。
    }
  }

  async setAutoInsert(enabled: boolean): Promise<void> {
    await this.updateSettings({ autoInsert: enabled });
  }

  getAuth(): Promise<AuthRecord | undefined> {
    return getAuthRecord();
  }

  async listInstalled(): Promise<InstalledPack[]> {
    return (await getInstalledPacks()).sort(
      (left, right) => right.installedAt - left.installedAt || left.id.localeCompare(right.id),
    );
  }

  async setPackEnabled(packId: string, enabled: boolean): Promise<void> {
    const pack = (await getInstalledPacks()).find(item => item.id === packId);
    if (!pack) throw new Error('本地未安装该图包');
    pack.enabled = enabled;
    pack.updatedAt = Date.now();
    await putRecord('packs', pack);
    await clearSelections();
    this.notifyLibraryChanged();
  }

  async uninstallPack(packId: string): Promise<void> {
    await removeInstalledPack(packId);
    await clearSelections();
    this.notifyLibraryChanged();
  }

  private async downloadManifest(
    manifest: PackManifest,
    previous: InstalledPack | undefined,
    onProgress?: (progress: DownloadProgress) => void,
  ): Promise<{ pack: InstalledPack; images: InstalledImage[] }> {
    const previousImages = new Map<string, InstalledImage>();
    if (previous) {
      for (const metadata of previous.manifest.images) {
        const stored = await getInstalledImage(metadata.id);
        if (stored) previousImages.set(metadata.id, stored);
      }
    }
    const images: InstalledImage[] = [];
    let completed = 0;
    let bytes = 0;
    for (const metadata of manifest.images) {
      const existing = previousImages.get(metadata.id);
      if (existing?.sha256 === metadata.sha256) {
        images.push(existing);
        completed += 1;
        bytes += existing.blob.size;
        onProgress?.({ completed, total: manifest.images.length, bytes });
        continue;
      }
      const response = await fetch(metadata.download_url);
      if (!response.ok) throw new Error(`图片 ${metadata.id} 下载失败（${response.status}）`);
      const blob = await response.blob();
      if (blob.size !== metadata.byte_size) throw new Error(`图片 ${metadata.id} 大小校验失败`);
      if ((await sha256Hex(blob)) !== metadata.sha256) throw new Error(`图片 ${metadata.id} 哈希校验失败`);
      images.push({ id: metadata.id, packId: manifest.pack.id, sha256: metadata.sha256, blob });
      completed += 1;
      bytes += blob.size;
      onProgress?.({ completed, total: manifest.images.length, bytes });
    }
    return {
      images,
      pack: {
        id: manifest.pack.id,
        source: previous?.source ?? 'remote',
        manifest,
        enabled: previous?.enabled ?? true,
        installedAt: previous?.installedAt ?? Date.now(),
        updatedAt: Date.now(),
        localBytes: images.reduce((sum, image) => sum + image.blob.size, 0),
        updateError: '',
      },
    };
  }

  async installPack(packId: string, onProgress?: (progress: DownloadProgress) => void): Promise<InstalledPack> {
    const manifest = await this.api.getPack(packId);
    const previous = (await getInstalledPacks()).find(item => item.id === packId);
    const downloaded = await this.downloadManifest(manifest, previous, onProgress);
    await replaceInstalledPack(downloaded.pack, downloaded.images);
    try {
      await this.api.recordDownload(packId);
    } catch (error) {
      console.warn('[创意工坊] 下载已完成，但下载量记录失败:', error);
    }
    await clearSelections();
    this.notifyLibraryChanged();
    return downloaded.pack;
  }

  async checkPackUpdate(
    packId: string,
    onProgress?: (progress: DownloadProgress) => void,
  ): Promise<'current' | 'updated' | 'hidden'> {
    const installed = (await getInstalledPacks()).find(item => item.id === packId);
    if (!installed) throw new Error('图包未安装');
    if (installed.source === 'offline') return 'current';
    try {
      const remote = await this.api.getPackVersion(packId);
      if (remote.status !== 'published') {
        installed.enabled = false;
        installed.updateError = '作者已下架该图包';
        installed.updatedAt = Date.now();
        await putRecord('packs', installed);
        await clearSelections();
        this.notifyLibraryChanged();
        return 'hidden';
      }
      if (remote.version === installed.manifest.pack.version) return 'current';
      const manifest = await this.api.getPack(packId);
      const downloaded = await this.downloadManifest(manifest, installed, onProgress);
      await replaceInstalledPack(downloaded.pack, downloaded.images);
      await clearSelections();
      this.notifyLibraryChanged();
      return 'updated';
    } catch (error) {
      installed.updateError = error instanceof Error ? error.message : String(error);
      installed.updatedAt = Date.now();
      await putRecord('packs', installed);
      throw error;
    }
  }

  async checkAllUpdates(force: boolean): Promise<{ updated: number; hidden: number; failed: number }> {
    const settings = await this.getSettings();
    const cooldown = settings.updateIntervalHours * 60 * 60 * 1000;
    if (!force && Date.now() - settings.lastUpdateCheck < cooldown) return { updated: 0, hidden: 0, failed: 0 };
    const result = { updated: 0, hidden: 0, failed: 0 };
    for (const pack of await getInstalledPacks()) {
      if (pack.source === 'offline') continue;
      try {
        const status = await this.checkPackUpdate(pack.id);
        if (status === 'updated') result.updated += 1;
        if (status === 'hidden') result.hidden += 1;
      } catch {
        result.failed += 1;
      }
    }
    await this.updateSettings({ lastUpdateCheck: Date.now() });
    return result;
  }

  async matchImages(request: MatchRequest): Promise<MatchedWorkshopImage[]> {
    const settings = await this.getSettings();
    if (!settings.autoInsert || !request.text.trim()) return [];
    const hash = await contentHash(request.text);
    const selectionKey = `${request.chatId}|${request.messageId}|${hash}`;
    const installed = (await getInstalledPacks()).filter(
      pack => pack.enabled && pack.manifest.pack.status === 'published',
    );
    const packsByImage = new Map<string, InstalledPack>();
    for (const pack of installed) for (const image of pack.manifest.images) packsByImage.set(image.id, pack);

    const cached = await getSelection(selectionKey);
    if (cached) {
      const resolved = await Promise.all(cached.imageIds.map(id => this.resolveMatchedImage(id, packsByImage, 0)));
      return resolved.filter((item): item is MatchedWorkshopImage => item !== null);
    }

    const candidates: Array<{ image: PackImage; pack: InstalledPack; score: number; longest: number }> = [];
    const historyByImage = new Map(
      (await getAllRecords<HistoryRecord>('history'))
        .filter(record => record.chatId === request.chatId)
        .map(record => [record.imageId, record.count]),
    );
    for (const pack of installed) {
      for (const image of pack.manifest.images) {
        const terms = [...image.keywords];
        if (pack.manifest.pack.category === '人物' && image.character_name) terms.push(image.character_name);
        let rawHits = 0;
        let longest = 0;
        for (const term of new Set(terms)) {
          const hits = countOccurrences(request.text, term);
          rawHits += hits;
          if (hits > 0) longest = Math.max(longest, term.length);
        }
        if (rawHits === 0) continue;
        candidates.push({
          image,
          pack,
          score: rawHits * historyFactor(historyByImage.get(image.id) ?? 0),
          longest,
        });
      }
    }
    candidates.sort((left, right) => {
      if (left.image.rating !== right.image.rating) return left.image.rating === 'nsfw' ? -1 : 1;
      if (left.score !== right.score) return right.score - left.score;
      if (left.longest !== right.longest) return right.longest - left.longest;
      return (
        stableHash(`${request.chatId}|${request.messageId}|${left.image.id}`) -
        stableHash(`${request.chatId}|${request.messageId}|${right.image.id}`)
      );
    });
    const selected = candidates.slice(0, settings.maxPerMessage);
    await putSelection({
      key: selectionKey,
      chatId: request.chatId,
      messageId: request.messageId,
      contentHash: hash,
      imageIds: selected.map(item => item.image.id),
      createdAt: Date.now(),
    });
    const resolved = await Promise.all(
      selected.map(item => this.resolveMatchedImage(item.image.id, packsByImage, item.score)),
    );
    return resolved.filter((item): item is MatchedWorkshopImage => item !== null);
  }

  async confirmDisplayed(request: { chatId: string; messageId: string; imageId: string }): Promise<void> {
    const displayKey = `${request.chatId}|${request.messageId}|${request.imageId}`;
    if (await getDisplay(displayKey)) return;
    await putDisplay({ key: displayKey, ...request, createdAt: Date.now() });
    const historyKey = `${request.chatId}|${request.imageId}`;
    const history = await getHistory(historyKey);
    await putHistory({
      key: historyKey,
      chatId: request.chatId,
      imageId: request.imageId,
      count: (history?.count ?? 0) + 1,
    });
  }

  private async resolveMatchedImage(
    imageId: string,
    packsByImage: Map<string, InstalledPack>,
    score: number,
  ): Promise<MatchedWorkshopImage | null> {
    const pack = packsByImage.get(imageId);
    if (!pack) return null;
    const metadata = pack.manifest.images.find(image => image.id === imageId);
    const local = await getInstalledImage(imageId);
    if (!metadata || !local) return null;
    return {
      id: imageId,
      packId: pack.id,
      packName: pack.manifest.pack.name,
      author: pack.manifest.pack.owner_name ?? '',
      characterName: metadata.character_name,
      rating: metadata.rating,
      keywords: metadata.keywords,
      blob: local.blob,
      score,
    };
  }

  async localStorageUsage(): Promise<number> {
    const images = await getAllRecords<InstalledImage>('images');
    return images.reduce((sum, image) => sum + image.blob.size, 0);
  }

  async publicPacks(
    query: string,
    category: string,
    offset: number,
  ): Promise<{ items: PackSummary[]; next_offset: number | null }> {
    return this.api.listPacks(query, category, offset);
  }

  async exportOwnPack(manifest: PackManifest): Promise<{ blob: Blob; filename: string }> {
    return createOfflinePack(manifest, imageId => this.api.getOwnImage(imageId));
  }

  async importOfflinePack(file: File): Promise<InstalledPack> {
    const imported = await readOfflinePack(file);
    await replaceInstalledPack(imported.pack, imported.images);
    await clearSelections();
    this.notifyLibraryChanged();
    return imported.pack;
  }
}

export const workshopService = new WorkshopService();
