<template>
  <div>
    <h2 class="xs-step-title">命途 · 落定</h2>
    <p class="xs-step-subtitle">最后核对你的选择；点击「确认开局」后将组装为初始变量。</p>

    <div class="xs-name-row">
      <label>道号</label>
      <input
        v-model="store.selection.道号"
        type="text"
        class="xs-name-input"
        placeholder="为自己取一个名字"
      />
    </div>

    <div class="xs-summary">
      <div class="xs-summary-row" v-if="difficulty">
        <span class="xs-summary-label">难度</span>
        <span class="xs-summary-value">
          <strong>{{ difficulty.name }}</strong>
          <span style="color: var(--xs-ink-mute);">{{ difficulty.subtitle }} · 共 {{ difficulty.points }} 点</span>
        </span>
      </div>
      <div class="xs-summary-row" v-if="root">
        <span class="xs-summary-label">灵根</span>
        <span class="xs-summary-value">
          <strong>{{ root.name }}</strong>
          <span style="color: var(--xs-ink-mute);">{{ root.品阶 }} · {{ root.五行.join(' / ') }}</span>
        </span>
      </div>
      <div class="xs-summary-row" v-if="physique">
        <span class="xs-summary-label">体质</span>
        <span class="xs-summary-value">
          <strong>{{ physique.name }}</strong>
          <span style="color: var(--xs-ink-mute);">悟 {{ physique.悟性 }} · 骨 {{ physique.根骨 }} · 感 {{ physique.气感 }}</span>
        </span>
      </div>
      <div class="xs-summary-row" v-if="location">
        <span class="xs-summary-label">出生地</span>
        <span class="xs-summary-value">
          <strong>{{ location.name }}</strong>
          <span style="color: var(--xs-ink-mute);">{{ location.世界 }} · {{ location.地域 }} · {{ location.具体地点 }}</span>
        </span>
      </div>
      <div class="xs-summary-row">
        <span class="xs-summary-label">资粮</span>
        <span class="xs-summary-value">
          <span v-if="store.selection.itemIds.length === 0" style="color: var(--xs-ink-mute);">未择资粮</span>
          <template v-else>
            <span v-for="it in selectedItems" :key="it.id" style="margin-right: 8px;">
              <strong>{{ it.name }}</strong>
            </span>
          </template>
        </span>
      </div>
      <div class="xs-summary-row" v-if="story">
        <span class="xs-summary-label">故事</span>
        <span class="xs-summary-value">
          <strong>{{ story.name }}</strong>
          <span style="color: var(--xs-ink-mute);">{{ story.subtitle }}</span>
        </span>
      </div>
      <div class="xs-summary-row">
        <span class="xs-summary-label">点数</span>
        <span class="xs-summary-value">
          <strong :style="{ color: store.overBudget ? 'var(--xs-cinnabar)' : 'var(--xs-jade-deep)' }">
            {{ store.spentPoints }} / {{ store.totalPoints }}
          </strong>
          <span style="color: var(--xs-ink-mute);">
            {{ store.overBudget ? '超出预算！' : '余 ' + store.remainingPoints + ' 点' }}
          </span>
        </span>
      </div>
    </div>

    <div class="xs-actions">
      <button type="button" class="xs-btn" @click="store.prev">返回</button>
      <button type="button" class="xs-btn xs-btn-ghost" @click="store.resetAll()">重新开始</button>
      <button
        type="button"
        class="xs-btn xs-btn-primary"
        :disabled="!canConfirm"
        @click="onConfirm"
      >
        确认开局 ▸
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  findDifficulty,
  findItem,
  findLocation,
  findPhysique,
  findRoot,
  findStory,
} from '../config';
import { useStartStore } from '../store';
import { buildInitialStatData, writeInitialStatData } from '../export';

const store = useStartStore();

const difficulty = computed(() => findDifficulty(store.selection.difficultyId));
const root = computed(() => findRoot(store.selection.rootId));
const physique = computed(() => findPhysique(store.selection.physiqueId));
const location = computed(() => findLocation(store.selection.locationId));
const story = computed(() => findStory(store.selection.storyId));
const selectedItems = computed(() =>
  store.selection.itemIds.map(id => findItem(id)).filter(Boolean) as NonNullable<ReturnType<typeof findItem>>[],
);

const canConfirm = computed(() => {
  return (
    !store.overBudget &&
    !!store.selection.difficultyId &&
    !!store.selection.rootId &&
    !!store.selection.physiqueId &&
    !!store.selection.locationId &&
    !!store.selection.storyId &&
    !!store.selection.道号.trim()
  );
});

async function onConfirm() {
  if (!canConfirm.value) {
    if (!store.selection.道号.trim()) store.showToast('请先填写道号');
    else if (store.overBudget) store.showToast('点数超出预算');
    else store.showToast('请先完成所有选择');
    return;
  }
  const data = buildInitialStatData(store.selection);
  const ok = await writeInitialStatData(data);
  if (ok) {
    store.showToast('命途已落定，可返回正文开始你的修行');
  } else {
    store.showToast('写入失败，请检查酒馆变量接口');
  }
}
</script>
