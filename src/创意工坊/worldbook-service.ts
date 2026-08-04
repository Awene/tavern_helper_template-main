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
import type {
  InstalledWorldbookPack,
  WorldbookPackSummary,
  WorldbookReplacementRecord,
} from './types';

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function safeBookName(pack: WorldbookPackSummary): string {
  const label = pack.name.replace(/[<>:"/\\|?*]/gu, '_').trim().slice(0, 48) || '未命名';
  return `[创意工坊]${label}-${pack.id.slice(-8)}`;
}

function matchesTarget(pack: InstalledWorldbookPack, target: string): boolean {
  return pack.pack.name === target || pack.pack.dlc_key.includes(`[${target}]`);
}

function entryMatchesTarget(name: string, target: string): boolean {
  return name.includes(`[${target}]`);
}

const DEFAULT_API_BASE = 'https://cultivation-illustration-workshop.awenewilly1.workers.dev';

export class WorldbookWorkshopService {
  readonly api = new WorkshopApi(async () => (await getSettingsRecord())?.apiBase || DEFAULT_API_BASE);

  async listInstalled(): Promise<InstalledWorldbookPack[]> {
    const installed = await getInstalledWorldbooks();
    const availableBooks = new Set(getWorldbookNames());
    const boundBooks = new Set(getCharWorldbookNames('current').additional);
    for (const pack of installed) {
      if (!availableBooks.has(pack.bookName)) {
        if (pack.enabled) {
          try {
            await this.setEnabledInternal(pack.id, false, new Set());
          } catch {
            // 下方仍会记录更直观的“世界书缺失”错误。
          }
        }
        pack.enabled = false;
        pack.missingPrerequisites = [];
        pack.updateError = `酒馆世界书“${pack.bookName}”已缺失，请卸载后重新安装`;
        await putInstalledWorldbook(pack);
        continue;
      }
      const actuallyEnabled = boundBooks.has(pack.bookName);
      if (pack.enabled !== actuallyEnabled) {
        try {
          // 启用状态以当前角色的附加世界书绑定为准；同步时同样应用/释放关系，
          // 避免用户手动改绑世界书或切换角色后留下失效的替换记录。
          await this.setEnabledInternal(pack.id, actuallyEnabled, new Set());
        } catch (error) {
          pack.updateError = `同步酒馆绑定失败：${errorText(error)}`;
          await putInstalledWorldbook(pack);
        }
      }
    }
    await this.refreshDependencyWarnings();
    return (await getInstalledWorldbooks()).sort(
      (left, right) => right.installedAt - left.installedAt || left.pack.name.localeCompare(right.pack.name, 'zh-CN'),
    );
  }

  async publicPacks(query: string, category: string, offset: number) {
    return this.api.listWorldbooks(query, category, offset);
  }

  private async importBook(raw: string, desiredBookName: string): Promise<string> {
    const before = new Set(getWorldbookNames());
    const response = await importRawWorldbook(`${desiredBookName}.json`, raw);
    if (!response.ok) throw new Error((await response.text().catch(() => '')) || `导入世界书失败（${response.status}）`);
    const after = getWorldbookNames();
    if (after.includes(desiredBookName)) return desiredBookName;
    const created = after.find(name => !before.has(name));
    if (created) return created;
    if (after.includes(`${desiredBookName}.json`)) return `${desiredBookName}.json`;
    throw new Error('世界书已导入，但无法确认酒馆中的世界书名称');
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
    const books = [...new Set([binding.primary, ...binding.additional].filter((name): name is string => Boolean(name)))];
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
      target => !installed.some(candidate => candidate.enabled && candidate.id !== pack.id && matchesTarget(candidate, target)),
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
          for (const conflict of installed.filter(item => item.enabled && item.id !== pack.id && matchesTarget(item, target))) {
            await this.setEnabledInternal(conflict.id, false, visited);
          }
        }
        await this.bindBook(pack.bookName);
        pack.enabled = true;
        pack.updateError = '';
        pack.missingPrerequisites = this.missingPrerequisites(pack, await getInstalledWorldbooks());
        await putInstalledWorldbook(pack);
        await this.applyReplacements(pack);
      } else {
        await this.releaseReplacements(pack.id);
        await this.unbindBook(pack.bookName);
        pack.enabled = false;
        pack.missingPrerequisites = [];
        await putInstalledWorldbook(pack);
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
    const desired = safeBookName(metadata);
    const bookName = await this.importBook(raw, desired);
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
    const deleted = await deleteWorldbook(pack.bookName);
    if (!deleted && getWorldbookNames().includes(pack.bookName)) throw new Error(`无法删除世界书“${pack.bookName}”`);
    await deleteInstalledWorldbook(pack.id);
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
      const bookName = await this.importBook(raw, pack.bookName);
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
