import { z } from 'zod';

// 修炼功法 Schema
const CultivationArtSchema = z.object({
  运行中: z.boolean().default(false),
  品质: z.string().default('凡'),
  境界: z.string().default('练气期'),
  五行: z.string().optional(),
  类型: z.string().optional(),
  消耗: z.string().optional(),
  标签: z.array(z.string()).optional(),
  效果: z.record(z.string(), z.string()).optional(),
  描述: z.string().optional(),
});

// 状态效果 Schema
const StatusEffectSchema = z.object({
  类型: z.string().default('特殊'),
  效果: z.string().default(''),
  层数: z.number().default(1),
  剩余时间: z.string().default('未知'),
  来源: z.string().optional(),
});

// 物品 Schema
const ItemSchema = z.object({
  品质: z.string().default('凡'),
  境界: z.string().optional(),
  类型: z.string().optional(),
  五行: z.string().optional(),
  标签: z.array(z.string()).optional(),
  数量: z.number().default(0),
  效果: z.record(z.string(), z.string()).optional(),
  描述: z.string().optional(),
  位置: z.string().optional(),
});

// 法宝 Schema
const TreasureSchema = z.object({
  出战: z.boolean().default(false),
  品质: z.string().default('凡'),
  境界: z.string().optional(),
  五行: z.string().optional(),
  消耗: z.string().optional(),
  标签: z.array(z.string()).optional(),
  数量: z.number().default(1),
  效果: z.record(z.string(), z.string()).optional(),
  描述: z.string().optional(),
  位置: z.string().optional(),
  灵气: z
    .object({
      现值: z.number().default(0),
      上限: z.number().default(100),
    })
    .optional(),
  遁速: z.number().optional(),
  命中: z.number().optional(),
  攻击力: z.number().optional(),
  防御力: z.number().optional(),
});

// 傀儡/灵兽 Schema
const PuppetBeastSchema = z.object({
  出战: z.boolean().default(false),
  品质: z.string().default('凡'),
  境界: z.string().optional(),
  五行: z.string().optional(),
  消耗: z.string().optional(),
  标签: z.array(z.string()).optional(),
  数量: z.number().default(1),
  效果: z.record(z.string(), z.string()).optional(),
  描述: z.string().optional(),
  位置: z.string().optional(),
  气血: z
    .object({
      现值: z.number().default(0),
      上限: z.number().default(100),
    })
    .optional(),
  遁速: z.number().optional(),
  命中: z.number().optional(),
  攻击力: z.number().optional(),
  防御力: z.number().optional(),
});

// 储物空间 Schema
const StorageSchema = z
  .object({
    灵石: z.number().default(0),
    物品: z.record(z.string(), ItemSchema).default({}),
    法宝: z.record(z.string(), TreasureSchema).default({}),
    傀儡: z.record(z.string(), PuppetBeastSchema).default({}),
    灵兽: z.record(z.string(), PuppetBeastSchema).default({}),
  })
  .default({ 灵石: 0, 物品: {}, 法宝: {}, 傀儡: {}, 灵兽: {} });

// NPC Schema
const NPCSchema = z.object({
  在场: z.boolean().default(false),
  种族: z.string().default('人族'),
  身份: z.array(z.string()).default([]),
  境界: z.string().default('未知'),
  寿元: z
    .object({
      年龄: z.number().default(0),
      寿命: z.number().default(100),
      外观年龄: z.number().optional(),
    })
    .optional(),
  灵根: z.string().optional(),
  体质: z.string().optional(),
  技艺: z
    .object({
      生产类: z.record(z.string(), z.number()).optional(),
      战斗类: z.record(z.string(), z.number()).optional(),
    })
    .optional(),
  状态: z
    .object({
      气血: z
        .object({
          现值: z.number().default(0),
          上限: z.number().default(100),
        })
        .optional(),
      灵力: z
        .object({
          现值: z.number().default(0),
          上限: z.number().default(100),
        })
        .optional(),
      遁速: z.number().optional(),
    })
    .optional(),
  状态效果: z.record(z.string(), StatusEffectSchema).optional(),
  功法: z.record(z.string(), CultivationArtSchema).optional(),
  储物空间: StorageSchema.optional(),
  性格: z.string().optional(),
  外貌: z.string().optional(),
  着装: z.string().optional(),
  道侣: z.boolean().default(false),
  好感度: z.number().default(0),
});

