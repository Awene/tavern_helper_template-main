<template>
  <section class="cw-page cw-wb-page">
    <div v-if="notice" class="cw-wb-notice" :class="noticeType">{{ notice }}</div>

    <template v-if="mode === 'browse'">
      <div class="cw-toolbar">
        <label class="cw-search"
          ><span>搜索</span
          ><input v-model="query" type="search" placeholder="世界书、作者或简介" @keyup.enter="loadPublic(true)"
        /></label>
        <label
          ><span>类别</span
          ><select v-model="category" @change="loadPublic(true)">
            <option value="">全部</option>
            <option>角色</option>
            <option>事件</option>
            <option>扩展</option>
          </select></label
        >
        <button class="cw-btn" type="button" :disabled="busy" @click="loadPublic(true)">刷新</button>
      </div>
      <div v-if="busy && !publicPacks.length" class="cw-empty">正在读取世界书目录……</div>
      <div v-else-if="!publicPacks.length" class="cw-empty">没有找到符合条件的世界书包。</div>
      <div v-else class="cw-wb-grid">
        <article
          v-for="publicBook in publicPacks"
          :key="publicBook.id"
          class="cw-wb-card cw-wb-public-card"
          :class="{ loading: detailLoadingId === publicBook.id }"
          tabindex="0"
          :aria-label="`查看世界书包：${publicBook.name}`"
          @click="openWorldbookDetail(publicBook)"
          @keydown.enter.prevent="openWorldbookDetail(publicBook)"
          @keydown.space.prevent="openWorldbookDetail(publicBook)"
        >
          <div class="cw-wb-cover">
            <img
              v-if="publicBook.cover_url"
              :src="publicBook.cover_url"
              :alt="`${publicBook.name}封面`"
              loading="lazy"
              referrerpolicy="no-referrer"
            />
            <span v-else aria-hidden="true">卷</span>
            <div class="cw-wb-cover-labels">
              <span class="cw-category">{{ publicBook.category }}</span>
              <span class="cw-version">v{{ publicBook.version }}</span>
            </div>
          </div>
          <h2>{{ publicBook.name }}</h2>
          <span class="cw-wb-dlc-key">{{ publicBook.dlc_key }}</span>
          <p class="cw-wb-card-description">{{ publicBook.description || '作者没有填写简介。' }}</p>
          <div class="cw-wb-meta">
            <span>{{ publicBook.owner_name || '未知作者' }}</span
            ><span>{{ publicBook.entry_count }} 条 · {{ formatBytes(publicBook.byte_size) }}</span>
          </div>
          <RelationBadges :pack="publicBook" />
          <div class="cw-wb-card-footer">
            <span>{{ detailLoadingId === publicBook.id ? '正在读取…' : '点击卡片查看详情' }}</span>
            <button
              class="cw-btn cw-btn-primary"
              type="button"
              :disabled="busy || isInstalled(publicBook.id)"
              @click.stop="install(publicBook)"
              @keydown.enter.stop
              @keydown.space.stop
            >
              {{ isInstalled(publicBook.id) ? '已安装' : '安装并启用' }}
            </button>
          </div>
        </article>
      </div>
      <button
        v-if="nextOffset !== null"
        class="cw-btn cw-more"
        type="button"
        :disabled="busy"
        @click="loadPublic(false)"
      >
        加载更多
      </button>
    </template>

    <template v-else-if="mode === 'installed'">
      <div class="cw-section-head">
        <div>
          <h2>已安装世界书</h2>
          <p>所有包集中写入“本格数值化修仙·创意工坊”；每个包仍可单独启用、停用和卸载。</p>
        </div>
        <button class="cw-btn" type="button" :disabled="busy" @click="checkAllUpdates">检查全部更新</button>
      </div>
      <div v-if="!installed.length" class="cw-empty">尚未安装世界书包。请先到“浏览世界书”安装。</div>
      <div v-else class="cw-list">
        <article v-for="item in installed" :key="item.id" class="cw-installed cw-wb-installed">
          <div class="cw-installed-info">
            <div class="cw-wb-card-head">
              <span class="cw-category">{{ item.pack.category }}</span
              ><span class="cw-version">v{{ item.pack.version }}</span>
            </div>
            <h3>{{ item.pack.name }}</h3>
            <span class="cw-wb-dlc-key">{{ item.pack.dlc_key }}</span>
            <p>{{ item.pack.entry_count }} 条 · 酒馆世界书：{{ item.bookName }}</p>
            <RelationBadges :pack="item.pack" />
            <div v-if="item.missingPrerequisites.length" class="cw-wb-warning">
              缺失或未启用前置：{{ item.missingPrerequisites.join('、') }}（当前仍可启用）
            </div>
            <div v-if="item.updateError" class="cw-wb-error">{{ item.updateError }}</div>
          </div>
          <div class="cw-installed-actions">
            <button class="cw-btn" type="button" :disabled="busy" @click="checkOneUpdate(item)">检查更新</button>
            <button class="cw-btn cw-btn-danger" type="button" :disabled="busy" @click="uninstall(item)">卸载</button>
          </div>
          <button
            class="cw-btn cw-pack-toggle"
            :class="item.enabled ? 'is-enabled' : 'is-disabled'"
            type="button"
            :disabled="busy"
            :aria-pressed="item.enabled"
            @click="toggleInstalled(item)"
          >
            <span class="cw-toggle-dot" aria-hidden="true"></span>{{ item.enabled ? '已启用' : '已停用' }}
          </button>
        </article>
      </div>
    </template>

    <template v-else>
      <div class="cw-section-head">
        <div>
          <h2>我的世界书</h2>
          <p>上传酒馆导出的 JSON；全部条目必须属于同一个 DLC 分组。</p>
        </div>
      </div>
      <div v-if="!auth" class="cw-login-prompt">
        <h2>登录后上传世界书包</h2>
        <p>浏览和安装无需登录；上传、更新与发布需要 Discord 登录。</p>
        <button class="cw-btn cw-btn-primary" type="button" @click="$emit('login')">Discord 登录</button>
      </div>
      <template v-else>
        <form class="cw-form-card cw-wb-upload" @submit.prevent="createPack">
          <div class="cw-wb-form-title">
            <div>
              <div class="cw-wb-title-line">
                <h3>上传新世界书包</h3>
                <button
                  class="cw-info-button small"
                  type="button"
                  aria-label="查看世界书条目命名说明"
                  title="命名规范"
                  @click="showGuide = true"
                >
                  i
                </button>
              </div>
              <p>名称和类别自动从 `[DLC][类别][名称]` 提取。</p>
            </div>
          </div>
          <label class="wide"
            ><span>世界书 JSON</span
            ><input
              ref="createFileInput"
              type="file"
              accept=".json,application/json"
              required
              @change="selectCreateFile"
          /></label>
          <label class="wide"
            ><span>封面（可选）</span
            ><input
              ref="createCoverInput"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              @change="selectCreateCover"
          /></label>
          <p v-if="createCoverFile" class="cw-cover-file wide">已选择：{{ createCoverFile.name }}</p>
          <label class="wide"><span>简介</span><textarea v-model="newDescription" maxlength="500"></textarea></label>
          <div v-if="createValidation" class="cw-wb-validation wide">
            <strong>{{ createValidation.dlcKey }}</strong
            ><span>{{ createValidation.entryCount }} 个条目</span
            ><RelationBadges :pack="validationAsPack(createValidation)" />
          </div>
          <div class="cw-form-actions wide">
            <button class="cw-btn cw-btn-primary" :disabled="busy || !createFile || !createValidation">
              上传为草稿
            </button>
          </div>
        </form>

        <div class="cw-owner-layout cw-wb-owner-layout">
          <aside class="cw-owner-list">
            <button
              v-for="ownBook in ownPacks"
              :key="ownBook.id"
              :class="{ active: selectedOwn?.id === ownBook.id }"
              type="button"
              @click="selectOwn(ownBook)"
            >
              <strong>{{ ownBook.name }}</strong
              ><span>{{ ownBook.status }} · {{ ownBook.entry_count }} 条</span>
            </button>
            <div v-if="!ownPacks.length" class="cw-empty compact">还没有世界书包。</div>
          </aside>
          <div v-if="selectedOwn" class="cw-owner-editor">
            <div class="cw-wb-card selected">
              <div class="cw-wb-cover selected-cover">
                <img
                  v-if="selectedOwn.cover_url"
                  :src="selectedOwn.cover_url"
                  :alt="`${selectedOwn.name}封面`"
                  referrerpolicy="no-referrer"
                />
                <span v-else aria-hidden="true">尚无封面</span>
              </div>
              <div class="cw-wb-card-head">
                <span class="cw-category">{{ selectedOwn.category }}</span
                ><span class="cw-version">v{{ selectedOwn.version }}</span>
              </div>
              <h2>{{ selectedOwn.name }}</h2>
              <span class="cw-wb-dlc-key">{{ selectedOwn.dlc_key }}</span>
              <RelationBadges :pack="selectedOwn" />
              <label><span>简介</span><textarea v-model="editDescription" maxlength="500"></textarea></label>
              <form class="cw-cover-upload" @submit.prevent="uploadSelectedCover">
                <label
                  ><span>上传或替换封面</span
                  ><input
                    ref="editCoverInput"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    @change="selectEditCover"
                /></label>
                <button class="cw-btn" type="submit" :disabled="busy || !editCoverFile">处理并上传封面</button>
              </form>
              <div class="cw-inline-actions">
                <button class="cw-btn" type="button" :disabled="busy" @click="saveDescription">保存简介</button>
                <button
                  v-if="selectedOwn.status !== 'published'"
                  class="cw-btn cw-btn-primary"
                  type="button"
                  :disabled="busy"
                  @click="publishSelected"
                >
                  发布
                </button>
                <button v-else class="cw-btn" type="button" :disabled="busy" @click="unpublishSelected">下架</button>
                <button class="cw-btn cw-btn-danger" type="button" :disabled="busy" @click="deleteSelected">
                  删除
                </button>
              </div>
            </div>
            <form class="cw-form-card compact" @submit.prevent="replaceContent">
              <div class="cw-wb-form-title">
                <div>
                  <h3>更新条目文件</h3>
                  <p>发布状态下更新会提升版本号。</p>
                </div>
              </div>
              <label class="wide"
                ><span>新的世界书 JSON</span
                ><input
                  ref="replaceFileInput"
                  type="file"
                  accept=".json,application/json"
                  required
                  @change="selectReplaceFile"
              /></label>
              <div v-if="replaceValidation" class="cw-wb-validation wide">
                <strong>{{ replaceValidation.dlcKey }}</strong
                ><span>{{ replaceValidation.entryCount }} 个条目</span>
              </div>
              <div class="cw-form-actions wide">
                <button class="cw-btn" :disabled="busy || !replaceFile || !replaceValidation">校验并更新</button>
              </div>
            </form>
          </div>
          <div v-else class="cw-empty">选择左侧世界书包进行管理。</div>
        </div>
      </template>
    </template>

    <div v-if="worldbookDetail" class="cw-suboverlay" @mousedown.self="closeWorldbookDetail">
      <section
        class="cw-wb-detail"
        role="dialog"
        aria-modal="true"
        :aria-label="`${worldbookDetail.pack.name}世界书包详情`"
      >
        <button class="cw-close" type="button" aria-label="关闭详情" @click="closeWorldbookDetail">×</button>

        <header class="cw-wb-detail-hero">
          <div class="cw-wb-cover cw-wb-detail-cover">
            <img
              v-if="worldbookDetail.pack.cover_url"
              :src="worldbookDetail.pack.cover_url"
              :alt="`${worldbookDetail.pack.name}封面`"
              referrerpolicy="no-referrer"
            />
            <span v-else aria-hidden="true">卷</span>
          </div>
          <div class="cw-wb-detail-heading">
            <div class="cw-wb-card-head">
              <span class="cw-category">{{ worldbookDetail.pack.category }}</span>
              <span class="cw-version">v{{ worldbookDetail.pack.version }}</span>
            </div>
            <h2>{{ worldbookDetail.pack.name }}</h2>
            <span class="cw-wb-dlc-key">{{ worldbookDetail.pack.dlc_key }}</span>
            <div class="cw-wb-meta">
              <span>作者：{{ worldbookDetail.pack.owner_name || '未知作者' }}</span>
              <span>{{ worldbookDetail.pack.entry_count }} 条 · {{ formatBytes(worldbookDetail.pack.byte_size) }}</span>
              <span>上传于 {{ formatDate(worldbookDetail.pack.published_at) }}</span>
            </div>
            <RelationBadges :pack="worldbookDetail.pack" />
          </div>
        </header>

        <div class="cw-wb-detail-description">
          <span>世界书包简介</span>
          <p>{{ worldbookDetail.pack.description || '作者没有填写简介。' }}</p>
        </div>

        <div class="cw-wb-detail-actions">
          <button
            class="cw-btn cw-btn-primary"
            type="button"
            :disabled="busy || isInstalled(worldbookDetail.pack.id)"
            @click="install(worldbookDetail.pack)"
          >
            {{ isInstalled(worldbookDetail.pack.id) ? '已安装' : '安装并启用' }}
          </button>
          <span>下方为原始条目的安全文本预览，不会执行其中的 EJS 或 HTML。</span>
        </div>

        <section class="cw-wb-entry-browser" aria-label="世界书条目目录">
          <div class="cw-wb-entry-browser-head">
            <div>
              <span>条目目录</span>
              <h3>共 {{ worldbookDetail.entries.length }} 个条目</h3>
            </div>
            <button class="cw-btn" type="button" @click="toggleAllEntries">
              {{ allEntriesExpanded ? '全部收起' : '全部展开' }}
            </button>
          </div>

          <div class="cw-wb-entry-list">
            <article
              v-for="(entry, index) in worldbookDetail.entries"
              :key="`${entry.name || 'entry'}-${index}`"
              class="cw-wb-entry"
              :class="{ expanded: expandedEntryIndexes.has(index) }"
            >
              <button
                class="cw-wb-entry-summary"
                type="button"
                :aria-expanded="expandedEntryIndexes.has(index)"
                @click="toggleEntry(index)"
              >
                <span class="cw-wb-entry-index">{{ String(index + 1).padStart(2, '0') }}</span>
                <span class="cw-wb-entry-title">
                  <strong>{{ entry.name || `未命名条目 ${index + 1}` }}</strong>
                  <small>{{ entryKeywordSummary(entry) }}</small>
                </span>
                <span class="cw-wb-entry-badges">
                  <i :class="entry.enabled === false ? 'disabled' : 'enabled'">
                    {{ entry.enabled === false ? '已停用' : '已启用' }}
                  </i>
                  <i>{{ strategyLabel(entry.strategy?.type) }}</i>
                </span>
                <span class="cw-wb-entry-chevron" aria-hidden="true">⌄</span>
              </button>

              <div v-if="expandedEntryIndexes.has(index)" class="cw-wb-entry-detail">
                <div class="cw-wb-entry-minor-meta">
                  <span>位置：{{ positionLabel(entry.position?.type) }}</span>
                  <span>顺序：{{ entry.position?.order ?? 0 }}</span>
                  <span>概率：{{ entry.probability ?? 100 }}%</span>
                  <span>深度：{{ scanDepthLabel(entry.strategy?.scan_depth) }}</span>
                </div>
                <div class="cw-wb-entry-keys">
                  <div>
                    <span>主要关键词</span>
                    <p>{{ formatKeys(entry.strategy?.keys) }}</p>
                  </div>
                  <div v-if="entry.strategy?.keys_secondary?.keys?.length">
                    <span>次要关键词</span>
                    <p>{{ formatKeys(entry.strategy?.keys_secondary?.keys) }}</p>
                  </div>
                </div>
                <div class="cw-wb-entry-content">
                  <span>条目内容</span>
                  <pre>{{ entry.content || '（空内容）' }}</pre>
                </div>
              </div>
            </article>
          </div>
        </section>
      </section>
    </div>

    <div v-if="showGuide" class="cw-suboverlay" @mousedown.self="showGuide = false">
      <section class="cw-wb-guide" role="dialog" aria-modal="true" aria-label="DLC 世界书条目命名规范">
        <button class="cw-close" type="button" @click="showGuide = false">×</button>
        <h2>DLC 世界书条目命名规范</h2>
        <p>每个上传文件只能包含一个 DLC 包，且每个条目的名称都必须以相同的前三段开头：</p>
        <pre>[DLC][角色|事件|扩展][名称][!互斥][&gt;替换][&lt;前置]描述(作者-信息)</pre>
        <dl>
          <dt><code>[DLC][类别][名称]</code></dt>
          <dd>必填。同一个文件中三段必须完全一致，用于识别、分类和分组。</dd>
          <dt><code>[!目标]</code></dt>
          <dd>互斥。启用当前包时自动停用目标世界书包；关闭当前包不会自动恢复。</dd>
          <dt><code>[&gt;目标]</code></dt>
          <dd>替换。启用时暂时关闭已绑定世界书中名称含 `[目标]` 的条目，停用或卸载后恢复原状态。</dd>
          <dt><code>[&lt;目标]</code></dt>
          <dd>前置。如果目标包没有安装或启用，会显示缺失提示，但不会阻止启用。</dd>
        </dl>
        <h3>示例</h3>
        <pre>
