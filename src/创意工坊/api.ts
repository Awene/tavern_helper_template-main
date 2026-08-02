import { clearAuthRecord, getAuthRecord, putAuthRecord } from './storage';
import type { AuthRecord, PackManifest, PackSummary, WorkshopUser } from './types';

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

  listOwnPacks(): Promise<{ items: PackSummary[] }> {
    return this.request('/api/me/packs', {}, true);
  }

  getOwnPack(packId: string): Promise<PackManifest> {
    return this.request(`/api/me/packs/${encodeURIComponent(packId)}`, {}, true);
  }

  getOwnImage(imageId: string): Promise<Blob> {
    return this.requestBlob(`/api/me/images/${encodeURIComponent(imageId)}`, true);
  }

  createPack(input: { name: string; description: string; category: string }): Promise<{ pack: PackSummary }> {
    return this.request('/api/packs', { method: 'POST', body: JSON.stringify(input) }, true);
  }

  updatePack(packId: string, input: { name?: string; description?: string; category?: string }): Promise<{ ok: true }> {
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
    input: { file: Blob; filename: string; rating: string; characterName: string; keywords: string[] },
  ): Promise<{ image: unknown }> {
    const form = new FormData();
    form.set('file', input.file, input.filename);
    form.set('rating', input.rating);
    form.set('character_name', input.characterName);
    form.set('keywords', input.keywords.join(','));
    return this.request(`/api/packs/${encodeURIComponent(packId)}/images`, { method: 'POST', body: form }, true);
  }

  updateImage(
    packId: string,
    imageId: string,
    input: { rating?: string; character_name?: string; keywords?: string[] },
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

  report(targetType: 'pack' | 'image', targetId: string, reason: string): Promise<{ report_id: string }> {
    return this.request(
      '/api/reports',
      { method: 'POST', body: JSON.stringify({ target_type: targetType, target_id: targetId, reason }) },
      true,
    );
  }

  listReports(status = 'open'): Promise<{ items: Record<string, unknown>[] }> {
    return this.request(`/api/admin/reports?status=${encodeURIComponent(status)}`, {}, true);
  }

  handleReport(reportId: string, status: 'resolved' | 'rejected', resolution: string): Promise<{ ok: true }> {
    return this.request(
      `/api/admin/reports/${encodeURIComponent(reportId)}`,
      { method: 'PATCH', body: JSON.stringify({ status, resolution }) },
      true,
    );
  }

  adminHideImage(imageId: string): Promise<{ ok: true }> {
    return this.request(`/api/admin/images/${encodeURIComponent(imageId)}/hide`, { method: 'POST' }, true);
  }

  adminUnpublishPack(packId: string): Promise<{ ok: true }> {
    return this.request(`/api/admin/packs/${encodeURIComponent(packId)}/unpublish`, { method: 'POST' }, true);
  }

  async login(): Promise<AuthRecord> {
    const base = (await this.getApiBase()).replace(/\/$/u, '');
    const expectedOrigin = new URL(base).origin;
    const openerOrigin = window.parent.location.origin;
    const loginUrl = `${base}/auth/discord/start?opener_origin=${encodeURIComponent(openerOrigin)}`;
    const popup = window.parent.open(loginUrl, 'cultivation-workshop-oauth', 'popup,width=560,height=760');
    if (!popup) throw new WorkshopApiError('浏览器阻止了登录弹窗，请允许弹窗后重试', 0);
    const code = await new Promise<string>((resolve, reject) => {
      const timeout = window.setTimeout(
        () => {
          cleanup();
          reject(new WorkshopApiError('Discord 登录超时', 0));
        },
        5 * 60 * 1000,
      );
      const listener = (event: MessageEvent) => {
        if (event.origin !== expectedOrigin || event.data?.type !== 'cultivation-workshop-oauth') return;
        cleanup();
        resolve(String(event.data.code));
      };
      const cleanup = () => {
        window.clearTimeout(timeout);
        window.parent.removeEventListener('message', listener);
      };
      window.parent.addEventListener('message', listener);
    });
    const exchange = await this.request<{ token: string; expires_at: number }>('/api/auth/exchange', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
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
