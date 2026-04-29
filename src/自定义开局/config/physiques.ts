import type { PhysiqueChoice, PhysiqueOption, PhysiqueTier } from '../types';

export const PHYSIQUE_TIERS: PhysiqueTier[] = ['凡体', '灵体', '道体', '仙体'];

/** 各等级的三维总和 S（取角色生成规则中的高值） */
export const PHYSIQUE_TIER_S: Record<PhysiqueTier, number> = {
  凡体: 30,
  灵体: 50,
  道体: 75,
  仙体: 100,
};

/** 各等级开局点数消耗 */
export const PHYSIQUE_TIER_COST: Record<PhysiqueTier, number> = {
  凡体: 0,
  灵体: 3,
  道体: 9,
  仙体: 15,
};

export const PHYSIQUE_TIER_INTRO: Record<PhysiqueTier, string> = {
  凡体: '普通修士，根基平凡。',
  灵体: '大能修士，微具异象。',
  道体: '气运之子，罕见异体。',
  仙体: '真仙血脉，夺天地造化。',
};

export const physiques: PhysiqueOption[] = [
  // —— 凡体（S=30）——
  {
    id: 'phy-fan-gu',
    name: '凡骨',
    tier: '凡体',
    subtitle: '凡夫之躯',
    desc: '与天地无异，无奇也无短；最易得见，亦最难超脱。',
    cost: 0,
    悟性: 10,
    根骨: 10,
    气感: 10,
    glyph: '凡',
    tags: ['免费'],
  },
  {
    id: 'phy-fan-hui',
    name: '灵慧凡躯',
    tier: '凡体',
    subtitle: '心思机敏',
    desc: '生而善思，悟性略胜常人，可惜根骨气感平庸。',
    cost: 0,
    悟性: 14,
    根骨: 8,
    气感: 8,
    glyph: '慧',
  },
  {
    id: 'phy-fan-zhuo',
    name: '朴拙凡躯',
    tier: '凡体',
    subtitle: '骨架结实',
    desc: '勤恳憨厚，根骨稍坚；适合炼体粗活。',
    cost: 0,
    悟性: 8,
    根骨: 14,
    气感: 8,
    glyph: '拙',
  },
  {
    id: 'phy-fan-min',
    name: '灵敏凡躯',
    tier: '凡体',
    subtitle: '感觉敏锐',
    desc: '气感独胜，对天地灵气最敏锐的凡人。',
    cost: 0,
    悟性: 8,
    根骨: 8,
    气感: 14,
    glyph: '敏',
  },

  // —— 灵体（S=50）——
  {
    id: 'phy-man-li',
    name: '蛮力之躯',
    tier: '灵体',
    subtitle: '骨刚筋韧',
    desc: '体魄如山，开山裂石不在话下；炼体功法事半功倍。',
    cost: 3,
    悟性: 14,
    根骨: 22,
    气感: 14,
    效果: { name: '物理伤害', value: '+25%' },
    glyph: '蛮',
  },
  {
    id: 'phy-tong-tou',
    name: '通透玲珑心',
    tier: '灵体',
    subtitle: '聪慧绝伦',
    desc: '心通玄微，参悟功法常生奇思；适合文修。',
    cost: 3,
    悟性: 22,
    根骨: 14,
    气感: 14,
    效果: { name: '参悟加成', value: '+25%' },
    glyph: '玲',
  },
  {
    id: 'phy-chi-yan',
    name: '赤焰灵体',
    tier: '灵体',
    subtitle: '天生火胎',
    desc: '与火相亲，怒焰化形；与水/木类灵根相冲。',
    cost: 3,
    悟性: 16,
    根骨: 16,
    气感: 18,
    效果: { name: '火系威力', value: '+30%' },
    glyph: '焰',
  },
  {
    id: 'phy-jian-ti',
    name: '先天剑体',
    tier: '灵体',
    subtitle: '为剑而生',
    desc: '与剑器同频，闻锋铁声便心潮澎湃。',
    cost: 3,
    悟性: 17,
    根骨: 16,
    气感: 17,
    效果: { name: '剑系领悟', value: '+30%' },
    glyph: '剑',
  },
  {
    id: 'phy-han-shuang',
    name: '寒霜玉体',
    tier: '灵体',
    subtitle: '冰肌玉骨',
    desc: '肌肤生霜，与水/冰相亲；与火类灵根相冲。',
    cost: 3,
    悟性: 16,
    根骨: 14,
    气感: 20,
    效果: { name: '水/冰系威力', value: '+30%' },
    glyph: '霜',
  },
  {
    id: 'phy-mu-ling',
    name: '木灵青躯',
    tier: '灵体',
    subtitle: '生机盎然',
    desc: '与草木相亲，自带生机；灵植医道之徒亲睐。',
    cost: 3,
    悟性: 14,
    根骨: 18,
    气感: 18,
    效果: { name: '灵植/医道', value: '+30%' },
    glyph: '青',
  },
  {
    id: 'phy-xuan-gui',
    name: '玄龟灵体',
    tier: '灵体',
    subtitle: '坚壳护身',
    desc: '皮厚如铜，骨硬若铁；防御功法事半功倍。',
    cost: 3,
    悟性: 12,
    根骨: 24,
    气感: 14,
    效果: { name: '物理减伤', value: '+30%' },
    glyph: '龟',
  },
  {
    id: 'phy-zhu-que',
    name: '朱雀灵躯',
    tier: '灵体',
    subtitle: '不死之兆',
    desc: '与朱雀相和，浴火重生；火属伤势恢复迅捷。',
    cost: 3,
    悟性: 15,
    根骨: 17,
    气感: 18,
    效果: { name: '火系恢复', value: '+25%' },
    glyph: '凰',
  },

  // —— 道体（S=75）——
  {
    id: 'phy-huang-gu',
    name: '荒古圣体',
    tier: '道体',
    subtitle: '上古遗血',
    desc: '气运绝佳，与天地相和；越战越勇。',
    cost: 9,
    悟性: 23,
    根骨: 27,
    气感: 25,
    效果: { name: '修为获取', value: '+25%' },
    glyph: '荒',
    tags: ['稀有'],
  },
  {
    id: 'phy-tian-lei',
    name: '天雷殛体',
    tier: '道体',
    subtitle: '雷劫淬体',
    desc: '生而饱受雷劫，越受越强；雷系功法绝配。',
    cost: 9,
    悟性: 22,
    根骨: 26,
    气感: 27,
    效果: { name: '雷系威力', value: '+40%' },
    glyph: '雷',
    tags: ['稀有'],
  },
  {
    id: 'phy-da-luo',
    name: '大罗玲珑体',
    tier: '道体',
    subtitle: '心生万法',
    desc: '天造玲珑，触类旁通；万道皆可入。',
    cost: 9,
    悟性: 28,
    根骨: 22,
    气感: 25,
    效果: { name: '功法领悟', value: '+25%' },
    glyph: '罗',
    tags: ['稀有'],
  },
  {
    id: 'phy-bu-mie',
    name: '不灭金身',
    tier: '道体',
    subtitle: '金光护体',
    desc: '佛门所传，金光萦身；正气凛然，邪魔退避。',
    cost: 9,
    悟性: 22,
    根骨: 33,
    气感: 20,
    效果: { name: '物理减伤', value: '+50%' },
    glyph: '金',
    tags: ['稀有'],
  },
  {
    id: 'phy-tai-yin',
    name: '太阴炼形',
    tier: '道体',
    subtitle: '幽月之体',
    desc: '受太阴月华滋养，阴气长盛；月夜修行倍增。',
    cost: 9,
    悟性: 27,
    根骨: 22,
    气感: 26,
    效果: { name: '阴系威力', value: '+35%' },
    glyph: '阴',
    tags: ['稀有'],
  },
  {
    id: 'phy-tai-yang',
    name: '太阳真火体',
    tier: '道体',
    subtitle: '炽阳之体',
    desc: '吸纳日华炼形，真火不灭；与魔煞天敌。',
    cost: 9,
    悟性: 25,
    根骨: 25,
    气感: 25,
    效果: { name: '阳系威力', value: '+35%' },
    glyph: '阳',
    tags: ['稀有'],
  },
  {
    id: 'phy-xuan-wu',
    name: '玄武不动体',
    tier: '道体',
    subtitle: '镇压万法',
    desc: '稳如玄武，万法不侵；专破异术诅咒。',
    cost: 9,
    悟性: 22,
    根骨: 30,
    气感: 23,
    效果: { name: '法术抗性', value: '+40%' },
    glyph: '武',
    tags: ['稀有'],
  },

  // —— 仙体/神体（S=100）——
  {
    id: 'phy-tai-chu',
    name: '太初真魔体',
    tier: '仙体',
    subtitle: '魔焰焚天',
    desc: '魔焰加身，万邪辟易；正法亦不可侵。',
    cost: 15,
    悟性: 30,
    根骨: 38,
    气感: 32,
    效果: { name: '状态抗性', value: '+50%' },
    glyph: '魔',
    tags: ['传说'],
  },
  {
    id: 'phy-bu-si',
    name: '不死不灭躯',
    tier: '仙体',
    subtitle: '永生之躯',
    desc: '魂魄与肉身互不可灭，万劫长生。',
    cost: 15,
    悟性: 30,
    根骨: 42,
    气感: 28,
    效果: { name: '寿元上限', value: '+500 年' },
    glyph: '寂',
    tags: ['传说'],
  },
  {
    id: 'phy-xu-kong',
    name: '虚空幻灭体',
    tier: '仙体',
    subtitle: '虚空之子',
    desc: '神识穿越虚空，超脱因果；幻灭无常。',
    cost: 15,
    悟性: 38,
    根骨: 28,
    气感: 34,
    效果: { name: '神识感知', value: '+50%' },
    glyph: '虚',
    tags: ['传说'],
  },
  {
    id: 'phy-hong-meng',
    name: '鸿蒙开天体',
    tier: '仙体',
    subtitle: '万法之始',
    desc: '与鸿蒙同源，万法之祖；一念可悟天地。',
    cost: 15,
    悟性: 40,
    根骨: 30,
    气感: 30,
    效果: { name: '功法领悟', value: '+60%' },
    glyph: '鸿',
    tags: ['传说'],
  },
  {
    id: 'phy-jiu-tian',
    name: '九天玄女体',
    tier: '仙体',
    subtitle: '群仙之姿',
    desc: '九天玄女遗血，神识冠绝；通晓阵法符箓。',
    cost: 15,
    悟性: 36,
    根骨: 28,
    气感: 36,
    效果: { name: '神识/阵法', value: '+55%' },
    glyph: '玄',
    tags: ['传说'],
  },
  {
    id: 'phy-zi-wei',
    name: '紫薇圣君体',
    tier: '仙体',
    subtitle: '帝星加身',
    desc: '帝星临体，气运加身；逢敌总有奇缘相助。',
    cost: 15,
    悟性: 32,
    根骨: 36,
    气感: 32,
    效果: { name: '修为获取', value: '+50%' },
    glyph: '紫',
    tags: ['传说'],
  },
  {
    id: 'phy-long-huang',
    name: '龙皇神体',
    tier: '仙体',
    subtitle: '龙裔之尊',
    desc: '真龙血脉，威压万兽；近敌力压群雄。',
    cost: 15,
    悟性: 28,
    根骨: 42,
    气感: 30,
    效果: { name: '物理伤害', value: '+50%' },
    glyph: '龙',
    tags: ['传说'],
  },
];

