<template>
  <div>
    <h2 class="xs-step-title">择 · 初始资材</h2>
    <p class="xs-step-subtitle">取舍之间见性情；可同时携带数件，所选条目独立计费。可按境界、品质、类型筛选；亦可自创资材。</p>

    <!-- 自创资材 -->
    <section class="xs-custom-section">
      <div class="xs-custom-head">
        <h3 class="xs-section-title">自创资材</h3>
        <span class="xs-custom-count">
          已创 {{ store.selection.customItems.length }} 件 · 计 {{ store.customItemsCost }} 点
        </span>
        <button
          v-if="!editorOpen"
          type="button"
          class="xs-btn xs-btn-ghost"
          @click="openCreate()"
        >
          + 添加
        </button>
      </div>

      <!-- 自创条目卡片 -->
      <div v-if="store.selection.customItems.length" class="xs-custom-list">
        <div v-for="c in store.selection.customItems" :key="c.id" class="xs-custom-card">
          <div class="xs-custom-card-head">
            <span class="xs-custom-card-name">{{ c.name }}</span>
            <span class="xs-custom-card-cost">{{ customCost(c) }} 点</span>
          </div>
          <div class="xs-inv-meta">
            <span class="xs-pill xs-pill-gold">{{ c.品质 }}品</span>
            <span class="xs-pill">{{ c.境界 }}</span>
            <span class="xs-pill xs-pill-jade">{{ c.类型 }}</span>
            <span v-if="c.五行" class="xs-pill xs-pill-cinnabar">{{ c.五行 }}</span>
          </div>
          <p v-if="c.desc" class="xs-custom-card-desc">{{ c.desc }}</p>
          <div class="xs-custom-card-actions">
            <button type="button" class="xs-btn xs-btn-ghost" @click="openEdit(c)">编辑</button>
            <button type="button" class="xs-btn xs-btn-ghost" @click="store.removeCustomItem(c.id)">删除</button>
          </div>
        </div>
      </div>

      <!-- 编辑器 -->
      <div v-if="editorOpen" class="xs-custom-editor">
        <div class="xs-custom-edit-row">
          <label>名号</label>
          <input
            type="text"
            v-model="draft.name"
            maxlength="14"
            placeholder="请为这件资材命名（如：紫电雷符）"
          />
        </div>
        <div class="xs-custom-edit-row">
          <label>大类</label>
          <select v-model="draft.category" @change="onDraftCategoryChange">
            <option v-for="c in ITEM_CATEGORIES.filter(c => c !== '灵石')" :key="c" :value="c">{{ c }}</option>
          </select>
          <label>类型</label>
          <select v-model="draft.类型">
            <option
              v-for="k in ITEM_KINDS_BY_CATEGORY[draft.category]"
              :key="k"
              :value="k"
            >
              {{ k }}
            </option>
          </select>
        </div>
        <div class="xs-custom-edit-row">
          <label>品质</label>
          <select v-model="draft.品质">
            <option v-for="q in ITEM_QUALITIES" :key="q" :value="q">{{ q }}品</option>
          </select>
          <label>境界</label>
          <select v-model="draft.境界">
            <option v-for="r in ITEM_REALMS" :key="r" :value="r">{{ r }}</option>
          </select>
          <label>五行</label>
          <select v-model="draft.五行">
            <option v-for="el in FIVE_ELEMENTS" :key="el" :value="el">{{ el }}</option>
          </select>
        </div>
        <div class="xs-custom-edit-row">
          <label>描述</label>
          <input
            type="text"
            v-model="draft.desc"
            maxlength="60"
            placeholder="一句话描述其作用（可空）"
          />
        </div>
        <div class="xs-custom-edit-actions">
          <span class="xs-custom-cost-preview">将耗费 {{ draftCost }} 点</span>
          <button type="button" class="xs-btn xs-btn-ghost" @click="closeEditor">取消</button>
          <button
            type="button"
            class="xs-btn xs-btn-primary"
            :disabled="!canSave"
            @click="onSave"
          >
            {{ editingId ? '保存改动' : '加入' }}
          </button>
        </div>
      </div>
    </section>

    <!-- 筛选器 -->
    <section class="xs-preset-section">
      <h3 class="xs-section-title">预设资材</h3>
      <div class="xs-inv-filters">
        <div class="xs-inv-filter">
          <span class="xs-inv-filter-label">境界</span>
          <select v-model="realmFilter">
            <option value="">全部</option>
            <option v-for="r in ITEM_REALMS" :key="r" :value="r">{{ r }}</option>
          </select>
        </div>
        <div class="xs-inv-filter">
          <span class="xs-inv-filter-label">品质</span>
          <select v-model="qualityFilter">
            <option value="">全部</option>
            <option v-for="q in ITEM_QUALITIES" :key="q" :value="q">{{ q }}品</option>
          </select>
        </div>
        <div class="xs-inv-filter">
          <span class="xs-inv-filter-label">大类</span>
          <select v-model="categoryFilter" @change="onCategoryChange">
            <option value="">全部</option>
            <option v-for="c in ITEM_CATEGORIES" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>
        <div class="xs-inv-filter">
          <span class="xs-inv-filter-label">类型</span>
          <select v-model="kindFilter">
            <option value="">全部</option>
            <option v-for="k in availableKinds" :key="k" :value="k">{{ k }}</option>
          </select>
        </div>
        <button v-if="hasFilters" type="button" class="xs-btn xs-btn-ghost xs-inv-clear" @click="clearFilters">
          清空筛选
        </button>
        <span class="xs-inv-count">显示 {{ filteredItems.length }} / {{ items.length }}</span>
      </div>

      <div v-if="filteredItems.length === 0" class="xs-empty">未匹配到任何资材</div>
      <div v-else>
        <div class="xs-card-grid cols-3">
          <OptionCard
            v-for="(it, i) in pageItems"
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
          >
            <div class="xs-inv-meta">
              <span v-if="it.品质" class="xs-pill xs-pill-gold">{{ it.品质 }}品</span>
              <span v-if="it.境界" class="xs-pill">{{ it.境界 }}</span>
              <span class="xs-pill xs-pill-jade">{{ it.类型 }}</span>
              <span v-if="it.五行" class="xs-pill xs-pill-cinnabar">{{ it.五行 }}</span>
            </div>
          </OptionCard>
        </div>

        <!-- 分页 -->
        <div v-if="totalPages > 1" class="xs-pager">
          <button
            type="button"
            class="xs-pager-btn"
            :disabled="currentPage <= 1"
            @click="currentPage = 1"
          >« 首页</button>
          <button
            type="button"
            class="xs-pager-btn"
            :disabled="currentPage <= 1"
            @click="currentPage--"
          >‹ 上一页</button>
          <span class="xs-pager-info">第 {{ currentPage }} / {{ totalPages }} 页</span>
          <button
            type="button"
            class="xs-pager-btn"
            :disabled="currentPage >= totalPages"
            @click="currentPage++"
          >下一页 ›</button>
          <button
            type="button"
            class="xs-pager-btn"
            :disabled="currentPage >= totalPages"
            @click="currentPage = totalPages"
          >末页 »</button>
        </div>
      </div>
    </section>

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
import { computed, reactive, ref, watch } from 'vue';
import type {
  CustomItem,
  ItemCategory,
  ItemKind,
  ItemOption,
  ItemQuality,
  ItemRealm,
} from '../types';
import {
  ALL_ITEM_KINDS,
  ITEM_CATEGORIES,
  ITEM_KINDS_BY_CATEGORY,
  ITEM_QUALITIES,
  ITEM_REALMS,
  computeCustomItemCost,
  items,
} from '../config';
import { useStartStore } from '../store';
import OptionCard from '../components/OptionCard.vue';

