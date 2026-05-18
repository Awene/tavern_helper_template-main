import type { EcoEntity, LocationNode, LocationOption } from '../types';

/** 当前世界（凡界为主修界域；灵界/仙界暂未开放） */
export const LOCATION_WORLD = '凡界';
export const LOCATION_WORLD_DESC =
  '凡人为主，修士极少。化神之后修行极难，灵界通道在上古已关闭。';

/**
 * 凡界 五大地域 → 生态。
 * - 北境/西域：依世界书《北境总览》《西域总览》采八大生态结构。
 * - 中原/东土/南疆：未做生态大修，暂以「地域=单生态」占位，待后续细化。
 */
export const LOCATION_REGIONS: LocationNode[] = [
  // ==================== 中原 ====================
  {
    id: 'reg-zhongyuan',
    name: '中原',
    description: '平原为主，间有丘峦山地；天江、悬河横贯东西。',
    children: [
      {
        id: 'eco-zy',
        name: '中原',
        description: '神陆中央沃野，仙盟魁首问道仙宗与乾元圣朝并峙；天江悬河贯东西。',
        tags: ['平原', '仙盟首座', '王朝都畿'],
        kingdoms: [
          {
            name: '乾元圣朝',
            brief: '自号护凡之王朝，都于胜天城；设北辰学宫、镇魔司护持凡人。',
            tags: ['王朝'],
          },
        ],
        sects: [
          { name: '问道仙宗', brief: '正道魁首，仙盟之主，居问道山临天江。', tags: ['正道', '仙盟'] },
          { name: '霸体宗', brief: '正道体修宗门，横炼肉身，居龙象山。', tags: ['正道', '体修'] },
          { name: '北辰学宫', brief: '乾元圣朝所立学府，设于胜天城。', tags: ['学府'] },
          { name: '镇魔司', brief: '乾元圣朝特殊执法衙署，总司设于胜天城。', tags: ['执法'] },
          { name: '血杀殿', brief: '主修杀伐之魔道宗门，居断魂崖临悬河。', tags: ['魔道'] },
        ],
      },
    ],
  },

  // ==================== 东土 ====================
  {
    id: 'reg-dongtu',
    name: '东土',
    description: '广袤平原，少山峦，东临无尽海；天江、悬河之下游入海口。',
    children: [
      {
        id: 'eco-dt',
        name: '东土',
        description: '神陆最繁华之地，临渊城万商云集；琉璃丹宗、合欢宗、魔渊阁并立。',
        tags: ['平原', '临海', '商市'],
        kingdoms: [
          {
            name: '稻香盟',
            brief: '东土西部稻香城所成农盟，掌耕牧之利。',
            tags: ['农盟'],
          },
        ],
        sects: [
          { name: '天衍楼', brief: '正道宗门，以阵法、符箓、卜算闻名；居临渊城。', tags: ['正道', '术修'] },
          { name: '魔渊阁', brief: '藏诸般奇诡法术之魔道宗门，居临渊城。', tags: ['魔道'] },
          { name: '合欢宗', brief: '不属正道亦非魔道之宗门，居临渊城。', tags: ['散道'] },
          { name: '琉璃丹宗', brief: '主修丹道之正道宗门，仙盟之属，居流芳山临悬河。', tags: ['正道', '丹道', '仙盟'] },
          { name: '醉月楼', brief: '青楼勾栏，合欢宗产业，居临渊城。', tags: ['散道', '产业'] },
          { name: '金来钱庄', brief: '私家银号；总号居临渊城。', tags: ['商号'] },
          { name: '水乡商会', brief: '众商联会，专掌东土水路。', tags: ['商会'] },
        ],
      },
    ],
  },

  // ==================== 北境 ====================
  {
    id: 'reg-beijing',
    name: '北境',
    description: '草原、苔原、冰川峡湾与极北沙漠并存；愈北愈寒，凡国凡修各踞一隅。',
    children: [
      {
        id: 'eco-bj-xuesong',
        name: '雪松峡湾',
        description: '东北沿海·冰川峡湾。鲸语者公孙氏世代立国，崇北方玄武；龙首楼船游弋峡湾。',
        tags: ['冰川峡湾', '海族', '玄武信仰'],
        kingdoms: [
          {
            name: '沧澜王朝',
            brief: '海上世袭王朝，公孙氏以鲸语者血脉立国；都鲸髓城。',
            tags: ['王朝', '鲛人血脉'],
          },
        ],
        sects: [],
      },
      {
        id: 'eco-bj-yongshuang',
        name: '永霜松涛',
        description: '北部内陆·黑松针叶林。猎户结熊罴会盟自治，黑松王座与雾魇巢穴深藏林心。',
        tags: ['针叶林', '萨满', '猎户'],
        kingdoms: [
          {
            name: '熊罴会盟',
            brief: '松林行猎人之松散联盟，无统一王朝，白袍长老议政。',
            tags: ['长老会盟'],
          },
        ],
        sects: [
          {
            name: '冻骨观',
            brief: '永霜松涛深处依孤坟岭尸气而立之鬼修小宗。',
            tags: ['中立', '鬼修'],
          },
        ],
      },
      {
        id: 'eco-bj-yinsha',
        name: '银沙落星漠',
        description: '西部沙漠。银白沙海与陨铁巨石错落；五大绿洲城邦共结商邦，掌北境西部商道。',
        tags: ['沙漠', '商道', '绿洲'],
        kingdoms: [
          {
            name: '沙裔商邦',
            brief: '五大绿洲城邦联盟，星议会共治，议会驻星陨堡。',
            tags: ['城邦联盟'],
          },
        ],
        sects: [],
      },
      {
        id: 'eco-bj-buzhou',
        name: '不周残脊',
        description: '中央·南北纵贯山脉。玄铁山骨刺破云层；东麓千机门，西麓血莲密教，主脊上为雪鬃高地部。',
        tags: ['山脉', '玄铁', '魔道'],
        kingdoms: [
          {
            name: '雪鬃高地部',
            brief: '高山神权王国，血莲密教附属；都天梯堡，雪冠世袭。',
            tags: ['神权附属国'],
          },
        ],
        sects: [
          {
            name: '千机门',
            brief: '正道机关炼器宗门，居东麓千机峰，神陆最大法宝制造商。',
            tags: ['正道', '炼器'],
          },
          {
            name: '血莲密教',
            brief: '以人祭血供为修法根本之魔道大宗，居西麓千骨陉。',
            tags: ['魔道'],
          },
        ],
      },
      {
        id: 'eco-bj-heiyao',
        name: '黑曜火渊',
        description: '残脊中段·地热裂谷。岩浆河蜿蜒于谷底，寒陆中唯一暖渊；烬阳城悬建东壁阶梯。',
        tags: ['地热裂谷', '炼器', '温泉'],
        kingdoms: [],
        sects: [
          {
            name: '烬阳城',
            brief: '中立修仙城，北境炼器中心；千炉同启之"炉火祭"闻名。',
            tags: ['中立修仙城'],
          },
        ],
      },
      {
        id: 'eco-bj-canglang',
        name: '苍狼草海',
        description: '东南·温带草原。十二部牧民共奉大可汗；苍狼山立为圣山。',
        tags: ['草原', '游牧', '骑兵'],
        kingdoms: [
          {
            name: '苍狼汗国',
            brief: '草原十二部联盟可汗制，金顶王庭随大可汗移动。',
            tags: ['部落联盟'],
          },
        ],
        sects: [],
      },
      {
        id: 'eco-bj-qianjing',
        name: '千镜盐泽',
        description: '东南低地·古海床盐原。浅水覆面如镜，磷火盐场夜起幽蓝；七姓盐家共治。',
        tags: ['盐原', '门阀', '占卜'],
        kingdoms: [
          {
            name: '七姓盐家',
            brief: '钟·镜·唐·萧·卢·杨·谢七大盐商豪族议盟，议堂铎钟城。',
            tags: ['门阀联盟'],
          },
        ],
        sects: [
          {
            name: '盐镜社',
            brief: '镜寒丘倒影幻术秘社，从属七姓镜氏。',
            tags: ['中立', '占卜'],
          },
        ],
      },
      {
        id: 'eco-bj-nanfeng',
        name: '南风锦绣',
        description: '南陲·沃土，北境最宜居之地。乾元圣朝藩国南风国都于锦绣城，文风鼎盛。',
        tags: ['沃土', '文修', '园林'],
        kingdoms: [
          {
            name: '南风国',
            brief: '北境南陲凡人王国，乾元圣朝藩属；萧氏世袭，文风鼎盛。',
            tags: ['藩国'],
          },
        ],
        sects: [
          {
            name: '聆风斋',
            brief: '以音入道之正道宗门，居锦绣城；天下风雅修士之圣地。',
            tags: ['正道', '音律'],
          },
        ],
      },
    ],
  },

  // ==================== 南疆 ====================
  {
    id: 'reg-nanjiang',
    name: '南疆',
    description:
      '湿热雨林、楚地大泽、十万大山与近海红树林并存，南临三层无尽海；道盟统御四宗，与西域仙盟敌对。',
    children: [
      {
        id: 'eco-nj-yuzhang',
        name: '雨瘴林',
        description: '南部·热带雨林·瘴蛊。五毒教神木殿掌万毒；百越南三部苗蛊系世代依附。',
        tags: ['热带雨林', '蛊毒', '道盟'],
        kingdoms: [
          {
            name: '百越国',
            brief: '部落联邦南境，南三部苗蛊系受五毒教渗透。',
            tags: ['部落联邦', '南境'],
          },
        ],
        sects: [
          {
            name: '五毒教',
            brief: '道盟长老席，淬毒炼蛊大宗，居神木殿。',
            tags: ['道盟', '蛊毒'],
          },
        ],
      },
      {
        id: 'eco-nj-cuiyu',
        name: '翠玉丘',
        description:
          '北部·亚热带丘陵。五十年前万兽宗被血洗，今为千形宗改造场；百越北四部抵抗联盟暗存。',
        tags: ['亚热带丘陵', '改造', '道盟'],
        kingdoms: [
          {
            name: '百越国',
            brief: '部落联邦北境，北四部御兽系被千形宗血洗，残部抵抗。',
            tags: ['部落联邦', '北境', '抵抗联盟'],
          },
        ],
        sects: [
          {
            name: '千形宗',
            brief: '道盟长老席，繁育畸变魔兽、活体改造大宗；五十年前血洗万兽宗占据此地。',
            tags: ['道盟', '改造', '畸兽'],
          },
        ],
      },
      {
        id: 'eco-nj-shiwan',
        name: '十万大山',
        description: '西南·原始山脉·妖族禁地。万妖盟七族盘踞，凡国不入；与道盟有平级同盟约。',
        tags: ['原始山脉', '妖族禁地', '万妖盟'],
        kingdoms: [],
        sects: [
          {
            name: '万妖盟',
            brief: '妖族独立联盟，七族共治，与道盟平级同盟约。',
            tags: ['妖族', '同盟', '禁地'],
          },
        ],
      },
      {
        id: 'eco-nj-yongheng',
        name: '永恒谷',
        description:
          '中南·死气谷地。幽冥府通幽阁立于谷心九幽泉；大祀王朝大祀城建于谷口，为道盟附属国之都畿。',
        tags: ['死气谷地', '亡灵', '道盟', '神权奴隶'],
        kingdoms: [
          {
            name: '大祀王朝',
            brief: '残酷神权奴隶王朝，幽冥府公开附属；都畿大祀城建于永恒谷边缘。',
            tags: ['神权奴隶', '幽冥府附属'],
          },
        ],
        sects: [
          {
            name: '幽冥府',
            brief: '道盟副盟主，掌死气与尸傀；大祀王朝公开宗主。',
            tags: ['道盟', '副盟主', '亡灵'],
          },
        ],
      },
      {
        id: 'eco-nj-yunmeng',
        name: '云梦泽',
        description:
          '东部·楚地大泽·王朝腹心。楚天王朝郢都建于泽中水上宫殿；湘灵阁九歌殿即道盟议事中枢。',
        tags: ['湿地大泽', '楚巫', '道盟中枢'],
        kingdoms: [
          {
            name: '楚天王朝',
            brief: '中央集权+巫祝双轨，"王"与"大祝"并尊；都郢城建于云梦泽腹心。',
            tags: ['王朝', '楚巫', '道盟附庸'],
          },
        ],
        sects: [
          {
            name: '湘灵阁',
            brief: '道盟盟主，上古祖巫之失落血裔大宗；阁主湘九灵兼楚天王朝大祝。',
            tags: ['道盟', '盟主', '巫族'],
          },
        ],
      },
      {
        id: 'eco-nj-jinxiu',
        name: '锦绣稻乡',
        description: '中北·楚天粮仓。千里梯田与平原，灵稻三季；楚天稻官府掌粮政，凡修稀少。',
        tags: ['粮仓', '稻田', '楚天'],
        kingdoms: [
          {
            name: '楚天王朝',
            brief: '王朝西境粮仓，稻官府主理粮政；大祝行宫坐镇稻祭。',
            tags: ['王朝', '粮仓'],
          },
        ],
        sects: [],
      },
      {
        id: 'eco-nj-shenmu',
        name: '神木莽原',
        description: '西中·上古神木林·树灵禁地。半 sentient 主神木盘踞林心；凡修不入，凡国无染。',
        tags: ['上古神木', '树灵禁地', '无主'],
        kingdoms: [],
        sects: [],
      },
      {
        id: 'eco-nj-zhusui',
        name: '朱髓孤屿',
        description:
          '远海·异种植物孤岛·大祀圣地。岛中央龙骸谷为大祀活祭祭场；朱髓木、瓶腹木、灵脂香独此一岛。',
        tags: ['远海孤岛', '异种植物', '大祀飞地', '祭地'],
        kingdoms: [
          {
            name: '大祀王朝',
            brief: '远海圣岛，纵目祭师团驻守；活祭船团每年押送奴隶上岸至龙骸谷。',
            tags: ['王朝飞地', '祭地'],
          },
        ],
        sects: [],
      },
    ],
  },

  // ==================== 西域 ====================
  {
    id: 'reg-xiyu',
    name: '西域',
    description: '西临海，中多荒漠，东有无垠雪山纵贯南北；西有古波斯式王朝，东有上古羲皇古朝。',
    children: [
      {
        id: 'eco-xy-rouwfeng',
        name: '柔风海湾',
        description: '西·温带海岸+港湾。柔风港万商云集；圣火塔常燃，胡商海船与商道古碑并存。',
        tags: ['海港', '商道', '祆教'],
        kingdoms: [
          {
            name: '赤焰拜日国',
            brief: '古波斯式王朝，柔风港为西海岸总督治所。',
            tags: ['神王专制'],
          },
        ],
        sects: [
          {
            name: '拜火坛',
            brief: '中立祆教大宗，圣火不灭千年；扶持赤焰拜日国为附属凡国。',
            tags: ['中立', '祆教'],
          },
        ],
      },
      {
        id: 'eco-xy-liusha',
        name: '流沙星海',
        description: '中西·热带沙漠。星辰陨落之黄沙浩瀚无垠；拜日金都立于沙海中央绿洲，圣火塔常燃。',
        tags: ['沙漠', '神王专制', '星陨'],
        kingdoms: [
          {
            name: '赤焰拜日国',
            brief: '拜火坛千年附属凡国，拜日金都为其都。',
            tags: ['王朝'],
          },
        ],
        sects: [],
      },
      {
        id: 'eco-xy-loulan',
        name: '楼兰旧地',
        description: '中央·绿洲废墟群。沙海中三十六绿洲星罗，千年废墟与活城邦并存；楼兰故都犹存。',
        tags: ['绿洲', '废墟', '商旅'],
        kingdoms: [
          {
            name: '赤焰拜日国',
            brief: '楼兰东沙都为其辖境，原三十六绿洲故同盟议事所改建。',
            tags: ['王朝辖境'],
          },
        ],
        sects: [],
      },
      {
        id: 'eco-xy-kunlun',
        name: '昆仑神墟',
        description: '中北·上古灵山。玉山为主峰，瑶池居中央，九门环列；西王母圣地，山海异兽出没。',
        tags: ['灵山', '瑶池', '异兽'],
        kingdoms: [],
        sects: [
          {
            name: '青鸟门',
            brief: '中立灵兽召唤·全女小宗，瑶池畔隐世；以三青鸟为信使。',
            tags: ['中立', '驭兽', '全女'],
          },
        ],
      },
      {
        id: 'eco-xy-puti',
        name: '菩提雪山',
        description: '东北·高原汉传佛国。须弥宫与菩提禅宗祖庭并立；万佛崖立塔。',
        tags: ['雪山', '佛门', '汉传'],
        kingdoms: [
          {
            name: '羲皇古朝',
            brief: '上古羲氏帝朝；菩提雪山为其菩提佛郡。',
            tags: ['上古帝朝'],
          },
        ],
        sects: [
          {
            name: '菩提禅宗',
            brief: '正道·汉传佛门首宗·禅武双修，仙盟成员，祖庭立于雪山。',
            tags: ['正道', '佛门', '仙盟'],
          },
        ],
      },
      {
        id: 'eco-xy-qinglong',
        name: '青龙玉野',
        description: '东·关中沃野。千里玉野沃壤，羲水东西贯穿；承天都立于羲水之畔。',
        tags: ['沃野', '王朝本郡', '道门'],
        kingdoms: [
          {
            name: '羲皇古朝',
            brief: '上古羲氏帝朝，承天本郡（首都所在），都承天都。',
            tags: ['上古帝朝'],
          },
        ],
        sects: [
          {
            name: '承天道门',
            brief: '正道·汉传道门，羲皇古朝国教，仙盟之首，居承天岳主峰。',
            tags: ['正道', '道门', '仙盟', '国教'],
          },
        ],
      },
      {
        id: 'eco-xy-kunwu',
        name: '昆吾石塬',
        description: '东北·喀斯特峰林。千崖风骨遍野，地下千里暗河贯穿；古铜冶遗墟群散布。',
        tags: ['喀斯特', '风穴', '古迹'],
        kingdoms: [
          {
            name: '羲皇古朝',
            brief: '昆吾边郡，王朝与北境互市的陆路过渡。',
            tags: ['王朝边郡'],
          },
        ],
        sects: [],
      },
      {
        id: 'eco-xy-wuyan',
        name: '无垠雪山',
        description: '东南-东·分界山脉。万古不化雪山纵贯南北千里，中原悬河、天江皆发源于此；天玄剑宗与玉女宗各踞一峰。',
        tags: ['雪山', '剑修', '仙盟', '关隘'],
        kingdoms: [
          {
            name: '天门关都护府',
            brief: '中原乾元圣朝在无垠雪山东麓之前哨守军，镇守天门关。',
            tags: ['关隘', '前哨'],
          },
        ],
        sects: [
          {
            name: '天玄剑宗',
            brief: '正道剑修圣地，仙盟成员；人剑合一，心诚剑明。',
            tags: ['正道', '剑修', '仙盟'],
          },
          {
            name: '玉女宗',
            brief: '正道全女宗门，仙盟成员；以太上忘情为道，居雪山北麓。',
            tags: ['正道', '纯女', '仙盟'],
          },
        ],
      },
    ],
  },
];

