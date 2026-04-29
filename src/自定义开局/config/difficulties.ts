import type { DifficultyOption } from '../types';

export const difficulties: DifficultyOption[] = [
  {
    id: 'easy',
    name: '小道悠游',
    subtitle: '轻松体验',
    desc: '资粮丰足，灵根天成，可慢悠悠走访山川。适合首次入道、求安稳之人。',
    cost: 0,
    points: 30,
    level: 1,
    tone: 'jade',
    glyph: '逸',
  },
  {
    id: 'normal',
    name: '寻常修行',
    subtitle: '标准体验',
    desc: '资源不丰不缺，机缘按部就班。适合大多数修行者。',
    cost: 0,
    points: 20,
    level: 2,
    tone: 'gold',
    glyph: '常',
  },
  {
    id: 'hard',
    name: '砺心问道',
    subtitle: '挑战体验',
    desc: '出身寒微，根骨平平，须以勤补拙、于风雨中觅一线天机。',
    cost: 0,
    points: 12,
    level: 3,
    tone: 'cinnabar',
    glyph: '砺',
  },
  {
    id: 'extreme',
    name: '逆天改命',
    subtitle: '极限体验',
    desc: '天地不仁，万事皆敌；以血肉为薪，于绝境中点燃道心。',
    cost: 0,
    points: 6,
    level: 4,
    tone: 'ink',
    glyph: '逆',
  },
];

export const findDifficulty = (id: string | null) =>
  difficulties.find(d => d.id === id);