[DLC][角色][薇薇拉]薇薇拉-核心设定(Awene-原创角色)
[DLC][事件][薇薇拉之歌][&lt;薇薇拉]入口(Awene)
[DLC][扩展][增强战斗][!简化战斗][&gt;基础战斗]规则(Awene)</pre>
        <div class="cw-wb-warning">
          世界书可能包含会影响提示词或由其他插件执行的 EJS 内容。只安装你信任的作者发布的条目。
        </div>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, ref, watch, type PropType } from 'vue';
import { prepareUploadImage } from './image';
import type { AuthRecord, DlcRelations, InstalledWorldbookPack, WorldbookPackSummary } from './types';
import { parseRawWorldbook, type ParsedWorldbookEntry } from './worldbook-parser';
import { validateWorldbookFile, type ParsedWorldbookUpload } from './worldbook-prefix';
import { worldbookWorkshopService } from './worldbook-service';

const props = defineProps<{ mode: 'browse' | 'installed' | 'mine'; auth?: AuthRecord }>();
defineEmits<{ login: [] }>();

const RelationBadges = defineComponent({
  props: { pack: { type: Object as PropType<Pick<WorldbookPackSummary, 'relations'>>, required: true } },
  setup(componentProps) {
    return () =>
      h('div', { class: 'cw-wb-relations' }, [
        ...componentProps.pack.relations.exclusions.map(value => h('span', { class: 'exclude' }, `互斥 ${value}`)),
        ...componentProps.pack.relations.replacements.map(value => h('span', { class: 'replace' }, `替换 ${value}`)),
        ...componentProps.pack.relations.prerequisites.map(value => h('span', { class: 'require' }, `前置 ${value}`)),
      ]);
  },
});

