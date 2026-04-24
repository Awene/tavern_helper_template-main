import { z } from 'zod';

// 修炼功法 Schema
const CultivationArtSchema = z.object({
  使用中: z.boolean().prefault(false),
  品质: z.enum(['凡', '黄', '玄', '地', '天']).prefault('凡'),
  境界: z.string().prefault('练气期'),
  五行: z.enum(['金', '木', '水', '火', '土', '阴', '阳', '混沌']).optional(),
  类型: z.enum(['心法', '攻击', '咒法', '身法', '护体', '其他']).prefault('心法'),
  消耗: z.string().prefault('无'),
  标签: z.array(z.string()).prefault([]),
  效果: z.record(z.string(), z.string()).prefault({}),
  描述: z.string().prefault(''),
});

// 状态效果 Schema
const StatusEffectSchema = z.object({
  类型: z.enum(['增益', '减益', '特殊']).prefault('特殊'),
  效果: z.string().prefault(''),
  层数: z.coerce
    .number()
    .transform(n => _.clamp(n, 0, Infinity))
    .prefault(1),
  剩余时间: z.string().prefault('永久'),
  来源: z.string().optional(),
});

// 物品 Schema
const ItemSchema = z.object({
  品质: z.enum(['凡', '黄', '玄', '地', '天']).prefault('凡'),
  境界: z.string().optional(),
  类型: z
    .enum(['秘籍', '配方', '符箓', '上装', '下装', '丹药', '素材', '武器', '饰品', '工具', '其他'])
    .prefault('其他'),
  五行: z.enum(['金', '木', '水', '火', '土', '阴', '阳', '混沌']).prefault('金'),
  标签: z.array(z.string()).prefault([]),
  数量: z.coerce
    .number()
    .transform(n => _.clamp(n, 0, Infinity))
    .prefault(0),
  效果: z.record(z.string(), z.string()).prefault({}),
  描述: z.string().prefault(''),
  位置: z.enum(['储物袋', '头部', '上装', '下装', '外搭', '足部', '手部', '腰带', '配饰1', '配饰2']).prefault('储物袋'),
});

// 法宝 Schema
const TreasureSchema = z.object({
  使用中: z.boolean().prefault(false),
  品质: z.enum(['凡', '黄', '玄', '地', '天']).prefault('凡'),
  境界: z.string().prefault('凡人'),
  五行: z.enum(['金', '木', '水', '火', '土', '阴', '阳', '混沌']).prefault('金'),
  消耗: z.string().prefault('无'),
  标签: z.array(z.string()).prefault([]),
  数量: z.coerce
    .number()
    .transform(n => _.clamp(n, 0, Infinity))
    .prefault(1),
  效果: z.record(z.string(), z.string()).prefault({}),
  描述: z.string().prefault(''),
  位置: z.string().prefault('储物袋'),
  灵气: z
    .object({
      现值: z.coerce
        .number()
        .transform(n => _.clamp(n, 0, Infinity))
        .prefault(100),
      上限: z.coerce
        .number()
        .transform(n => _.clamp(n, 1, Infinity))
        .prefault(100),
    })
    .prefault({ 现值: 100, 上限: 100 }),
  遁速: z.coerce
    .number()
    .transform(n => _.clamp(n, 0, Infinity))
    .prefault(10),
  命中: z.coerce
    .number()
    .transform(n => _.clamp(n, 0, Infinity))
    .prefault(0),
  攻击力: z.coerce
    .number()
    .transform(n => _.clamp(n, 0, Infinity))
    .prefault(0),
  防御力: z.coerce
    .number()
    .transform(n => _.clamp(n, 0, Infinity))
    .prefault(0),
});

// 傀儡/灵兽 Schema
const PuppetBeastSchema = z.object({
  使用中: z.boolean().prefault(false),
  品质: z.enum(['凡', '黄', '玄', '地', '天']).prefault('凡'),
  境界: z.string().prefault('凡人'),
  五行: z.enum(['金', '木', '水', '火', '土', '阴', '阳', '混沌']).prefault('金'),
  消耗: z.string().prefault('无'),
  标签: z.array(z.string()).prefault([]),
  数量: z.coerce
    .number()
    .transform(n => _.clamp(n, 0, Infinity))
    .prefault(1),
  效果: z.record(z.string(), z.string()).prefault({}),
  描述: z.string().prefault(''),
  位置: z.string().prefault('储物袋'),
  气血: z
    .object({
      现值: z.coerce
        .number()
        .transform(n => _.clamp(n, 0, Infinity))
        .prefault(100),
      上限: z.coerce
        .number()
        .transform(n => _.clamp(n, 1, Infinity))
        .prefault(100),
    })
    .prefault({ 现值: 100, 上限: 100 }),
  遁速: z.coerce
    .number()
    .transform(n => _.clamp(n, 0, Infinity))
    .prefault(10),
  命中: z.coerce
    .number()
    .transform(n => _.clamp(n, 0, Infinity))
    .prefault(0),
  攻击力: z.coerce
    .number()
    .transform(n => _.clamp(n, 0, Infinity))
    .prefault(0),
  防御力: z.coerce
    .number()
    .transform(n => _.clamp(n, 0, Infinity))
    .prefault(0),
});