export const findPhysique = (id: string | null): PhysiqueOption | undefined =>
  id ? physiques.find(p => p.id === id) : undefined;

export const physiquesByTier = (tier: PhysiqueTier): PhysiqueOption[] =>
  physiques.filter(p => p.tier === tier);

export function emptyPhysiqueChoice(): PhysiqueChoice {
  return makeDefaultPhysiqueChoice('凡体');
}

/** 切换 tier 时生成默认（自拟）三维：尽量均匀分配 S */
export function makeDefaultPhysiqueChoice(tier: PhysiqueTier): PhysiqueChoice {
  const S = PHYSIQUE_TIER_S[tier];
  const a = Math.floor(S / 3);
  const b = Math.floor(S / 3);
  const c = S - a - b;
  return {
    tier,
    presetId: null,
    customName: '',
    customEffectName: '',
    customEffectValue: '',
    custom悟性: a,
    custom根骨: b,
    custom气感: c,
  };
}

export function normalizePhysiqueChoice(raw: any): PhysiqueChoice {
  const empty = emptyPhysiqueChoice();
  if (!raw || typeof raw !== 'object') return empty;
  const tier: PhysiqueTier = (PHYSIQUE_TIERS as readonly string[]).includes(raw.tier)
    ? (raw.tier as PhysiqueTier)
    : '凡体';
  const fallback = makeDefaultPhysiqueChoice(tier);
  return {
    tier,
    presetId: typeof raw.presetId === 'string' ? raw.presetId : null,
    customName: typeof raw.customName === 'string' ? raw.customName : '',
    customEffectName: typeof raw.customEffectName === 'string' ? raw.customEffectName : '',
    customEffectValue: typeof raw.customEffectValue === 'string' ? raw.customEffectValue : '',
    custom悟性: Number.isFinite(raw.custom悟性) ? raw.custom悟性 : fallback.custom悟性,
    custom根骨: Number.isFinite(raw.custom根骨) ? raw.custom根骨 : fallback.custom根骨,
    custom气感: Number.isFinite(raw.custom气感) ? raw.custom气感 : fallback.custom气感,
  };
}

