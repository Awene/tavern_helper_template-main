// =============== 通用选项 ===============
export interface Option {
  id: string;
  name: string;
  /** 简短副标题 */
  subtitle?: string;
  /** 详细描述（鼠标悬浮或选中后显示） */
  desc?: string;
  /** 占用点数；负数表示赠送点数 */
  cost: number;
  /** 选项标签，用于过滤/分组 */
  tags?: string[];
  /** 选项底部小图标/装饰字（如「水」「金丹」） */
  glyph?: string;
}

// =============== 难度 ===============
export interface DifficultyOption extends Option {
  /** 总可分配点数（开局预算） */
  points: number;
  /** 难度等级序号；越大越难 */
  level: number;
  /** 颜色基调，用于卡片高亮 */
  tone: 'jade' | 'gold' | 'cinnabar' | 'ink';
}

// =============== 灵根 ===============
export interface RootOption extends Option {
  品阶: string;
  五行: string[];
}

// =============== 体质 ===============
export interface PhysiqueOption extends Option {
  /** 三维基准（悟性/根骨/气感） */
  悟性: number;
  根骨: number;
  气感: number;
  效果?: Record<string, string>;
}

// =============== 出生地 ===============
export interface LocationOption extends Option {
  世界: string;
  地域: string;
  具体地点: string;
}

// =============== 物品（含功法/装备） ===============
export interface ItemOption extends Option {
  /** 分类：功法 / 物品 / 装备 / 灵石 */
  category: '功法' | '物品' | '装备' | '灵石';
  /** 仅当 category=灵石 时使用：一份多少灵石 */
  灵石?: number;
  /** 卡片附加数据（按 MVU schema 给出） */
  data?: Record<string, any>;
}

// =============== 开局故事 ===============
export interface StoryOption extends Option {
  /** 故事正文（Markdown / 纯文本） */
  body: string;
  /** 推荐难度（仅作 UI 提示） */
  recommend?: string;
}

// =============== 玩家选择快照 ===============
export interface Selection {
  difficultyId: string | null;
  rootId: string | null;
  physiqueId: string | null;
  locationId: string | null;
  itemIds: string[];
  storyId: string | null;
  /** 道号（玩家自行输入） */
  道号: string;
}

// =============== 持久化预设 ===============
export interface Preset {
  /** 持久化 id（时间戳生成） */
  id: string;
  /** 显示名 */
  name: string;
  /** 创建时间 ISO */
  createdAt: string;
  selection: Selection;
}
