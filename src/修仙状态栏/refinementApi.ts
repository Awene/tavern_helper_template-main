const CACHE_PREFIX = 'cultivation:npc-json-compat:v1:';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

/** Only parameter rejection warrants another potentially billable request. */
export function canRetryWithoutSchema(error: unknown): boolean {
  const e = error as any;
  const text = [typeof error === 'string' ? error : '', e?.name, e?.message,
    e?.error?.message, e?.error?.code, e?.code, e?.responseText].filter(Boolean).join(' ');
  const status = Number(e?.status ?? e?.response?.status);
  if ([401, 403, 408, 429].includes(status) || status >= 500 ||
    /abort|cancel|停止|取消|unauthoriz|forbidden|api.?key|quota|rate.?limit|credit|balance|timeout|network|fetch failed|safety|content.?filter/i.test(text)) return false;
  return /INVALID_ARGUMENT|Request contains an invalid argument/i.test(text) ||
    (/json.?schema|response.?format|structured.?output|response.?schema/i.test(text) &&
      /invalid|unsupported|not supported|not allowed|unknown|unrecognized|不支持|无效/i.test(text));
}

export async function refinementConnectionKey(): Promise<string | undefined> {
  try {
    const settings = SillyTavern.chatCompletionSettings;
    const source = settings.chat_completion_source;
    // Some ST versions interpret the argument as settings rather than a source.
    const model = SillyTavern.getChatCompletionModel();
    if (!source || !model || SillyTavern.mainApi !== 'openai') return undefined;
    const endpoint = source === 'custom' ? settings.custom_url : settings.reverse_proxy;
    let address = '';
    if (endpoint) {
      const url = new URL(endpoint);
      // Never persist credentials, query strings or raw connection settings.
      address = url.origin + url.pathname.replace(/\/+$/, '');
    }
    const bytes = new TextEncoder().encode(JSON.stringify([source, model, address]));
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return CACHE_PREFIX + Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return undefined; // Unknown connection: probe each time, never share a fallback key.
  }
}

export async function requestRefinementJson(options: {
  key?: string;
  storage?: Pick<Storage, 'getItem' | 'setItem'>;
  request: (structured: boolean) => Promise<string>;
  onFallback: () => void;
}) {
  const { key, storage, request, onFallback } = options;
  let cached = false;
  try {
    const time = key ? Number(storage?.getItem(key)) : 0;
    cached = time > 0 && Date.now() >= time && Date.now() - time < CACHE_TTL;
  } catch { /* Private browsing/storage policy must not block generation. */ }
  const remember = () => {
    try { if (key) storage?.setItem(key, String(Date.now())); } catch { /* Best effort. */ }
  };
  if (cached) return { text: await request(false), remember: () => {} };
  try {
    return { text: await request(true), remember: () => {} };
  } catch (originalError) {
    if (!canRetryWithoutSchema(originalError)) throw originalError;
    onFallback();
    try {
      return { text: await request(false), remember };
    } catch (fallbackError) {
      if (/abort|cancel|停止|取消/i.test(String(fallbackError))) throw fallbackError;
      throw new Error('结构化请求失败，移除 JSON Schema 后重试仍失败。请检查接口参数、额度与服务商日志。',
        { cause: { originalError, fallbackError } });
    }
  }
}
