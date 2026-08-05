import { clearAuthRecord, getAuthRecord, putAuthRecord } from './storage';
import type {
  AuthRecord,
  PackEngagement,
  PackImage,
  PackManifest,
  PackSummary,
  WorkshopUser,
  WorldbookPackSummary,
} from './types';

export class WorkshopApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

export interface PageResult<T> {
  items: T[];
  next_offset: number | null;
}

async function errorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error || `请求失败（${response.status}）`;
  } catch {
    return `请求失败（${response.status}）`;
  }
}

export class WorkshopApi {
  private cancelPendingLogin?: () => void;

  constructor(private readonly getApiBase: () => Promise<string>) {}

  private async request<T>(path: string, init: RequestInit = {}, authenticated = false): Promise<T> {
    const base = (await this.getApiBase()).replace(/\/$/u, '');
    const headers = new Headers(init.headers);
    if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    if (authenticated) {
      const auth = await getAuthRecord();
      if (!auth || auth.expiresAt <= Math.floor(Date.now() / 1000)) {
        await clearAuthRecord();
        throw new WorkshopApiError('请先登录 Discord', 401);
      }
      headers.set('Authorization', `Bearer ${auth.token}`);
    }
    const response = await fetch(`${base}${path}`, { ...init, headers });
    if (!response.ok) {
      if (response.status === 401) await clearAuthRecord();
      throw new WorkshopApiError(await errorMessage(response), response.status);
    }
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  }

  private async requestBlob(path: string, authenticated = false): Promise<Blob> {
    const base = (await this.getApiBase()).replace(/\/$/u, '');
    const headers = new Headers();
    if (authenticated) {
      const auth = await getAuthRecord();
      if (!auth || auth.expiresAt <= Math.floor(Date.now() / 1000)) {
        await clearAuthRecord();
        throw new WorkshopApiError('请先登录 Discord', 401);
      }
      headers.set('Authorization', `Bearer ${auth.token}`);
    }
    const response = await fetch(`${base}${path}`, { headers });
    if (!response.ok) {
      if (response.status === 401) await clearAuthRecord();
      throw new WorkshopApiError(await errorMessage(response), response.status);
    }
    return response.blob();
  }

  async health(): Promise<boolean> {
    try {
      const result = await this.request<{ ok: boolean }>('/api/health');
      return result.ok;
    } catch {
      return false;
    }
  }

  listPacks(query = '', category = '', offset = 0): Promise<PageResult<PackSummary>> {
    const params = new URLSearchParams({ limit: '24', offset: String(offset) });
    if (query.trim()) params.set('query', query.trim());
    if (category) params.set('category', category);
    return this.request(`/api/packs?${params}`);
  }

  getPack(packId: string): Promise<PackManifest> {
    return this.request(`/api/packs/${encodeURIComponent(packId)}`);
  }

  getPackVersion(packId: string): Promise<{ id: string; version: number; status: string; updated_at: number }> {
    return this.request(`/api/packs/${encodeURIComponent(packId)}/version`);
  }

  recordDownload(packId: string): Promise<PackEngagement & { counted: boolean }> {
    return this.request(`/api/packs/${encodeURIComponent(packId)}/download`, { method: 'POST' });
  }

  listMyLikes(): Promise<{ pack_ids: string[] }> {
    return this.request('/api/me/likes', {}, true);
  }

  likePack(packId: string): Promise<PackEngagement & { liked: true }> {
    return this.request(`/api/packs/${encodeURIComponent(packId)}/like`, { method: 'POST' }, true);
  }

  unlikePack(packId: string): Promise<PackEngagement & { liked: false }> {
    return this.request(`/api/packs/${encodeURIComponent(packId)}/like`, { method: 'DELETE' }, true);
  }

  listOwnPacks(): Promise<{ items: PackSummary[] }> {
    return this.request('/api/me/packs', {}, true);
  }

  getOwnPack(packId: string): Promise<PackManifest> {
    return this.request(`/api/me/packs/${encodeURIComponent(packId)}`, {}, true);
  }

