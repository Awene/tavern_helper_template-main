<template>
  <div>
    <h2 class="xs-step-title">择 · 初始资材</h2>
    <p class="xs-step-subtitle">取舍之间见性情；可同时携带数件，所选条目独立计费。可按境界、品质、类型筛选；亦可自创资材。</p>
    <p class="xs-realm-cap-hint">
      <span class="xs-pill xs-pill-jade">境界上限</span>
      仅可选择 <b>{{ realmCapLabel }}</b> 及以下境界的资材（由开局故事决定）。
    </p>

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
            <option v-for="r in allowedRealms" :key="r" :value="r">{{ r }}</option>
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
            <option v-for="r in allowedRealms" :key="r" :value="r">{{ r }}</option>
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
            <!-- 顶级元数据 pill -->
            <div class="xs-inv-meta">
              <span v-if="it.品质" class="xs-pill xs-pill-gold">{{ it.品质 }}品</span>
              <span v-if="it.境界" class="xs-pill">{{ it.境界 }}</span>
              <span class="xs-pill xs-pill-jade">{{ it.类型 }}</span>
              <span v-if="it.五行" class="xs-pill xs-pill-cinnabar">{{ it.五行 }}</span>
            </div>
            <!-- 数值标签:按规则公式计算 -->
            <div class="xs-inv-stats" v-if="hasNumericStats(it)">
              <span v-if="display(it).攻击力" class="xs-stat-chip xs-stat-attack">攻 {{ display(it).攻击力 }}</span>
              <span v-if="display(it).防御力" class="xs-stat-chip xs-stat-defense">防 {{ display(it).防御力 }}</span>
              <span v-if="display(it).气血" class="xs-stat-chip xs-stat-hp">血 {{ display(it).气血 }}</span>
              <span v-if="display(it).资源池?.灵气?.上限" class="xs-stat-chip xs-stat-mana">气 {{ display(it).资源池.灵气.上限 }}</span>
              <span v-if="display(it).遁速" class="xs-stat-chip xs-stat-speed">遁 {{ display(it).遁速 }}</span>
              <span v-if="display(it).修行速度" class="xs-stat-chip xs-stat-cult">修 {{ display(it).修行速度 }}</span>
              <span v-if="display(it).恢复" class="xs-stat-chip xs-stat-heal">回 {{ display(it).恢复 }}</span>
              <span v-if="display(it).加成" class="xs-stat-chip xs-stat-bonus">加 {{ display(it).加成 }}</span>
              <span v-if="display(it).数量 && display(it).数量 > 1" class="xs-stat-chip xs-stat-qty">×{{ display(it).数量 }}</span>
              <span v-if="display(it).使用中 === true" class="xs-stat-chip xs-stat-active">✓使用中</span>
              <span v-if="display(it).完整度" class="xs-stat-chip">{{ display(it).完整度 }}</span>
            </div>
            <!-- 效果块 -->
            <div v-if="display(it).效果 && Object.keys(display(it).效果 || {}).length" class="xs-inv-effects">
              <div v-for="(v, k) in display(it).效果" :key="String(k)" class="xs-inv-effect-row">
                <span class="xs-inv-effect-name">{{ k }}:</span>
                <span class="xs-inv-effect-val">{{ v }}</span>
              </div>
            </div>
            <!-- 技能块(仅 傀儡/灵兽) -->
            <div v-if="display(it).技能 && Object.keys(display(it).技能 || {}).length" class="xs-inv-skills">
              <div class="xs-inv-skills-head">技能</div>
              <div v-for="(sk, name) in display(it).技能" :key="String(name)" class="xs-inv-skill-row">
                <span class="xs-inv-skill-name">{{ name }}</span>
                <span v-if="sk.攻击力" class="xs-stat-chip xs-stat-attack">攻 {{ sk.攻击力 }}</span>
                <span v-if="sk.消耗" class="xs-inv-skill-cost">耗 {{ sk.消耗 }}</span>
                <span v-if="sk.效果" class="xs-inv-skill-eff">
                  <span v-for="(v, k) in sk.效果" :key="String(k)">{{ k }}: {{ v }}</span>
                </span>
              </div>
            </div>
            <!-- 描述性标签(items.ts 自带的:基础/剑修/魔修等) -->
            <div v-if="display(it).描述标签.length" class="xs-inv-tagrow">
              <span v-for="t in display(it).描述标签" :key="t" class="xs-inv-tag">{{ t }}</span>
            </div>
            <!-- 消耗 / 位置 / 阅读进度 -->
            <div v-if="display(it).消耗 || display(it).位置 || display(it).阅读进度" class="xs-inv-foot">
              <span v-if="display(it).消耗" class="xs-inv-foot-item">耗 {{ display(it).消耗 }}</span>
              <span v-if="display(it).阅读进度" class="xs-inv-foot-item">进度 {{ display(it).阅读进度 }}</span>
              <span v-if="display(it).位置" class="xs-inv-foot-item xs-inv-loc">📍 {{ display(it).位置 }}</span>
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
import { computed, onMounted, reactive, ref, watch } from 'vue';
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
  customStoryToOption,
  findStory,
  items,
} from '../config';
import { toDisplay } from '../itemNormalizer';
import { useStartStore } from '../store';
import OptionCard from '../components/OptionCard.vue';

