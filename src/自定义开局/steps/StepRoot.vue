<template>
  <div>
    <h2 class="xs-step-title">择 · 灵根 · 体质</h2>
    <p class="xs-step-subtitle">灵根定五行所亲，体质定身骨之形。两者为修行根本，需综合点数与道途权衡。</p>

    <h3 class="xs-section-title">灵根</h3>
    <div class="xs-card-grid cols-3">
      <OptionCard
        v-for="(r, i) in roots"
        :key="r.id"
        :title="r.name"
        :subtitle="r.subtitle"
        :desc="r.desc"
        :glyph="r.glyph"
        :cost="r.cost"
        :tags="r.tags"
        :selected="store.selection.rootId === r.id"
        :disabled="!canAfford(r.cost, store.selection.rootId === r.id, currentRootCost)"
        :index="i"
        @pick="store.selectRoot(r.id)"
      >
        <div class="xs-card-meta">
          <span class="xs-pill">{{ r.品阶 }}</span>
          <span
            v-for="el in r.五行"
            :key="el"
            class="xs-element"
            :style="{ '--el': elColor(el) }"
          >
            {{ el === '无' ? '·' : (el === '未知' ? '未' : el) }}
          </span>
        </div>
      </OptionCard>
    </div>

    <h3 class="xs-section-title" style="margin-top: 22px;">体质</h3>
    <div class="xs-card-grid cols-3">
      <OptionCard
        v-for="(p, i) in physiques"
        :key="p.id"
        :title="p.name"
        :subtitle="p.subtitle"
        :desc="p.desc"
        :glyph="p.glyph"
        :cost="p.cost"
        :tags="p.tags"
        :selected="store.selection.physiqueId === p.id"
        :disabled="!canAfford(p.cost, store.selection.physiqueId === p.id, currentPhysiqueCost)"
        :index="i"
        @pick="store.selectPhysique(p.id)"
      >
        <div class="xs-attr-row">
          <div class="xs-attr-cell">
            <span class="xs-attr-cell-label">悟性</span>
            <span class="xs-attr-cell-value">{{ p.悟性 }}</span>
          </div>
          <div class="xs-attr-cell">
            <span class="xs-attr-cell-label">根骨</span>
            <span class="xs-attr-cell-value">{{ p.根骨 }}</span>
          </div>
          <div class="xs-attr-cell">
            <span class="xs-attr-cell-label">气感</span>
            <span class="xs-attr-cell-value">{{ p.气感 }}</span>
          </div>
        </div>
      </OptionCard>
    </div>

    <div class="xs-actions">
      <button type="button" class="xs-btn" @click="store.prev">返回</button>
      <button
        type="button"
        class="xs-btn xs-btn-primary"
        :disabled="!store.selection.rootId || !store.selection.physiqueId || store.overBudget"
        @click="store.next"
      >
        继续 ▸
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { findPhysique, findRoot, physiques, roots } from '../config';
import { useStartStore } from '../store';
import OptionCard from '../components/OptionCard.vue';

const store = useStartStore();

const currentRootCost = computed(() => findRoot(store.selection.rootId)?.cost ?? 0);
const currentPhysiqueCost = computed(() => findPhysique(store.selection.physiqueId)?.cost ?? 0);

/** 是否能买得起这个选项：当前为已选则始终可见；
 *  其他选项要看 cost - 当前同分类已选选项的 cost ≤ remaining */
function canAfford(cost: number, isCurrent: boolean, currentCost: number): boolean {
  if (isCurrent) return true;
  // 切换到这个选项相当于：先退还当前 cost，再扣新 cost
  const delta = cost - currentCost;
  return delta <= store.remainingPoints;
}

function elColor(el: string): string {
  const map: Record<string, string> = {
    金: 'var(--xs-el-jin)',
    木: 'var(--xs-el-mu)',
    水: 'var(--xs-el-shui)',
    火: 'var(--xs-el-huo)',
    土: 'var(--xs-el-tu)',
    阴: 'var(--xs-el-yin)',
    阳: 'var(--xs-el-yang)',
    混沌: 'var(--xs-el-hundun)',
  };
  return map[el] || 'var(--xs-ink-mute)';
}
</script>

<style scoped>
.xs-section-title {
  font-family: var(--xs-font-display);
  font-size: 16px;
  letter-spacing: 4px;
  color: var(--xs-ink);
  margin-bottom: 10px;
  border-left: 3px solid var(--xs-cinnabar);
  padding-left: 8px;
}
</style>