// 储物空间 Schema
const StorageSchema = z
  .object({
    灵石: z.coerce
      .number()
      .transform(n => _.clamp(n, 0, Infinity))
      .describe('默认单位为下品灵石')
      .prefault(0),
    物品: z.record(z.string(), ItemSchema).prefault({}),
    法宝: z.record(z.string(), TreasureSchema).prefault({}),
    傀儡: z.record(z.string(), PuppetBeastSchema).prefault({}),
    灵兽: z.record(z.string(), PuppetBeastSchema).prefault({}),
  })
  .prefault({ 灵石: 0, 物品: {}, 法宝: {}, 傀儡: {}, 灵兽: {} });

// NPC Schema
const NPCSchema = z.object({
  在场: z.boolean().prefault(false),
  种族: z.string().prefault('人族'),
  身份: z.array(z.string()).prefault([]),
  境界: z.string().prefault('未知'),
  寿元: z
    .object({
      年龄: z.coerce
        .number()
        .transform(n => _.clamp(n, 0, Infinity))
        .prefault(18),
      寿命: z.coerce
        .number()
        .transform(n => _.clamp(n, 0, Infinity))
        .prefault(100),
      外观年龄: z.coerce
        .number()
        .transform(n => _.clamp(n, 0, Infinity))
        .prefault(18),
    })
    .prefault({ 年龄: 18, 寿命: 100, 外观年龄: 18 }),
  灵根: z
    .object({
      名称: z.string().prefault('凡品灵根'),
      灵根五行: z.array(z.enum(['金', '木', '水', '火', '土', '阴', '阳', '混沌'])).prefault([]),
      灵根品阶: z.enum(['单灵根', '双灵根', '三灵根', '四灵根', '五灵根', '无灵根']).prefault('无灵根'),
    })
    .prefault({ 名称: '凡品灵根', 灵根五行: [], 灵根品阶: '无灵根' }),
  体质: z
    .object({
      名称: z.string().prefault('凡体'),
      描述: z.string().prefault(''),
      悟性: z.coerce
        .number()
        .transform(n => _.clamp(n, 0, Infinity))
        .prefault(0),
      根骨: z.coerce
        .number()
        .transform(n => _.clamp(n, 0, Infinity))
        .prefault(0),
      气感: z.coerce
        .number()
        .transform(n => _.clamp(n, 0, Infinity))
        .prefault(0),
    })
    .prefault({ 名称: '凡体', 描述: '', 悟性: 0, 根骨: 0, 气感: 0 }),
  元阴: z.boolean().optional().prefault(undefined),
  元阳: z.boolean().optional().prefault(undefined),
  技艺: z
    .object({
      生产类: z
        .object({
          炼器: z.coerce
            .number()
            .transform(n => _.clamp(n, 0, Infinity))
            .prefault(0),
          驯兽: z.coerce
            .number()
            .transform(n => _.clamp(n, 0, Infinity))
            .prefault(0),
          培育: z.coerce
            .number()
            .transform(n => _.clamp(n, 0, Infinity))
            .prefault(0),
          卜卦: z.coerce
            .number()
            .transform(n => _.clamp(n, 0, Infinity))
            .prefault(0),
          炼丹: z.coerce
            .number()
            .transform(n => _.clamp(n, 0, Infinity))
            .prefault(0),
          制符: z.coerce
            .number()
            .transform(n => _.clamp(n, 0, Infinity))
            .prefault(0),
        })
        .prefault({}),
      战斗类: z
        .object({
          御物: z.coerce
            .number()
            .transform(n => _.clamp(n, 0, Infinity))
            .prefault(0),
          咒法: z.coerce
            .number()
            .transform(n => _.clamp(n, 0, Infinity))
            .prefault(0),
          幻术: z.coerce
            .number()
            .transform(n => _.clamp(n, 0, Infinity))
            .prefault(0),
          阵法: z.coerce
            .number()
            .transform(n => _.clamp(n, 0, Infinity))
            .prefault(0),
          神识: z.coerce
            .number()
            .transform(n => _.clamp(n, 0, Infinity))
            .prefault(0),
          炼体: z.coerce
            .number()
            .transform(n => _.clamp(n, 0, Infinity))
            .prefault(0),
        })
        .prefault({}),
    })
    .prefault({}),
  状态: z
    .object({
      气血: z
        .object({
          现值: z.coerce
            .number()
            .transform(n => _.clamp(n, 0, Infinity))
            .prefault(100),
          上限: z.coerce
            .number()
            .transform(n => _.clamp(n, 1, Infinity))
            .prefault(100),
        })
        .prefault({ 现值: 100, 上限: 100 }),
      灵力: z
        .object({
          现值: z.coerce
            .number()
            .transform(n => _.clamp(n, 0, Infinity))
            .prefault(100),
          上限: z.coerce
            .number()
            .transform(n => _.clamp(n, 1, Infinity))
            .prefault(100),
        })
        .prefault({ 现值: 100, 上限: 100 }),
      遁速: z.coerce
        .number()
        .transform(n => _.clamp(n, 0, Infinity))
        .prefault(10),
    })
    .prefault({ 气血: { 现值: 100, 上限: 100 }, 灵力: { 现值: 100, 上限: 100 }, 遁速: 10 }),
  状态效果: z.record(z.string(), StatusEffectSchema).prefault({}),
  功法: z.record(z.string(), CultivationArtSchema).prefault({}),
  储物空间: StorageSchema.prefault({ 灵石: 0, 物品: {}, 法宝: {}, 傀儡: {}, 灵兽: {} }),
  性格: z.string().prefault(''),
  外貌: z.string().prefault(''),
  着装: z.string().prefault(''),
  道侣: z.boolean().prefault(false),
  好感度: z.coerce
    .number()
    .transform(n => _.clamp(n, -100, 100))
    .prefault(0),
});

