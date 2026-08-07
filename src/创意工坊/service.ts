import { WorkshopApi } from './api';
import { sha256Hex } from './image';
import { createOfflinePack, readOfflinePack } from './offline-pack';
import { deleteCachedPreviewImage, getCachedPreviewImage, putCachedPreviewImage } from './preview-cache';
import {
  getAllRecords,
  getAuthRecord,
  getDisplay,
  clearSelections,
  getHistory,
  getInstalledImage,
  getInstalledPacks,
  getSettingsRecord,
  putHistory,
  putDisplay,
  putRecord,
  putSettingsRecord,
  replaceInstalledPack,
  uninstallPack as removeInstalledPack,
} from './storage';
import type {
  AuthRecord,
  InstalledImage,
  InstalledPack,
  MatchRequest,
  PackManifest,
  PackSummary,
  WorkshopPlayerData,
  WorkshopPlayerPack,
  WorkshopSettings,
} from './types';

const DEFAULT_SETTINGS: WorkshopSettings = {
  key: 'main',
  apiBase: 'https://cultivation-illustration-workshop.awenewilly1.workers.dev',
  autoInsert: true,
  updateIntervalHours: 6,
  lastUpdateCheck: 0,
  packPreferences: {},
};

export interface DownloadProgress {
  completed: number;
  total: number;
  bytes: number;
}

export function countOccurrences(text: string, term: string): number {
  const source = text.toLocaleLowerCase();
  const needle = term.toLocaleLowerCase();
  if (!needle) return 0;
  let count = 0;
  let offset = 0;
  while ((offset = source.indexOf(needle, offset)) >= 0) {
    count += 1;
    offset += Math.max(needle.length, 1);
  }
  return count;
}

function normalizeName(value: string): string {
  return value.normalize('NFKC').trim().toLocaleLowerCase();
}

function packCharacterIdentity(pack: InstalledPack): { name: string; aliases: string[] } | null {
  if (pack.characterMigration?.name.trim()) return pack.characterMigration;
  const name = pack.manifest.pack.character_name?.trim() || pack.manifest.images[0]?.character_name?.trim() || '';
  if (!name) return null;
  const aliases = pack.manifest.pack.aliases?.length
    ? pack.manifest.pack.aliases
    : (pack.manifest.images.find(image => image.character_name.trim() === name)?.aliases ?? []);
  return { name, aliases };
}

function messageLocationText(messageId: string): string {
  try {
    const parsedId = Number(messageId);
    const variables = getVariables({ type: 'message', message_id: Number.isFinite(parsedId) ? parsedId : -1 });
    const location = _.get(variables, 'stat_data.地点', {}) as Record<string, unknown>;
    return [location.世界, location.地域, location.具体地点]
      .map(value =>
        String(value ?? '')
          .normalize('NFKC')
          .trim(),
      )
      .filter(Boolean)
      .join(' ')
      .toLocaleLowerCase();
  } catch (error) {
    console.warn('[创意工坊] 读取本楼 MVU 地点失败:', error);
    return '';
  }
}