  getOwnImage(imageId: string): Promise<Blob> {
    return this.requestBlob(`/api/me/images/${encodeURIComponent(imageId)}`, true);
  }

  getPublicImage(imageId: string): Promise<Blob> {
    return this.requestBlob(`/api/images/${encodeURIComponent(imageId)}`);
  }

  createPack(input: { name: string; description: string; category: string }): Promise<{ pack: PackSummary }> {
    return this.request('/api/packs', { method: 'POST', body: JSON.stringify(input) }, true);
  }

  updatePack(
    packId: string,
    input: { name?: string; description?: string; category?: string; preview_image_id?: string | null },
  ): Promise<{ ok: true }> {
    return this.request(
      `/api/packs/${encodeURIComponent(packId)}`,
      { method: 'PATCH', body: JSON.stringify(input) },
      true,
    );
  }

  publishPack(packId: string): Promise<{ ok: true }> {
    return this.request(`/api/packs/${encodeURIComponent(packId)}/publish`, { method: 'POST' }, true);
  }

  unpublishPack(packId: string): Promise<{ ok: true }> {
    return this.request(`/api/packs/${encodeURIComponent(packId)}/unpublish`, { method: 'POST' }, true);
  }

  deletePack(packId: string): Promise<{ ok: true }> {
    return this.request(`/api/packs/${encodeURIComponent(packId)}`, { method: 'DELETE' }, true);
  }

  uploadImage(
    packId: string,
    input: { file: Blob; filename: string; rating: string; characterName: string; aliases: string[] },
  ): Promise<{ image: PackImage }> {
    const form = new FormData();
    form.set('file', input.file, input.filename);
    form.set('rating', input.rating);
    form.set('character_name', input.characterName);
    form.set('aliases', input.aliases.join(','));
    return this.request(`/api/packs/${encodeURIComponent(packId)}/images`, { method: 'POST', body: form }, true);
  }

  updateImage(
    packId: string,
    imageId: string,
    input: { rating?: string; character_name?: string; aliases?: string[] },
  ): Promise<{ ok: true }> {
    return this.request(
      `/api/packs/${encodeURIComponent(packId)}/images/${encodeURIComponent(imageId)}`,
      { method: 'PATCH', body: JSON.stringify(input) },
      true,
    );
  }

  deleteImage(packId: string, imageId: string): Promise<{ ok: true }> {
    return this.request(
      `/api/packs/${encodeURIComponent(packId)}/images/${encodeURIComponent(imageId)}`,
      { method: 'DELETE' },
      true,
    );
  }

  listWorldbooks(query = '', category = '', offset = 0): Promise<PageResult<WorldbookPackSummary>> {
    const params = new URLSearchParams({ limit: '24', offset: String(offset) });
    if (query.trim()) params.set('query', query.trim());
    if (category) params.set('category', category);
    return this.request(`/api/worldbooks?${params}`);
  }

  async getWorldbookPack(packId: string): Promise<WorldbookPackSummary> {
    const result = await this.request<{ pack: WorldbookPackSummary }>(`/api/worldbooks/${encodeURIComponent(packId)}`);
    return result.pack;
  }

  getWorldbookPackVersion(
    packId: string,
  ): Promise<{ id: string; version: number; status: string; updated_at: number }> {
    return this.request(`/api/worldbooks/${encodeURIComponent(packId)}/version`);
  }

  async getWorldbookContent(packId: string, own = false): Promise<string> {
    const base = (await this.getApiBase()).replace(/\/$/u, '');
    const headers = new Headers();
    if (own) {
      const auth = await getAuthRecord();
      if (!auth || auth.expiresAt <= Math.floor(Date.now() / 1000)) throw new WorkshopApiError('请先登录 Discord', 401);
      headers.set('Authorization', `Bearer ${auth.token}`);
    }
    const prefix = own ? '/api/me/worldbooks' : '/api/worldbooks';
    const response = await fetch(`${base}${prefix}/${encodeURIComponent(packId)}/content`, { headers });
    if (!response.ok) throw new WorkshopApiError(await errorMessage(response), response.status);
    return response.text();
  }