const busy = ref(false);
const notice = ref('');
const noticeType = ref<'success' | 'error'>('success');
const query = ref('');
const category = ref('');
const publicPacks = ref<WorldbookPackSummary[]>([]);
const installed = ref<InstalledWorldbookPack[]>([]);
const ownPacks = ref<WorldbookPackSummary[]>([]);
const selectedOwn = ref<WorldbookPackSummary>();
const nextOffset = ref<number | null>(0);
const showGuide = ref(false);
const detailLoadingId = ref('');
const worldbookDetail = ref<{ pack: WorldbookPackSummary; entries: ParsedWorldbookEntry[] }>();
const expandedEntryIndexes = ref<Set<number>>(new Set());
const createFile = ref<File>();
const createValidation = ref<ParsedWorldbookUpload>();
const createFileInput = ref<HTMLInputElement>();
const createCoverFile = ref<File>();
const createCoverInput = ref<HTMLInputElement>();
const newDescription = ref('');
const replaceFile = ref<File>();
const replaceValidation = ref<ParsedWorldbookUpload>();
const replaceFileInput = ref<HTMLInputElement>();
const editCoverFile = ref<File>();
const editCoverInput = ref<HTMLInputElement>();
const editDescription = ref('');
const allEntriesExpanded = computed(
  () =>
    Boolean(worldbookDetail.value?.entries.length) &&
    expandedEntryIndexes.value.size === worldbookDetail.value?.entries.length,
);

