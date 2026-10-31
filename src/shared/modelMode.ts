export const MODEL_MODES = ['Gemini', 'Claude', 'Glm', 'DeepSeek'] as const;
export type ModelMode = (typeof MODEL_MODES)[number];
export const modelLabel = (mode: ModelMode) => (mode === 'Glm' ? 'GLM' : mode);
const header = (mode: ModelMode) => `🔌 ${mode}头部`;

export function getModelMode(): ModelMode | null {
  const prompts = getPreset('in_use').prompts;
  const selected = MODEL_MODES.filter(mode => prompts.some(p => p.name === header(mode) && p.enabled));
  return selected.length === 1 ? selected[0] : null;
}

export async function applyModelMode(mode: ModelMode): Promise<void> {
  if (!MODEL_MODES.includes(mode)) throw new Error('不支持的模型模式');
  await updatePresetWith('in_use', preset => {
    if (!MODEL_MODES.every(m => preset.prompts.filter(p => p.name === header(m)).length === 1)) {
      throw new Error('当前预设缺少模型条目，请先选择新版本格修仙预设');
    }
    for (const prompt of preset.prompts) {
      if (MODEL_MODES.some(m => prompt.name === header(m))) prompt.enabled = prompt.name === header(mode);
    }
    return preset;
  });
  if (getModelMode() !== mode) throw new Error('模型模式未保存，请重试');
}
