export type PlotContext = Readonly<{ data: any }>;
export type PlotCondition = (ctx: PlotContext) => boolean;
export type PlotChapter = { name: string; condition: string; gate: PlotCondition };
export type PlotDefinition = { name: string; entry: string; order: number; region: PlotCondition; authorized?: PlotCondition; chapters: PlotChapter[]; completedAliases?: string[] };
export type DailyDefinition = { name: string; entry: string };
export const realm = ({ data }: PlotContext) => String(data.修炼进度?.境界 || '').replace('练气', '炼气');
export const rank = (ctx: PlotContext) => Math.max(0, ['凡人','炼气','筑基','金丹','元婴','化神','返虚','合体','大乘','渡劫'].findIndex(n => realm(ctx).includes(n)));
export const place = ({ data }: PlotContext) => String(data.地点?.具体地点 || '');
export const identity = ({ data }: PlotContext) => [].concat(data.身份 || []).join(' ');
export const always = () => true;
/** Only hard eligibility and reading ranges. The model chooses narrative timing; this never mutates state. */
export function dispatchPlots(data: any, _action: string, plots: readonly PlotDefinition[], _daily: readonly DailyDefinition[] = [], entries?: readonly string[]) {
 const diagnostics: string[] = [];
 const result: { title: string; phase: string; active: boolean; eligible: boolean; condition: string; order: number }[] = [];
 const event = data.事件 || {}, tasks = data.历练 || {}, ctx = { data };
 if (event.聚焦模式 === '暂停') return { title: '', candidates: result, diagnostics };
 const issues = validatePlotRegistry(plots, entries, false);
 diagnostics.push(...issues);
 for (const def of plots) {
  if (issues.some(x => x.includes('[' + def.name + ']'))) continue;
  try {
   if (event.已完成事件?.includes(def.name) || def.completedAliases?.some(n => event.已完成事件?.includes(n))) continue;
   if (def.authorized && !def.authorized(ctx)) continue;
   const task = tasks[def.name];
   if (!task && !def.region(ctx)) continue;
   if (task && task.类别 !== '剧情') continue;
   const index = task ? def.chapters.findIndex(c => c.name === task.阶段) : -1;
   if (task && index < 0) { diagnostics.push('未知幕次：[' + def.name + ']/' + task.阶段); continue; }
   const active = task?.本幕进行中 === true;
   const chapter = def.chapters[active ? index : index + 1];
   if (!chapter) continue;
   // Existing active interaction is not blocked by the NEXT chapter's hard gate.
   const eligible = active || chapter.gate(ctx);
   result.push({ title: def.name, phase: chapter.name, active, eligible, condition: chapter.condition, order: def.order });
  } catch (error) { diagnostics.push('条件异常：[' + def.name + '] ' + String(error)); }
 }
 result.sort((a,b) => a.order-b.order || (a.title < b.title ? -1 : a.title > b.title ? 1 : 0));
 const current = result.find(c => c.active && c.title === event.标题) || result.find(c => c.active);
 // Current chapter has exclusive narrative scope; no automatic selection of unopened chapters.
 const candidates = current ? [current] : result;
 return { title: current?.title || '', candidates, diagnostics };
}
export function validatePlotRegistry(plots: readonly PlotDefinition[], entries?: readonly string[], strict = true): string[] {
 const issues: string[] = [];
 for (const p of plots) {
  if (!p.name || !p.entry || !Number.isFinite(p.order) || (entries && !entries.includes(p.entry)) || plots.filter(x=>x.name===p.name || x.entry===p.entry).length!==1) issues.push('无效或重复注册：['+p.name+']');
  if (!p.chapters.length || new Set(p.chapters.map(c=>c.name)).size!==p.chapters.length || p.chapters.some(c=>!c.name || !c.condition || typeof c.gate!=='function')) issues.push('无效幕次：['+p.name+']');
 }
 if (strict && issues.length) throw Error(issues.join('\n'));
 return issues;
}