const FIVE_ELEMENTS = ['金', '木', '水', '火', '土', '阴', '阳'] as const;

const store = useStartStore();

// —— 筛选状态 ——
const realmFilter = ref<'' | ItemRealm>('');
const qualityFilter = ref<'' | ItemQuality>('');
const categoryFilter = ref<'' | ItemCategory>('');
const kindFilter = ref<'' | ItemKind>('');

const availableKinds = computed<ItemKind[]>(() => {
  if (!categoryFilter.value) return ALL_ITEM_KINDS;
  return ITEM_KINDS_BY_CATEGORY[categoryFilter.value];
});

const filteredItems = computed(() =>
  items.filter(it => {
    if (realmFilter.value && it.境界 !== realmFilter.value) return false;
    if (qualityFilter.value && it.品质 !== qualityFilter.value) return false;
    if (categoryFilter.value && it.category !== categoryFilter.value) return false;
    if (kindFilter.value && it.类型 !== kindFilter.value) return false;
    return true;
  }),
);

const hasFilters = computed(
  () =>
    !!realmFilter.value ||
    !!qualityFilter.value ||
    !!categoryFilter.value ||
    !!kindFilter.value,
);

function onCategoryChange() {
  if (kindFilter.value && categoryFilter.value) {
    const allowed = ITEM_KINDS_BY_CATEGORY[categoryFilter.value];
    if (!allowed.includes(kindFilter.value as ItemKind)) {
      kindFilter.value = '';
    }
  }
}

