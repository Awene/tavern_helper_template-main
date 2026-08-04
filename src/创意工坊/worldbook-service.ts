import { WorkshopApi } from './api';
import {
  deleteInstalledWorldbook,
  deleteWorldbookReplacement,
  getInstalledWorldbooks,
  getSettingsRecord,
  getWorldbookReplacements,
  putInstalledWorldbook,
  putWorldbookReplacement,
} from './storage';
import type { InstalledWorldbookPack, WorldbookPackSummary, WorldbookReplacementRecord } from './types';
import { parseRawWorldbook, type ParsedWorldbookEntry } from './worldbook-parser';

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function matchesTarget(pack: InstalledWorldbookPack, target: string): boolean {
  return pack.pack.name === target || pack.pack.dlc_key.includes(`[${target}]`);
}

function entryMatchesTarget(name: string, target: string): boolean {
  return name.includes(`[${target}]`);
}

const DEFAULT_API_BASE = 'https://cultivation-illustration-workshop.awenewilly1.workers.dev';
const SHARED_WORLDBOOK_NAME = '本格数值化修仙·创意工坊';

interface WorkshopEntrySource {
  sourceId: string;
  sourceType: 'worldbook_pack';
  sourceTitle: string;
  sourceVersion: number;
  originalEnabled: boolean;
  installedAt: string;
}

function entrySource(entry: Pick<WorldbookEntry, 'extra'>): WorkshopEntrySource | undefined {
  const source = entry.extra?.creativeWorkshop;
  if (!source || typeof source !== 'object') return undefined;
  const value = source as Partial<WorkshopEntrySource>;
  return value.sourceType === 'worldbook_pack' && typeof value.sourceId === 'string'
    ? (value as WorkshopEntrySource)
    : undefined;
}

function isPackEntry(entry: Pick<WorldbookEntry, 'extra'>, packId: string): boolean {
  return entrySource(entry)?.sourceId === packId;
}

function decorateEntries(
  entries: ParsedWorldbookEntry[],
  pack: WorldbookPackSummary,
  enabled: boolean,
): ParsedWorldbookEntry[] {
  const installedAt = new Date().toISOString();
  return entries.map(entry => {
    const originalEnabled = entry.enabled !== false;
    return {
      ...entry,
      enabled: enabled && originalEnabled,
      extra: {
        ...(entry.extra ?? {}),
        creativeWorkshop: {
          sourceId: pack.id,
          sourceType: 'worldbook_pack',
          sourceTitle: pack.name,
          sourceVersion: pack.version,
          originalEnabled,
          installedAt,
        } satisfies WorkshopEntrySource,
      },
    };
  });
}

function normalizedWorldbookName(name: string): string {
  return name.trim().replace(/\.json$/iu, '');
}

function findMatchingWorldbookName(names: string[], expectedName: string): string | undefined {
  const expected = normalizedWorldbookName(expectedName);
  return names.find(name => normalizedWorldbookName(name) === expected);
}

export class WorldbookWorkshopService {
  readonly api = new WorkshopApi(async () => (await getSettingsRecord())?.apiBase || DEFAULT_API_BASE);

  async listInstalled(): Promise<InstalledWorldbookPack[]> {
    const installed = await getInstalledWorldbooks();
    const availableBooks = new Set(getWorldbookNames());
    for (const pack of installed) {
      if (pack.bookName !== SHARED_WORLDBOOK_NAME) {
        try {
          await this.migrateLegacyPack(pack);
          availableBooks.add(pack.bookName);
        } catch (error) {
          pack.updateError = `迁移到统一创意工坊世界书失败：${errorText(error)}`;
          await putInstalledWorldbook(pack);
          continue;
        }
      }
      if (!findMatchingWorldbookName([...availableBooks], SHARED_WORLDBOOK_NAME)) {
        pack.missingPrerequisites = [];
        pack.updateError = `酒馆世界书“${SHARED_WORLDBOOK_NAME}”已缺失，请卸载后重新安装世界书包`;
        await putInstalledWorldbook(pack);
      }
    }
    const sharedName = findMatchingWorldbookName([...availableBooks], SHARED_WORLDBOOK_NAME);
    if (sharedName) {
      const latest = await getInstalledWorldbooks();
      const sourceIds = new Set(
        (await getWorldbook(sharedName))
          .map(entry => entrySource(entry)?.sourceId)
          .filter((sourceId): sourceId is string => Boolean(sourceId)),
      );
      for (const pack of latest) {
        pack.bookName = sharedName;
        if (!sourceIds.has(pack.id)) {
          pack.updateError = `统一创意工坊世界书中缺少“${pack.pack.name}”的条目，请卸载后重新安装该包`;
        } else if (
          pack.updateError.startsWith('酒馆世界书“') ||
          pack.updateError.startsWith('迁移到统一创意工坊世界书失败：') ||
          pack.updateError.startsWith('统一创意工坊世界书中缺少“')
        ) {
          pack.updateError = '';
        }
        await putInstalledWorldbook(pack);
      }
      if (latest.some(pack => pack.enabled)) await this.bindBook(sharedName);
      else await this.unbindBook(sharedName);
    }
    await this.refreshDependencyWarnings();
    return (await getInstalledWorldbooks()).sort(
      (left, right) => right.installedAt - left.installedAt || left.pack.name.localeCompare(right.pack.name, 'zh-CN'),
    );
  }