  listOwnWorldbooks(): Promise<{ items: WorldbookPackSummary[] }> {
    return this.request('/api/me/worldbooks', {}, true);
  }

  async getOwnWorldbook(packId: string): Promise<WorldbookPackSummary> {
    const result = await this.request<{ pack: WorldbookPackSummary }>(
      `/api/me/worldbooks/${encodeURIComponent(packId)}`,
      {},
      true,
    );
    return result.pack;
  }

  createWorldbook(file: File, description: string, cover?: File): Promise<{ pack: WorldbookPackSummary }> {
    const form = new FormData();
    form.set('file', file, file.name);
    form.set('description', description);
    if (cover) form.set('cover', cover, cover.name);
    return this.request('/api/worldbooks', { method: 'POST', body: form }, true);
  }

  updateWorldbook(packId: string, description: string): Promise<{ ok: true }> {
    return this.request(
      `/api/worldbooks/${encodeURIComponent(packId)}`,
      { method: 'PATCH', body: JSON.stringify({ description }) },
      true,
    );
  }

  replaceWorldbookContent(packId: string, file: File, description: string): Promise<{ ok: true }> {
    const form = new FormData();
    form.set('file', file, file.name);
    form.set('description', description);
    return this.request(`/api/worldbooks/${encodeURIComponent(packId)}/content`, { method: 'POST', body: form }, true);
  }

  uploadWorldbookCover(packId: string, cover: File): Promise<{ pack: WorldbookPackSummary }> {
    const form = new FormData();
    form.set('cover', cover, cover.name);
    return this.request(`/api/worldbooks/${encodeURIComponent(packId)}/cover`, { method: 'POST', body: form }, true);
  }

  publishWorldbook(packId: string): Promise<{ ok: true }> {
    return this.request(`/api/worldbooks/${encodeURIComponent(packId)}/publish`, { method: 'POST' }, true);
  }

  unpublishWorldbook(packId: string): Promise<{ ok: true }> {
    return this.request(`/api/worldbooks/${encodeURIComponent(packId)}/unpublish`, { method: 'POST' }, true);
  }

  deleteWorldbook(packId: string): Promise<{ ok: true }> {
    return this.request(`/api/worldbooks/${encodeURIComponent(packId)}`, { method: 'DELETE' }, true);
  }