// 基本信息 Schema
const BasicInfoSchema = z.object({
  姓名: z.string().default('未知'),
  种族: z.string().default('人族'),
  寿元: z
    .object({
      年龄: z.number().default(0),
      寿命: z.number().default(100),
      外观年龄: z.number().default(18),
    })
    .default({ 年龄: 0, 寿命: 100, 外观年龄: 18 }),
  灵根: z
    .object({
      名称: z.string().default('无'),
      灵根五行: z.array(z.string()).default([]),
      灵根品阶: z.string().default('无'),
    })
    .default({ 名称: '无', 灵根五行: [], 灵根品阶: '无' }),
  体质: z
    .object({
      名称: z.string().default('无'),
      描述: z.string().optional(),
      悟性: z.number().default(0),
      根骨: z.number().default(0),
      气感: z.number().default(0),
    })
    .default({ 名称: '无', 描述: '', 悟性: 0, 根骨: 0, 气感: 0 }),
  境界: z
    .object({
      当前境界: z.string().default('练气初期'),
      修为进度: z.number().default(0),
      修为上限: z.number().default(100),
      天谴: z.number().default(0),
    })
    .default({ 当前境界: '练气初期', 修为进度: 0, 修为上限: 100, 天谴: 0 }),
  技艺: z
    .object({
      生产类: z.record(z.string(), z.number()).optional(),
      战斗类: z.record(z.string(), z.number()).optional(),
    })
    .optional(),
  状态: z
    .object({
      气血: z
        .object({
          现值: z.number().default(0),
          上限: z.number().default(100),
        })
        .default({ 现值: 0, 上限: 100 }),
      灵力: z
        .object({
          现值: z.number().default(0),
          上限: z.number().default(100),
        })
        .default({ 现值: 0, 上限: 100 }),
      遁速: z.number().default(0),
    })
    .default({ 气血: { 现值: 0, 上限: 100 }, 灵力: { 现值: 0, 上限: 100 }, 遁速: 0 }),
  地点: z
    .object({
      世界: z.string().default('未知'),
      地域: z.string().default('未知'),
      具体地点: z.string().default('未知'),
    })
    .default({ 世界: '未知', 地域: '未知', 具体地点: '未知' }),
  时间: z
    .object({
      年: z.number().default(0),
      月: z.number().default(1),
      日: z.number().default(1),
      时辰: z.string().default('子时'),
    })
    .default({ 年: 0, 月: 1, 日: 1, 时辰: '子时' }),
  状态效果: z.record(z.string(), StatusEffectSchema).optional(),
});

// 主 Schema
export const CultivationStatusSchema = z.object({
  基本信息: BasicInfoSchema.default(() => ({
    姓名: '未知',
    种族: '人族',
    寿元: { 年龄: 0, 寿命: 100, 外观年龄: 18 },
    灵根: { 名称: '无', 灵根五行: [], 灵根品阶: '无' },
    体质: { 名称: '无', 描述: '', 悟性: 0, 根骨: 0, 气感: 0 },
    境界: { 当前境界: '练气初期', 修为进度: 0, 修为上限: 100, 天谴: 0 },
    状态: { 气血: { 现值: 0, 上限: 100 }, 灵力: { 现值: 0, 上限: 100 }, 遁速: 0 },
    地点: { 世界: '未知', 地域: '未知', 具体地点: '未知' },
    时间: { 年: 0, 月: 1, 日: 1, 时辰: '子时' },
  })),
  修炼功法: z.record(z.string(), CultivationArtSchema).default({}),
  储物空间: StorageSchema,
  关系列表: z.record(z.string(), NPCSchema).default({}),
});

export type CultivationStatusData = z.infer<typeof CultivationStatusSchema>;