  async publicPacks(query: string, category: string, offset: number) {
    return this.api.listWorldbooks(query, category, offset);
  }

  private async ensureSharedWorldbook(): Promise<string> {
    const existing = findMatchingWorldbookName(getWorldbookNames(), SHARED_WORLDBOOK_NAME);
    if (existing) return existing;
    await createWorldbook(SHARED_WORLDBOOK_NAME, []);
    const created = findMatchingWorldbookName(getWorldbookNames(), SHARED_WORLDBOOK_NAME);
    if (!created) throw new Error(`酒馆没有创建世界书“${SHARED_WORLDBOOK_NAME}”`);
    return created;
  }

  private async writePackEntries(raw: string, pack: WorldbookPackSummary, enabled: boolean): Promise<string> {
    const bookName = await this.ensureSharedWorldbook();
    const entries = decorateEntries(parseRawWorldbook(raw), pack, enabled);
    await updateWorldbookWith(
      bookName,
      worldbook => [...worldbook.filter(entry => !isPackEntry(entry, pack.id)), ...entries],
      { render: 'immediate' },
    );
    const written = (await getWorldbook(bookName)).filter(entry => isPackEntry(entry, pack.id));
    if (written.length !== entries.length) {
      throw new Error(`世界书包写入校验失败：应有 ${entries.length} 个条目，实际写入 ${written.length} 个`);
    }
    return bookName;
  }

  private async setPackEntriesEnabled(packId: string, enabled: boolean): Promise<void> {
    const bookName = await this.ensureSharedWorldbook();
    let matched = 0;
    await updateWorldbookWith(
      bookName,
      entries =>
        entries.map(entry => {
          const source = entrySource(entry);
          if (source?.sourceId !== packId) return entry;
          matched += 1;
          return { ...entry, enabled: enabled && source.originalEnabled };
        }),
      { render: 'immediate' },
    );
    if (!matched) throw new Error('统一创意工坊世界书中没有找到该包的条目，请重新安装');
  }

  private async removePackEntries(packId: string): Promise<void> {
    const bookName = findMatchingWorldbookName(getWorldbookNames(), SHARED_WORLDBOOK_NAME);
    if (!bookName) return;
    await updateWorldbookWith(bookName, entries => entries.filter(entry => !isPackEntry(entry, packId)), {
      render: 'immediate',
    });
  }

  private async migrateLegacyPack(pack: InstalledWorldbookPack): Promise<void> {
    const legacyName = findMatchingWorldbookName(getWorldbookNames(), pack.bookName);
    if (!legacyName) throw new Error(`旧世界书“${pack.bookName}”不存在`);
    const legacyEntries = await getWorldbook(legacyName);
    const sharedName = await this.ensureSharedWorldbook();
    const converted = decorateEntries(legacyEntries, pack.pack, pack.enabled);
    await updateWorldbookWith(
      sharedName,
      entries => [...entries.filter(entry => !isPackEntry(entry, pack.id)), ...converted],
      { render: 'immediate' },
    );
    await this.unbindBook(legacyName);
    if (legacyName.startsWith('[创意工坊]')) await deleteWorldbook(legacyName);
    pack.bookName = sharedName;
    pack.updateError = '';
    await putInstalledWorldbook(pack);
  }

  private async bindBook(bookName: string): Promise<void> {
    const binding = getCharWorldbookNames('current');
    if (binding.additional.includes(bookName)) return;
    await rebindCharWorldbooks('current', {
      primary: binding.primary,
      additional: [...new Set([...binding.additional, bookName])],
    });
  }

  private async unbindBook(bookName: string): Promise<void> {
    const binding = getCharWorldbookNames('current');
    if (!binding.additional.includes(bookName)) return;
    await rebindCharWorldbooks('current', {
      primary: binding.primary,
      additional: binding.additional.filter(name => name !== bookName),
    });
  }

