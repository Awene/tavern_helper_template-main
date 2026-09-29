import type { LocationNode } from '../types';

export const earthRegions: LocationNode[] = [
  {
    id: 'reg-earth-china',
    name: '中国',
    description: '现代城市与修行教育并行。北京华夏修真科学技术大学接收各地检测出灵根、自愿转学的新生。',
    children: [
      {
        id: 'eco-earth-beijing',
        name: '北京',
        description: '华夏修真科学技术大学开学第一天。带着原学校转来的学籍材料与灵根检测报告，在报到处开始新的校园生活。',
        sects: [{ name: '华夏修真科学技术大学', brief: '简称修科大。全国统一公共修行学府，按境界分级；修士与凡人讲师共同授课。', tags: ['公共培养', '大学生活'] }],
        tags: ['都市', '求学', '灵气复苏'],
      },
    ],
  },
];
