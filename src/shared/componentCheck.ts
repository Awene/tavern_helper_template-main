export type CheckState = 'ok' | 'warning' | 'missing' | 'unknown';
export interface ComponentCheck {
  id: string;
  name: string;
  state: CheckState;
  current: string;
  expected: string;
  detail: string;
}
export const COMPONENT_BASELINE = {
  helper: '4.9.3',
  template: '1.17.8.1',
  router: '0.19.6',
  preset: '2026.10.22',
  routerConfig: '2026.10.22',
};
export function compareComponentVersion(current: string, expected: string): number | null {
  const parse = (s: string) =>
    /^\d+(?:\.\d+)*$/.test(s.replace(/^v(?:er\.)?/i, ''))
      ? s
          .replace(/^v(?:er\.)?/i, '')
          .split('.')
          .map(Number)
      : null;
  const a = parse(current),
    b = parse(expected);
  if (!a || !b) return null;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const delta = (a[i] ?? 0) - (b[i] ?? 0);
    if (delta) return Math.sign(delta);
  }
  return 0;
}
function versionState(current: string, expected: string): CheckState {
  const result = compareComponentVersion(current, expected);
  return result === null ? 'unknown' : result < 0 ? 'warning' : 'ok';
}
type RouterDiagnostics = {
  version: string;
  ready: boolean;
  enabled: boolean;
  books: Record<string, { rules: number; metadata: { id: string; version: string } | null }>;
};
type Host = Window & {
  TavernHelper?: unknown;
  EjsTemplate?: { getFeatures?: () => { enabled?: boolean; generate_enabled?: boolean } };
  Mvu?: { getMvuData?: unknown; parseMessage?: unknown; version?: string };
  CultivationRuleRouter?: { getDiagnostics?: () => RouterDiagnostics };
};
async function plugin(
  id: string,
  name: string,
  expected: string,
  runtime: boolean,
  disabled = false,
): Promise<ComponentCheck> {
  const row: ComponentCheck = {
    id,
    name,
    expected,
    current: '无法确认',
    state: 'unknown',
    detail: '无法读取版本，请检查插件管理页。',
  };
  try {
    if (typeof isInstalledExtension === 'function' && !isInstalledExtension(id))
      return { ...row, state: 'missing', current: '未安装', detail: '请先安装此插件，然后刷新酒馆。' };
    const response = await window.parent.fetch(
      `/scripts/extensions/third-party/${encodeURIComponent(id)}/manifest.json`,
      { cache: 'no-store', signal: AbortSignal.timeout(4000) },
    );
    if (response.ok) {
      const data = await response.json();
      row.current = String(data.version ?? '无法确认');
      row.state = versionState(row.current, expected);
    }
    row.detail =
      row.state === 'ok'
        ? '达到本卡验证基线。'
        : row.state === 'warning'
          ? '低于本卡验证基线，请更新插件。'
          : row.detail;
    if (!runtime || disabled) {
      row.state = 'warning';
      row.detail = disabled ? '插件已关闭，请启用后重新检测。' : '插件尚未就绪，请启用或刷新后重新检测。';
    }
  } catch {
    row.detail = '版本读取失败，可在插件管理页确认后重新检测。';
  }
  return row;
}
export async function inspectComponents(): Promise<ComponentCheck[]> {
  const host = window.parent as Host;
  const features = host.EjsTemplate?.getFeatures?.();
  const rows = await Promise.all([
    plugin('JS-Slash-Runner', '酒馆助手', COMPONENT_BASELINE.helper, !!host.TavernHelper),
    plugin(
      'ST-Prompt-Template',
      '提示词模板',
      COMPONENT_BASELINE.template,
      !!host.EjsTemplate,
      features?.enabled === false || features?.generate_enabled === false,
    ),
    plugin('cultivation-rule-router', '规则路由插件', COMPONENT_BASELINE.router, !!host.CultivationRuleRouter),
  ]);
  const mvu = host.Mvu;
  const mvuReady = typeof mvu?.getMvuData === 'function' && typeof mvu?.parseMessage === 'function';
  rows.push({
    id: 'mvu',
    name: 'MVU 变量框架',
    state: mvuReady ? 'ok' : 'warning',
    current: mvuReady ? '运行接口就绪' : mvu ? '运行接口不完整' : '尚未加载',
    expected: '运行接口可用',
    detail: mvuReady
      ? '所需变量接口已加载；此项检查运行接口，不核验 MVU 版本。'
      : '请启用角色卡内的 MVU 脚本，等待加载完成后重新检测。',
  });
  try {
    const preset = getPreset('in_use');
    const meta = preset.extensions?.cultivation_card;
    const valid = meta?.id === 'bengexiuxian';
    const current = valid ? String(meta.version ?? '') : '缺少版本标识';
    rows.push({
      id: 'preset',
      name: '当前聊天预设',
      current,
      expected: COMPONENT_BASELINE.preset,
      state: valid ? versionState(current, COMPONENT_BASELINE.preset) : 'warning',
      detail: valid
        ? '检查当前选中的预设；版本为本卡组件修订号。'
        : '请选择新版「本格修仙」预设；旧版或第三方预设无法确认兼容性。',
    });
  } catch {
    rows.push({
      id: 'preset',
      name: '当前聊天预设',
      current: '无法读取',
      expected: COMPONENT_BASELINE.preset,
      state: 'unknown',
      detail: '请确认聊天补全模式及当前使用的预设。',
    });
  }
  try {
    const diagnostics = host.CultivationRuleRouter?.getDiagnostics?.();
    const bound = getCharWorldbookNames('current');
    const books = [bound.primary, ...bound.additional].filter(Boolean) as string[];
    const matches = books.map(book => ({ book, value: diagnostics?.books[book] })).filter(x => x.value);
    const compatible = matches.filter(x => x.value?.metadata?.id === 'bengexiuxian');
    const versions = compatible.map(x => x.value!.metadata!.version);
    const state: CheckState = !diagnostics
      ? 'unknown'
      : !matches.length
        ? 'missing'
        : !diagnostics.ready || !diagnostics.enabled || !compatible.length || compatible.every(x => !x.value!.rules)
          ? 'warning'
          : versions.some(v => versionState(v, COMPONENT_BASELINE.routerConfig) !== 'ok')
            ? 'warning'
            : 'ok';
    rows.push({
      id: 'routerConfig',
      name: '本卡路由配置',
      expected: COMPONENT_BASELINE.routerConfig,
      state,
      current: versions.join(' / ') || (matches.length ? '未标注版本' : '未确认配置'),
      detail: !diagnostics
        ? '请更新路由插件，以读取配置版本。'
        : !diagnostics.enabled
          ? '路由插件总开关已关闭。'
          : state === 'ok'
            ? '当前角色绑定世界书已配置，存在启用的路由规则。'
            : matches.length && !compatible.length
              ? '已找到路由规则，但已导入的配置缺少本卡版本标识。请刷新酒馆加载新版路由插件，再重新导入本卡路由配置。'
              : '请导入本卡新版路由配置，并确认绑定世界书及路由规则已启用。',
    });
  } catch {
    rows.push({
      id: 'routerConfig',
      name: '本卡路由配置',
      expected: COMPONENT_BASELINE.routerConfig,
      state: 'unknown',
      current: '无法确认',
      detail: '无法读取绑定世界书或路由配置，请重新检测。',
    });
  }
  return rows;
}
