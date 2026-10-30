import type { PlotDefinition, PlotChapter, PlotCondition } from '../core';
import { rank, realm, place, identity, always } from '../core';
export const inside = ({ data }: { data: any }) => /五毒|百草瘴|神木殿|万毒窟|炼蛊池|百毒瘴/.test(String(data.地点?.地域 || '') + String(data.地点?.具体地点 || ''));
export const availableRegion = (ctx: { data: any }) => (!ctx.data.地点?.世界 || ctx.data.地点.世界 === '凡界') && (/南疆|五毒|雨瘴林/.test(String(ctx.data.地点?.地域 || '') + place(ctx)) || inside(ctx));
const chapter = (name: string, condition: string, gate: PlotCondition = always): PlotChapter => ({ name, condition, gate });
const favor = ({data}: {data:any}) => Number((data.关系列表?.蓝幽月 || data.关系列表?.['五毒圣女·蓝幽月'])?.好感度 ?? (data.关系列表?.蓝幽月 || {})?.好感 ?? 0);
export const dreamPlot: PlotDefinition = {
 name: '梦茧', entry: '[事件]五毒教-梦茧', order: 30, region: availableRegion,
 authorized: ctx => identity(ctx).includes('五毒'),
 chapters: [
  chapter('第一幕', '五毒教身份，教内，炼气后期或进度八成', ctx => inside(ctx) && rank(ctx)===1 && (/后|圆满|巅峰/.test(realm(ctx)) || Number(ctx.data.修炼进度?.当前进度 || 0)/Number(ctx.data.修炼进度?.进度上限 || 100)>=.8)),
  chapter('第二幕', '五毒教身份，炼气', ctx => rank(ctx)===1),
  chapter('第三幕', '五毒教身份，筑基中期及以上', ctx => rank(ctx)>2 || (rank(ctx)===2 && /中|后|圆满|巅峰/.test(realm(ctx)))),
  chapter('第四幕', '五毒教身份，金丹及以上', ctx => rank(ctx)>=3),
  chapter('第五幕', '五毒教身份，元婴及以上，归元分支', ctx => rank(ctx)>=4 && ctx.data.历练?.梦茧?.分支==='归元'),
 ],
};
export const saintPlot: PlotDefinition = {
 name: '五毒圣女·幽月情缘', entry: '[事件]五毒教-圣女', order: 20, region: availableRegion, completedAliases: ['五毒教圣女'],
 chapters: [
  chapter('第一幕', '筑基及以上，五毒教内', ctx=>rank(ctx)>=2 && inside(ctx)),
  chapter('第二幕', '金丹及以上，好感至少50', ctx=>rank(ctx)>=3 && favor(ctx)>=50),
  chapter('第三幕', '金丹及以上，好感至少70', ctx=>rank(ctx)>=3 && favor(ctx)>=70),
  chapter('第四幕', '金丹及以上，好感100', ctx=>rank(ctx)>=3 && favor(ctx)>=100),
 ],
};
const authorized = ({data}: {data:any}) => data.__custom_start__?.story==='story-wudu-init' || [].concat(data.__custom_start__?.flags || []).some(f=>['万毒祖窟','噬心蛊经'].includes(f));
export const ancestorPlot: PlotDefinition = {
 name: '万毒祖窟·噬心蛊鸣', entry: '[事件]开局-五毒教-万毒祖窟', order: 10, region: authorized, authorized,
 chapters: [
  chapter('第一幕', '祖窟专属开局授权'),
  chapter('第二幕', '筑基及以上，祖窟专属开局授权', ctx=>rank(ctx)>=2),
  chapter('第三幕', '筑基后期及以上，祖窟专属开局授权', ctx=>rank(ctx)>2 || (rank(ctx)===2 && /后|圆满|巅峰/.test(realm(ctx)))),
  chapter('第四幕', '金丹及以上，宗门高阶身份，压制魔性分支，祖窟专属开局授权', ctx=>rank(ctx)>=3 && /长老|护法|掌门|教主|供奉/.test(identity(ctx)) && ctx.data.历练?.['万毒祖窟·噬心蛊鸣']?.分支==='压制魔性'),
  chapter('第五幕', '化神及以上，祖窟专属开局授权', ctx=>rank(ctx)>=5),
 ],
};
export const nanjiangPlots = [dreamPlot, saintPlot, ancestorPlot];
export const nanjiangDaily = [{ name: '五毒教日常', entry: '[事件]五毒教-日常' }];
