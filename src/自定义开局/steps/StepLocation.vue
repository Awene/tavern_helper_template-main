<template>
  <div>
    <h2 class="xs-step-title">择 · 出生地</h2>
    <p class="xs-step-subtitle">道始于地。出身决定起步的人脉与性格底色，本身不耗费开局点数。</p>

    <div class="xs-loc-tree">
      <!-- 世界 -->
      <div class="xs-loc-row xs-loc-row-world">
        <span class="xs-loc-row-label">世界</span>
        <button type="button" class="xs-loc-chip world active" disabled>
          {{ LOCATION_WORLD }}
        </button>
        <span class="xs-loc-row-hint">{{ LOCATION_WORLD_DESC }}</span>
      </div>

      <!-- 大地域 -->
      <div class="xs-loc-row">
        <span class="xs-loc-row-label">地域</span>
        <button
          v-for="r in LOCATION_REGIONS"
          :key="r.id"
          type="button"
          class="xs-loc-chip"
          :class="{ active: regionId === r.id }"
          @click="pickRegion(r.id)"
        >
          {{ r.name }}
        </button>
      </div>
      <p v-if="currentRegion?.description" class="xs-loc-region-desc">
        {{ currentRegion.description }}
      </p>

      <!-- 生态卡 -->
      <div v-if="currentRegion" class="xs-loc-leaf-grid">
        <button
          v-for="eco in currentRegion.children"
          :key="eco.id"
          type="button"
          class="xs-loc-leaf-card"
          :class="{ active: store.selection.locationId === eco.id }"
          @click="store.selectLocation(eco.id)"
        >
          <div class="xs-loc-leaf-head">
            <span class="xs-loc-leaf-name">{{ eco.name }}</span>
          </div>
          <p v-if="eco.description" class="xs-loc-leaf-desc">{{ eco.description }}</p>

          <div v-if="eco.kingdoms && eco.kingdoms.length" class="xs-eco-section">
            <span class="xs-eco-label">凡国</span>
            <ul class="xs-eco-list">
              <li v-for="k in eco.kingdoms" :key="k.name">
                <strong>{{ k.name }}</strong>
                <span class="xs-eco-brief">{{ k.brief }}</span>
              </li>
            </ul>
          </div>
          <div v-if="eco.sects && eco.sects.length" class="xs-eco-section">
            <span class="xs-eco-label">宗门</span>
            <ul class="xs-eco-list">
              <li v-for="s in eco.sects" :key="s.name">
                <strong>{{ s.name }}</strong>
                <span class="xs-eco-brief">{{ s.brief }}</span>
              </li>
            </ul>
          </div>

          <div v-if="eco.tags && eco.tags.length" class="xs-loc-leaf-tags">
            <span v-for="t in eco.tags" :key="t" class="xs-pill">{{ t }}</span>
          </div>
        </button>
      </div>

      <!-- 已选预览 -->
      <div v-if="selectedLocation" class="xs-loc-preview">
        <div class="xs-loc-preview-path">
          <span>{{ selectedLocation.世界 }}</span>
          <span class="sep">›</span>
          <span>{{ selectedLocation.地域 }}</span>
          <span class="sep">›</span>
          <strong>{{ selectedLocation.生态 }}</strong>
        </div>
        <p v-if="selectedLocation.desc" class="xs-loc-preview-desc">{{ selectedLocation.desc }}</p>
      </div>
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
import { computed, ref, watch } from 'vue';
import {
  LOCATION_REGIONS,
  LOCATION_WORLD,
  LOCATION_WORLD_DESC,
  findLocation,
  findLocationPath,
  findRegionById,
} from '../config';
import { useStartStore } from '../store';

const store = useStartStore();

// 根据当前选中的生态反推 region，初始展开
const initialPath = findLocationPath(store.selection.locationId || '');
const regionId = ref<string>(initialPath.region?.id || LOCATION_REGIONS[0].id);

const currentRegion = computed(() => findRegionById(regionId.value));

const selectedLocation = computed(() => findLocation(store.selection.locationId));

function pickRegion(id: string) {
  regionId.value = id;
}

// 已选生态变化时同步展开地域
watch(
  () => store.selection.locationId,
  newId => {
    const p = findLocationPath(newId || '');
    if (p.region) {
      regionId.value = p.region.id;
    }
  },
);
</script>

