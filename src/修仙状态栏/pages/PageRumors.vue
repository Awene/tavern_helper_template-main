<template>
  <section class="xy-page xy-page-rumors">
    <div class="world-advance-bar">
      <div class="world-advance-times">
        <span>上次推进 <strong>{{ lastAdvance }}</strong></span>
        <span>当前时间 <strong>{{ currentTime }}</strong></span>
      </div>
      <button type="button" :disabled="sending" @click="advanceWorld">{{ sending ? '发送中…' : '世界推进' }}</button>
    </div>
    <div v-if="activeTimelineEvents.length === 0" class="xy-empty">
      <div class="xy-empty-mark">寂</div>
      <p>风平浪静，未闻新事</p>
    </div>

    <div v-else class="xy-rumor-list">
      <article
        v-for="(r, i) in activeTimelineEvents"
        :key="i"
        class="xy-rumor"
      >
        <div class="xy-rumor-head">
          <div class="xy-rumor-seal">
            <span>{{ r.类别 }}</span>
          </div>
          <div class="xy-rumor-meta">
            <div class="xy-rumor-time">{{ formatRange(r.时间区间) }}</div>
            <div class="xy-rumor-source">— {{ r.地点 || '不知何处' }}</div>
          </div>
          <div class="xy-rumor-difficulty" :title="`适配境界：${r.难度}`">
            <i>难</i>{{ r.难度 }}
          </div>
        </div>
        <div class="xy-rumor-body">{{ r.内容 }}</div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { activeTimelineEvents } from '../composables';
import { useDataStore } from '../store';

type TimelineDate = { 年: number; 月: number; 日: number };
const store = useDataStore();
const sending = ref(false);
const lastAdvance = computed(() => {
  const t = store.data.传闻.上次世界推进时间点;
  return t ? `${t.年}年${t.月}月${t.日}日 · ${t.时辰}` : '等待核验初始化';
});
const currentTime = computed(() => {
  const t = store.data.时间;
  return t ? `${t.年}年${t.月}月${t.日}日 · ${t.时辰}` : '等待时间数据';
});
async function advanceWorld() {
  if (sending.value) return;
  sending.value = true;
  try {
    const host = window.parent as Window & {
      CultivationWorldAdvance?: { send?: () => Promise<void> };
    };
    if (!host.CultivationWorldAdvance?.send) throw new Error('请先启用角色卡的【本格修仙】世界推进脚本');
    await host.CultivationWorldAdvance.send();
  } catch (error) {
    toastr.warning(error instanceof Error ? error.message : String(error), '世界推进');
  } finally {
    sending.value = false;
  }
}

function formatRange(range: { 起: TimelineDate; 止: TimelineDate }): string {
  const s = range.起;
  const e = range.止;
  const fmt = (d: TimelineDate) => `${d.年}年${d.月}月${d.日}日`;
  if (s.年 === e.年 && s.月 === e.月 && s.日 === e.日) return fmt(s);
  return `${fmt(s)} ~ ${fmt(e)}`;
}
</script>
<style scoped>
.world-advance-bar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 14px; padding: 10px 12px; border: 1px solid var(--xy-line-gold); border-radius: 9px; }
.world-advance-times { display: flex; flex: 1 1 260px; flex-wrap: wrap; align-items: baseline; gap: 4px 18px; min-width: 0; color: var(--xy-ink-mute); font-size: 12px; }
.world-advance-times > span { overflow-wrap: anywhere; }
.world-advance-bar strong { color: var(--xy-gold-deep); font-weight: normal; }
.world-advance-bar button { flex-shrink: 0; border: 1px solid var(--xy-line-gold); border-radius: 999px; padding: 7px 14px; color: var(--xy-cinnabar); background: var(--xy-paper-warm); cursor: pointer; font: inherit; font-size: 13px; }
.world-advance-bar button:disabled { opacity: .5; cursor: wait; }
@media (max-width: 560px) {
  .xy-rumor { padding: 12px; min-height: 0; }
  .xy-rumor::before { display: none; }
  .xy-rumor-head { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px; }
  .xy-rumor-seal { position: static; grid-column: 1; grid-row: 1; justify-self: start; width: auto; height: auto; max-width: 100%; padding: 4px 8px; font-size: 11px; writing-mode: horizontal-tb; transform: none; box-shadow: none; }
  .xy-rumor-meta { grid-column: 1 / -1; grid-row: 2; min-width: 0; flex-direction: column; align-items: flex-start; gap: 2px; }
  .xy-rumor-time { font-size: 11px; letter-spacing: 0; overflow-wrap: anywhere; }
  .xy-rumor-source { overflow-wrap: anywhere; }
  .xy-rumor-difficulty { grid-column: 2; grid-row: 1; align-self: center; margin: 0; font-size: 10px; }
  .xy-rumor-body { text-indent: 0; }
}
</style>