function tell(message: string, type: 'success' | 'error' = 'success'): void {
  notice.value = message;
  noticeType.value = type;
  window.setTimeout(() => {
    if (notice.value === message) notice.value = '';
  }, 7000);
}
function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
function formatBytes(bytes: number): string {
  return bytes < 1024
    ? `${bytes} B`
    : bytes < 1024 * 1024
      ? `${(bytes / 1024).toFixed(1)} KB`
      : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
function formatDate(timestamp?: number | null): string {
  return timestamp
    ? new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' }).format(
        new Date(timestamp * 1000),
      )
    : '尚未发布';
}
function isInstalled(id: string): boolean {
  return installed.value.some(item => item.id === id);
}
function validationAsPack(value: ParsedWorldbookUpload): Pick<WorldbookPackSummary, 'relations'> {
  return { relations: value.relations };
}
function formatKeys(keys?: ReadonlyArray<string | RegExp>): string {
  return keys?.length ? keys.map(String).join('、') : '无';
}
function entryKeywordSummary(entry: ParsedWorldbookEntry): string {
  if (entry.strategy?.type === 'constant') return '常驻条目，无需关键词触发';
  const keys = formatKeys(entry.strategy?.keys);
  return keys === '无' ? '没有设置主要关键词' : `关键词：${keys}`;
}
function strategyLabel(type?: string): string {
  return (
    ({ constant: '常驻', selective: '关键词', vectorized: '向量匹配' } as Record<string, string>)[type ?? ''] ??
    '关键词'
  );
}
function positionLabel(type?: string): string {
  return (
    (
      {
        before_character_definition: '角色定义之前',
        after_character_definition: '角色定义之后',
        before_example_messages: '示例消息之前',
        after_example_messages: '示例消息之后',
        before_author_note: '作者注释之前',
        after_author_note: '作者注释之后',
        at_depth: '指定深度',
        outlet: '扩展插槽',
      } as Record<string, string>
    )[type ?? ''] ?? '未指定'
  );
}
function scanDepthLabel(depth?: number | 'same_as_global'): string {
  return depth === 'same_as_global' || depth === undefined ? '跟随全局' : String(depth);
}
function toggleEntry(index: number): void {
  const next = new Set(expandedEntryIndexes.value);
  if (next.has(index)) next.delete(index);
  else next.add(index);
  expandedEntryIndexes.value = next;
}
function toggleAllEntries(): void {
  if (!worldbookDetail.value) return;
  expandedEntryIndexes.value = allEntriesExpanded.value
    ? new Set()
    : new Set(worldbookDetail.value.entries.map((_, index) => index));
}
function closeWorldbookDetail(): void {
  worldbookDetail.value = undefined;
  expandedEntryIndexes.value = new Set();
}
async function openWorldbookDetail(pack: WorldbookPackSummary): Promise<void> {
  if (detailLoadingId.value) return;
  detailLoadingId.value = pack.id;
  try {
    const [detailPack, raw] = await Promise.all([
      worldbookWorkshopService.api.getWorldbookPack(pack.id),
      worldbookWorkshopService.api.getWorldbookContent(pack.id),
    ]);
    worldbookDetail.value = { pack: detailPack, entries: parseRawWorldbook(raw) };
    expandedEntryIndexes.value = new Set();
  } catch (error) {
    tell(`读取世界书详情失败：${errorText(error)}`, 'error');
  } finally {
    detailLoadingId.value = '';
  }
}

