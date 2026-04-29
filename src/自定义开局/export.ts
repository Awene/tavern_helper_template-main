/**
 * 把玩家选择组装成 MVU 的 stat_data，并写入当前消息的酒馆变量。
 * 输出形状对齐 src/修仙状态栏/schema.ts。
 */
import {
  LOCATION_WORLD,
  customStoryToOption,
  findDifficulty,
  findItem,
  findLocation,
  findStory,
  physiqueResolved,
  rootDescription,
  rootDisplayName,
  rootTierCanonical,
} from './config';
import type { Selection, StoryOption } from './types';

function resolveStory(sel: Selection): StoryOption | undefined {
  const id = sel.storyId;
  if (!id) return undefined;
  const custom = sel.customStory;
  if (custom && custom.id === id) return customStoryToOption(custom);
  return findStory(id);
}

export function buildInitialStatData(sel: Selection): Record<string, any> {
  const physique = physiqueResolved(sel.physique);
  const location = findLocation(sel.locationId);
  const difficulty = findDifficulty(sel.difficultyId);
  const story = resolveStory(sel);
  const rootName = rootDisplayName(sel.root);
  const rootTier = rootTierCanonical(sel.root);
  const rootElements = sel.root.elements.length ? sel.root.elements.slice() : ['无'];
  const rootDesc = rootDescription(sel.root);

  // 资材归类（含玩家自创）
  const stones = sel.itemIds
    .map(id => findItem(id))
    .filter((x): x is NonNullable<ReturnType<typeof findItem>> => !!x && x.category === '灵石')
    .reduce((sum, x) => sum + (x.灵石 ?? 0), 0);
  const arts: Record<string, any> = {};
  const items: Record<string, any> = {};
  const equips: Record<string, any> = {};
  const puppets: Record<string, any> = {};
  const beasts: Record<string, any> = {};

  function bucket(name: string, category: string, data: Record<string, any>) {
    if (category === '功法') arts[name] = data;
    else if (category === '物品') items[name] = data;
    else if (category === '装备') equips[name] = data;
    else if (category === '傀儡') puppets[name] = data;
    else if (category === '灵兽') beasts[name] = data;
  }

  for (const id of sel.itemIds) {
    const it = findItem(id);
    if (!it || it.category === '灵石') continue;
    bucket(it.name, it.category, it.data || {});
  }
  // 自创资材
  for (const c of sel.customItems) {
    bucket(c.name, c.category, {
      品质: c.品质,
      境界: c.境界,
      类型: c.类型,
      五行: c.五行,
      自创: true,
      描述: c.desc || '',
    });
  }

  // 体质三维
  const 悟性 = physique.悟性;
  const 根骨 = physique.根骨;
  const 气感 = physique.气感;
  const 体质效果 = physique.效果 ? { [physique.效果.name]: physique.效果.value } : {};

  // 起步资源池：基于 L=0 凡人，根骨/气感 各加 10%
  const baseHp = Math.max(20, Math.floor(10 * (1 + 根骨 * 0.1)));
  const baseMp = Math.max(10, Math.floor(10 * (1 + 气感 * 0.1)));
  const baseDun = Math.max(2, Math.floor(10 * (1 + 根骨 * 0.02)));

  // 故事设定（如果有）
  const storySettings = story?.settings;
  const 大境界 = storySettings?.初始境界.大境界 || '炼气';
  const 小境界 = storySettings?.初始境界.小境界 || '初期';
  const 起始时间 = storySettings?.时间 || { 年: 7000, 月: 1, 日: 1, 时辰: '辰时' };
  const 宗门 = storySettings?.宗门 || '散修';

  // 性别 / 元阳元阴：按角色生成规则保留对应键
  // 其他性别：元阳与元阴均为 false（无概念）
  const 元阴元阳: Record<string, boolean> = {};
  if (sel.性别 === '男') 元阴元阳.元阳 = sel.元阳元阴;
  else if (sel.性别 === '女') 元阴元阳.元阴 = sel.元阳元阴;
  else {
    元阴元阳.元阳 = false;
    元阴元阳.元阴 = false;
  }

  return {
    基本信息: {
      姓名: sel.道号 || '无名',
      种族: '人族',
      性别: sel.性别,
      ...元阴元阳,
      宗门,
      寿元: { 年龄: 16, 寿命: 100, 外观年龄: 16 },
      灵根: {
        名称: rootName,
        五行: rootElements,
        品阶: rootTier,
        变异: sel.root.mutation,
        描述: rootDesc,
      },
      体质: {
        名称: physique.name,
        品阶: physique.tier,
        悟性,
        根骨,
        气感,
        效果: 体质效果,
        描述: physique.desc,
      },
      修炼进度: {
        境界: `${大境界}${小境界}`,
        当前进度: 0,
        进度上限: 100,
        天谴: 0,
      },
      技艺: {
        生产类: { 炼器: 0, 驯兽: 0, 培育: 0, 医术: 0, 炼丹: 0, 制符: 0 },
        战斗类: { 御物: 0, 咒法: 0, 幻术: 0, 阵法: 0, 神识: 0, 炼体: 0 },
      },
      资源池: {
        气血: { 现值: baseHp, 上限: baseHp },
        灵力: { 现值: baseMp, 上限: baseMp },
        遁速: baseDun,
      },
      地点: {
        世界: location?.世界 || LOCATION_WORLD,
        地域: location?.地域 || '中原',
        子域: location?.子域 || '',
        具体地点: location?.具体地点 || '某处村落',
      },
      时间: {
        年: 起始时间.年,
        月: 起始时间.月,
        日: 起始时间.日,
        时辰: 起始时间.时辰 || '辰时',
      },
      状态效果: {},
    },
    修炼功法: {
      功法: arts,
    },
    储物空间: {
      灵石: stones,
      物品: items,
      装备: equips,
      傀儡: puppets,
      灵兽: beasts,
    },
    关系列表: {},
    传闻: [],
    // 附加信息：自定义开局元数据
    __custom_start__: {
      difficulty: difficulty?.id,
      story: story?.id,
      story_body: story?.body,
      points_total: difficulty?.points ?? 0,
      created_at: new Date().toISOString(),
    },
  };
}

