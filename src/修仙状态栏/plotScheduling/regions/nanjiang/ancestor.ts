import type { PlotDefinition } from '../../types';
import { rank, realm, identity, response, actionPattern, always } from './shared';
const authorized: PlotDefinition['opening'] = ({ data }) => data.__custom_start__?.story === 'story-wudu-init' || [].concat(data.__custom_start__?.flags || []).some(f => ['万毒祖窟','噬心蛊经'].includes(f));
export const ancestorPlot: PlotDefinition = {
 name: '万毒祖窟·噬心蛊鸣', entry: '[事件]开局-五毒教-万毒祖窟', order: 10,
 region: authorized, opening: authorized, openingScene: always, authorized,
 ...actionPattern('万毒祖窟|祖窟|噬心蛊经|识海|蛊音|蛊鸣|残魂|魔影|压制魔性|以身饲蛊'), response,
 stages: {
  '吞果初醒': { advance: ctx => rank(ctx) >= 2, respond: always },
  '蛊鸣辨毒': { advance: ctx => rank(ctx) > 2 || (rank(ctx) === 2 && /后期|圆满|巅峰/.test(realm(ctx))), respond: always },
  '炼蛊抉择中': { advance: always }, '以身饲蛊': { advance: always },
  '压制魔性': { advance: ctx => rank(ctx) >= 3 && /长老|护法|掌门|教主|供奉/.test(identity(ctx)), respond: always },
  '祖窟归位': { advance: ctx => rank(ctx) >= 5, respond: always },
 },
};