function clearFilters() {
  realmFilter.value = '';
  qualityFilter.value = '';
  categoryFilter.value = '';
  kindFilter.value = '';
}

// —— 分页 ——
const PAGE_SIZE = 12;
const currentPage = ref(1);
const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredItems.value.length / PAGE_SIZE)),
);
const pageItems = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE;
  return filteredItems.value.slice(start, start + PAGE_SIZE);
});
// 筛选条件变化时回到第 1 页
watch(filteredItems, () => {
  currentPage.value = 1;
});

function canAfford(it: ItemOption): boolean {
  if (store.isItemSelected(it.id)) return true;
  return it.cost <= store.remainingPoints;
}

// —— 自创资材编辑器 ——
const editorOpen = ref(false);
const editingId = ref<string | null>(null);

interface Draft {
  name: string;
  desc: string;
  category: ItemCategory;
  类型: ItemKind;
  品质: ItemQuality;
  境界: ItemRealm;
  五行: string;
}

const draft = reactive<Draft>({
  name: '',
  desc: '',
  category: '物品',
  类型: '丹药',
  品质: '黄',
  境界: '炼气',
  五行: '金',
});

function resetDraft() {
  draft.name = '';
  draft.desc = '';
  draft.category = '物品';
  draft.类型 = '丹药';
  draft.品质 = '黄';
  draft.境界 = '炼气';
  draft.五行 = '金';
}

function openCreate() {
  editingId.value = null;
  resetDraft();
  editorOpen.value = true;
}
function openEdit(c: CustomItem) {
  editingId.value = c.id;
  draft.name = c.name;
  draft.desc = c.desc || '';
  draft.category = c.category;
  draft.类型 = c.类型;
  draft.品质 = c.品质;
  draft.境界 = c.境界;
  draft.五行 = c.五行 || '金';
  editorOpen.value = true;
}
function closeEditor() {
  editorOpen.value = false;
  editingId.value = null;
}

function onDraftCategoryChange() {
  // 类型可能不在新大类下：取该大类首个类型
  const kinds = ITEM_KINDS_BY_CATEGORY[draft.category];
  if (!kinds.includes(draft.类型)) {
    draft.类型 = kinds[0];
  }
}

const draftCost = computed(() =>
  computeCustomItemCost({ 品质: draft.品质, 境界: draft.境界 }),
);

const canSave = computed(() => {
  if (!draft.name.trim()) return false;
  if (editingId.value) {
    // 编辑时若涨价导致超支也允许保存（与游戏逻辑无关）
    return true;
  }
  return draftCost.value <= store.remainingPoints;
});

function onSave() {
  const payload = {
    name: draft.name.trim(),
    desc: draft.desc.trim() || undefined,
    category: draft.category,
    类型: draft.类型,
    品质: draft.品质,
    境界: draft.境界,
    五行: draft.五行,
  };
  if (editingId.value) {
    store.updateCustomItem(editingId.value, payload);
  } else {
    store.addCustomItem(payload);
  }
  closeEditor();
}

function customCost(c: CustomItem): number {
  return computeCustomItemCost({ 品质: c.品质, 境界: c.境界 });
}
</script>

<style scoped>
.xs-section-title {
  font-family: var(--xs-font-display);
  font-size: 16px;
  letter-spacing: 4px;
  color: var(--xs-ink);
  border-left: 3px solid var(--xs-cinnabar);
  padding-left: 8px;
}

.xs-custom-section {
  margin-bottom: 22px;
}
.xs-custom-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}
.xs-custom-count {
  font-size: 12px;
  letter-spacing: 1px;
  color: var(--xs-ink-mute);
}
.xs-custom-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  margin-bottom: 10px;
}
@media (min-width: 600px) {
  .xs-custom-list { grid-template-columns: repeat(2, 1fr); }
}
@media (min-width: 880px) {
  .xs-custom-list { grid-template-columns: repeat(3, 1fr); }
}
.xs-custom-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  border: 1px dashed var(--xs-cinnabar);
  border-radius: 10px;
  background: rgba(177, 58, 58, 0.04);
}
.xs-custom-card-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
}
.xs-custom-card-name {
  font-family: var(--xs-font-display);
  font-size: 14px;
  letter-spacing: 2px;
  color: var(--xs-ink);
}
.xs-custom-card-cost {
  font-family: var(--xs-font-title);
  font-size: 14px;
  color: var(--xs-cinnabar);
  letter-spacing: 1px;
}
.xs-custom-card-desc {
  font-size: 12px;
  line-height: 1.6;
  color: var(--xs-ink-soft);
}
.xs-custom-card-actions {
  display: flex;
  gap: 6px;
  margin-top: 4px;
}
.xs-custom-card-actions .xs-btn {
  padding: 4px 12px;
  font-size: 11px;
  letter-spacing: 2px;
}

