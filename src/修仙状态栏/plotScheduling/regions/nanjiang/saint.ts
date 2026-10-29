import type { PlotDefinition, PlotContext } from '../../types';
import { rank, inside, place, yes, availableRegion, response, actionPattern } from './shared';
const npc = ({ data }: PlotContext) => data.关系列表?.蓝幽月 || data.关系列表?.['五毒圣女·蓝幽月'] || {};
const favor = (ctx: PlotContext) => Number(npc(ctx).好感度 ?? npc(ctx).好感 ?? 0);
const present = (ctx: PlotContext) => yes(npc(ctx).在场) || (Boolean(ctx.data.在场?.蓝幽月) && yes(ctx.data.在场.蓝幽月.在场 ?? true));
const scene = (ctx: PlotContext) => present(ctx) || /药圃|青竹药架/.test(place(ctx));
export const saintPlot: PlotDefinition = {
 name: '五毒圣女·幽月情缘', entry: '[事件]五毒教-圣女', order: 20, region: availableRegion, completedAliases: ['五毒教圣女'],
 opening: ctx => rank(ctx) >= 2 && inside(ctx), openingScene: ctx => /药圃|青竹药架|百草瘴/.test(place(ctx)),
 ...actionPattern('蓝幽月|圣女|药圃|青竹药架|灵糖|封口'), response,
 stages: {
  '同行_确认朋友': { advance: ctx => rank(ctx) >= 3 && favor(ctx) >= 50 && present(ctx), respond: scene },
  '传音求救': { advance: ctx => rank(ctx) >= 3 && favor(ctx) >= 70 && !present(ctx) && !inside(ctx), respond: ctx => scene(ctx) || /传音|蓝幽月|圣女|救援/.test(ctx.action) },
  '秘窟驰援': { advance: ctx => rank(ctx) >= 3 && present(ctx) && place(ctx).includes('寒髓秘窟'), respond: ctx => present(ctx) && place(ctx).includes('寒髓秘窟') },
  '终幕_月下定情': { advance: ctx => rank(ctx) >= 3 && favor(ctx) >= 100 && present(ctx), respond: scene },
 },
};