// 基本信息 Schema
const BasicInfoSchema = z.object({
  姓名: z.string().prefault('User'),
  种族: z.string().prefault('人族'),
  寿元: z
    .object({
      年龄: z.coerce
        .number()
        .transform(n => _.clamp(n, 0, Infinity))
        .prefault(18),
      寿命: z.coerce
        .number()
        .transform(n => _.clamp(n, 0, Infinity))
        .prefault(100),
      外观年龄: z.coerce
        .number()
        .transform(n => _.clamp(n, 0, Infinity))
        .prefault(18),
    })
    .prefault({ 年龄: 18, 寿命: 100, 外观年龄: 18 }),
  灵根: z
    .object({
      名称: z.string().prefault('凡品灵根'),
      灵根五行: z.array(z.enum(['金', '木', '水', '火', '土', '阴', '阳', '混沌'])).prefault([]),
      灵根品阶: z.enum(['单灵根', '双灵根', '三灵根', '四灵根', '五灵根', '无灵根']).prefault('无灵根'),
    })
    .prefault({ 名称: '凡品灵根', 灵根五行: [], 灵根品阶: '无灵根' }),
  体质: z
    .object({
      名称: z.string().prefault('凡体'),
      描述: z.string().prefault(''),
      悟性: z.coerce
        .number()
        .transform(n => _.clamp(n, 0, Infinity))
        .prefault(0),
      根骨: z.coerce
        .number()
        .transform(n => _.clamp(n, 0, Infinity))
        .prefault(0),
      气感: z.coerce
        .number()
        .transform(n => _.clamp(n, 0, Infinity))
        .prefault(0),
    })
    .prefault({ 名称: '凡体', 描述: '', 悟性: 0, 根骨: 0, 气感: 0 }),
  境界: z
    .object({
      当前境界: z.string().prefault('凡人'),
      修为进度: z.coerce
        .number()
        .transform(n => _.clamp(n, 0, Infinity))
        .prefault(0),
      修为上限: z.coerce
        .number()
        .transform(n => _.clamp(n, 1, Infinity))
        .prefault(100),
      天谴: z.coerce
        .number()
        .transform(n => _.clamp(n, 0, Infinity))
        .prefault(0),
    })
    .prefault({ 当前境界: '凡人', 修为进度: 0, 修为上限: 100, 天谴: 0 }),
  技艺: z
    .object({
      生产类: z
        .object({
          炼器: z.coerce
            .number()
            .transform(n => _.clamp(n, 0, Infinity))
            .prefault(0),
          驯兽: z.coerce
            .number()
            .transform(n => _.clamp(n, 0, Infinity))
            .prefault(0),
          培育: z.coerce
            .number()
            .transform(n => _.clamp(n, 0, Infinity))
            .prefault(0),
          卜卦: z.coerce
            .number()
            .transform(n => _.clamp(n, 0, Infinity))
            .prefault(0),
          炼丹: z.coerce
            .number()
            .transform(n => _.clamp(n, 0, Infinity))
            .prefault(0),
          制符: z.coerce
            .number()
            .transform(n => _.clamp(n, 0, Infinity))
            .prefault(0),
        })
        .prefault({}),
      战斗类: z
        .object({
          御物: z.coerce
            .number()
            .transform(n => _.clamp(n, 0, Infinity))
            .prefault(0),
          咒法: z.coerce
            .number()
            .transform(n => _.clamp(n, 0, Infinity))
            .prefault(0),
          幻术: z.coerce
            .number()
            .transform(n => _.clamp(n, 0, Infinity))
            .prefault(0),
          阵法: z.coerce
            .number()
            .transform(n => _.clamp(n, 0, Infinity))
            .prefault(0),
          神识: z.coerce
            .number()
            .transform(n => _.clamp(n, 0, Infinity))
            .prefault(0),
          炼体: z.coerce
            .number()
            .transform(n => _.clamp(n, 0, Infinity))
            .prefault(0),
        })
        .prefault({}),
    })
    .prefault({}),
  状态: z
    .object({
      气血: z
        .object({
          现值: z.coerce
            .number()
            .transform(n => _.clamp(n, 0, Infinity))
            .prefault(100),
          上限: z.coerce
            .number()
            .transform(n => _.clamp(n, 1, Infinity))
            .prefault(100),
        })
        .prefault({ 现值: 100, 上限: 100 }),
      灵力: z
        .object({
          现值: z.coerce
            .number()
            .transform(n => _.clamp(n, 0, Infinity))
            .prefault(100),
          上限: z.coerce
            .number()
            .transform(n => _.clamp(n, 1, Infinity))
            .prefault(100),
        })
        .prefault({ 现值: 100, 上限: 100 }),
      遁速: z.coerce
        .number()
        .transform(n => _.clamp(n, 0, Infinity))
        .describe('单位：m/s')
        .prefault(10),
    })
    .prefault({ 气血: { 现值: 100, 上限: 100 }, 灵力: { 现值: 100, 上限: 100 }, 遁速: 10 }),
  地点: z
    .object({
      世界: z.enum(['凡界', '灵界', '仙界']).prefault('凡界'),
      地域: z.string().prefault('中原'),
      具体地点: z.string().prefault('荒野'),
    })
    .prefault({ 世界: '凡界', 地域: '中原', 具体地点: '荒野' }),
  时间: z
    .object({
      年: z.coerce.number().prefault(7000),
      月: z.coerce
        .number()
        .transform(n => _.clamp(n, 1, 12))
        .prefault(1),
      日: z.coerce
        .number()
        .transform(n => _.clamp(n, 1, 30))
        .prefault(1),
      时辰: z
        .enum(['子时', '丑时', '寅时', '卯时', '辰时', '巳时', '午时', '未时', '申时', '酉时', '戌时', '亥时'])
        .prefault('午时'),
    })
    .prefault({ 年: 7000, 月: 1, 日: 1, 时辰: '午时' }),
  状态效果: z.record(z.string(), StatusEffectSchema).prefault({}),
});

