import type { StoryOption } from '../types';

export const stories: StoryOption[] = [
  {
    id: 'story-zayou',
    name: '杂役入山',
    subtitle: '从最底层起步',
    desc: '一身布衣，怀揣家书入山，从扫地、挑水、看炉做起。',
    cost: 0,
    glyph: '凡',
    recommend: '寻常修行 / 砺心问道',
    body: `${'凛冬清晨，山门外排起了长队。\n\n你裹着单薄的棉袍，跟着乡邻里几位同行的少年，恭敬地把一封家书递给值守的执事，听对方淡淡道：\n\n"自此入山，再无外事。"\n\n你点了点头，跨过那道高高的石阶——'}`,
  },
  {
    id: 'story-yinyu',
    name: '隐玉初识',
    subtitle: '于市井间结识高人',
    desc: '本欲只在市井度日，却于茶肆偶遇游方仙师，赠你一卷残页。',
    cost: 0,
    glyph: '机',
    recommend: '寻常修行',
    body: `${'你正坐在茶肆角落，看着雪粒打在窗棂上发呆。\n\n邻桌一位灰衣老者忽然冲你笑了笑：\n\n"小友与剑有缘。"\n\n他随手在桌上推过一卷油黄的残页，又自顾自饮尽杯中酒，转眼便消失在风雪中——'}`,
  },
  {
    id: 'story-fuchou',
    name: '血门遗孤',
    subtitle: '负仇前行',
    desc: '门派在魔修夜袭中被屠尽，只你一人带着师门信物逃出生天。',
    cost: -3,
    glyph: '仇',
    recommend: '砺心问道 / 逆天改命',
    body: `${'山门毁于一夜之间。\n\n你伏在血泥里装死，听着师姐的最后一声怒吼，听着那道沉重的拐杖从你身边经过。\n\n直到一切归于死寂。\n\n你紧紧攥着那枚被血浸透的玉牌，在黎明前从断壁残垣中爬出来——'}`,
    tags: ['赠送点数'],
  },
  {
    id: 'story-dadao',
    name: '已悟大道',
    subtitle: '前世今生',
    desc: '你似乎记得前世种种。一切尚未开始，便仿佛已是结局。',
    cost: 6,
    glyph: '道',
    recommend: '小道悠游',
    body: `${'你在朝霞中睁开眼。\n\n窗外是再熟悉不过的灵溪，远处晨钟敲响——\n\n这一切，你似乎在某个梦里见过千百次。\n\n你抬手轻抚胸口的玉牌，那里仿佛还残留着上一世火焚之后的余温——'}`,
    tags: ['传说'],
  },
];

export const findStory = (id: string | null) =>
  stories.find(s => s.id === id);
