<template>
  <div>
    <h2 class="xs-step-title">择 · 出生地</h2>
    <p class="xs-step-subtitle">道始于地。出身决定起步资源、人脉与性格底色。</p>

    <div class="xs-card-grid">
      <OptionCard
        v-for="(l, i) in locations"
        :key="l.id"
        :title="l.name"
        :subtitle="l.subtitle"
        :desc="l.desc"
        :glyph="l.glyph"
        :cost="l.cost"
        :tags="l.tags"
        :selected="store.selection.locationId === l.id"
        :disabled="!canAfford(l.cost, store.selection.locationId === l.id, currentCost)"
        :index="i"
        @pick="store.selectLocation(l.id)"
      >
        <div class="xs-loc-info">
          <span class="xs-pill xs-pill-jade">{{ l.世界 }}</span>
          <span class="xs-pill">{{ l.地域 }}</span>
          <span class="xs-pill xs-pill-gold">{{ l.具体地点 }}</span>
        </div>
      </OptionCard>
    </div>

    <div class="xs-actions">
      <button type="button" class="xs-btn" @click="store.prev">返回</button>
      <button
        type="button"
        class="xs-btn xs-btn-primary"
        :disabled="!store.selection.locationId || store.overBudget"
        @click="store.next"
      >
        继续 ▸
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { findLocation, locations } from '../config';
import { useStartStore } from '../store';
import OptionCard from '../components/OptionCard.vue';

const store = useStartStore();
const currentCost = computed(() => findLocation(store.selection.locationId)?.cost ?? 0);

function canAfford(cost: number, isCurrent: boolean, current: number): boolean {
  if (isCurrent) return true;
  return cost - current <= store.remainingPoints;
}
</script>
