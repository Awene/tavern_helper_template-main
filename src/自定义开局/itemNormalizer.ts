/**
 * 物品/功法/法宝/傀儡/灵兽 数值规范化
 *
 * 按 [物品功法生成规则] 系数表:
 *   物品数值 = floor(10^L × 系数 × (1+Q))
 * 提供 normalizeItemForMvu(item) 返回规范化后的 data 字段。
 *
 * UI 卡片(StepInventory.vue) 与 注入(export.ts) 共用此函数,确保所见即所得。
 */

const REALM_L: Record<string, number> = {
  炼气: 1, 练气: 1, 筑基: 2, 金丹: 3, 元婴: 4, 化神: 5,
  返虚: 6, 炼虚: 6, 合体: 7, 大乘: 8, 渡劫: 9, 飞升: 9,
};
const QUALITY_Q: Record<string, number> = {
  凡: 0, 黄: 0.25, 玄: 0.5, 地: 0.75, 天: 1.0,
};

export function calcItemStat(L: number, Q: number, coef: number): number {
  return Math.max(1, Math.floor(Math.pow(10, L) * coef * (1 + Q)));
}

/** d20 数值类(命中/闪避/穿透/减免) 加值: max(1, floor(L/2 + 2Q)) */
function d20Stat(L: number, Q: number): number {
  return Math.max(1, Math.floor(L / 2 + 2 * Q));
}

/** 百分比类(穿透%/减免%) 取值: L×5 + Q×20 */
function pctStat(L: number, Q: number): number {
  return Math.max(0, Math.floor(L * 5 + Q * 20));
}

function stripStatTag(tags: any[], statName: string): string[] {
  if (!Array.isArray(tags)) return [];
  const re = new RegExp(`^\\s*${statName}\\s*[:：]`);
  return tags.filter(t => typeof t === 'string' && !re.test(t));
}

interface ItemLike {
  品质?: string;
  境界?: string;
  类型?: string;
  五行?: string;
  data?: Record<string, any>;
}

/**
 * 物品 子类型修饰位 (在 data 内显式给出):
 *   - 攻击型: 仅符箓使用,默认 true,false 时 攻击力=0
 *   - 加成型: 仅工具使用,默认 false,true 时入 [加成:N] 标签
 */

/**
 * 按规则规范化某件物品的 data 字段。
 * - 保留:描述 / 效果 / 数量 / 位置 / 使用中 / 消耗 / 完整度 / 描述性标签
 * - 校正/写入:品质 / 境界 / 类型 / 五行 / 数值标签(攻击力/防御力 等仅入标签)
 */