/**
 * 将组装好的 stat_data 写入当前消息的酒馆变量。
 * 失败时记录到 console，并返回 false。
 */
export async function writeInitialStatData(data: Record<string, any>): Promise<boolean> {
  try {
    const message_id =
      typeof getCurrentMessageId === 'function' ? getCurrentMessageId() : -1;
    await insertOrAssignVariables(
      { stat_data: data },
      { type: 'message', message_id },
    );
    return true;
  } catch (err) {
    console.error('[自定义开局] 写入酒馆变量失败：', err);
    return false;
  }
}

// ============ AI 提示词生成 ============
/**
 * 把玩家选择渲染为发送给 AI 的纯文本提示词。
 * 参考 src/custom_start/core/utils/data-exporter.ts 的 generateAIPrompt 风格。
 */
export function generateAIPrompt(sel: Selection): string {
  const physique = physiqueResolved(sel.physique);
  const story = resolveStory(sel);
  const location = findLocation(sel.locationId);
  const difficulty = findDifficulty(sel.difficultyId);
  const rootName = rootDisplayName(sel.root);
  const rootTier = rootTierCanonical(sel.root);
  const rootElements = sel.root.elements.length ? sel.root.elements.slice() : ['无'];
  const rootDesc = rootDescription(sel.root);

  const lines: string[] = [];

  // —— 角色信息 ——
  lines.push('【角色信息】');
  lines.push(`道号：${sel.道号 || '无名'}`);
  lines.push(`性别：${sel.性别}`);
  if (sel.性别 === '男') lines.push(`元阳：${sel.元阳元阴 ? '尚存' : '已损'}`);
  else if (sel.性别 === '女') lines.push(`元阴：${sel.元阳元阴 ? '尚存' : '已损'}`);
  else lines.push('元阳/元阴：无（其他性别）');

  lines.push('');
  lines.push('【灵根】');
  lines.push(`名号：${rootName}`);
  lines.push(`品阶：${rootTier}`);
  lines.push(`五行：${rootElements.join(' / ')}`);
  if (sel.root.mutation) lines.push('变异：是');
  if (rootDesc) lines.push(`描述：${rootDesc}`);

  lines.push('');
  lines.push('【体质】');
  lines.push(`名号：${physique.name}`);
  lines.push(`等级：${physique.tier}`);
  lines.push(`三维：悟性 ${physique.悟性} / 根骨 ${physique.根骨} / 气感 ${physique.气感}`);
  if (physique.效果) lines.push(`效果：${physique.效果.name} ${physique.效果.value}`);
  if (physique.desc) lines.push(`描述：${physique.desc}`);

  // —— 出生地 ——
  if (location) {
    lines.push('');
    lines.push('【出生地】');
    lines.push(`${location.世界} · ${location.地域} · ${location.子域} · ${location.具体地点}`);
    if (location.kind) lines.push(`类型：${location.kind}`);
    if (location.desc) lines.push(`说明：${location.desc}`);
  }

  // —— 开局设定（来自剧本 settings） ——
  if (story?.settings) {
    const s = story.settings;
    lines.push('');
    lines.push('【开局设定】');
    lines.push(`时间：${s.时间.年}年 ${s.时间.月}月 ${s.时间.日}日${s.时间.时辰 ? ' · ' + s.时间.时辰 : ''}`);
    lines.push(`宗门：${s.宗门}`);
    lines.push(`初始境界：${s.初始境界.大境界}${s.初始境界.小境界}`);
  }

  // —— 难度 ——
  if (difficulty) {
    lines.push('');
    lines.push('【难度】');
    lines.push(`${difficulty.name}（${difficulty.subtitle}）· 共 ${difficulty.points} 点`);
  }

  // —— 携带资材 ——
  const presetCarry = sel.itemIds
    .map(id => findItem(id))
    .filter(Boolean) as NonNullable<ReturnType<typeof findItem>>[];
  if (presetCarry.length) {
    lines.push('');
    lines.push('【携带资材 · 预设】');
    presetCarry.forEach(it => {
      const tags: string[] = [];
      if (it.品质) tags.push(`${it.品质}品`);
      if (it.境界) tags.push(it.境界);
      tags.push(it.类型);
      if (it.五行) tags.push(it.五行);
      lines.push(`- ${it.name}（${tags.join(' · ')}）${it.灵石 ? ` · ${it.灵石}枚灵石` : ''}`);
      if (it.desc) lines.push(`    ${it.desc}`);
    });
  }
  if (sel.customItems.length) {
    lines.push('');
    lines.push('【携带资材 · 自创】');
    sel.customItems.forEach(c => {
      const tags = [`${c.品质}品`, c.境界, c.类型, c.五行];
      lines.push(`- ${c.name}（${tags.join(' · ')}）`);
      if (c.desc) lines.push(`    ${c.desc}`);
    });
  }

  // —— 开局剧本 ——
  if (story) {
    lines.push('');
    lines.push(`【开局剧本】${story.name}${story.类型 ? `（${story.类型}）` : ''}`);
    if (story.subtitle) lines.push(story.subtitle);
    if (story.desc) lines.push(story.desc);
    if (story.body) {
      lines.push('');
      lines.push('—— 正文 ——');
      lines.push(story.body);
    }
  }

  const content = lines.join('\n');
  const instructions = [
    '---',
    '请你严格按照以上设定为玩家展开开局剧情。注意事项：',
    '- 故事正文中的「你」直接指代玩家角色（道号见上）；',
    `- 故事时间须从「${story?.settings.时间.年 ?? 7000}年」开始推进；`,
    `- 玩家所属：${story?.settings.宗门 ?? '散修'}；`,
    `- 初始境界：${story?.settings.初始境界.大境界 ?? '炼气'}${story?.settings.初始境界.小境界 ?? '初期'}；`,
    '- 请生成一段贴合上述设定的开局叙述，篇幅自然即可，不必再罗列上述信息。',
  ].join('\n');

  return '```text\n' + content + '\n```\n\n' + instructions;
}

