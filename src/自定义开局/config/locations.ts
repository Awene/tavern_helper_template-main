import type { LocationNode, LocationOption } from '../types';

/** 当前世界（凡界为主修界域；灵界/仙界暂未开放） */
export const LOCATION_WORLD = '凡界';
export const LOCATION_WORLD_DESC =
  '凡人为主，修士极少。化神之后修行极难，灵界通道在上古已关闭。';

/**
 * 凡界 五大地域 → 子域 → 具体地点。
 * 数据源自世界书 地域-凡界-{中原|东土|北境|南疆|西域}.txt
 */
export const LOCATION_REGIONS: LocationNode[] = [
  {
    id: 'reg-zhongyuan',
    name: '中原',
    description: '平原为主，间有丘峦山地；天江、悬河横贯东西。',
    children: [
      {
        id: 'sub-zy-east',
        name: '中原东部',
        children: [
          {
            id: 'loc-wendao',
            name: '问道仙宗',
            kind: '宗门',
            description: '综合型正道宗门，正道魁首，仙盟之主，居问道山，临天江。',
            tags: ['正道', '仙盟'],
          },
          {
            id: 'loc-wangxian',
            name: '望仙城',
            kind: '聚落',
            description: '围绕问道仙宗而建，中原最繁盛之城。',
          },
        ],
      },
      {
        id: 'sub-zy-mid',
        name: '中原中部',
        children: [
          {
            id: 'loc-batizong',
            name: '霸体宗',
            kind: '宗门',
            description: '正道体修宗门，以横炼肉身著称，居龙象山，临天江。',
            tags: ['正道', '体修'],
          },
          {
            id: 'loc-qianyuan',
            name: '乾元圣朝',
            kind: '王朝',
            description: '自号护凡人之王朝，都于胜天城。',
            tags: ['王朝'],
          },
          {
            id: 'loc-beichen',
            name: '北辰学宫',
            kind: '学府',
            description: '乾元圣朝所立学府，设于胜天城。',
            tags: ['学府'],
          },
          {
            id: 'loc-zhenmosi',
            name: '镇魔司',
            kind: '组织',
            description: '乾元圣朝特殊执法衙署，总司设于胜天城。',
            tags: ['执法'],
          },
          {
            id: 'loc-shengtian',
            name: '胜天城',
            kind: '聚落',
            description: '凡人聚居之城，因乾元圣朝护佑，凡人利益在此最受周全。',
          },
        ],
      },
      {
        id: 'sub-zy-west',
        name: '中原西部',
        children: [
          {
            id: 'loc-xueshadian',
            name: '血杀殿',
            kind: '宗门',
            description: '主修杀伐之魔道宗门，崇弱肉强食；居断魂崖，临悬河。',
            tags: ['魔道'],
          },
        ],
      },
    ],
  },
  {
    id: 'reg-dongtu',
    name: '东土',
    description: '广袤平原，少山峦，东临海；天江、悬河之下游入海口。',
    children: [
      {
        id: 'sub-dt-east',
        name: '东土东部',
        children: [
          {
            id: 'loc-linyuan',
            name: '临渊城',
            kind: '聚落',
            description: '天下熙攘之地，神陆最繁华之邑，临无尽海。',
          },
          {
            id: 'loc-tianyan',
            name: '天衍楼',
            kind: '宗门',
            description: '正道宗门，以阵法、符箓、卜算之术闻名；居临渊城。',
            tags: ['正道', '术修'],
          },
          {
            id: 'loc-moyuan',
            name: '魔渊阁',
            kind: '宗门',
            description: '藏诸般奇诡法术之魔道宗门，居临渊城。',
            tags: ['魔道'],
          },
          {
            id: 'loc-hehuan',
            name: '合欢宗',
            kind: '宗门',
            description: '不属正道亦非魔道之宗门，居临渊城。',
            tags: ['散道'],
          },
          {
            id: 'loc-zuiyue',
            name: '醉月楼',
            kind: '组织',
            description: '青楼勾栏，合欢宗之产业，居临渊城。',
            tags: ['散道', '产业'],
          },
          {
            id: 'loc-jinlai',
            name: '金来钱庄',
            kind: '组织',
            description: '经济组织，私家银号；总号居临渊城。',
            tags: ['商号'],
          },
        ],
      },
      {
        id: 'sub-dt-mid',
        name: '东土中部',
        children: [
          {
            id: 'loc-liulidanzong',
            name: '琉璃丹宗',
            kind: '宗门',
            description: '主修丹道之正道宗门，仙盟之属，居流芳山，临悬河下游。',
            tags: ['正道', '丹道', '仙盟'],
          },
          {
            id: 'loc-shuixiang',
            name: '水乡商会',
            kind: '组织',
            description: '经济组织，众商联会，专掌东土水路。',
            tags: ['商会'],
          },
        ],
      },
      {
        id: 'sub-dt-west',
        name: '东土西部',
        children: [
          {
            id: 'loc-daoxiang',
            name: '稻香城',
            kind: '聚落',
            description: '极巨之农镇，耕牧为要业，产粮甚丰。',
          },
          {
            id: 'loc-daoxiangmeng',
            name: '稻香盟',
            kind: '组织',
            description: '稻香城为谋农利所结之合作团体。',
            tags: ['农盟'],
          },
        ],
      },
    ],
  },
  {
    id: 'reg-beijing',
    name: '北境',
    description: '草原为主，间有苔原，其北近极地；气候温燥，愈北愈寒。',
    children: [
      {
        id: 'sub-bj-north',
        name: '北境北部',
        children: [
          {
            id: 'loc-zhongye',
            name: '终夜村',
            kind: '聚落',
            description: '北境极边之村，有雪原之风，可见极光。',
          },
          {
            id: 'loc-benlang',
            name: '奔狼众',
            kind: '势力',
            description: '游牧之民，以草原畜牧为业。',
            tags: ['游牧'],
          },
        ],
      },
      {
        id: 'sub-bj-south',
        name: '北境南部',
        children: [
          {
            id: 'loc-jinxiu',
            name: '锦绣城',
            kind: '聚落',
            description: '天下风雅云集之城，近北境与中原之界限。',
          },
          {
            id: 'loc-lingfeng',
            name: '聆风斋',
            kind: '宗门',
            description: '正道宗门，以精音律之道著，居锦绣城。',
            tags: ['正道', '音律'],
          },
          {
            id: 'loc-qianji',
            name: '千机门',
            kind: '宗门',
            description: '正道宗门，以机关、炼器之术著，居石坡。',
            tags: ['正道', '炼器'],
          },
        ],
      },
    ],
  },
  {
    id: 'reg-nanjiang',
    name: '南疆',
    description: '多平原丘陵，间有山峦，南临海；气候温热而湿，水源丰沛。',
    children: [
      {
        id: 'sub-nj-south',
        name: '南疆南部',
        children: [
          {
            id: 'loc-wudu',
            name: '五毒教',
            kind: '宗门',
            description: '魔道宗门，修毒蛊之术，居雨瘴林。',
            tags: ['魔道', '蛊毒'],
          },
          {
            id: 'loc-wanyao',
            name: '万妖盟',
            kind: '势力',
            description: '居十万大山，众妖联盟，鲜少入世。',
            tags: ['妖族'],
          },
        ],
      },
      {
        id: 'sub-nj-mid',
        name: '南疆中部',
        children: [
          {
            id: 'loc-youming',
            name: '幽冥府',
            kind: '宗门',
            description: '掌死气，驱尸傀之魔道宗门，居永恒谷。',
            tags: ['魔道', '亡灵'],
          },
        ],
      },
      {
        id: 'sub-nj-north',
        name: '南疆北部',
        children: [
          {
            id: 'loc-wanshou',
            name: '万兽宗',
            kind: '宗门',
            description: '正道宗门，善驯灵兽并能与之偕战，居翠玉丘。',
            tags: ['正道', '驭兽'],
          },
        ],
      },
    ],
  },
  {
    id: 'reg-xiyu',
    name: '西域',
    description: '西临海，中多荒漠，东有无垠雪山纵贯南北；雪山为西域与中原之界限。',
    children: [
      {
        id: 'sub-xy-west',
        name: '西域西部',
        children: [
          {
            id: 'loc-rouwfeng',
            name: '柔风湾',
            kind: '聚落',
            description: '西域繁华之港湾，临无尽海。',
          },
        ],
      },
      {
        id: 'sub-xy-mid',
        name: '西域中部',
        children: [
          {
            id: 'loc-lunhui',
            name: '轮回教',
            kind: '组织',
            description: '教门，奉梵天。',
            tags: ['教门'],
          },
          {
            id: 'loc-niepan',
            name: '涅槃教',
            kind: '组织',
            description: '教门，奉佛陀。',
            tags: ['教门'],
          },
          {
            id: 'loc-chisha',
            name: '赤沙教',
            kind: '组织',
            description: '教门，奉法老。',
            tags: ['教门'],
          },
        ],
      },
      {
        id: 'sub-xy-east',
        name: '西域东部',
        children: [
          {
            id: 'loc-yunv',
            name: '玉女宗',
            kind: '宗门',
            description: '不属正道、亦非魔道，纯女众宗门，遗世独立；以太上忘情心法著称，位于无垠雪山北麓。',
            tags: ['散道', '纯女'],
          },
          {
            id: 'loc-tianmen',
            name: '天门关',
            kind: '关隘',
            description: '通中原与西域之关隘，位于无垠雪山中部山麓。',
            tags: ['关隘'],
          },
          {
            id: 'loc-tianxuan',
            name: '天玄剑宗',
            kind: '宗门',
            description: '正道剑修名门，仙盟之属，位于无垠雪山中部。',
            tags: ['正道', '剑修', '仙盟'],
          },
        ],
      },
    ],
  },
];