async function loadInstalled(): Promise<void> {
  installed.value = await worldbookWorkshopService.listInstalled();
}
async function loadPublic(reset: boolean): Promise<void> {
  busy.value = true;
  try {
    const offset = reset ? 0 : (nextOffset.value ?? 0);
    const result = await worldbookWorkshopService.publicPacks(query.value, category.value, offset);
    publicPacks.value = reset ? result.items : [...publicPacks.value, ...result.items];
    nextOffset.value = result.next_offset;
    await loadInstalled();
  } catch (error) {
    tell(errorText(error), 'error');
  } finally {
    busy.value = false;
  }
}
async function install(pack: WorldbookPackSummary): Promise<void> {
  busy.value = true;
  try {
    const result = await worldbookWorkshopService.install(pack.id);
    await loadInstalled();
    tell(
      result.missingPrerequisites.length
        ? `已安装并启用；缺失前置：${result.missingPrerequisites.join('、')}`
        : `「${pack.name}」已安装并启用`,
      result.missingPrerequisites.length ? 'error' : 'success',
    );
  } catch (error) {
    tell(errorText(error), 'error');
  } finally {
    busy.value = false;
  }
}
async function toggleInstalled(item: InstalledWorldbookPack): Promise<void> {
  busy.value = true;
  try {
    const missing = await worldbookWorkshopService.setEnabled(item.id, !item.enabled);
    await loadInstalled();
    tell(
      missing.length ? `已启用，但缺失前置：${missing.join('、')}` : item.enabled ? '世界书包已停用' : '世界书包已启用',
      missing.length ? 'error' : 'success',
    );
  } catch (error) {
    tell(errorText(error), 'error');
  } finally {
    busy.value = false;
  }
}
async function uninstall(item: InstalledWorldbookPack): Promise<void> {
  if (!window.parent.confirm(`确定卸载“${item.pack.name}”并从创意工坊世界书中删除其条目吗？`)) return;
  busy.value = true;
  try {
    await worldbookWorkshopService.uninstall(item.id);
    await loadInstalled();
    tell('世界书包已卸载');
  } catch (error) {
    tell(errorText(error), 'error');
  } finally {
    busy.value = false;
  }
}
async function checkOneUpdate(item: InstalledWorldbookPack): Promise<void> {
  busy.value = true;
  try {
    const status = await worldbookWorkshopService.checkUpdate(item.id);
    await loadInstalled();
    tell(
      status === 'updated' ? '世界书包已更新' : status === 'hidden' ? '作者已下架，本地版本仍保留' : '当前已是最新版',
      status === 'hidden' ? 'error' : 'success',
    );
  } catch (error) {
    await loadInstalled();
    tell(errorText(error), 'error');
  } finally {
    busy.value = false;
  }
}
async function checkAllUpdates(): Promise<void> {
  busy.value = true;
  try {
    const result = await worldbookWorkshopService.checkAllUpdates();
    await loadInstalled();
    tell(
      `更新完成：更新 ${result.updated}，下架 ${result.hidden}，失败 ${result.failed}`,
      result.failed ? 'error' : 'success',
    );
  } catch (error) {
    tell(errorText(error), 'error');
  } finally {
    busy.value = false;
  }
}
async function validateSelection(event: Event, target: 'create' | 'replace'): Promise<void> {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (target === 'create') {
    createFile.value = file;
    createValidation.value = undefined;
  } else {
    replaceFile.value = file;
    replaceValidation.value = undefined;
  }
  if (!file) return;
  try {
    const result = await validateWorldbookFile(file);
    if (target === 'create') createValidation.value = result;
    else replaceValidation.value = result;
    tell(`校验通过：${result.dlcKey}，共 ${result.entryCount} 个条目`);
  } catch (error) {
    if (target === 'create') createFile.value = undefined;
    else replaceFile.value = undefined;
    (event.target as HTMLInputElement).value = '';
    tell(`校验失败：${errorText(error)}`, 'error');
  }
}
const selectCreateFile = (event: Event) => validateSelection(event, 'create');
const selectReplaceFile = (event: Event) => validateSelection(event, 'replace');
function selectCover(event: Event, target: 'create' | 'edit'): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file && !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    input.value = '';
    tell('封面只支持 JPEG、PNG 或 WebP，不支持 GIF', 'error');
    return;
  }
  if (target === 'create') createCoverFile.value = file;
  else editCoverFile.value = file;
}
const selectCreateCover = (event: Event) => selectCover(event, 'create');
const selectEditCover = (event: Event) => selectCover(event, 'edit');

