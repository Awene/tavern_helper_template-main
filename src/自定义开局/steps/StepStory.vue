<template>
  <div>
    <h2 class="xs-step-title">择 · 开局故事</h2>
    <p class="xs-step-subtitle">道始于一场际遇。故事将作为开篇引导 AI 展开你的命途。</p>

    <div class="xs-card-grid">
      <OptionCard
        v-for="(s, i) in stories"
        :key="s.id"
        :title="s.name"
        :subtitle="s.subtitle"
        :desc="s.desc"
        :glyph="s.glyph"
        :cost="s.cost"
        :tags="s.tags"
        :selected="store.selection.storyId === s.id"
        :disabled="!canAfford(s.cost, store.selection.storyId === s.id, currentCost)"
        :index="i"
        @pick="store.selectStory(s.id)"
      >
        <div v-if="s.recommend" class="xs-card-meta">
          <span class="xs-pill xs-pill-cinnabar">推荐：{{ s.recommend }}</span>
        </div>
        <div v-if="store.selection.storyId === s.id" class="xs-story-body">{{ s.body }}</div>
      </OptionCard>
    </div>

    <div class="xs-actions">
      <button type="button" class="xs-btn" @click="store.prev">返回</button>
      <button
        type="button"
        class="xs-btn xs-btn-primary"
        :disabled="!store.selection.storyId || store.overBudget"
        @click="store.next"
      >
        继续 ▸
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { findStory, stories } from '../config';
import { useStartStore } from '../store';
import OptionCard from '../components/OptionCard.vue';

const store = useStartStore();
const currentCost = computed(() => findStory(store.selection.storyId)?.cost ?? 0);

function canAfford(cost: number, isCurrent: boolean, current: number): boolean {
  if (isCurrent) return true;
  return cost - current <= store.remainingPoints;
}
</script>
