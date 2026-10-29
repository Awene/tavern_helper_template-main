import type { PlotContext, PlotDefinition, DailyDefinition, PlotDecision } from './types';

/** 调度只读同一快照；判断函数不得修改 data，也不得结算剧情。 */
export function dispatchPlots(data: any, action: string, plots: readonly PlotDefinition[], daily: readonly DailyDefinition[] = [], entries?: readonly string[]): PlotDecision {
  const empty = (): PlotDecision => ({ title: '', phase: '', kind: 'none', advance: false, respond: false, opening: false, diagnostics });
  const diagnostics: string[] = [];
  const event = data.事件 || {}, tasks = data.历练 || {}, done = event.已完成事件 || [];
  if (event.聚焦模式 === '暂停') return empty();
  const ctx: PlotContext = { data, action };
  const names = new Map<string, number>(), entryCounts = new Map<string, number>();
  for (const p of plots) { names.set(p.name, (names.get(p.name) || 0) + 1); entryCounts.set(p.entry, (entryCounts.get(p.entry) || 0) + 1); }
  if (event.聚焦模式 === '手动' && event.标题 && !names.has(event.标题)) diagnostics.push(`未注册的聚焦剧情：${event.标题}`);
  const hasDailyPending = () => daily.some(def => {
    if (entries && !entries.includes(def.entry)) { diagnostics.push(`无效日常入口：${def.name}`); return false; }
    try { return def.pending(ctx); } catch (error) { diagnostics.push(`日常条件异常：${def.name}：${String(error)}`); return false; }
  });
  const candidates: { def: PlotDefinition; phase: string; kind: 'opening' | 'advance' | 'respond'; explicit: boolean; response: boolean }[] = [];
  let mentioned = false;
  for (const def of plots) {
    if (!def.name || names.get(def.name) !== 1 || entryCounts.get(def.entry) !== 1 || !def.entry || (entries && !entries.includes(def.entry)) || !Number.isFinite(def.order)) { diagnostics.push(`无效或重复剧情注册：${def.name}`); continue; }
    try {
    const explicit = def.matches(action);
    mentioned ||= def.mentions?.(action) ?? explicit;
    if (done.includes(def.name) || def.completedAliases?.some(n => done.includes(n))) continue;
    const task = tasks[def.name];
    // 地区只过滤未开启线；已有线仍按各阶段自己的条件检查。
    if (!task && event.标题 !== def.name && !def.region(ctx)) continue;
      if (def.authorized && !def.authorized(ctx)) continue;
      if (!task) {
        if (def.region(ctx) && def.opening(ctx) && (explicit || def.openingScene(ctx))) candidates.push({ def, phase: '', kind: 'opening', explicit, response: false });
        continue;
      }
      if (task.类别 !== '剧情') continue;
      const phase = String(task.阶段 || (event.标题 === def.name ? event.阶段 : '') || '');
      if (!Object.prototype.hasOwnProperty.call(def.stages, phase)) { diagnostics.push(`未知剧情阶段：${def.name}/${phase}`); continue; }
      const stage = def.stages[phase];
      const pending = event.进度?.[def.name]?.待回应 === true;
      const canRespond = pending && Boolean(stage.respond?.(ctx));
      if (canRespond) candidates.push({ def, phase, kind: 'respond', explicit, response: def.response(action) });
      else if (stage.advance(ctx)) candidates.push({ def, phase, kind: 'advance', explicit, response: false });
    } catch (error) { diagnostics.push(`剧情条件异常：${def.name}：${String(error)}`); }
  }
  const sorted = candidates.sort((a, b) => a.def.order - b.def.order || (a.def.name < b.def.name ? -1 : a.def.name > b.def.name ? 1 : 0));
  const selected = (c: typeof candidates[number]): PlotDecision => ({ title: c.def.name, phase: c.phase, kind: c.kind, opening: c.kind === 'opening', advance: c.kind === 'advance', respond: c.kind === 'respond', diagnostics });
  if (event.聚焦模式 === '手动') {
    const focused = sorted.find(c => c.def.name === event.标题 && !(c.def.mentions?.(action) && !c.explicit));
    if (focused) return selected(focused);
    const explicitOpening = sorted.find(c => c.kind === 'opening' && c.explicit);
    if (explicitOpening) return selected(explicitOpening);
    if (hasDailyPending()) return empty();
    const opening = !mentioned && sorted.find(c => c.kind === 'opening');
    return opening ? selected(opening) : empty();
  }
  const explicit = sorted.find(c => c.explicit);
  if (explicit) return selected(explicit);
  if (mentioned) return empty();
  const response = sorted.find(c => c.kind === 'respond' && c.response && c.def.name === event.标题);
  if (response) return selected(response);
  if (hasDailyPending()) return empty();
  const opening = sorted.find(c => c.kind === 'opening');
  return opening ? selected(opening) : empty();
}

/** 所有注册错误离线阻断；运行期同类错误只阻止相关候选并返回诊断。 */
export function validatePlotRegistry(plots: readonly PlotDefinition[], entries: readonly string[]) {
  const names = new Set<string>(), usedEntries = new Set<string>();
  for (const p of plots) {
    if (!p.name || names.has(p.name)) throw new Error(`重复或空剧情名称：${p.name}`);
    names.add(p.name);
    if (usedEntries.has(p.entry)) throw new Error(`重复世界书入口：${p.entry}`);
    usedEntries.add(p.entry);
    if (!entries.includes(p.entry)) throw new Error(`无效世界书入口：${p.entry}`);
    if (!Number.isFinite(p.order) || !p.stages || !Object.keys(p.stages).length) throw new Error(`无效剧情配置：${p.name}`);
    for (const key of ['region', 'opening', 'openingScene', 'matches', 'response'] as const) if (typeof p[key] !== 'function') throw new Error(`缺少剧情条件：${p.name}/${key}`);
    for (const [phase, condition] of Object.entries(p.stages)) if (!phase || typeof condition.advance !== 'function' || (condition.respond !== undefined && typeof condition.respond !== 'function')) throw new Error(`无效阶段条件：${p.name}/${phase}`);
  }
}