.xs-custom-editor {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 14px;
  border: 1px dashed var(--xs-cinnabar);
  border-radius: 10px;
  background: rgba(177, 58, 58, 0.04);
  margin-top: 8px;
}
.xs-custom-edit-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.xs-custom-edit-row label {
  flex: 0 0 auto;
  min-width: 36px;
  font-family: var(--xs-font-display);
  font-size: 12px;
  letter-spacing: 2px;
  color: var(--xs-ink-mute);
}
.xs-custom-edit-row input[type='text'] {
  flex: 1 1 200px;
  font-family: var(--xs-font-display);
  font-size: 13.5px;
  letter-spacing: 1.5px;
  background: var(--xs-paper-warm);
  border: 1px solid var(--xs-line-gold);
  padding: 6px 10px;
}
.xs-custom-edit-row input:focus,
.xs-custom-edit-row select:focus {
  border-color: var(--xs-cinnabar);
  outline: none;
  box-shadow: 0 0 0 3px rgba(177, 58, 58, 0.15);
}
.xs-custom-edit-row select {
  font-family: var(--xs-font-display);
  font-size: 13px;
  letter-spacing: 1px;
  background: var(--xs-paper);
  border: 1px solid var(--xs-line-gold);
  border-radius: 6px;
  padding: 4px 8px;
  color: var(--xs-ink);
}
.xs-custom-edit-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  flex-wrap: wrap;
}
.xs-custom-cost-preview {
  flex: 1 1 auto;
  font-family: var(--xs-font-display);
  font-size: 13px;
  letter-spacing: 1px;
  color: var(--xs-cinnabar);
}

.xs-preset-section .xs-section-title {
  margin-bottom: 10px;
}

.xs-inv-filters {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 10px 14px;
  border: 1px solid var(--xs-line-gold);
  border-radius: 10px;
  background: var(--xs-paper-warm);
  margin-bottom: 14px;
}
.xs-inv-filter {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.xs-inv-filter-label {
  font-family: var(--xs-font-display);
  font-size: 12.5px;
  letter-spacing: 2px;
  color: var(--xs-ink-mute);
}
.xs-inv-filter select {
  font-family: var(--xs-font-display);
  font-size: 13px;
  letter-spacing: 1.5px;
  background: var(--xs-paper);
  border: 1px solid var(--xs-line-gold);
  border-radius: 6px;
  padding: 4px 8px;
  color: var(--xs-ink);
}
.xs-inv-filter select:focus {
  border-color: var(--xs-cinnabar);
  outline: none;
  box-shadow: 0 0 0 3px rgba(177, 58, 58, 0.15);
}
.xs-inv-clear {
  padding: 4px 12px;
  font-size: 11.5px;
  letter-spacing: 2px;
}
.xs-inv-count {
  margin-left: auto;
  font-size: 11.5px;
  letter-spacing: 1px;
  color: var(--xs-ink-mute);
}
.xs-inv-meta {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  margin-top: 4px;
}

/* —— 分页 —— */
.xs-pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 14px;
  flex-wrap: wrap;
}
.xs-pager-btn {
  padding: 4px 12px;
  font-family: var(--xs-font-display);
  font-size: 12px;
  letter-spacing: 2px;
  border: 1px solid var(--xs-line-gold);
  border-radius: 14px;
  background: var(--xs-paper-warm);
  color: var(--xs-ink);
  transition: all 0.18s ease;
}
.xs-pager-btn:hover:not(:disabled) {
  background: var(--xs-cinnabar);
  border-color: var(--xs-cinnabar-deep);
  color: #fff;
}
.xs-pager-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.xs-pager-info {
  font-family: var(--xs-font-display);
  font-size: 12.5px;
  letter-spacing: 2px;
  color: var(--xs-ink-mute);
  margin: 0 8px;
}
</style>