// ============ 树形遍历助手 ============
/** 扁平化所有可选地点（仅生态叶节点） */
export const locations: LocationOption[] = (() => {
  const out: LocationOption[] = [];
  for (const region of LOCATION_REGIONS) {
    for (const eco of region.children || []) {
      out.push({
        id: eco.id,
        name: eco.name,
        desc: eco.description,
        世界: LOCATION_WORLD,
        地域: region.name,
        生态: eco.name,
        具体地点: eco.name,
        kingdoms: eco.kingdoms,
        sects: eco.sects,
        tags: eco.tags,
      });
    }
  }
  return out;
})();

export const findLocation = (id: string | null): LocationOption | undefined =>
  id ? locations.find(l => l.id === id) : undefined;

export const findRegionById = (id: string): LocationNode | undefined =>
  LOCATION_REGIONS.find(r => r.id === id);

/** 通过生态叶 id 反查所属 region 节点 */
export function findLocationPath(leafId: string): {
  region?: LocationNode;
  leaf?: LocationNode;
} {
  for (const region of LOCATION_REGIONS) {
    const leaf = region.children?.find(l => l.id === leafId);
    if (leaf) return { region, leaf };
  }
  return {};
}

/** 用于辅助展示：把凡国/宗门数组归并成简短文本（多用于卡片副标题） */
export function summarizeEntities(items?: EcoEntity[]): string {
  if (!items || !items.length) return '';
  return items.map(i => i.name).join(' · ');
}
