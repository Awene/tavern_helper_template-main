/**
 * 变量更新模式的落地：根据玩家在「配置」页的选择，开关世界书条目与预设提示词中
 * 对应的「二选一」条目。
 *
 * 注意：截图里 MVU 扩展的「变量更新方式」下拉框 + API 地址/密钥属于 MVU 扩展自身的
 * 设置，脚本无法代改——那一步只能玩家在酒馆里手动完成（见 ApiTutorialModal.vue 的教程）。
 * 本模块只负责卡片自己能控制的那一半：世界书条目 + 预设提示词的启用状态。
 */
import type { ApiMode } from './types';

/**
 * 世界书条目 → 各模式下是否启用。
 * 键为条目名称（须与 本格修仙.yaml 中「名称」完全一致）。
 * 两条常开条目（[mvu_update]变量更新规则 / [mvu_update]变量格式强调）与模式无关，不在此表内。
 */
const WORLDBOOK_ENABLED: Record<string, Record<ApiMode, boolean>> = {
  '变量输出列表（随主AI输出开）': { 随主API: true, 额外API: false },
  '[mvu_plot]变量输出列表（额外API开）': { 随主API: false, 额外API: true },
  '[mvu_update]变量输出列表（额外API开）': { 随主API: false, 额外API: true },
  '[mvu_update]变量输出格式（随主AI输出开）': { 随主API: true, 额外API: false },
  '[mvu_update]变量输出格式（额外API开）': { 随主API: false, 额外API: true },
};

/**
 * 预设提示词 → 各模式下是否启用。
 * 键为提示词「名称」。玩家预设若缺少这些条目则静默跳过。
 */
const PRESET_ENABLED: Record<string, Record<ApiMode, boolean>> = {
  '🧭变量额外API(二选一)': { 随主API: false, 额外API: true },
  '🧭变量主API(二选一)': { 随主API: true, 额外API: false },
};

export interface ApplyApiModeResult {
  ok: boolean;
  /** 实际改动的世界书条目数 */
  worldbookChanged: number;
  /** 实际改动的预设提示词数 */
  presetChanged: number;
  /** 出错说明（ok=false 时） */
  reason?: string;
}

/** 把当前角色卡绑定的世界书按模式表切换启用状态 */
async function applyWorldbook(mode: ApiMode): Promise<number> {
  if (
    typeof getCharWorldbookNames !== 'function' ||
    typeof getWorldbook !== 'function' ||
    typeof updateWorldbookWith !== 'function'
  ) {
    return 0;
  }
  const bound = getCharWorldbookNames('current');
  const names = [bound.primary, ...bound.additional].filter(
    (n): n is string => typeof n === 'string' && n.length > 0,
  );
  let changed = 0;
  for (const wbName of names) {
    let entries;
    try {
      entries = await getWorldbook(wbName);
    } catch {
      continue; // 世界书不存在等，跳过
    }
    // 仅在该世界书确有目标条目时才写回，避免无谓触碰无关世界书
    const hits = entries.filter(e => WORLDBOOK_ENABLED[e.name] !== undefined);
    if (hits.length === 0) continue;
    const needWrite = hits.some(e => e.enabled !== WORLDBOOK_ENABLED[e.name][mode]);
    if (!needWrite) {
      changed += hits.length; // 已是目标状态，仍计入「已就绪」数
      continue;
    }
    await updateWorldbookWith(wbName, wb =>
      wb.map(e =>
        WORLDBOOK_ENABLED[e.name] !== undefined
          ? { ...e, enabled: WORLDBOOK_ENABLED[e.name][mode] }
          : e,
      ),
    );
    changed += hits.length;
  }
  return changed;
}

/** 把酒馆正在使用的预设（'in_use'）按模式表切换提示词启用状态 */
async function applyPreset(mode: ApiMode): Promise<number> {
  if (typeof getPreset !== 'function' || typeof updatePresetWith !== 'function') {
    return 0;
  }
  let preset;
  try {
    preset = getPreset('in_use');
  } catch {
    return 0;
  }
  const hits = (preset.prompts ?? []).filter(p => PRESET_ENABLED[p.name] !== undefined);
  if (hits.length === 0) return 0;
  await updatePresetWith('in_use', p => {
    p.prompts.forEach(prompt => {
      const table = PRESET_ENABLED[prompt.name];
      if (table !== undefined) prompt.enabled = table[mode];
    });
    return p;
  });
  return hits.length;
}

/**
 * 应用玩家选择的变量更新模式：同时开关世界书条目与预设提示词。
 * 幂等——可安全重复调用（如切换回来、提交开局时再次确认）。
 */
export async function applyApiMode(mode: ApiMode): Promise<ApplyApiModeResult> {
  try {
    const worldbookChanged = await applyWorldbook(mode);
    const presetChanged = await applyPreset(mode);
    return { ok: true, worldbookChanged, presetChanged };
  } catch (err) {
    console.error('[自定义开局] 应用变量更新模式失败：', err);
    return {
      ok: false,
      worldbookChanged: 0,
      presetChanged: 0,
      reason: err instanceof Error ? err.message : String(err),
    };
  }
}
