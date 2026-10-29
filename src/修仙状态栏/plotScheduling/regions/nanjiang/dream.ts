import type { PlotDefinition } from '../../types';
import { rank, realm, inside, identity, availableRegion, response, actionPattern, always } from './shared';
export const dreamPlot: PlotDefinition = {
 name: '梦茧', entry: '[事件]五毒教-梦茧', order: 30, region: availableRegion,
 opening: ctx => identity(ctx).includes('五毒') && inside(ctx) && rank(ctx) === 1 && (/后|圆满|巅峰/.test(realm(ctx)) || Number(ctx.data.修炼进度?.当前进度 || 0) / Number(ctx.data.修炼进度?.进度上限 || 100) >= .8),
 openingScene: inside, authorized: ctx => identity(ctx).includes('五毒'),
 ...actionPattern('梦茧|血蝶|集毒|五毒蛊|本命蛊|炼蛊池|归元化生|奇毒'), response,
 stages: {
  '追问传说': { advance: always }, '集毒': { advance: always }, '筑基结蛊': { advance: always },
  '梦茧苏醒': { advance: ctx => rank(ctx) > 2 || (rank(ctx) === 2 && /中|后|圆满|巅峰/.test(realm(ctx))), respond: inside },
  '了结抉择': { advance: ctx => rank(ctx) >= 3, respond: inside },
  '收集归元材料': { advance: always }, '炼制归元化生丹': { advance: ctx => rank(ctx) >= 4, respond: inside },
  '丹成待服': { advance: always }, '结局·化蝶': { advance: always }, '结局·完美': { advance: always },
  '结局·茧中': { advance: always }, '结局·夺舍': { advance: always }, '献祭·查证': { advance: always },
 },
};