  private async applyReplacements(pack: InstalledWorldbookPack): Promise<void> {
    if (!pack.pack.relations.replacements.length) return;
    const binding = getCharWorldbookNames('current');
    const books = [
      ...new Set([binding.primary, ...binding.additional].filter((name): name is string => Boolean(name))),
    ];
    const records = new Map((await getWorldbookReplacements()).map(record => [record.key, record]));
    for (const bookName of books) {
      let entries: WorldbookEntry[];
      try {
        entries = await getWorldbook(bookName);
      } catch (error) {
        console.warn(`[创意工坊] 无法读取世界书“${bookName}”以应用替换关系:`, error);
        continue;
      }
      const matched = entries.filter(entry =>
        pack.pack.relations.replacements.some(target => entryMatchesTarget(entry.name, target)),
      );
      if (!matched.length) continue;
      for (const entry of matched) {
        const key = `${bookName}\u0000${entry.uid}`;
        const current = records.get(key);
        const record: WorldbookReplacementRecord = current ?? {
          key,
          bookName,
          uid: entry.uid,
          entryName: entry.name,
          originalEnabled: entry.enabled,
          activePackIds: [],
        };
        if (!record.activePackIds.includes(pack.id)) record.activePackIds.push(pack.id);
        records.set(key, record);
        await putWorldbookReplacement(record);
      }
      await updateWorldbookWith(bookName, worldbook =>
        worldbook.map(entry =>
          matched.some(target => target.uid === entry.uid && target.name === entry.name)
            ? { ...entry, enabled: false }
            : entry,
        ),
      );
    }
  }

  private async releaseReplacements(packId: string): Promise<void> {
    for (const record of await getWorldbookReplacements()) {
      if (!record.activePackIds.includes(packId)) continue;
      const remaining = record.activePackIds.filter(id => id !== packId);
      if (remaining.length) {
        await putWorldbookReplacement({ ...record, activePackIds: remaining });
        continue;
      }
      try {
        await updateWorldbookWith(record.bookName, entries =>
          entries.map(entry =>
            entry.uid === record.uid && entry.name === record.entryName
              ? { ...entry, enabled: record.originalEnabled }
              : entry,
          ),
        );
      } catch (error) {
        console.warn(`[创意工坊] 恢复世界书“${record.bookName}”中的替换条目失败:`, error);
      }
      await deleteWorldbookReplacement(record.key);
    }
  }

  private missingPrerequisites(pack: InstalledWorldbookPack, installed: InstalledWorldbookPack[]): string[] {
    return pack.pack.relations.prerequisites.filter(
      target =>
        !installed.some(candidate => candidate.enabled && candidate.id !== pack.id && matchesTarget(candidate, target)),
    );
  }

  private async refreshDependencyWarnings(): Promise<void> {
    const installed = await getInstalledWorldbooks();
    for (const pack of installed) {
      const missing = pack.enabled ? this.missingPrerequisites(pack, installed) : [];
      if (missing.join('\u0000') !== pack.missingPrerequisites.join('\u0000')) {
        pack.missingPrerequisites = missing;
        await putInstalledWorldbook(pack);
      }
    }
  }

  private async setEnabledInternal(packId: string, enabled: boolean, visited: Set<string>): Promise<string[]> {
    if (visited.has(packId)) return [];
    visited.add(packId);
    const installed = await getInstalledWorldbooks();
    const pack = installed.find(item => item.id === packId);
    if (!pack) throw new Error('本地未安装该世界书包');
    if (pack.enabled === enabled) return pack.missingPrerequisites;
    try {
      if (enabled) {
        for (const target of pack.pack.relations.exclusions) {
          for (const conflict of installed.filter(
            item => item.enabled && item.id !== pack.id && matchesTarget(item, target),
          )) {
            await this.setEnabledInternal(conflict.id, false, visited);
          }
        }
        await this.setPackEntriesEnabled(pack.id, true);
        await this.bindBook(await this.ensureSharedWorldbook());
        pack.enabled = true;
        pack.updateError = '';
        pack.missingPrerequisites = this.missingPrerequisites(pack, await getInstalledWorldbooks());
        await putInstalledWorldbook(pack);
        await this.applyReplacements(pack);
      } else {
        await this.releaseReplacements(pack.id);
        await this.setPackEntriesEnabled(pack.id, false);
        pack.enabled = false;
        pack.missingPrerequisites = [];
        await putInstalledWorldbook(pack);
        const remaining = (await getInstalledWorldbooks()).some(item => item.id !== pack.id && item.enabled);
        const sharedName = findMatchingWorldbookName(getWorldbookNames(), SHARED_WORLDBOOK_NAME);
        if (!remaining && sharedName) await this.unbindBook(sharedName);
      }
      await this.refreshDependencyWarnings();
      return pack.missingPrerequisites;
    } catch (error) {
      pack.updateError = errorText(error);
      await putInstalledWorldbook(pack);
      throw error;
    }
  }