/**
 * 提交开局：写入 MVU 变量、生成 AI 提示词、发送给酒馆并触发回复。
 * 参考 src/custom_start/core/composables/use-journey.ts 的 executeJourney。
 */
export async function commitJourney(
  sel: Selection,
): Promise<{ ok: boolean; reason?: string }> {
  // 1) 写 MVU 变量
  const data = buildInitialStatData(sel);
  const mvuOk = await writeInitialStatData(data);
  if (!mvuOk) return { ok: false, reason: '写入 MVU 变量失败' };

  // 2) 生成 AI 提示词并发送
  const prompt = generateAIPrompt(sel);
  try {
    if (typeof createChatMessages !== 'function') {
      return { ok: false, reason: '当前环境不支持 createChatMessages' };
    }
    await createChatMessages([{ role: 'user', message: prompt }]);
  } catch (err) {
    console.error('[自定义开局] 发送消息失败：', err);
    return { ok: false, reason: '发送消息失败' };
  }

  // 3) 触发 AI 回复
  try {
    if (typeof triggerSlash === 'function') {
      await triggerSlash('/trigger');
    }
  } catch (err) {
    console.error('[自定义开局] 触发 /trigger 失败：', err);
    // 触发失败不视作整体失败：玩家可手动让 AI 续写
    return { ok: true, reason: '已发送，但触发 AI 回复失败' };
  }

  return { ok: true };
}
