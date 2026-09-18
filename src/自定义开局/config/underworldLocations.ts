import type { LocationNode } from '../types';

/** 依据《冥界总览》的五处生态与宗门。 */
export const underworldRegions: LocationNode[] = [
  {
    id: 'region-underworld',
    name: '冥界',
    description: '沿黄泉路、忘川与南岸诸境展开，远冥通往寄身渡。',
    children: [
      {
        id: 'eco-underworld-huangquan',
        name: '黄泉驿野',
        description: '鬼门关后的长谷与缓坡。黄泉路通往阴都，歇灯镇供新来亡魂落脚，各宗在会招棚招收留居者。',
        tags: ['驿路', '旅舍', '接引'],
      },
      {
        id: 'eco-underworld-yindu',
        name: '阴都盆地',
        description: '忘川中游北岸的城居盆地。阴都与枉死城街坊相连，文书、制衣、夜市与宗门司堂并存。',
        sects: [{ name: '玄津宫', brief: '轮回宗门，掌接引、审判、炼魂与送往轮回。' }],
        tags: ['城居', '轮回', '市井'],
      },
      {
        id: 'eco-underworld-wangchuan',
        name: '忘川两岸',
        description: '忘川沿岸的堤田、船埠与苇荡。苇汀城以种植、织造、修船为生，奈何桥连接两岸。',
        sects: [{ name: '澄川宗', brief: '维护水脉与堤渠，擅长水法、舟运与造船。' }],
        tags: ['河岸', '舟运', '堤田'],
      },
      {
        id: 'eco-underworld-nanan',
        name: '南岸诸境',
        description: '忘川以南的矿山、药谷与菌林。百坊城聚集工匠，青苔镇邻接药圃与村庄。',
        sects: [
          { name: '百骸山', brief: '冶炼、锻造与附体器具制作。' },
          { name: '续灯观', brief: '医治魂伤，培药制香与疗养。' },
          { name: '苔庭院', brief: '培育阴植菌粮，经营药圃与田地。' },
        ],
        tags: ['工坊', '矿山', '药谷'],
      },
      {
        id: 'eco-underworld-yuanming',
        name: '远冥边地',
        description: '南岸之外的旧驿、荒谷与边集。归灯集供商旅补给，寄身渡联系阳间肉体。',
        sects: [{ name: '归尘台', brief: '经营寄身渡，联系阳间肉体与还阳之路。' }],
        tags: ['边地', '商旅', '寄身渡'],
      },
    ],
  },
];
