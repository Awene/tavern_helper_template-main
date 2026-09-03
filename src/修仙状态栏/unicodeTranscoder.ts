export const UNICODE_TRANSCODER_GLOBAL = '__bengexiuxianUnicodeTranscoder__';

export interface UnicodeTranscoderSettings {
  enabled: boolean;
  encodeUserPrompt: boolean;
  encodeAllUserHistory: boolean;
  encodingScheme: string;
  encodingScope: string;
  sparseOutputEncoding: boolean;
  sparseOutputMinWords: number;
  sparseOutputMaxWords: number;
  fixedCharacterReplacement: boolean;
  decodeAssistantOutput: boolean;
  runTagCleanerAfterDecode: boolean;
}

export interface UnicodeEncodingScope {
  id: string;
  name: string;
  target: string;
}

export interface UnicodeEncodingScheme {
  id: string;
  name: string;
  badge: string;
  description: string;
  example: string;
}

export interface UnicodeTranscoderApi {
  getSettings(): UnicodeTranscoderSettings;
  listEncodingScopes(): UnicodeEncodingScope[];
  listEncodingSchemes(): UnicodeEncodingScheme[];
  setMasterEnabled(enabled: boolean, options?: { notify?: boolean }): boolean;
  setUserInputEncoding(enabled: boolean, options?: { notify?: boolean }): boolean;
  setSparseOutputEncoding(enabled: boolean, options?: { notify?: boolean }): boolean;
  setEncodingScope(scope: string, options?: { notify?: boolean }): string;
  setEncodingScheme(scheme: string, options?: { notify?: boolean }): string;
  setFixedCharacterReplacement(enabled: boolean, options?: { notify?: boolean }): boolean;
  retryLatestDecode(): Promise<unknown>;
}

export async function getUnicodeTranscoderApi(timeoutMs = 2500): Promise<UnicodeTranscoderApi> {
  const timeout = new Promise<never>((_, reject) => {
    window.setTimeout(() => reject(new Error('Unicode 转码角色脚本未加载')), timeoutMs);
  });
  // 酒馆助手的 waitGlobalInitialized 只负责等待，不返回全局对象本身。
  // 状态栏运行在 srcdoc iframe 中，角色脚本的 API 则挂在酒馆顶层窗口。
  await Promise.race([waitGlobalInitialized(UNICODE_TRANSCODER_GLOBAL), timeout]);
  const root = window.parent as unknown as Record<string, unknown>;
  const api = root[UNICODE_TRANSCODER_GLOBAL] as UnicodeTranscoderApi | undefined;
  if (!api || typeof api.getSettings !== 'function') {
    throw new Error('Unicode 转码角色脚本接口不可用');
  }
  return api;
}