<style scoped>
.xs-loc-tree {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px;
  border: 1px solid var(--xs-line-gold);
  border-radius: 10px;
  background: var(--xs-glass);
  margin-bottom: 18px;
}
.xs-loc-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}
.xs-loc-row-label {
  flex: 0 0 auto;
  width: 44px;
  font-family: var(--xs-font-display);
  font-size: 12.5px;
  letter-spacing: 3px;
  color: var(--xs-ink-mute);
}
.xs-loc-row-hint {
  font-size: 11.5px;
  color: var(--xs-ink-mute);
  letter-spacing: 0.5px;
  margin-left: 4px;
}
.xs-loc-chip {
  padding: 4px 14px;
  border-radius: 14px;
  border: 1px solid var(--xs-line);
  background: var(--xs-paper-warm);
  font-family: var(--xs-font-display);
  font-size: 12.5px;
  letter-spacing: 2px;
  color: var(--xs-ink);
  transition: all 0.18s ease;
}
.xs-loc-chip:hover:not(.active):not(:disabled) {
  border-color: var(--xs-cinnabar);
  color: var(--xs-cinnabar);
}
.xs-loc-chip.active {
  background: var(--xs-cinnabar);
  border-color: var(--xs-cinnabar-deep);
  color: #fff;
  box-shadow: 0 4px 12px -4px var(--xs-cinnabar-glow);
}
.xs-loc-chip.world {
  background: var(--xs-jade);
  border-color: var(--xs-jade-deep);
  color: #fff;
  cursor: default;
}
.xs-loc-region-desc {
  padding-left: 52px;
  font-size: 12px;
  color: var(--xs-ink-soft);
  letter-spacing: 1px;
  line-height: 1.7;
}

.xs-loc-leaf-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  margin-top: 4px;
}
@media (min-width: 600px) {
  .xs-loc-leaf-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (min-width: 880px) {
  .xs-loc-leaf-grid { grid-template-columns: repeat(3, 1fr); }
}
.xs-loc-leaf-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 14px;
  border: 1px solid var(--xs-line-gold);
  border-radius: 10px;
  background: var(--xs-glass);
  text-align: left;
  cursor: pointer;
  transition: all 0.18s ease;
}
.xs-loc-leaf-card:hover:not(.active) {
  border-color: var(--xs-gold);
  transform: translateY(-2px);
  box-shadow: var(--xs-shadow);
}
.xs-loc-leaf-card.active {
  border-color: var(--xs-cinnabar);
  background: linear-gradient(180deg, var(--xs-tint-cinnabar-soft), var(--xs-glass-strong));
  box-shadow: 0 0 0 1px var(--xs-cinnabar) inset, 0 8px 24px -10px var(--xs-cinnabar-glow);
}
.xs-loc-leaf-head {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}
.xs-loc-leaf-name {
  font-family: var(--xs-font-display);
  font-size: 15px;
  letter-spacing: 3px;
  color: var(--xs-ink);
}
.xs-loc-leaf-desc {
  font-size: 12px;
  line-height: 1.6;
  color: var(--xs-ink-soft);
}
.xs-eco-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px 0 0;
  border-top: 1px dashed var(--xs-line);
}
.xs-eco-label {
  font-family: var(--xs-font-display);
  font-size: 11.5px;
  letter-spacing: 3px;
  color: var(--xs-ink-mute);
}
.xs-eco-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.xs-eco-list li {
  font-size: 12px;
  line-height: 1.55;
  color: var(--xs-ink-soft);
}
.xs-eco-list strong {
  font-family: var(--xs-font-display);
  font-size: 12.5px;
  letter-spacing: 1px;
  color: var(--xs-ink);
  margin-right: 6px;
}
.xs-eco-brief {
  font-size: 11.5px;
  color: var(--xs-ink-mute);
}
.xs-loc-leaf-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.xs-loc-preview {
  margin-top: 8px;
  padding: 10px 14px;
  border: 1px solid var(--xs-cinnabar);
  border-radius: 10px;
  background: linear-gradient(180deg, var(--xs-tint-cinnabar-faint), var(--xs-glass-strong));
}
.xs-loc-preview-path {
  font-family: var(--xs-font-display);
  font-size: 13px;
  letter-spacing: 2px;
  color: var(--xs-ink);
}
.xs-loc-preview-path strong {
  color: var(--xs-cinnabar);
  font-size: 15px;
  letter-spacing: 3px;
}
.xs-loc-preview-path .sep {
  margin: 0 6px;
  color: var(--xs-ink-mute);
}
.xs-loc-preview-desc {
  font-size: 12.5px;
  line-height: 1.7;
  color: var(--xs-ink-soft);
  margin-top: 4px;
}
</style>
