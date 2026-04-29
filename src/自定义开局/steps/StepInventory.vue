<template>
  <div>
    <h2 class="xs-step-title">择 · 初始资粮</h2>
    <p class="xs-step-subtitle">取舍之间见性情；可同时携带数件，所选条目独立计费。</p>

    <div class="xs-tabs">
      <button
        v-for="t in tabs"
        :key="t.key"
        type="button"
        class="xs-tab"
        :class="{ active: tab === t.key }"
        @click="tab = t.key"
      >
        {{ t.label }} <em>已选 {{ countSelected(t.key) }}</em>
      </button>
    </div>

    <div class="xs-card-grid cols-3">
      <OptionCard
        v-for="(it, i) in itemsInTab"
        :key="it.id"
        :title="it.name"
        :subtitle="it.subtitle"
        :desc="it.desc"
        :glyph="it.glyph"
        :cost="it.cost"
        :tags="it.tags"
        :selected="store.isItemSelected(it.id)"
        :disabled="!canAfford(it)"
        :index="i"
        @pick="store.toggleItem(it.id)"
      />
    </div>

    <div class="xs-actions">
      <button type="button" class="xs-btn" @click="store.prev">返回</button>
      <button
        type="button"
        class="xs-btn xs-btn-primary"
        :disabled="store.overBudget"
        @click="store.next"
      >
        继续 ▸
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { ItemOption } from '../types';
import { items } from '../config';
import { useStartStore } from '../store';
import OptionCard from '../components/OptionCard.vue';

const store = useStartStore();

const tabs = [
  { key: '功法', label: '功法' },
  { key: '装备', label: '装备' },
  { key: '物品', label: '物品' },
  { key: '灵石', label: '灵石' },
] as const;

type TabKey = (typeof tabs)[number]['key'];

const tab = ref<TabKey>('功法');

const itemsInTab = computed(() =>
  items.filter(it => it.category === tab.value),
);

function countSelected(cat: TabKey): number {
  let n = 0;
  for (const id of store.selection.itemIds) {
    const it = items.find(x => x.id === id);
    if (it && it.category === cat) n++;
  }
  return n;
}

function canAfford(it: ItemOption): boolean {
  if (store.isItemSelected(it.id)) return true;
  return it.cost <= store.remainingPoints;
}
</script>
