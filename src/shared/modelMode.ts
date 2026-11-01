export const MODEL_MODES = ['Gemini', 'GeminiFlash', 'Claude', 'Glm', 'DeepSeek'] as const;
export type ModelMode = (typeof MODEL_MODES)[number];
export const modelLabel = (mode: ModelMode) =>
  mode === 'Glm' ? 'GLM' : mode === 'Gemini' ? 'Gemini · 标准' : mode === 'GeminiFlash' ? 'Gemini 3.7F / 3.8' : mode;
const headers: Record<ModelMode, string[]> = {
  Gemini: ['🔌 Gemini头部', '⚓️Gemini3.1p开'],
  GeminiFlash: ['⚓️Gemini3.7F与3.8开'],
  Claude: ['🔌 Claude头部', '⚓️Claude开'],
  Glm: ['🔌 Glm头部'],
  DeepSeek: ['🔌 DeepSeek头部', '⚓️DS开'],
};
const matches = (name: string, mode: ModelMode) => headers[mode].includes(name);

export function getAvailableModelModes(): ModelMode[] {
  const prompts = getPreset('in_use').prompts;
  return MODEL_MODES.filter(mode => prompts.filter(p => matches(p.name, mode)).length === 1);
}

export function getModelMode(): ModelMode | null {
  const prompts = getPreset('in_use').prompts;
  const selected = MODEL_MODES.filter(mode => prompts.some(p => matches(p.name, mode) && p.enabled));
  return selected.length === 1 ? selected[0] : null;
}

export async function applyModelMode(mode: ModelMode): Promise<void> {
  if (!MODEL_MODES.includes(mode)) throw new Error('不支持的模型模式');
  await updatePresetWith('in_use', preset => {
    if (preset.prompts.filter(p => matches(p.name, mode)).length !== 1) {
      throw new Error('当前预设缺少模型条目，请先选择新版本格修仙预设');
    }
    for (const prompt of preset.prompts) {
      if (MODEL_MODES.some(m => matches(prompt.name, m))) prompt.enabled = matches(prompt.name, mode);
    }
    return preset;
  });
  if (getModelMode() !== mode) throw new Error('模型模式未保存，请重试');
}
