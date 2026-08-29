import type { RaceName, RaceOption } from '../types';

/**
 * 初始种族清单。
 *
 * 名称与《世界设定-生命种族》保持一致；可选范围与轮回转生面板一致。
 * 妖族、灵族、物化生灵与魔族允许补充具体血脉/本体，主种族仍写入 MVU 的 `种族` 字段。
 */
export const races: RaceOption[] = [
  { id: 'human', name: '人族', glyph: '人', brief: '世间最常见的种族', selectable: true },
  { id: 'wu', name: '巫族', glyph: '巫', brief: '蛮荒巫祝后裔，与天地鬼神立约', selectable: true },
  {
    id: 'yao',
    name: '妖族',
    glyph: '妖',
    brief: '万兽吸纳灵气而成，少数可开智化形',
    selectable: true,
    detailLabel: '妖兽种类',
    detailPlaceholder: '如：白狐、蛟龙',
    canChooseTransformation: true,
    originalFormLabel: '妖兽本体',
  },
  {
    id: 'ling',
    name: '灵族',
    glyph: '灵',
    brief: '天地万物吸纳日月精华自然成精',
    selectable: true,
    detailLabel: '精怪类型',
    detailPlaceholder: '如：木灵、五行真灵',
    canChooseTransformation: true,
    originalFormLabel: '精怪本体',
  },
  {
    id: 'wuhua',
    name: '物化生灵',
    glyph: '器',
    brief: '器物历久通灵，拥有独立意识与人格',
    selectable: true,
    detailLabel: '器物类型',
    detailPlaceholder: '如：剑灵、丹灵、阵灵',
    canChooseTransformation: true,
    originalFormLabel: '器物本体',
  },
  {
    id: 'mo',
    name: '魔族',
    glyph: '魔',
    brief: '上古殉族的稀少残脉，与天魔无关',
    selectable: true,
    detailLabel: '魔族血脉',
    detailPlaceholder: '如：古魔、魅魔、翼魔',
  },
  {
    id: 'gui',
    name: '冥族',
    glyph: '冥',
    brief: '死后转化、阴气滋养之族',
    selectable: false,
    disabledNote: '仅由死亡转化',
  },
  {
    id: 'shen',
    name: '神族',
    glyph: '神',
    brief: '上古神格血脉的延续者',
    selectable: false,
    disabledNote: '暂不可选',
  },
  {
    id: 'yuwai',
    name: '域外异类',
    glyph: '外',
    brief: '游离于世界壁垒之外的危险生命',
    selectable: false,
    disabledNote: '暂不可选',
  },
];

export const selectableRaces = races.filter(race => race.selectable);

export function findRace(name: string | null | undefined): RaceOption | undefined {
  return races.find(race => race.name === name);
}

/** 旧预设或异常导入值统一回退为人族，避免写入世界设定之外的主种族。 */
export function normalizeRaceName(value: unknown): RaceName {
  if (typeof value !== 'string') return '人族';
  const race = races.find(option => option.name === value && option.selectable);
  return race?.name ?? '人族';
}
