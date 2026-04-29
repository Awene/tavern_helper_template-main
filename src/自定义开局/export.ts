/**
 * 把玩家选择组装成 MVU 的 stat_data，并写入当前消息的酒馆变量。
 * 输出形状对齐 src/修仙状态栏/schema.ts。
 */
import {
  findDifficulty,
  findItem,
  findLocation,
  findPhysique,
  findRoot,
  findStory,
} from './config';
import type { Selection } from './types';

export function buildInitialStatData(sel: Selection): Record<string, any> {
  const root = findRoot(sel.rootId);
  const physique = findPhysique(sel.physiqueId);
  const location = findLocation(sel.locationId);
  const difficulty = findDifficulty(sel.difficultyId);
  const story = findStory(sel.storyId);

  // 资粮归类
  const stones = sel.itemIds
    .map(id => findItem(id))
    .filter((x): x is NonNullable<ReturnType<typeof findItem>> => !!x && x.category === '灵石')
    .reduce((sum, x) => sum + (x.灵石 ?? 0), 0);
  const arts: Record<string, any> = {};
  const items: Record<string, any> = {};
  const equips: Record<string, any> = {};
  for (const id of sel.itemIds) {
    const it = findItem(id);
    if (!it) continue;
    if (it.category === '功法') arts[it.name] = it.data || {};
    else if (it.category === '物品') items[it.name] = it.data || {};
    else if (it.category === '装备') equips[it.name] = it.data || {};
  }

  // 体质三维（默认值）
  const 悟性 = physique?.悟性 ?? 8;
  const 根骨 = physique?.根骨 ?? 8;
  const 气感 = physique?.气感 ?? 8;

  // 起步资源池：基于 L=0 凡人，根骨/气感 各加 10%
  const baseHp = Math.max(20, Math.floor(10 * (1 + 根骨 * 0.1)));
  const baseMp = Math.max(10, Math.floor(10 * (1 + 气感 * 0.1)));
  const baseDun = Math.max(2, Math.floor(10 * (1 + 根骨 * 0.02)));

  return {
    基本信息: {
      姓名: sel.道号 || '无名',
      种族: '人族',
      寿元: { 年龄: 16, 寿命: 100, 外观年龄: 16 },
      灵根: {
        名称: root?.name || '凡品灵根',
        五行: root?.五行 || ['无'],
        品阶: root?.品阶 || '无灵根',
      },
      体质: {
        名称: physique?.name || '寻常凡体',
        悟性,
        根骨,
        气感,
        效果: physique?.效果 || {},
      },
      修炼进度: {
        境界: '炼气初期',
        当前进度: 0,
        进度上限: 100,
        天谴: 0,
      },
      技艺: {
        生产类: { 炼器: 0, 驯兽: 0, 培育: 0, 医术: 0, 炼丹: 0, 制符: 0 },
        战斗类: { 御物: 0, 咒法: 0, 幻术: 0, 阵法: 0, 神识: 0, 炼体: 0 },
      },
      资源池: {
        气血: { 现值: baseHp, 上限: baseHp },
        灵力: { 现值: baseMp, 上限: baseMp },
        遁速: baseDun,
      },
      地点: {
        世界: location?.世界 || '凡界',
        地域: location?.地域 || '中原',
        具体地点: location?.具体地点 || '某处村落',
      },
      时间: { 年: 7000, 月: 1, 日: 1, 时辰: '辰时' },
      状态效果: {},
    },
    修炼功法: {
      功法: arts,
    },
    储物空间: {
      灵石: stones,
      物品: items,
      装备: equips,
      傀儡: {},
      灵兽: {},
    },
    关系列表: {},
    传闻: [],
    // 附加信息：自定义开局元数据
    __custom_start__: {
      difficulty: difficulty?.id,
      story: story?.id,
      story_body: story?.body,
      points_total: difficulty?.points ?? 0,
      created_at: new Date().toISOString(),
    },
  };
}

/**
 * 将组装好的 stat_data 写入当前消息的酒馆变量。
 * 失败时记录到 console，并返回 false。
 */
export async function writeInitialStatData(data: Record<string, any>): Promise<boolean> {
  try {
    const message_id =
      typeof getCurrentMessageId === 'function' ? getCurrentMessageId() : -1;
    await insertOrAssignVariables(
      { stat_data: data },
      { type: 'message', message_id },
    );
    return true;
  } catch (err) {
    console.error('[自定义开局] 写入酒馆变量失败：', err);
    return false;
  }
}