const FIVE_ELEMENTS = ['金', '木', '水', '火', '土', '阴', '阳'] as const;

const store = useStartStore();

// —— 当前开局故事决定的大境界(决定了资材境界上限) ——
const REALM_RANK_MAP: Record<string, number> = {
  炼气: 1, 练气: 1, 筑基: 2, 金丹: 3, 元婴: 4, 化神: 5,
};
const playerRealmRank = computed<number>(() => {
  const id = store.selection.storyId;
  if (!id) return 1; // 未选剧本时默认炼气,允许低阶资材
  const custom = store.selection.customStory;
  const story = (custom && custom.id === id) ? customStoryToOption(custom) : findStory(id);
  const big = story?.settings?.初始境界?.大境界 ?? '炼气';
  return REALM_RANK_MAP[big] ?? 1;
});
function realmRankOf(realm: ItemRealm | undefined): number {
  if (!realm) return 0; // 无境界(灵石/通用工具)恒不超
  return REALM_RANK_MAP[realm] ?? 1;
}
function realmAllowed(it: ItemOption): boolean {
  return realmRankOf(it.境界) <= playerRealmRank.value;
}
function realmAllowedCustom(c: CustomItem): boolean {
  return realmRankOf(c.境界) <= playerRealmRank.value;
}
const realmCapLabel = computed<string>(() => {
  const r = playerRealmRank.value;
  return ITEM_REALMS[Math.max(0, Math.min(ITEM_REALMS.length - 1, r - 1))] ?? '炼气';
});
const allowedRealms = computed<ItemRealm[]>(() =>
  ITEM_REALMS.filter(r => realmRankOf(r) <= playerRealmRank.value),
);

// —— 进入本步骤时,清理已选/自创但超出当前境界上限的资材 ——
function pruneOverCapSelections() {
  const removed: string[] = [];
  // 预设资材
  const keepIds = store.selection.itemIds.filter(id => {
    const it = items.find(x => x.id === id);
    if (!it) return false;
    if (realmAllowed(it)) return true;
    removed.push(it.name);
    return false;
  });
  store.selection.itemIds = keepIds;
  // 自创资材
  const overCustom = store.selection.customItems.filter(c => !realmAllowedCustom(c));
  for (const c of overCustom) {
    store.removeCustomItem(c.id);
    removed.push(c.name);
  }
  if (removed.length) {
    store.showToast(`已移除超出境界上限的资材: ${removed.slice(0, 3).join('、')}${removed.length > 3 ? '…' : ''}`);
  }
  // 同步重置筛选(若当前境界筛选已超上限)
  if (realmFilter.value && !allowedRealms.value.includes(realmFilter.value as ItemRealm)) {
    realmFilter.value = '';
  }
}
onMounted(pruneOverCapSelections);
watch(playerRealmRank, pruneOverCapSelections);

// 卡片显示用:按规则规范化每件物品(品质/境界/类型/五行 → 攻击力/防御力/etc)
// 缓存避免 v-for 重复计算
const _displayCache = new Map<string, ReturnType<typeof toDisplay>>();
function display(it: ItemOption) {
  const key = it.id;
  let v = _displayCache.get(key);
  if (!v) {
    v = toDisplay(it);
    _displayCache.set(key, v);
  }
  return v;
}
function hasNumericStats(it: ItemOption): boolean {
  const d = display(it);
  return !!(
    d.攻击力 || d.防御力 || d.气血 || d.遁速 ||
    d.修行速度 || d.恢复 || d.加成 ||
    d.资源池?.灵气?.上限 ||
    (d.数量 && d.数量 > 1) ||
    d.使用中 === true || d.完整度
  );
}

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
    if (!realmAllowed(it)) return false; // 高于角色境界的资材直接隐藏
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