async function prepareCover(file: File): Promise<File> {
  const prepared = await prepareUploadImage(file);
  return new File([prepared.blob], prepared.filename, { type: prepared.blob.type });
}
async function loadOwn(): Promise<void> {
  if (!props.auth) return;
  busy.value = true;
  try {
    ownPacks.value = (await worldbookWorkshopService.api.listOwnWorldbooks()).items;
    if (selectedOwn.value) selectOwn(ownPacks.value.find(item => item.id === selectedOwn.value?.id));
  } catch (error) {
    tell(errorText(error), 'error');
  } finally {
    busy.value = false;
  }
}
function selectOwn(pack?: WorldbookPackSummary): void {
  selectedOwn.value = pack;
  editDescription.value = pack?.description ?? '';
  replaceFile.value = undefined;
  replaceValidation.value = undefined;
  editCoverFile.value = undefined;
  if (replaceFileInput.value) replaceFileInput.value.value = '';
  if (editCoverInput.value) editCoverInput.value.value = '';
}
async function createPack(): Promise<void> {
  if (!createFile.value || !createValidation.value) return;
  busy.value = true;
  try {
    const cover = createCoverFile.value ? await prepareCover(createCoverFile.value) : undefined;
    const result = await worldbookWorkshopService.api.createWorldbook(createFile.value, newDescription.value, cover);
    createFile.value = undefined;
    createValidation.value = undefined;
    createCoverFile.value = undefined;
    newDescription.value = '';
    if (createFileInput.value) createFileInput.value.value = '';
    if (createCoverInput.value) createCoverInput.value.value = '';
    await loadOwn();
    selectOwn(ownPacks.value.find(item => item.id === result.pack.id) ?? result.pack);
    tell('世界书包已上传为草稿');
  } catch (error) {
    tell(errorText(error), 'error');
  } finally {
    busy.value = false;
  }
}
async function uploadSelectedCover(): Promise<void> {
  if (!selectedOwn.value || !editCoverFile.value) return;
  busy.value = true;
  try {
    const cover = await prepareCover(editCoverFile.value);
    const result = await worldbookWorkshopService.api.uploadWorldbookCover(selectedOwn.value.id, cover);
    editCoverFile.value = undefined;
    if (editCoverInput.value) editCoverInput.value.value = '';
    await loadOwn();
    selectOwn(ownPacks.value.find(item => item.id === result.pack.id) ?? result.pack);
    tell('世界书包封面已更新');
  } catch (error) {
    tell(errorText(error), 'error');
  } finally {
    busy.value = false;
  }
}
async function saveDescription(): Promise<void> {
  if (!selectedOwn.value) return;
  busy.value = true;
  try {
    await worldbookWorkshopService.api.updateWorldbook(selectedOwn.value.id, editDescription.value);
    await loadOwn();
    tell('简介已保存');
  } catch (error) {
    tell(errorText(error), 'error');
  } finally {
    busy.value = false;
  }
}
async function replaceContent(): Promise<void> {
  if (!selectedOwn.value || !replaceFile.value || !replaceValidation.value) return;
  busy.value = true;
  try {
    await worldbookWorkshopService.api.replaceWorldbookContent(
      selectedOwn.value.id,
      replaceFile.value,
      editDescription.value,
    );
    await loadOwn();
    tell('世界书条目已更新');
  } catch (error) {
    tell(errorText(error), 'error');
  } finally {
    busy.value = false;
  }
}
async function publishSelected(): Promise<void> {
  if (!selectedOwn.value) return;
  busy.value = true;
  try {
    await worldbookWorkshopService.api.publishWorldbook(selectedOwn.value.id);
    await loadOwn();
    tell('世界书包已发布');
  } catch (error) {
    tell(errorText(error), 'error');
  } finally {
    busy.value = false;
  }
}
async function unpublishSelected(): Promise<void> {
  if (!selectedOwn.value) return;
  busy.value = true;
  try {
    await worldbookWorkshopService.api.unpublishWorldbook(selectedOwn.value.id);
    await loadOwn();
    tell('世界书包已下架');
  } catch (error) {
    tell(errorText(error), 'error');
  } finally {
    busy.value = false;
  }
}
async function deleteSelected(): Promise<void> {
  if (!selectedOwn.value || !window.parent.confirm(`确定删除“${selectedOwn.value.name}”吗？`)) return;
  busy.value = true;
  try {
    await worldbookWorkshopService.api.deleteWorldbook(selectedOwn.value.id);
    selectedOwn.value = undefined;
    await loadOwn();
    tell('世界书包已删除');
  } catch (error) {
    tell(errorText(error), 'error');
  } finally {
    busy.value = false;
  }
}

const mode = computed(() => props.mode);
async function loadMode(): Promise<void> {
  if (props.mode === 'browse') await loadPublic(true);
  if (props.mode === 'installed') await loadInstalled();
  if (props.mode === 'mine') await loadOwn();
}
watch(
  () => props.mode,
  () => void loadMode(),
);
watch(
  () => props.auth,
  () => {
    if (props.mode === 'mine') void loadOwn();
  },
);
onMounted(() => void loadMode());
</script>