export function physiqueCost(choice: PhysiqueChoice): number {
  return PHYSIQUE_TIER_COST[choice.tier];
}

/** 自拟三维当前总和 */
export function customPhysiqueSum(choice: PhysiqueChoice): number {
  return (choice.custom悟性 || 0) + (choice.custom根骨 || 0) + (choice.custom气感 || 0);
}

export interface ResolvedPhysique {
  name: string;
  tier: PhysiqueTier;
  desc: string;
  悟性: number;
  根骨: number;
  气感: number;
  效果?: { name: string; value: string };
}

export function physiqueResolved(choice: PhysiqueChoice): ResolvedPhysique {
  if (choice.presetId) {
    const p = findPhysique(choice.presetId);
    if (p) {
      return {
        name: p.name,
        tier: p.tier,
        desc: p.desc || '',
        悟性: p.悟性,
        根骨: p.根骨,
        气感: p.气感,
        效果: p.效果,
      };
    }
  }
  const name = choice.customName.trim() || `${choice.tier}（自拟）`;
  let 效果: { name: string; value: string } | undefined;
  if (choice.tier !== '凡体') {
    const en = choice.customEffectName.trim();
    const ev = choice.customEffectValue.trim();
    if (en) 效果 = { name: en, value: ev };
  }
  return {
    name,
    tier: choice.tier,
    desc: '玩家自拟之体。',
    悟性: choice.custom悟性,
    根骨: choice.custom根骨,
    气感: choice.custom气感,
    效果,
  };
}

export function isPhysiqueChoiceValid(choice: PhysiqueChoice): boolean {
  if (choice.presetId) {
    return !!findPhysique(choice.presetId);
  }
  if (!choice.customName.trim()) return false;
  if (choice.tier !== '凡体' && !choice.customEffectName.trim()) return false;
  if (customPhysiqueSum(choice) !== PHYSIQUE_TIER_S[choice.tier]) return false;
  if (choice.custom悟性 < 1 || choice.custom根骨 < 1 || choice.custom气感 < 1) return false;
  return true;
}