// 主 Schema
export const CultivationStatusSchema = z.object({
  基本信息: BasicInfoSchema.prefault({
    姓名: 'User',
    种族: '人族',
    寿元: { 年龄: 18, 寿命: 100, 外观年龄: 18 },
    灵根: { 名称: '凡品灵根', 灵根五行: [], 灵根品阶: '无灵根' },
    体质: { 名称: '凡体', 描述: '', 悟性: 0, 根骨: 0, 气感: 0 },
    境界: { 当前境界: '凡人', 修为进度: 0, 修为上限: 100, 天谴: 0 },
    状态: { 气血: { 现值: 100, 上限: 100 }, 灵力: { 现值: 100, 上限: 100 }, 遁速: 10 },
    地点: { 世界: '凡界', 地域: '中原', 具体地点: '荒野' },
    时间: { 年: 7000, 月: 1, 日: 1, 时辰: '午时' },
    状态效果: {},
    技艺: { 生产类: {}, 战斗类: {} },
  }),
  修炼功法: z.record(z.string(), CultivationArtSchema).prefault({}),
  储物空间: StorageSchema.prefault({ 灵石: 0, 物品: {}, 法宝: {}, 傀儡: {}, 灵兽: {} }),
  关系列表: z.record(z.string(), NPCSchema).prefault({}),
});

export type CultivationStatusData = z.infer<typeof CultivationStatusSchema>;