<style scoped lang="scss">
.cw-wb-notice {
  position: sticky;
  top: 0;
  z-index: 7;
  margin-bottom: 10px;
  padding: 8px 11px;
  border-radius: 8px;
  color: #37624d;
  background: #e6f0e8;
}
.cw-wb-notice.error,
.cw-wb-error {
  color: #9d373a;
  background: #f7dfda;
}
.cw-wb-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
}
.cw-wb-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px;
  border: 1px solid var(--cw-line);
  border-radius: 11px;
  background: color-mix(in srgb, var(--cw-paper-2) 45%, transparent);
}
.cw-wb-public-card {
  cursor: pointer;
  outline: none;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;
}
.cw-wb-public-card:hover,
.cw-wb-public-card:focus-visible {
  border-color: color-mix(in srgb, var(--cw-red) 45%, var(--cw-line));
  box-shadow: 0 8px 24px rgba(79, 49, 37, 0.12);
  transform: translateY(-2px);
}
.cw-wb-public-card.loading {
  cursor: wait;
  opacity: 0.78;
}
.cw-wb-cover {
  position: relative;
  display: grid;
  width: 100%;
  aspect-ratio: 16 / 9;
  place-items: center;
  overflow: hidden;
  border: 1px solid var(--cw-line);
  border-radius: 8px;
  color: var(--cw-muted);
  background: color-mix(in srgb, var(--cw-paper-2) 72%, transparent);
}
.cw-wb-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.cw-wb-cover > span {
  font-size: 20px;
  letter-spacing: 0.15em;
}
.cw-wb-cover-labels {
  position: absolute;
  inset: 7px 7px auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  pointer-events: none;
}
.cw-wb-cover-labels > span {
  padding: 2px 7px;
  border: 1px solid rgba(255, 255, 255, 0.58);
  border-radius: 99px;
  color: #fff8ec;
  background: rgba(39, 31, 26, 0.68);
  box-shadow: 0 2px 8px #0003;
  backdrop-filter: blur(5px);
}
.cw-wb-cover.selected-cover {
  max-height: 300px;
}
.cw-wb-card.selected {
  margin-bottom: 10px;
}
.cw-wb-card h2,
.cw-wb-card h3,
.cw-wb-installed h3,
.cw-wb-form-title h3 {
  margin: 0;
  color: var(--cw-ink);
}
.cw-wb-card p,
.cw-wb-meta,
.cw-wb-installed p,
.cw-wb-form-title p {
  margin: 0;
  color: var(--cw-muted);
  font-size: 13px;
}
.cw-wb-card-description {
  display: -webkit-box;
  min-height: 2.9em;
  overflow: hidden;
  line-height: 1.45;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.cw-wb-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: auto;
  padding-top: 3px;
}
.cw-wb-card-footer > span {
  color: var(--cw-muted);
  font-size: 10px;
}
.cw-wb-card-footer .cw-btn {
  min-height: 30px;
  padding: 5px 10px;
  font-size: 12px;
}
.cw-wb-dlc-key {
  display: block;
  overflow-wrap: anywhere;
  padding: 0;
  border: 0;
  border-radius: 0;
  color: var(--cw-red);
  background: transparent;
  box-shadow: none;
  font-family: inherit;
  font-size: 12px;
  line-height: 1.5;
  white-space: normal;
}
.cw-wb-card-head,
.cw-wb-form-title {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}
.cw-wb-title-line {
  display: flex;
  align-items: center;
  gap: 6px;
}
.cw-wb-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 5px 12px;
}
.cw-wb-relations {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}
.cw-wb-relations span {
  padding: 2px 7px;
  border: 1px solid var(--cw-line);
  border-radius: 99px;
  font-size: 11px;
}
.cw-wb-relations .exclude {
  color: #a35a31;
}
.cw-wb-relations .replace {
  color: #3d7180;
}
.cw-wb-relations .require {
  color: var(--cw-green);
}
.cw-wb-installed {
  grid-template-columns: minmax(0, 1fr) auto auto;
}
.cw-wb-warning,
.cw-wb-error {
  margin-top: 7px;
  padding: 7px 9px;
  border-radius: 7px;
  font-size: 12px;
}
.cw-wb-warning {
  color: #91612b;
  background: #f5e8c9;
}
.cw-info-button {
  flex: none;
  width: 22px;
  height: 22px;
  border: 1px solid var(--cw-red);
  border-radius: 50%;
  color: white;
  background: var(--cw-red);
  cursor: pointer;
  font: 700 13px/1 serif;
}
.cw-info-button.small {
  width: 20px;
  height: 20px;
  font-size: 12px;
}
.cw-wb-upload {
  margin-bottom: 12px;
}
.cw-wb-validation {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 8px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--cw-green) 14%, transparent);
}
.cw-cover-file {
  margin: -4px 0 0;
  color: var(--cw-muted);
  font-size: 12px;
}
.cw-cover-upload {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 8px;
}
.cw-cover-upload label {
  min-width: 0;
}
.cw-wb-owner-layout {
  margin-top: 12px;
}
.cw-wb-detail {
  position: relative;
  width: min(960px, calc(100% - 24px));
  max-height: min(900px, calc(100% - 24px));
  overflow: auto;
  padding: 16px;
  border: 1px solid var(--cw-line);
  border-radius: 15px;
  color: var(--cw-ink);
  background: var(--cw-paper);
  box-shadow: 0 22px 80px #0008;
  scrollbar-width: thin;
}
.cw-wb-detail > .cw-close {
  position: absolute;
  z-index: 2;
  top: 10px;
  right: 10px;
}
.cw-wb-detail-hero {
  display: grid;
  grid-template-columns: 160px minmax(0, 1fr);
  gap: 14px;
  padding-right: 36px;
}
.cw-wb-detail-cover {
  aspect-ratio: 4 / 3;
}
.cw-wb-detail-heading {
  display: flex;
  min-width: 0;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
}
.cw-wb-detail-heading h2 {
  margin: 0;
  font-size: clamp(22px, 3.4vw, 30px);
  font-weight: 600;
  letter-spacing: 0.03em;
}
.cw-wb-detail-description {
  max-height: min(26vh, 240px);
  overflow: auto;
  margin: 12px 0 10px;
  padding: 9px 12px;
  border: 1px solid var(--cw-line);
  border-left: 3px solid var(--cw-red);
  border-radius: 10px;
  background: color-mix(in srgb, var(--cw-paper-2) 62%, transparent);
  scrollbar-width: thin;
}
.cw-wb-detail-description > span,
.cw-wb-entry-browser-head > div > span,
.cw-wb-entry-content > span,
.cw-wb-entry-keys span {
  display: block;
  margin-bottom: 5px;
  color: var(--cw-red);
  font-size: 11px;
  letter-spacing: 0.14em;
}
.cw-wb-detail-description p {
  margin: 0;
  font-size: 13px;
  line-height: 1.65;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}