.xs-realm-cap-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 6px 0 14px;
  padding: 6px 12px;
  font-size: 12.5px;
  letter-spacing: 1px;
  color: var(--xs-ink-soft);
  background: var(--xs-tint-cinnabar-faint, rgba(168, 153, 104, 0.08));
  border-left: 2px solid var(--xs-cinnabar, #a07f48);
  border-radius: 0 4px 4px 0;
}
.xs-realm-cap-hint b {
  color: var(--xs-cinnabar-deep, #a07f48);
  letter-spacing: 2px;
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
  background: var(--xs-tint-cinnabar-faint);
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
  background: var(--xs-tint-cinnabar-faint);
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
  box-shadow: 0 0 0 3px var(--xs-tint-cinnabar-strong);
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
  box-shadow: 0 0 0 3px var(--xs-tint-cinnabar-strong);
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

/* —— 卡片扩展区:数值/效果/标签/位置 —— */
.xs-inv-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 5px;
}
.xs-stat-chip {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 1px 8px;
  border-radius: 4px;
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.3px;
  background: var(--xs-paper-warm);
  border: 1px solid var(--xs-line-gold);
  color: var(--xs-ink);
}
.xs-stat-chip.xs-stat-attack {
  background: linear-gradient(135deg, rgba(229, 62, 62, 0.10), rgba(197, 48, 48, 0.06));
  border-color: rgba(197, 48, 48, 0.30);
  color: #b03030;
}
.xs-stat-chip.xs-stat-defense {
  background: linear-gradient(135deg, rgba(66, 153, 225, 0.10), rgba(44, 82, 130, 0.06));
  border-color: rgba(44, 82, 130, 0.30);
  color: #2c5282;
}
.xs-stat-chip.xs-stat-hp {
  background: linear-gradient(135deg, rgba(245, 101, 101, 0.10), rgba(155, 44, 44, 0.06));
  border-color: rgba(155, 44, 44, 0.28);
  color: #9b2c2c;
}
.xs-stat-chip.xs-stat-speed {
  background: linear-gradient(135deg, rgba(56, 161, 105, 0.10), rgba(47, 133, 90, 0.06));
  border-color: rgba(47, 133, 90, 0.28);
  color: #2f855a;
}
.xs-stat-chip.xs-stat-cult {
  background: linear-gradient(135deg, rgba(214, 158, 46, 0.12), rgba(183, 121, 31, 0.08));
  border-color: rgba(183, 121, 31, 0.32);
  color: #b7791f;
}
.xs-stat-chip.xs-stat-mana {
  background: linear-gradient(135deg, rgba(99, 179, 237, 0.10), rgba(43, 108, 176, 0.06));
  border-color: rgba(43, 108, 176, 0.30);
  color: #2b6cb0;
}
.xs-stat-chip.xs-stat-heal {
  background: linear-gradient(135deg, rgba(159, 122, 234, 0.10), rgba(85, 60, 154, 0.06));
  border-color: rgba(85, 60, 154, 0.28);
  color: #6b46c1;
}
.xs-stat-chip.xs-stat-bonus {
  background: linear-gradient(135deg, rgba(72, 187, 120, 0.10), rgba(38, 132, 70, 0.06));
  border-color: rgba(38, 132, 70, 0.28);
  color: #276749;
}
.xs-stat-chip.xs-stat-qty {
  font-family: var(--xs-font-display, 'Cinzel', serif);
}
.xs-stat-chip.xs-stat-active {
  background: linear-gradient(135deg, #38a169, #2f855a);
  color: #fff;
  border-color: #2f855a;
}

.xs-inv-effects {
  margin-top: 6px;
  padding: 5px 8px;
  background: rgba(168, 153, 104, 0.08);
  border-left: 2px solid var(--xs-cinnabar, #a07f48);
  border-radius: 0 4px 4px 0;
  font-size: 11.5px;
  line-height: 1.55;
  text-align: left;
}
.xs-inv-effect-row {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}
.xs-inv-effect-name {
  color: var(--xs-cinnabar-deep, #a07f48);
  font-weight: 700;
  flex-shrink: 0;
}
.xs-inv-effect-val {
  color: var(--xs-ink, #3a2f24);
}

.xs-inv-skills {
  margin-top: 6px;
  padding: 5px 8px;
  background: rgba(160, 127, 72, 0.06);
  border-left: 2px solid var(--xs-cinnabar-deep, #a07f48);
  border-radius: 0 4px 4px 0;
  font-size: 11.5px;
  text-align: left;
}
.xs-inv-skills-head {
  font-family: var(--xs-font-display);
  font-size: 11px;
  letter-spacing: 2px;
  color: var(--xs-cinnabar-deep, #a07f48);
  margin-bottom: 3px;
}
.xs-inv-skill-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px;
  margin-bottom: 2px;
  line-height: 1.5;
}
.xs-inv-skill-name {
  font-weight: 700;
  color: var(--xs-ink, #3a2f24);
}
.xs-inv-skill-cost {
  font-size: 11px;
  color: var(--xs-ink-mute, #5a4a36);
}
.xs-inv-skill-eff {
  font-size: 11px;
  color: var(--xs-ink-soft, #4a3d2c);
}
.xs-inv-skill-eff > span {
  margin-right: 4px;
}

.xs-inv-tagrow {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  margin-top: 5px;
}
.xs-inv-tag {
  padding: 1px 7px;
  border-radius: 4px;
  background: rgba(168, 153, 104, 0.12);
  border: 1px dashed rgba(160, 127, 72, 0.35);
  color: var(--xs-ink-mute, #5a4a36);
  font-size: 11px;
  letter-spacing: 0.4px;
}

.xs-inv-foot {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 10px;
  margin-top: 5px;
  font-size: 11px;
  color: var(--xs-ink-mute, #5a4a36);
}
.xs-inv-foot-item {
  opacity: 0.85;
}
.xs-inv-foot-item.xs-inv-loc {
  color: var(--xs-cinnabar-deep, #a07f48);
  font-weight: 600;
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
