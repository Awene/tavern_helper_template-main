import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import {
  difficulties,
  findDifficulty,
  findItem,
  findLocation,
  findPhysique,
  findRoot,
  findStory,
} from './config';
import type { Preset, Selection } from './types';

const PRESETS_KEY = 'xs-presets-v1';

const emptySelection = (): Selection => ({
  difficultyId: null,
  rootId: null,
  physiqueId: null,
  locationId: null,
  itemIds: [],
  storyId: null,
  道号: '',
});

const loadPresets = (): Preset[] => {
  try {
    const raw = localStorage.getItem(PRESETS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as Preset[];
  } catch {
    /* ignore */
  }
  return [];
};

const writePresets = (list: Preset[]) => {
  try {
    localStorage.setItem(PRESETS_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
};

export const useStartStore = defineStore('xs-start', () => {
  // 当前步骤索引；0=封面，最大=确认页
  const stepIndex = ref(0);

  // 玩家选择
  const selection = ref<Selection>(emptySelection());

  // 持久化预设
  const presets = ref<Preset[]>(loadPresets());

  // 预设对话框开关（UI 局部，不持久化）
  const presetOpen = ref(false);

  // 通用 toast
  const toast = ref('');
  let toastTimer: ReturnType<typeof setTimeout> | null = null;
  function showToast(msg: string, durationMs = 2400) {
    toast.value = msg;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      if (toast.value === msg) toast.value = '';
    }, durationMs);
  }

  // ============ 当前难度对应的总点数 ============
  const totalPoints = computed(() => {
    const d = findDifficulty(selection.value.difficultyId);
    return d?.points ?? 0;
  });

  // ============ 已花费点数 ============
  const spentPoints = computed(() => {
    const sel = selection.value;
    let n = 0;
    n += findRoot(sel.rootId)?.cost ?? 0;
    n += findPhysique(sel.physiqueId)?.cost ?? 0;
    n += findLocation(sel.locationId)?.cost ?? 0;
    for (const itemId of sel.itemIds) n += findItem(itemId)?.cost ?? 0;
    n += findStory(sel.storyId)?.cost ?? 0;
    return n;
  });

  const remainingPoints = computed(() => totalPoints.value - spentPoints.value);

  const overBudget = computed(() => remainingPoints.value < 0);

  // ============ 步骤切换 ============
  function next() {
    stepIndex.value += 1;
  }
  function prev() {
    if (stepIndex.value > 0) stepIndex.value -= 1;
  }
  function goto(i: number) {
    stepIndex.value = i;
  }

  // ============ 选择助手 ============
  function selectDifficulty(id: string) {
    selection.value.difficultyId = id;
  }
  function selectRoot(id: string) {
    selection.value.rootId = id;
  }
  function selectPhysique(id: string) {
    selection.value.physiqueId = id;
  }
  function selectLocation(id: string) {
    selection.value.locationId = id;
  }
  function toggleItem(id: string) {
    const arr = selection.value.itemIds;
    const idx = arr.indexOf(id);
    if (idx >= 0) arr.splice(idx, 1);
    else arr.push(id);
  }
  function isItemSelected(id: string): boolean {
    return selection.value.itemIds.includes(id);
  }
  function selectStory(id: string) {
    selection.value.storyId = id;
  }

  function resetAll() {
    selection.value = emptySelection();
    stepIndex.value = 0;
  }

  // 选择默认难度后的初始化（仅在还未选时）
  function ensureDefaultDifficulty() {
    if (!selection.value.difficultyId && difficulties.length > 0) {
      selection.value.difficultyId = difficulties[1]?.id ?? difficulties[0].id;
    }
  }

  // ============ 预设保存 / 读取 ============
  function savePreset(name: string) {
    const trimmed = name.trim();
    if (!trimmed) {
      showToast('请输入命途名');
      return false;
    }
    const preset: Preset = {
      id: 'p-' + Date.now().toString(36),
      name: trimmed,
      createdAt: new Date().toISOString(),
      selection: JSON.parse(JSON.stringify(selection.value)),
    };
    presets.value = [preset, ...presets.value].slice(0, 30); // 最多保留 30 条
    writePresets(presets.value);
    showToast('已封存命途');
    return true;
  }

  function loadPreset(id: string) {
    const p = presets.value.find(x => x.id === id);
    if (!p) return false;
    selection.value = JSON.parse(JSON.stringify(p.selection));
    showToast(`已读取「${p.name}」`);
    return true;
  }

  function deletePreset(id: string) {
    presets.value = presets.value.filter(p => p.id !== id);
    writePresets(presets.value);
  }

  return {
    stepIndex,
    selection,
    presets,
    presetOpen,
    toast,
    totalPoints,
    spentPoints,
    remainingPoints,
    overBudget,
    next,
    prev,
    goto,
    selectDifficulty,
    selectRoot,
    selectPhysique,
    selectLocation,
    toggleItem,
    isItemSelected,
    selectStory,
    resetAll,
    ensureDefaultDifficulty,
    savePreset,
    loadPreset,
    deletePreset,
    showToast,
  };
});