export class WorkshopService {
  readonly api = new WorkshopApi(async () => (await this.getSettings()).apiBase);
  private readonly pendingPreviewImages = new Map<string, Promise<Blob>>();

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
      return { ...DEFAULT_SETTINGS, ...stored, packPreferences: stored.packPreferences ?? {} };
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
      updateIntervalHours: Math.max(1, Math.min(168, Number(patch.updateIntervalHours ?? current.updateIntervalHours))),
      packPreferences: patch.packPreferences ?? current.packPreferences ?? {},
    };
    await putSettingsRecord(next);
    if (next.autoInsert !== current.autoInsert) {
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

  async setPreferredPack(subjectKey: string, packId: string): Promise<void> {
    const settings = await this.getSettings();
    await this.updateSettings({ packPreferences: { ...settings.packPreferences, [subjectKey]: packId } });
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

  async setCharacterMigration(packId: string, name: string, aliases: string[]): Promise<void> {
    const pack = (await getInstalledPacks()).find(item => item.id === packId);
    if (!pack) throw new Error('本地未安装该图包');
    if (pack.manifest.pack.category !== '人物') throw new Error('只有人物图包可以迁移角色名');
    const normalizedName = name.normalize('NFKC').trim();
    const normalizedAliases = [...new Set(aliases.map(alias => alias.normalize('NFKC').trim()).filter(Boolean))];
    if (normalizedName.length > 60) throw new Error('替换角色名不能超过 60 字');
    if (normalizedAliases.length > 30 || normalizedAliases.some(alias => alias.length > 30)) {
      throw new Error('角色别名最多 30 个，单个不能超过 30 字');
    }
    pack.characterMigration = normalizedName ? { name: normalizedName, aliases: normalizedAliases } : undefined;
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
      const blob = await this.getPreviewImage({ id: metadata.id, expectedBytes: metadata.byte_size });
      if (blob.size !== metadata.byte_size) throw new Error(`图片 ${metadata.id} 大小校验失败`);
      if ((await sha256Hex(blob)) !== metadata.sha256) {
        await this.removePreviewImage(metadata.id);
        throw new Error(`图片 ${metadata.id} 哈希校验失败`);
      }
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
        characterMigration: previous?.characterMigration,
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

  async matchImages(request: MatchRequest): Promise<WorkshopPlayerData | null> {
    const settings = await this.getSettings();
    if (!settings.autoInsert || !request.text.trim()) return null;
    const installed = (await getInstalledPacks()).filter(
      pack => pack.enabled && pack.manifest.pack.status === 'published',
    );
    if (!installed.length) return null;

    const roles = new Map<string, { name: string; terms: Set<string> }>();
    for (const pack of installed) {
      if (pack.manifest.pack.category !== '人物') continue;
      const identity = packCharacterIdentity(pack);
      if (!identity) continue;
      const key = normalizeName(identity.name);
      const role = roles.get(key) ?? { name: identity.name.trim(), terms: new Set<string>() };
      role.terms.add(identity.name.trim());
      for (const alias of identity.aliases ?? []) if (alias.trim()) role.terms.add(alias.trim());
      roles.set(key, role);
    }

    let selectedRole: { key: string; name: string; count: number; latest: number } | null = null;
    const normalizedText = request.text.normalize('NFKC').toLocaleLowerCase();
    for (const [key, role] of roles) {
      let count = 0;
      let latest = -1;
      for (const term of role.terms) {
        count += countOccurrences(normalizedText, term);
        latest = Math.max(latest, normalizedText.lastIndexOf(normalizeName(term)));
      }
      if (
        count > 0 &&
        (!selectedRole || count > selectedRole.count || (count === selectedRole.count && latest > selectedRole.latest))
      ) {
        selectedRole = { key, name: role.name, count, latest };
      }
    }

    const locationText = messageLocationText(request.messageId);
    const termMatches = (pack: InstalledPack, source: string) =>
      (pack.manifest.pack.match_terms ?? []).some(term => source.includes(normalizeName(term)));
    const landscapePacks = selectedRole
      ? []
      : installed.filter(
          pack =>
            pack.manifest.pack.category === '风景' &&
            pack.manifest.images.length > 0 &&
            Boolean(locationText) &&
            termMatches(pack, locationText),
        );
    const otherPacks =
      selectedRole || landscapePacks.length
        ? []
        : installed.filter(
            pack =>
              pack.manifest.pack.category === '其他' &&
              pack.manifest.images.length > 0 &&
              termMatches(pack, normalizedText),
          );
    const category = selectedRole ? '人物' : landscapePacks.length ? '风景' : otherPacks.length ? '其他' : null;
    if (!category) return null;
    const subjectKey = selectedRole ? `character:${selectedRole.key}` : `category:${category}`;
    const relevant = selectedRole
      ? installed.filter(
          pack =>
            pack.manifest.pack.category === '人物' &&
            normalizeName(packCharacterIdentity(pack)?.name ?? '') === selectedRole.key,
        )
      : category === '风景'
        ? landscapePacks
        : otherPacks;
    const packs: WorkshopPlayerPack[] = [];
    for (const pack of relevant) {
      const metadata = pack.manifest.images;
      const images = (
        await Promise.all(
          metadata.map(async image => {
            const local = await getInstalledImage(image.id);
            return local ? { id: image.id, rating: image.rating, blob: local.blob } : null;
          }),
        )
      ).filter((image): image is NonNullable<typeof image> => image !== null);
      if (images.length)
        packs.push({
          id: pack.id,
          name: pack.manifest.pack.name,
          author: pack.manifest.pack.owner_name ?? '',
          images,
        });
    }
    if (!packs.length) return null;

    let desiredRating: 'sfw' | 'nsfw' = 'sfw';
    let routeDetectionFailed = false;
    if (selectedRole) {
      try {
        const host = window.parent as Window & {
          CultivationRuleRouter?: {
            getFloorEntryState?: (messageId: string, entryName: string) => { ok: boolean; enabled: boolean };
          };
        };
        const state = host.CultivationRuleRouter?.getFloorEntryState?.(request.messageId, '[mvu_plot][NSFW]基础指导');
        if (!state?.ok) routeDetectionFailed = true;
        else desiredRating = state.enabled ? 'nsfw' : 'sfw';
      } catch {
        routeDetectionFailed = true;
      }
    }
    const rememberedPackId = packs.some(pack => pack.id === settings.packPreferences[subjectKey])
      ? settings.packPreferences[subjectKey]
      : packs[0].id;
    const desiredPacks = packs.filter(pack => pack.images.some(image => image.rating === desiredRating));
    const initialRating = desiredPacks.length ? desiredRating : desiredRating === 'sfw' ? 'nsfw' : 'sfw';
    const preferredPackId = desiredPacks.some(pack => pack.id === rememberedPackId)
      ? rememberedPackId
      : (desiredPacks[0]?.id ?? rememberedPackId);
    return {
      subjectKey,
      title: selectedRole?.name ?? category,
      kind: selectedRole ? 'character' : 'category',
      initialRating,
      preferredPackId,
      routeDetectionFailed,
      packs,
    };
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

  async localStorageUsage(): Promise<number> {
    const images = await getAllRecords<InstalledImage>('images');
    return images.reduce((sum, image) => sum + image.blob.size, 0);
  }

  async getPreviewImage(input: { id: string; authenticated?: boolean; expectedBytes?: number }): Promise<Blob> {
    const installed = await getInstalledImage(input.id);
    if (installed && (!input.expectedBytes || installed.blob.size === input.expectedBytes)) return installed.blob;

    try {
      const cached = await getCachedPreviewImage(input.id);
      if (cached && (!input.expectedBytes || cached.size === input.expectedBytes)) return cached;
      if (cached) await deleteCachedPreviewImage(input.id);
    } catch (error) {
      console.warn('[创意工坊] 读取本地图片缓存失败，将直接请求图片:', error);
    }

    const pending = this.pendingPreviewImages.get(input.id);
    if (pending) return pending;
    const request = (input.authenticated ? this.api.getOwnImage(input.id) : this.api.getPublicImage(input.id))
      .then(async blob => {
        if (input.expectedBytes && blob.size !== input.expectedBytes) throw new Error('图片大小校验失败，请重试');
        try {
          await putCachedPreviewImage(input.id, blob);
        } catch (error) {
          console.warn('[创意工坊] 写入本地图片缓存失败:', error);
        }
        return blob;
      })
      .finally(() => this.pendingPreviewImages.delete(input.id));
    this.pendingPreviewImages.set(input.id, request);
    return request;
  }

  async cachePreviewImage(imageId: string, blob: Blob): Promise<void> {
    try {
      await putCachedPreviewImage(imageId, blob);
    } catch (error) {
      console.warn('[创意工坊] 写入本地图片缓存失败:', error);
    }
  }

  async removePreviewImage(imageId: string): Promise<void> {
    try {
      await deleteCachedPreviewImage(imageId);
    } catch (error) {
      console.warn('[创意工坊] 删除本地图片缓存失败:', error);
    }
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