  setEnabled(packId: string, enabled: boolean): Promise<string[]> {
    return this.setEnabledInternal(packId, enabled, new Set());
  }

  async install(packId: string): Promise<InstalledWorldbookPack> {
    const metadata = await this.api.getWorldbookPack(packId);
    const raw = await this.api.getWorldbookContent(packId);
    const previous = (await getInstalledWorldbooks()).find(item => item.id === packId);
    if (previous) return previous;
    const bookName = await this.writePackEntries(raw, metadata, false);
    const now = Date.now();
    const installed: InstalledWorldbookPack = {
      id: metadata.id,
      pack: metadata,
      bookName,
      enabled: false,
      installedAt: now,
      updatedAt: now,
      updateError: '',
      missingPrerequisites: [],
    };
    await putInstalledWorldbook(installed);
    await this.setEnabled(installed.id, true);
    return (await getInstalledWorldbooks()).find(item => item.id === installed.id) ?? installed;
  }

  async uninstall(packId: string): Promise<void> {
    const pack = (await getInstalledWorldbooks()).find(item => item.id === packId);
    if (!pack) return;
    if (pack.enabled) await this.setEnabled(pack.id, false);
    await this.removePackEntries(pack.id);
    await deleteInstalledWorldbook(pack.id);
    const sharedName = findMatchingWorldbookName(getWorldbookNames(), SHARED_WORLDBOOK_NAME);
    if (!(await getInstalledWorldbooks()).some(item => item.enabled) && sharedName) await this.unbindBook(sharedName);
    await this.refreshDependencyWarnings();
  }

  async checkUpdate(packId: string): Promise<'current' | 'updated' | 'hidden'> {
    const pack = (await getInstalledWorldbooks()).find(item => item.id === packId);
    if (!pack) throw new Error('世界书包未安装');
    const wasEnabled = pack.enabled;
    let disabledForUpdate = false;
    try {
      const remote = await this.api.getWorldbookPackVersion(pack.id);
      if (remote.status !== 'published') {
        pack.updateError = '作者已下架该世界书包；本地版本仍可继续使用';
        await putInstalledWorldbook(pack);
        return 'hidden';
      }
      if (remote.version === pack.pack.version) {
        pack.updateError = '';
        await putInstalledWorldbook(pack);
        return 'current';
      }
      // 先把远端内容完整下载到内存，再动本地启用状态，避免网络失败影响旧版本。
      const metadata = await this.api.getWorldbookPack(pack.id);
      const raw = await this.api.getWorldbookContent(pack.id);
      if (wasEnabled) await this.setEnabled(pack.id, false);
      disabledForUpdate = wasEnabled;
      const bookName = await this.writePackEntries(raw, metadata, false);
      const current = (await getInstalledWorldbooks()).find(item => item.id === pack.id) ?? pack;
      Object.assign(current, { pack: metadata, bookName, enabled: false, updatedAt: Date.now(), updateError: '' });
      await putInstalledWorldbook(current);
      if (wasEnabled) await this.setEnabled(pack.id, true);
      return 'updated';
    } catch (error) {
      let restoreError = '';
      if (disabledForUpdate) {
        try {
          await this.setEnabled(pack.id, true);
        } catch (restoreFailure) {
          restoreError = `；恢复旧版启用状态也失败：${errorText(restoreFailure)}`;
        }
      }
      const current = (await getInstalledWorldbooks()).find(item => item.id === pack.id) ?? pack;
      current.updateError = `${errorText(error)}${restoreError}`;
      await putInstalledWorldbook(current);
      throw new Error(current.updateError);
    }
  }

  async checkAllUpdates(): Promise<{ updated: number; hidden: number; failed: number }> {
    const result = { updated: 0, hidden: 0, failed: 0 };
    for (const pack of await getInstalledWorldbooks()) {
      try {
        const status = await this.checkUpdate(pack.id);
        if (status === 'updated') result.updated += 1;
        if (status === 'hidden') result.hidden += 1;
      } catch {
        result.failed += 1;
      }
    }
    return result;
  }
}

export const worldbookWorkshopService = new WorldbookWorkshopService();