// ============ 树形遍历助手 ============
function* walkLeaves(
  region: LocationNode,
  subRegion: LocationNode,
): Generator<LocationOption> {
  for (const leaf of subRegion.children || []) {
    yield {
      id: leaf.id,
      name: leaf.name,
      desc: leaf.description,
      世界: LOCATION_WORLD,
      地域: region.name,
      子域: subRegion.name,
      具体地点: leaf.name,
      kind: leaf.kind,
      tags: leaf.tags,
    };
  }
}

/** 扁平化所有可选地点（仅叶节点） */
export const locations: LocationOption[] = (() => {
  const out: LocationOption[] = [];
  for (const region of LOCATION_REGIONS) {
    for (const sub of region.children || []) {
      for (const leaf of walkLeaves(region, sub)) {
        out.push(leaf);
      }
    }
  }
  return out;
})();

export const findLocation = (id: string | null): LocationOption | undefined =>
  id ? locations.find(l => l.id === id) : undefined;

export const findRegionById = (id: string): LocationNode | undefined =>
  LOCATION_REGIONS.find(r => r.id === id);

export const findSubRegionById = (
  regionId: string,
  subId: string,
): LocationNode | undefined =>
  findRegionById(regionId)?.children?.find(s => s.id === subId);

/** 通过叶 id 反查所属 region/sub 节点 */
export function findLocationPath(leafId: string): {
  region?: LocationNode;
  sub?: LocationNode;
  leaf?: LocationNode;
} {
  for (const region of LOCATION_REGIONS) {
    for (const sub of region.children || []) {
      const leaf = sub.children?.find(l => l.id === leafId);
      if (leaf) return { region, sub, leaf };
    }
  }
  return {};
}
