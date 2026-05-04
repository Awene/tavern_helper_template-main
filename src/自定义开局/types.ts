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

// =============== 灵根变异预设 ===============
export interface RootMutation {
  id: string;
  /** 显示名（如「剑灵根」「血灵根」） */
  name: string;
  /** 适用属性（金/木/水/火/土/阴/阳/混沌） */
  element: string;
  desc: string;
}

// =============== 灵根选择（多选 + 变异） ===============
export interface RootChoice {
  /** 已选属性集合（金/木/水/火/土/阴/阳/混沌/无） */
  elements: string[];
  /** 是否启用变异；仅 elements 长度为 1 时有效 */
  mutation: boolean;
  /** 选用的预设变异 id；null 表示采用自定义命名 */
  mutationId: string | null;
  /** 自定义变异名称（mutationId 为 null 时使用） */
  customName: string;
}

// =============== 体质 ===============
/** 体质等级：参考世界设定 凡 / 灵 / 道 / 仙(神)四阶 */
export type PhysiqueTier = '凡体' | '灵体' | '道体' | '仙体';

export interface PhysiqueEffect {
  name: string;
  value: string;
}

export interface PhysiqueOption extends Option {
  /** 体质等级，决定 S 与点数消耗 */
  tier: PhysiqueTier;
  /** 三维基准（悟性/根骨/气感） */
  悟性: number;
  根骨: number;
  气感: number;
  /** 单条效果；凡体可缺省 */
  效果?: PhysiqueEffect;
}

/** 体质选择（预设或玩家自拟） */
export interface PhysiqueChoice {
  /** 选定等级 */
  tier: PhysiqueTier;
  /** 选用的预设 id；null = 玩家自拟 */
  presetId: string | null;
  /** 自拟体质名称 */
  customName: string;
  /** 自拟体质效果（凡体可空） */
  customEffectName: string;
  customEffectValue: string;
  /** 自拟三维分配（总和等于该等级 S） */
  custom悟性: number;
  custom根骨: number;
  custom气感: number;
}

// =============== 出生地 ===============
export type LocationKind =
  | '宗门'
  | '王朝'
  | '学府'
  | '组织'
  | '聚落'
  | '关隘'
  | '势力'
  | '其他';

/** 树形地点节点：内部节点（世界/大地域/子域）或可选叶节点（具体地点） */
export interface LocationNode {
  id: string;
  name: string;
  /** 简短描述 */
  description?: string;
  /** 子节点；叶节点不写或为空 */
  children?: LocationNode[];
  /** 仅叶节点提供：地点类型 */
  kind?: LocationKind;
  /** 仅叶节点提供：所在子域名（可读路径，如「中原东部」） */
  subRegionName?: string;
  /** 标签（叶节点） */
  tags?: string[];
}

export interface LocationOption {
  id: string;
  name: string;
  desc?: string;
  世界: string;
  地域: string;
  子域: string;
  具体地点: string;
  kind?: LocationKind;
  tags?: string[];
}

// =============== 物品（含功法/装备/傀儡/灵兽） ===============
export type ItemQuality = '凡' | '黄' | '玄' | '地' | '天';
/** 境界范围限定到化神；本游戏中"凡人"指非修仙者，故不作为物品境界 */
export type ItemRealm = '炼气' | '筑基' | '金丹' | '元婴' | '化神';
export type ItemCategory =
  | '功法'
  | '物品'
  | '装备'
  | '灵石'
  | '傀儡'
  | '灵兽';
export type ItemKind =
  // 功法
  | '心法'
  | '攻击'
  | '咒法'
  | '身法'
  | '护体'
  | '阵法'
  // 装备
  | '法宝'
  | '护甲'
  | '饰品'
  | '工具'
  // 物品
  | '丹药'
  | '符箓'
  | '秘籍'
  | '素材'
  // 战斗实体
  | '傀儡'
  | '灵兽'
  // 资源
  | '灵石';

export interface ItemOption extends Option {
  /** 大类 */
  category: ItemCategory;
  /** 子类型，用于筛选 */
  类型: ItemKind;
  /** 品质（无品质则记 '凡'，灵石可省略） */
  品质?: ItemQuality;
  /** 适用境界（无境界则不填，灵石不填） */
  境界?: ItemRealm;
  /** 五行（可选） */
  五行?: string;
  /** 仅当 category=灵石 时使用：一份多少灵石 */
  灵石?: number;
  /** 卡片附加数据（按 MVU schema 给出） */
  data?: Record<string, any>;
}

/** 玩家自创资材：可携带多件，依品质 / 境界计费 */
export interface CustomItem {
  /** 运行时 id，使用时间戳生成 */
  id: string;
  name: string;
  desc?: string;
  category: ItemCategory;
  类型: ItemKind;
  品质: ItemQuality;
  境界: ItemRealm;
  /** 五行属性必填 */
  五行: string;
}

// =============== 性别 / 元阳元阴 ===============
/** 其他性别无元阳/元阴概念，统计输出时两者均为 false */
export type Gender = '男' | '女' | '其他';

// =============== 开局故事 ===============
export type StoryKind = '宗门' | '散修' | '特殊';
export type SmallRealm = '初期' | '中期' | '后期';

/** 故事可选条件：未满足则禁选 */
export interface StoryConstraints {
  /** 必须为这些叶节点 id 之一（出生地） */
  locationIds?: string[];
  /** 必须落在这些大地域 id 之一 */
  regionIds?: string[];
  /** 必须为该性别 */
  性别?: Gender;
  /** 元阳/元阴必须尚存 */
  元阳元阴必须?: boolean;
  /** 灵根至少含以下任一五行 */
  灵根五行任意?: string[];
  /** 灵根品阶子串匹配（如「单灵根」「双灵根」） */
  灵根品阶?: string[];
  /** 灵根不能含以下任一五行（如：'无'） */
  灵根禁止?: string[];
  /** 体质等级须为以下任一；不设则任意 */
  physiqueTier?: PhysiqueTier[];
}

/** 故事开局设定：年份必须 ≥ 7000 */
export interface StorySettings {
  时间: { 年: number; 月: number; 日: number; 时辰?: string };
  /** 宗门名称；散修则填 '散修' */
  宗门: string;
  /** 初始境界 = 大境界 + 小境界 */
  初始境界: { 大境界: string; 小境界: SmallRealm };
}

export interface StoryOption extends Option {
  /** 故事正文（Markdown / 纯文本） */
  body: string;
  /** 推荐难度（仅作 UI 提示） */
  recommend?: string;
  /** 故事大类 */
  类型?: StoryKind;
  /** 选取条件 */
  constraints?: StoryConstraints;
  /** 开局设定（必填） */
  settings: StorySettings;
}

/** 玩家自创开局故事 */
export interface CustomStory {
  id: string;
  name: string;
  desc?: string;
  body: string;
  类型: StoryKind;
  settings: StorySettings;
}

// =============== 玩家选择快照 ===============
export interface Selection {
  difficultyId: string | null;
  /** 自定义灵根：多选属性 + 可选变异 */
  root: RootChoice;
  /** 自定义体质：等级 + 预设或自拟 */
  physique: PhysiqueChoice;
  /** 性别 */
  性别: Gender;
  /** 元阳（男）/元阴（女）是否尚存（处子之身） */
  元阳元阴: boolean;
  locationId: string | null;
  itemIds: string[];
  /** 玩家自创的资材（可多件） */
  customItems: CustomItem[];
  storyId: string | null;
  /** 玩家自创的开局剧本（仅一篇；为 null 表示未自创） */
  customStory: CustomStory | null;
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