export function normalizeItemForMvu(item: ItemLike): Record<string, any> {
  const d: Record<string, any> = { ...(item.data || {}) };
  const Q = QUALITY_Q[item.品质 || '凡'] ?? 0;
  const L = REALM_L[item.境界 || '炼气'] ?? 1;
  const calc = (coef: number) => calcItemStat(L, Q, coef);

  // 公共元数据
  d.品质 = item.品质 ?? d.品质;
  d.境界 = item.境界 ?? d.境界;
  const rawType = item.类型 || d.类型 || '';
  d.类型 = rawType;
  if (item.五行) d.五行 = item.五行;
  if (
    typeof d.使用中 !== 'boolean' &&
    ['心法', '攻击', '咒法', '身法', '护体', '法宝', '傀儡', '灵兽'].includes(rawType)
  ) {
    d.使用中 = false;
  }
  if (!Array.isArray(d.标签)) d.标签 = [];
  // 删除 items.ts 残留的不规范顶级字段(数值进标签,字符串修行速度淘汰)
  delete (d as any).修行速度;
  delete (d as any).攻击力;
  delete (d as any).防御力;

  switch (rawType) {
    case '法宝': {
      // 装备 法宝:攻击力 仅入标签;位置由 items.ts 显式指定(默认不设,即不展示位置)
      const v = calc(0.25);
      d.标签 = [...stripStatTag(d.标签, '攻击力'), `攻击力:${v}`];
      break;
    }
    case '护甲': {
      // 装备 护甲:防御力 仅入标签
      const v = calc(0.15);
      d.位置 = d.位置 || '上装';
      d.标签 = [...stripStatTag(d.标签, '防御力'), `防御力:${v}`];
      break;
    }
    case '饰品': {
      d.位置 = d.位置 || '腰间';
      break;
    }
    case '工具': {
      // 工具 仅当显式标记 加成型 (核心生产工具如丹炉/器鼎/符笔) 才入 加成 标签;
      // 收纳类工具 (储物袋/锦囊) 不加
      d.标签 = stripStatTag(d.标签, '加成');
      if ((d as any).加成型 === true) {
        d.标签 = [...d.标签, `加成:${calc(1.0)}`];
      }
      delete (d as any).加成型;
      break;
    }
    case '心法': {
      d.标签 = [...stripStatTag(d.标签, '修行速度'), `修行速度:${calc(0.3)}`];
      break;
    }
    case '攻击':
    case '咒法': {
      // 功法 攻击/咒法 必含 [命中:X][穿透%:X][攻击力:X]
      d.标签 = [
        ...stripStatTag(d.标签, '命中'),
        ...stripStatTag(d.标签, '穿透%'),
        ...stripStatTag(d.标签, '攻击力'),
        `命中:${d20Stat(L, Q)}`,
        `穿透%:${pctStat(L, Q)}`,
        `攻击力:${calc(0.4)}`,
      ];
      break;
    }
    case '身法': {
      // 功法 身法 必含 [闪避:X][遁速:X]
      d.标签 = [
        ...stripStatTag(d.标签, '闪避'),
        ...stripStatTag(d.标签, '遁速'),
        `闪避:${d20Stat(L, Q)}`,
        `遁速:${calc(1.5)}`,
      ];
      break;
    }
    case '护体': {
      // 功法 护体 必含 [灵气受击|气血受击] [减免%:X] [防御力:X]
      // 默认走 灵气受击(优先吸收伤害的护体功法,占多数);气血受击 由后续编辑覆盖
      const hasTrigger = (d.标签 as any[]).some(
        t => typeof t === 'string' && (t === '灵气受击' || t === '气血受击'),
      );
      d.标签 = [
        ...stripStatTag(d.标签, '减免%'),
        ...stripStatTag(d.标签, '防御力'),
        ...(hasTrigger ? [] : ['灵气受击']),
        `减免%:${pctStat(L, Q)}`,
        `防御力:${calc(0.3)}`,
      ];
      break;
    }
    case '阵法': {
      // 功法.阵法:消耗固定为无,标签必含 [灵气容量:N][攻击力:N]
      const cap = calc(4);    // 灵气容量 系数 2~6, 中值 4
      const atk = calc(0.15); // 攻击力 系数 0~0.3, 中值 0.15
      d.消耗 = '无';
      d.标签 = [
        ...stripStatTag(d.标签, '灵气容量'),
        ...stripStatTag(d.标签, '攻击力'),
        `灵气容量:${cap}`, `攻击力:${atk}`,
      ];
      break;
    }
    case '丹药': {
      // 丹药 无强制标签;恢复值由 效果 描述,不再生成 恢复:N 标签
      d.标签 = stripStatTag(d.标签, '恢复');
      break;
    }
    case '符箓': {
      // 物品 符箓 必含 [灵气消耗:X][攻击力:X] (非攻击型攻击力可=0,由 data.攻击型 显式标记)
      const offensive = (d as any).攻击型 !== false;
      const atk = offensive ? calc(0.4) : 0;
      d.标签 = [
        ...stripStatTag(d.标签, '灵气消耗'),
        ...stripStatTag(d.标签, '攻击力'),
        `灵气消耗:${calc(0.2)}`,
        `攻击力:${atk}`,
      ];
      delete (d as any).攻击型;
      break;
    }
    case '秘籍': {
      const Y = Math.max(1, Math.ceil(L / 2));
      d.完整度 = d.完整度 || '抄本';
      d.阅读进度 = `0/${Y}`;
      d.标签 = [
        ...stripStatTag(d.标签, '完整度'),
        ...stripStatTag(d.标签, '阅读进度'),
        `完整度:${d.完整度}`,
        `阅读进度:${d.阅读进度}`,
      ];
      break;
    }
    case '素材': {
      // 物品 素材 必含 [炼制难度:X];以 10^L × 0.5(单材杂质难度) 为基准
      d.标签 = [
        ...stripStatTag(d.标签, '炼制难度'),
        `炼制难度:${calc(0.5)}`,
      ];
      break;
    }
    case '傀儡':
    case '灵兽': {
      // 傀儡/灵兽 mvu 顶级:资源池(气血/灵气/遁速) + 防御力 + 技能字典;不再有顶级 攻击力/气血
      const hpCoef = rawType === '灵兽' ? 10 : 0.75;
      const hp = calc(hpCoef);
      const mp = calc(0.5);
      const dun = calc(1.25);
      d.资源池 = {
        气血: { 现值: hp, 上限: hp },
        灵气: { 现值: mp, 上限: mp },
        遁速: dun,
      };
      d.防御力 = calc(0.125);
      // 删除可能残留的顶级数字字段(已迁入 资源池)
      delete (d as any).气血;
      delete (d as any).灵气;
      delete (d as any).遁速;
      // 技能字典:留空由 AI 后续生成,初始空对象
      if (!d.技能 || typeof d.技能 !== 'object') d.技能 = {};
      // 旧标签里的 气血:N / 攻击力:N / 遁速:N 清掉(数据已在 资源池/技能 里)
      d.标签 = stripStatTag(d.标签, '气血');
      d.标签 = stripStatTag(d.标签, '攻击力');
      d.标签 = stripStatTag(d.标签, '遁速');
      break;
    }
  }

  return d;
}