  private waitForDiscordExchange(
    popup: Window,
    expectedOrigin: string,
    loginId: string,
  ): Promise<{ token: string; expires_at: number }> {
    return new Promise((resolve, reject) => {
      const pollIntervalMs = 1000;
      const exchangeTimeoutMs = 8000;
      const popupClosedGraceMs = 12_000;
      let exchangeCode = loginId;
      let exchanging = false;
      let settled = false;
      let lastTemporaryError: unknown;
      let popupClosedAt: number | null = null;
      let exchangeController: AbortController | null = null;

      const cleanup = () => {
        window.clearInterval(pollTimer);
        window.clearTimeout(timeoutTimer);
        exchangeController?.abort();
        window.parent.removeEventListener('message', listener);
        if (this.cancelPendingLogin === cancel) this.cancelPendingLogin = undefined;
      };
      const finish = (callback: () => void) => {
        if (settled) return;
        settled = true;
        cleanup();
        callback();
      };
      const tryExchange = async () => {
        if (settled || exchanging) return;
        exchanging = true;
        const controller = new AbortController();
        exchangeController = controller;
        const requestTimeout = window.setTimeout(() => controller.abort(), exchangeTimeoutMs);
        try {
          const result = await this.request<{ token: string; expires_at: number }>('/api/auth/exchange', {
            method: 'POST',
            body: JSON.stringify({ code: exchangeCode }),
            signal: controller.signal,
          });
          finish(() => resolve(result));
        } catch (error) {
          // 授权回调完成前登录码尚不存在；网络抖动、限流与服务端暂时错误也不应让等待流程提前退出。
          const retryable =
            !(error instanceof WorkshopApiError) ||
            error.status === 0 ||
            error.status === 400 ||
            error.status === 408 ||
            error.status === 429 ||
            error.status >= 500;
          if (retryable) {
            if (!(error instanceof WorkshopApiError) || error.status !== 400) {
              lastTemporaryError = error;
              console.warn('[创意工坊] Discord 登录结果暂时获取失败，将继续重试:', error);
            }
          } else {
            finish(() => reject(error));
          }
        } finally {
          window.clearTimeout(requestTimeout);
          if (exchangeController === controller) exchangeController = null;
          exchanging = false;
        }
      };
      const cancel = () => {
        try {
          popup.close();
        } catch {
          // 跨站隔离可能阻止访问授权窗口，仍然可以结束本地等待状态。
        }
        finish(() => reject(new WorkshopApiError('已取消 Discord 登录', 499)));
      };
      const listener = (event: MessageEvent) => {
        if (event.origin !== expectedOrigin || event.data?.type !== 'cultivation-workshop-oauth') return;
        if (event.source && event.source !== popup) return;
        exchangeCode = String(event.data.code || loginId);
        void tryExchange();
      };
      const poll = () => {
        void tryExchange();

        let popupClosed = false;
        try {
          popupClosed = popup.closed;
        } catch {
          // 某些浏览器在跨域跳转期间不允许读取弹窗状态，此时继续依靠登录码轮询。
          return;
        }
        if (!popupClosed) {
          popupClosedAt = null;
          return;
        }

        // 正常授权完成也会自动关闭弹窗；保留短暂宽限期，让最终登录码有机会被兑换。
        popupClosedAt ??= Date.now();
        if (Date.now() - popupClosedAt < popupClosedGraceMs) return;
        if (lastTemporaryError) {
          finish(() =>
            reject(
              new WorkshopApiError(
                `登录窗口已关闭，且登录结果确认失败：${lastTemporaryError instanceof Error ? lastTemporaryError.message : String(lastTemporaryError)}`,
                0,
              ),
            ),
          );
          return;
        }
        finish(() => reject(new WorkshopApiError('登录窗口已关闭，Discord 登录已取消', 499)));
      };
      const pollTimer = window.setInterval(poll, pollIntervalMs);
      const timeoutTimer = window.setTimeout(
        () =>
          finish(() =>
            reject(
              new WorkshopApiError(
                lastTemporaryError
                  ? `Discord 登录结果持续获取失败：${lastTemporaryError instanceof Error ? lastTemporaryError.message : String(lastTemporaryError)}`
                  : '未能取得 Discord 登录结果，请重新登录',
                0,
              ),
            ),
          ),
        5 * 60 * 1000,
      );
      this.cancelPendingLogin?.();
      this.cancelPendingLogin = cancel;
      window.parent.addEventListener('message', listener);
      poll();
    });
  }

  cancelLogin(): void {
    this.cancelPendingLogin?.();
  }

  async login(): Promise<AuthRecord> {
    const base = (await this.getApiBase()).replace(/\/$/u, '');
    const expectedOrigin = new URL(base).origin;
    const openerOrigin = window.parent.location.origin;
    const loginId = crypto.randomUUID().replaceAll('-', '') + crypto.randomUUID().replaceAll('-', '');
    const loginUrl = `${base}/auth/discord/start?opener_origin=${encodeURIComponent(openerOrigin)}&login_id=${loginId}`;
    const popup = window.parent.open(loginUrl, 'cultivation-workshop-oauth', 'popup,width=560,height=760');
    if (!popup) throw new WorkshopApiError('浏览器阻止了登录弹窗，请允许弹窗后重试', 0);
    const exchange = await this.waitForDiscordExchange(popup, expectedOrigin, loginId);
    const me = await this.request<{ user: WorkshopUser }>(
      '/api/auth/me',
      { headers: { Authorization: `Bearer ${exchange.token}` } },
      false,
    );
    const auth: AuthRecord = { key: 'session', token: exchange.token, expiresAt: exchange.expires_at, user: me.user };
    await putAuthRecord(auth);
    return auth;
  }

  async logout(): Promise<void> {
    try {
      await this.request('/api/auth/logout', { method: 'POST' }, true);
    } finally {
      await clearAuthRecord();
    }
  }
}