.cw-wb-detail-actions {
  display: flex;
  align-items: center;
  gap: 9px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}
.cw-wb-detail-actions > span {
  color: var(--cw-muted);
  font-size: 12px;
}
.cw-wb-entry-browser {
  padding-top: 10px;
  border-top: 1px solid var(--cw-line);
}
.cw-wb-entry-browser-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 7px;
}
.cw-wb-entry-browser-head h3 {
  margin: 0;
  font-size: 16px;
}
.cw-wb-entry-list {
  display: grid;
  gap: 8px;
}
.cw-wb-entry {
  overflow: hidden;
  border: 1px solid var(--cw-line);
  border-radius: 10px;
  background: color-mix(in srgb, var(--cw-paper-2) 42%, transparent);
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}
.cw-wb-entry.expanded {
  border-color: color-mix(in srgb, var(--cw-red) 45%, var(--cw-line));
  box-shadow: 0 7px 22px rgba(79, 49, 37, 0.08);
}
.cw-wb-entry-summary {
  display: grid;
  width: 100%;
  grid-template-columns: 34px minmax(0, 1fr) auto 20px;
  align-items: center;
  gap: 10px;
  padding: 9px 11px;
  border: 0;
  color: var(--cw-ink);
  background: transparent;
  text-align: left;
  cursor: pointer;
}
.cw-wb-entry-summary:hover {
  background: color-mix(in srgb, var(--cw-red) 5%, transparent);
}
.cw-wb-entry-index {
  color: var(--cw-red);
  font:
    500 15px/1 Georgia,
    serif;
}
.cw-wb-entry-title {
  display: grid;
  min-width: 0;
  gap: 3px;
}
.cw-wb-entry-title strong {
  overflow: hidden;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cw-wb-entry-title small {
  overflow: hidden;
  color: var(--cw-muted);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cw-wb-entry-badges {
  display: flex;
  align-items: center;
  gap: 5px;
}
.cw-wb-entry-badges i {
  padding: 2px 7px;
  border: 1px solid var(--cw-line);
  border-radius: 99px;
  color: var(--cw-muted);
  font-size: 10px;
  font-style: normal;
  white-space: nowrap;
}
.cw-wb-entry-badges i.enabled {
  color: var(--cw-green);
}
.cw-wb-entry-badges i.disabled {
  color: var(--cw-red);
}
.cw-wb-entry-chevron {
  color: var(--cw-muted);
  font-size: 20px;
  line-height: 1;
  transition: transform 0.18s ease;
}
.cw-wb-entry.expanded .cw-wb-entry-chevron {
  transform: rotate(180deg);
}
.cw-wb-entry-detail {
  padding: 0 11px 11px 45px;
  border-top: 1px dashed var(--cw-line);
}
.cw-wb-entry-minor-meta {
  display: flex;
  align-items: center;
  gap: 3px 12px;
  flex-wrap: wrap;
  margin: 7px 0;
  color: var(--cw-muted);
  font-size: 10px;
}
.cw-wb-entry-keys {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
  margin-bottom: 7px;
}
.cw-wb-entry-keys > div {
  min-width: 0;
  padding: 7px 9px;
  border: 1px solid var(--cw-line);
  border-radius: 7px;
  background: color-mix(in srgb, var(--cw-paper) 60%, transparent);
}
.cw-wb-entry-keys > div:only-child {
  grid-column: 1 / -1;
}
.cw-wb-entry-keys p {
  margin: 0;
  color: var(--cw-muted);
  font-size: 12px;
  overflow-wrap: anywhere;
}
.cw-wb-entry-content pre {
  max-height: min(48vh, 480px);
  overflow: auto;
  margin: 0;
  padding: 10px;
  border: 1px solid var(--cw-line);
  border-radius: 8px;
  color: var(--cw-ink);
  background: var(--cw-paper-2);
  font:
    12px/1.6 ui-monospace,
    SFMono-Regular,
    Consolas,
    monospace;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
  word-break: break-word;
  scrollbar-width: thin;
}
.cw-wb-guide {
  position: relative;
  width: min(760px, calc(100% - 24px));
  max-height: min(760px, calc(100% - 24px));
  overflow: auto;
  padding: 20px;
  border: 1px solid var(--cw-line);
  border-radius: 14px;
  color: var(--cw-ink);
  background: var(--cw-paper);
  box-shadow: 0 20px 70px #0008;
}
.cw-wb-guide .cw-close {
  position: absolute;
  top: 8px;
  right: 8px;
}
.cw-wb-guide pre {
  overflow-x: auto;
  padding: 10px;
  border-radius: 8px;
  white-space: pre-wrap;
  background: var(--cw-paper-2);
}
.cw-wb-guide dt {
  margin-top: 9px;
  font-weight: 700;
}
.cw-wb-guide dd {
  margin: 3px 0 0;
  color: var(--cw-muted);
}
@media (max-width: 700px) {
  .cw-wb-detail-hero,
  .cw-wb-entry-keys {
    grid-template-columns: 1fr;
  }
  .cw-wb-detail {
    width: calc(100% - 12px);
    max-height: calc(100% - 12px);
    padding: 15px;
  }
  .cw-wb-detail-hero {
    padding-right: 28px;
  }
  .cw-wb-detail-cover {
    max-height: 210px;
  }
  .cw-wb-entry-summary {
    grid-template-columns: 32px minmax(0, 1fr) 20px;
  }
  .cw-wb-entry-badges {
    display: none;
  }
  .cw-wb-entry-detail {
    padding-left: 14px;
  }
  .cw-wb-installed {
    grid-template-columns: 1fr;
  }
  .cw-wb-owner-layout {
    grid-template-columns: 1fr;
  }
  .cw-cover-upload {
    grid-template-columns: 1fr;
  }
}
</style>