/** 用于 UI 显示:按字段优先级抽取数值/数量/位置/效果. */
export interface NormalizedDisplay {
  品质?: string;
  境界?: string;
  类型?: string;
  五行?: string;
  攻击力?: number;
  防御力?: number;
  气血?: number;
  遁速?: number;
  修行速度?: number;
  恢复?: number;
  加成?: number;
  数量?: number;
  位置?: string;
  消耗?: string;
  使用中?: boolean;
  完整度?: string;
  阅读进度?: string;
  效果?: Record<string, string>;
  /** 数值标签(规则强制),如 ['攻击力:4'] */
  数值标签: string[];
  /** 描述性标签(从 items.ts 原本带的) */
  描述标签: string[];
  /** 资源池(仅 傀儡/灵兽);气血上限/灵气上限/遁速 */
  资源池?: {
    气血?: { 现值: number; 上限: number };
    灵气?: { 现值: number; 上限: number };
    遁速?: number;
  };
  /** 技能字典(仅 傀儡/灵兽) */
  技能?: Record<string, { 攻击力?: number; 消耗?: string; 效果?: Record<string, string> }>;
}

/**
 * 拿规范化后的 data,展平给 UI 卡片显示用。
 * 把 data.标签 拆成"数值标签"(K:V 形式) 与 "描述标签"(纯文本 如:'剑修')。
 */
export function toDisplay(item: ItemLike): NormalizedDisplay {
  const d = normalizeItemForMvu(item);
  const tags: string[] = Array.isArray(d.标签) ? d.标签 : [];
  const numericTags: string[] = [];
  const descTags: string[] = [];
  for (const t of tags) {
    if (typeof t !== 'string') continue;
    if (/[:：]/.test(t)) numericTags.push(t);
    else descTags.push(t);
  }
  // 傀儡/灵兽:从 资源池 抽取数值给 UI
  const rp = d.资源池 && typeof d.资源池 === 'object' ? d.资源池 : null;
  const rpHp = rp?.气血?.上限 ?? rp?.气血?.现值;
  const rpDun = rp?.遁速;

  return {
    品质: d.品质,
    境界: d.境界,
    类型: d.类型,
    五行: d.五行,
    // 装备的攻击力/防御力 仅存在于标签里;傀儡/灵兽 也是
    攻击力: pickNumFromTags(numericTags, '攻击力'),
    防御力: typeof d.防御力 === 'number' ? d.防御力 : pickNumFromTags(numericTags, '防御力'),
    气血: typeof rpHp === 'number' ? rpHp : pickNumFromTags(numericTags, '气血'),
    遁速: typeof rpDun === 'number' ? rpDun : pickNumFromTags(numericTags, '遁速'),
    数量: typeof d.数量 === 'number' ? d.数量 : undefined,
    // 储物袋 = 默认存放态,卡片不展示这条信息以减少噪声
    位置: typeof d.位置 === 'string' && d.位置 !== '储物袋' ? d.位置 : undefined,
    消耗: typeof d.消耗 === 'string' ? d.消耗 : undefined,
    使用中: typeof d.使用中 === 'boolean' ? d.使用中 : undefined,
    完整度: typeof d.完整度 === 'string' ? d.完整度 : undefined,
    阅读进度: typeof d.阅读进度 === 'string' ? d.阅读进度 : undefined,
    效果: d.效果 && typeof d.效果 === 'object' && !Array.isArray(d.效果) ? d.效果 : undefined,
    数值标签: numericTags,
    描述标签: descTags,
    修行速度: pickNumFromTags(numericTags, '修行速度'),
    恢复: pickNumFromTags(numericTags, '恢复'),
    加成: pickNumFromTags(numericTags, '加成'),
    资源池: rp ? {
      气血: rp.气血 && typeof rp.气血 === 'object' ? { 现值: Number(rp.气血.现值) || 0, 上限: Number(rp.气血.上限) || 0 } : undefined,
      灵气: rp.灵气 && typeof rp.灵气 === 'object' ? { 现值: Number(rp.灵气.现值) || 0, 上限: Number(rp.灵气.上限) || 0 } : undefined,
      遁速: typeof rp.遁速 === 'number' ? rp.遁速 : undefined,
    } : undefined,
    技能: d.技能 && typeof d.技能 === 'object' && !Array.isArray(d.技能) ? d.技能 : undefined,
  };
}

function pickNumFromTags(tags: string[], key: string): number | undefined {
  for (const t of tags) {
    const m = t.match(new RegExp(`^${key}\\s*[:：]\\s*(\\d+)`));
    if (m) return Number(m[1]);
  }
  return undefined;
}
