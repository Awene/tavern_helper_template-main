<template>
  <section ref="root" class="xy-focus-panel" aria-label="聚焦剧情" @keydown.esc="expanded = false">
    <div class="xy-focus-row">
      <span class="xy-focus-label">聚焦剧情</span>
      <button class="xy-focus-toggle" type="button" :aria-expanded="expanded" aria-controls="plot-focus-choices" @click="expanded = !expanded"><strong>{{ selected.name }}</strong><span>{{ expanded ? '收起 ▴' : '展开 ▾' }}</span></button>
      <button type="button" :disabled="!current" @click="viewStory">查看</button>
    </div>
    <p>{{ selected.hint }}</p>
    <div v-if="expanded" id="plot-focus-choices" class="xy-focus-choices">
      <button v-for="choice in choices" :key="choice.value" type="button" class="xy-focus-choice" :class="{ selected: selection === choice.value }" :aria-pressed="selection === choice.value" @click="changeFocus(choice.value)">
        <span>{{ selection === choice.value ? '✓' : '·' }}</span><span><strong>{{ choice.name }}</strong><small>{{ choice.hint }}</small></span>
      </button>
    </div>
  </section>
</template>
<script setup lang="ts">
import { computed, nextTick, ref, onMounted, onBeforeUnmount } from 'vue';
import { state } from '../composables';
import { useDataStore } from '../store';
import { selectPlot } from '../plotControls';
const store = useDataStore();
const expanded = ref(false);
const root = ref<HTMLElement>();
const stories = computed(() => Object.entries(store.data.历练).filter(([name, task]) => task.类别 === '剧情' && !store.data.事件.已完成事件.includes(name)).map(([name, task]) => ({ ...task, name })));
const selection = computed(() => store.data.事件.聚焦模式 === '暂停' ? 'none' : stories.value.some(s => s.name === store.data.事件.标题 && (store.data.事件.聚焦模式 === '手动' || (store.data.事件.开启 && s.本幕进行中))) ? store.data.事件.标题 : 'auto');
const choices = computed(() => [
  { value: 'auto', name: '自由模式', hint: '随当前行动自由探索，遇到合适的剧情再展开。' },
  { value: 'none', name: '无剧情模式', hint: '不触发或推进剧情，保留已有进度；修炼、探索与委托照常。' },
  ...stories.value.map(s => ({ value: s.name, name: s.name, hint: s.推进线索 || '可查看剧情记录，继续探索' })),
]);
const selected = computed(() => choices.value.find(c => c.value === selection.value)!);
const current = computed(() => stories.value.find(s => s.name === selection.value));
function changeFocus(value: string) {
  if (value === 'auto' || value === 'none') Object.assign(store.data.事件, { 聚焦模式: value === 'auto' ? '自动' : '暂停', 标题: '', 阶段: '', 开启: false });
  else selectPlot(store.data, value);
  expanded.value = false;
}
function outside(event: PointerEvent) { if (root.value && !root.value.contains(event.target as Node)) expanded.value = false; }
onMounted(() => document.addEventListener('pointerdown', outside));
onBeforeUnmount(() => document.removeEventListener('pointerdown', outside));
async function viewStory() {
  const name = current.value?.name;
  if (!name) return;
  state.currentTab = 0;
  state.cardOpen[`task:${name}`] = true;
  await nextTick();
  document.dispatchEvent(new CustomEvent('xy-show-plot', { detail: name }));
  setTimeout(() => {
    const card = Array.from(document.querySelectorAll('.xy-task-card')).find(el =>
      el.querySelector('.xy-task-title')?.textContent?.includes(name),
    );
    card?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 220);
}
</script>
<style scoped>
.xy-focus-panel { margin: 2px 0 14px; padding: 15px; border: 1px solid var(--xy-line-gold); border-radius: 8px; background: var(--xy-glass); }
.xy-focus-row { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 12px; }
.xy-focus-label { color: var(--xy-gold); font-family: var(--xy-font-display); letter-spacing: 2px; border-left: 2px solid var(--xy-gold); padding-left: 9px; }
button { font: inherit; cursor: pointer; border: 1px solid var(--xy-line-gold); border-radius: 6px; padding: 8px 12px; background: var(--xy-paper-warm); color: var(--xy-ink); }
button:disabled { opacity: .4; }
.xy-focus-toggle { display: flex; justify-content: space-between; gap: 10px; min-width: 0; text-align: left; border-color: var(--xy-plot-purple-border); }
.xy-focus-toggle strong { overflow-wrap: anywhere; }
.xy-focus-toggle > span { white-space: nowrap; color: var(--xy-gold); font-size: 12px; }
p, small { color: var(--xy-ink-soft); font-size: 13px; line-height: 1.8; overflow-wrap: anywhere; }
p { margin: 11px 0 0; }
.xy-focus-choices { display: grid; gap: 7px; margin-top: 13px; padding-top: 12px; border-top: 1px dashed var(--xy-line); }
.xy-focus-choice { display: grid; grid-template-columns: 18px minmax(0, 1fr); gap: 8px; width: 100%; padding: 12px; text-align: left; border-color: var(--xy-line); }
.xy-focus-choice.selected { border-color: var(--xy-plot-purple-border); background: var(--xy-glass); }
small { display: block; margin-top: 6px; }
@media (max-width: 520px) { .xy-focus-panel { padding: 12px; } .xy-focus-row { gap: 8px; } .xy-focus-label { font-size: 12px; letter-spacing: 1px; } .xy-focus-toggle { padding: 9px; } }
</style>
