<template>
  <section class="cw-page cw-wb-page">
    <div v-if="notice" class="cw-wb-notice" :class="noticeType">{{ notice }}</div>

    <template v-if="mode === 'browse'">
      <div class="cw-toolbar">
        <label class="cw-search"><span>搜索</span><input v-model="query" type="search" placeholder="世界书、作者或简介" @keyup.enter="loadPublic(true)" /></label>
        <label><span>类别</span><select v-model="category" @change="loadPublic(true)"><option value="">全部</option><option>角色</option><option>事件</option><option>扩展</option></select></label>
        <button class="cw-btn" type="button" :disabled="busy" @click="loadPublic(true)">刷新</button>
      </div>
      <div v-if="busy && !publicPacks.length" class="cw-empty">正在读取世界书目录……</div>
      <div v-else-if="!publicPacks.length" class="cw-empty">没有找到符合条件的世界书包。</div>
      <div v-else class="cw-wb-grid">
        <article v-for="publicBook in publicPacks" :key="publicBook.id" class="cw-wb-card">
          <div class="cw-wb-card-head"><span class="cw-category">{{ publicBook.category }}</span><span class="cw-version">v{{ publicBook.version }}</span></div>
          <h2>{{ publicBook.name }}</h2>
          <code>{{ publicBook.dlc_key }}</code>
          <p>{{ publicBook.description || '作者没有填写简介。' }}</p>
          <div class="cw-wb-meta"><span>{{ publicBook.owner_name || '未知作者' }}</span><span>{{ publicBook.entry_count }} 条 · {{ formatBytes(publicBook.byte_size) }}</span><span>上传于 {{ formatDate(publicBook.published_at) }}</span></div>
          <RelationBadges :pack="publicBook" />
          <button class="cw-btn cw-btn-primary" type="button" :disabled="busy || isInstalled(publicBook.id)" @click="install(publicBook)">{{ isInstalled(publicBook.id) ? '已安装' : '安装并启用' }}</button>
        </article>
      </div>
      <button v-if="nextOffset !== null" class="cw-btn cw-more" type="button" :disabled="busy" @click="loadPublic(false)">加载更多</button>
    </template>

    <template v-else-if="mode === 'installed'">
      <div class="cw-section-head">
        <div><h2>已安装世界书</h2><p>每个包作为独立附加世界书安装；缺失前置只会警告，不阻止启用。</p></div>
        <button class="cw-btn" type="button" :disabled="busy" @click="checkAllUpdates">检查全部更新</button>
      </div>
      <div v-if="!installed.length" class="cw-empty">尚未安装世界书包。请先到“浏览世界书”安装。</div>
      <div v-else class="cw-list">
        <article v-for="item in installed" :key="item.id" class="cw-installed cw-wb-installed">
          <div class="cw-installed-info">
            <div class="cw-wb-card-head"><span class="cw-category">{{ item.pack.category }}</span><span class="cw-version">v{{ item.pack.version }}</span></div>
            <h3>{{ item.pack.name }}</h3>
            <code>{{ item.pack.dlc_key }}</code>
            <p>{{ item.pack.entry_count }} 条 · 酒馆世界书：{{ item.bookName }}</p>
            <RelationBadges :pack="item.pack" />
            <div v-if="item.missingPrerequisites.length" class="cw-wb-warning">缺失或未启用前置：{{ item.missingPrerequisites.join('、') }}（当前仍可启用）</div>
            <div v-if="item.updateError" class="cw-wb-error">{{ item.updateError }}</div>
          </div>
          <div class="cw-installed-actions">
            <button class="cw-btn" type="button" :disabled="busy" @click="checkOneUpdate(item)">检查更新</button>
            <button class="cw-btn cw-btn-danger" type="button" :disabled="busy" @click="uninstall(item)">卸载</button>
          </div>
          <button class="cw-btn cw-pack-toggle" :class="item.enabled ? 'is-enabled' : 'is-disabled'" type="button" :disabled="busy" :aria-pressed="item.enabled" @click="toggleInstalled(item)">
            <span class="cw-toggle-dot" aria-hidden="true"></span>{{ item.enabled ? '已启用' : '已停用' }}
          </button>
        </article>
      </div>
    </template>

    <template v-else>
      <div class="cw-section-head">
        <div><h2>我的世界书</h2><p>上传酒馆导出的 JSON；全部条目必须属于同一个 DLC 分组。</p></div>
        <button class="cw-info-button" type="button" aria-label="查看世界书条目命名说明" title="命名规范" @click="showGuide = true">i</button>
      </div>
      <div v-if="!auth" class="cw-login-prompt">
        <h2>登录后上传世界书包</h2><p>浏览和安装无需登录；上传、更新与发布需要 Discord 登录。</p>
        <button class="cw-btn cw-btn-primary" type="button" @click="$emit('login')">Discord 登录</button>
      </div>
      <template v-else>
        <form class="cw-form-card cw-wb-upload" @submit.prevent="createPack">
          <div class="cw-wb-form-title"><div><h3>上传新世界书包</h3><p>名称和类别自动从 `[DLC][类别][名称]` 提取。</p></div><button class="cw-info-button small" type="button" title="命名规范" @click="showGuide = true">i</button></div>
          <label class="wide"><span>世界书 JSON</span><input ref="createFileInput" type="file" accept=".json,application/json" required @change="selectCreateFile" /></label>
          <label class="wide"><span>简介</span><textarea v-model="newDescription" maxlength="500"></textarea></label>
          <div v-if="createValidation" class="cw-wb-validation wide"><strong>{{ createValidation.dlcKey }}</strong><span>{{ createValidation.entryCount }} 个条目</span><RelationBadges :pack="validationAsPack(createValidation)" /></div>
          <div class="cw-form-actions wide"><button class="cw-btn cw-btn-primary" :disabled="busy || !createFile || !createValidation">上传为草稿</button></div>
        </form>

        <div class="cw-owner-layout cw-wb-owner-layout">
          <aside class="cw-owner-list">
            <button v-for="ownBook in ownPacks" :key="ownBook.id" :class="{ active: selectedOwn?.id === ownBook.id }" type="button" @click="selectOwn(ownBook)"><strong>{{ ownBook.name }}</strong><span>{{ ownBook.status }} · {{ ownBook.entry_count }} 条</span></button>
            <div v-if="!ownPacks.length" class="cw-empty compact">还没有世界书包。</div>
          </aside>
          <div v-if="selectedOwn" class="cw-owner-editor">
            <div class="cw-wb-card selected">
              <div class="cw-wb-card-head"><span class="cw-category">{{ selectedOwn.category }}</span><span class="cw-version">v{{ selectedOwn.version }}</span></div>
              <h2>{{ selectedOwn.name }}</h2><code>{{ selectedOwn.dlc_key }}</code>
              <RelationBadges :pack="selectedOwn" />
              <label><span>简介</span><textarea v-model="editDescription" maxlength="500"></textarea></label>
              <div class="cw-inline-actions">
                <button class="cw-btn" type="button" :disabled="busy" @click="saveDescription">保存简介</button>
                <button v-if="selectedOwn.status !== 'published'" class="cw-btn cw-btn-primary" type="button" :disabled="busy" @click="publishSelected">发布</button>
                <button v-else class="cw-btn" type="button" :disabled="busy" @click="unpublishSelected">下架</button>
                <button class="cw-btn cw-btn-danger" type="button" :disabled="busy" @click="deleteSelected">删除</button>
              </div>
            </div>
            <form class="cw-form-card compact" @submit.prevent="replaceContent">
              <div class="cw-wb-form-title"><div><h3>更新条目文件</h3><p>发布状态下更新会提升版本号。</p></div><button class="cw-info-button small" type="button" title="命名规范" @click="showGuide = true">i</button></div>
              <label class="wide"><span>新的世界书 JSON</span><input ref="replaceFileInput" type="file" accept=".json,application/json" required @change="selectReplaceFile" /></label>
              <div v-if="replaceValidation" class="cw-wb-validation wide"><strong>{{ replaceValidation.dlcKey }}</strong><span>{{ replaceValidation.entryCount }} 个条目</span></div>
              <div class="cw-form-actions wide"><button class="cw-btn" :disabled="busy || !replaceFile || !replaceValidation">校验并更新</button></div>
            </form>
          </div>
          <div v-else class="cw-empty">选择左侧世界书包进行管理。</div>
        </div>
      </template>
    </template>

    <div v-if="showGuide" class="cw-suboverlay" @mousedown.self="showGuide = false">
      <section class="cw-wb-guide" role="dialog" aria-modal="true" aria-label="DLC 世界书条目命名规范">
        <button class="cw-close" type="button" @click="showGuide = false">×</button>
        <h2>DLC 世界书条目命名规范</h2>
        <p>每个上传文件只能包含一个 DLC 包，且每个条目的名称都必须以相同的前三段开头：</p>
        <pre>[DLC][角色|事件|扩展][名称][!互斥][&gt;替换][&lt;前置]描述(作者-信息)</pre>
        <dl>
          <dt><code>[DLC][类别][名称]</code></dt><dd>必填。同一个文件中三段必须完全一致，用于识别、分类和分组。</dd>
          <dt><code>[!目标]</code></dt><dd>互斥。启用当前包时自动停用目标世界书包；关闭当前包不会自动恢复。</dd>
          <dt><code>[&gt;目标]</code></dt><dd>替换。启用时暂时关闭已绑定世界书中名称含 `[目标]` 的条目，停用或卸载后恢复原状态。</dd>
          <dt><code>[&lt;目标]</code></dt><dd>前置。如果目标包没有安装或启用，会显示缺失提示，但不会阻止启用。</dd>
        </dl>
        <h3>示例</h3>
        <pre>[DLC][角色][薇薇拉]薇薇拉-核心设定(Awene-原创角色)
[DLC][事件][薇薇拉之歌][&lt;薇薇拉]入口(Awene)
[DLC][扩展][增强战斗][!简化战斗][&gt;基础战斗]规则(Awene)</pre>
        <div class="cw-wb-warning">世界书可能包含会影响提示词或由其他插件执行的 EJS 内容。只安装你信任的作者发布的条目。</div>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, ref, watch, type PropType } from 'vue';
import type { AuthRecord, DlcRelations, InstalledWorldbookPack, WorldbookPackSummary } from './types';
import { validateWorldbookFile, type ParsedWorldbookUpload } from './worldbook-prefix';
import { worldbookWorkshopService } from './worldbook-service';

const props = defineProps<{ mode: 'browse' | 'installed' | 'mine'; auth?: AuthRecord }>();
defineEmits<{ login: [] }>();

const RelationBadges = defineComponent({
  props: { pack: { type: Object as PropType<Pick<WorldbookPackSummary, 'relations'>>, required: true } },
  setup(componentProps) {
    return () => h('div', { class: 'cw-wb-relations' }, [
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
const createFile = ref<File>();
const createValidation = ref<ParsedWorldbookUpload>();
const createFileInput = ref<HTMLInputElement>();
const newDescription = ref('');
const replaceFile = ref<File>();
const replaceValidation = ref<ParsedWorldbookUpload>();
const replaceFileInput = ref<HTMLInputElement>();
const editDescription = ref('');

function tell(message: string, type: 'success' | 'error' = 'success'): void {
  notice.value = message;
  noticeType.value = type;
  window.setTimeout(() => { if (notice.value === message) notice.value = ''; }, 7000);
}
function errorText(error: unknown): string { return error instanceof Error ? error.message : String(error); }
function formatBytes(bytes: number): string { return bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`; }
function formatDate(timestamp?: number | null): string { return timestamp ? new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(timestamp * 1000)) : '尚未发布'; }
function isInstalled(id: string): boolean { return installed.value.some(item => item.id === id); }
function validationAsPack(value: ParsedWorldbookUpload): Pick<WorldbookPackSummary, 'relations'> { return { relations: value.relations }; }

async function loadInstalled(): Promise<void> { installed.value = await worldbookWorkshopService.listInstalled(); }
async function loadPublic(reset: boolean): Promise<void> {
  busy.value = true;
  try {
    const offset = reset ? 0 : (nextOffset.value ?? 0);
    const result = await worldbookWorkshopService.publicPacks(query.value, category.value, offset);
    publicPacks.value = reset ? result.items : [...publicPacks.value, ...result.items];
    nextOffset.value = result.next_offset;
    await loadInstalled();
  } catch (error) { tell(errorText(error), 'error'); } finally { busy.value = false; }
}
async function install(pack: WorldbookPackSummary): Promise<void> {
  busy.value = true;
  try {
    const result = await worldbookWorkshopService.install(pack.id);
    await loadInstalled();
    tell(result.missingPrerequisites.length ? `已安装并启用；缺失前置：${result.missingPrerequisites.join('、')}` : `「${pack.name}」已安装并启用`, result.missingPrerequisites.length ? 'error' : 'success');
  } catch (error) { tell(errorText(error), 'error'); } finally { busy.value = false; }
}
async function toggleInstalled(item: InstalledWorldbookPack): Promise<void> {
  busy.value = true;
  try {
    const missing = await worldbookWorkshopService.setEnabled(item.id, !item.enabled);
    await loadInstalled();
    tell(missing.length ? `已启用，但缺失前置：${missing.join('、')}` : item.enabled ? '世界书包已停用' : '世界书包已启用', missing.length ? 'error' : 'success');
  } catch (error) { tell(errorText(error), 'error'); } finally { busy.value = false; }
}
async function uninstall(item: InstalledWorldbookPack): Promise<void> {
  if (!window.parent.confirm(`确定卸载“${item.pack.name}”并删除对应的酒馆世界书吗？`)) return;
  busy.value = true;
  try { await worldbookWorkshopService.uninstall(item.id); await loadInstalled(); tell('世界书包已卸载'); }
  catch (error) { tell(errorText(error), 'error'); } finally { busy.value = false; }
}
async function checkOneUpdate(item: InstalledWorldbookPack): Promise<void> {
  busy.value = true;
  try { const status = await worldbookWorkshopService.checkUpdate(item.id); await loadInstalled(); tell(status === 'updated' ? '世界书包已更新' : status === 'hidden' ? '作者已下架，本地版本仍保留' : '当前已是最新版', status === 'hidden' ? 'error' : 'success'); }
  catch (error) { await loadInstalled(); tell(errorText(error), 'error'); } finally { busy.value = false; }
}
async function checkAllUpdates(): Promise<void> {
  busy.value = true;
  try { const result = await worldbookWorkshopService.checkAllUpdates(); await loadInstalled(); tell(`更新完成：更新 ${result.updated}，下架 ${result.hidden}，失败 ${result.failed}`, result.failed ? 'error' : 'success'); }
  catch (error) { tell(errorText(error), 'error'); } finally { busy.value = false; }
}
async function validateSelection(event: Event, target: 'create' | 'replace'): Promise<void> {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (target === 'create') { createFile.value = file; createValidation.value = undefined; }
  else { replaceFile.value = file; replaceValidation.value = undefined; }
  if (!file) return;
  try {
    const result = await validateWorldbookFile(file);
    if (target === 'create') createValidation.value = result; else replaceValidation.value = result;
    tell(`校验通过：${result.dlcKey}，共 ${result.entryCount} 个条目`);
  } catch (error) {
    if (target === 'create') createFile.value = undefined; else replaceFile.value = undefined;
    (event.target as HTMLInputElement).value = '';
    tell(`校验失败：${errorText(error)}`, 'error');
  }
}
const selectCreateFile = (event: Event) => validateSelection(event, 'create');
const selectReplaceFile = (event: Event) => validateSelection(event, 'replace');
async function loadOwn(): Promise<void> {
  if (!props.auth) return;
  busy.value = true;
  try { ownPacks.value = (await worldbookWorkshopService.api.listOwnWorldbooks()).items; if (selectedOwn.value) selectOwn(ownPacks.value.find(item => item.id === selectedOwn.value?.id)); }
  catch (error) { tell(errorText(error), 'error'); } finally { busy.value = false; }
}
function selectOwn(pack?: WorldbookPackSummary): void { selectedOwn.value = pack; editDescription.value = pack?.description ?? ''; replaceFile.value = undefined; replaceValidation.value = undefined; if (replaceFileInput.value) replaceFileInput.value.value = ''; }
async function createPack(): Promise<void> {
  if (!createFile.value || !createValidation.value) return;
  busy.value = true;
  try { const result = await worldbookWorkshopService.api.createWorldbook(createFile.value, newDescription.value); createFile.value = undefined; createValidation.value = undefined; newDescription.value = ''; if (createFileInput.value) createFileInput.value.value = ''; await loadOwn(); selectOwn(ownPacks.value.find(item => item.id === result.pack.id) ?? result.pack); tell('世界书包已上传为草稿'); }
  catch (error) { tell(errorText(error), 'error'); } finally { busy.value = false; }
}
async function saveDescription(): Promise<void> { if (!selectedOwn.value) return; busy.value = true; try { await worldbookWorkshopService.api.updateWorldbook(selectedOwn.value.id, editDescription.value); await loadOwn(); tell('简介已保存'); } catch (error) { tell(errorText(error), 'error'); } finally { busy.value = false; } }
async function replaceContent(): Promise<void> { if (!selectedOwn.value || !replaceFile.value || !replaceValidation.value) return; busy.value = true; try { await worldbookWorkshopService.api.replaceWorldbookContent(selectedOwn.value.id, replaceFile.value, editDescription.value); await loadOwn(); tell('世界书条目已更新'); } catch (error) { tell(errorText(error), 'error'); } finally { busy.value = false; } }
async function publishSelected(): Promise<void> { if (!selectedOwn.value) return; busy.value = true; try { await worldbookWorkshopService.api.publishWorldbook(selectedOwn.value.id); await loadOwn(); tell('世界书包已发布'); } catch (error) { tell(errorText(error), 'error'); } finally { busy.value = false; } }
async function unpublishSelected(): Promise<void> { if (!selectedOwn.value) return; busy.value = true; try { await worldbookWorkshopService.api.unpublishWorldbook(selectedOwn.value.id); await loadOwn(); tell('世界书包已下架'); } catch (error) { tell(errorText(error), 'error'); } finally { busy.value = false; } }
async function deleteSelected(): Promise<void> { if (!selectedOwn.value || !window.parent.confirm(`确定删除“${selectedOwn.value.name}”吗？`)) return; busy.value = true; try { await worldbookWorkshopService.api.deleteWorldbook(selectedOwn.value.id); selectedOwn.value = undefined; await loadOwn(); tell('世界书包已删除'); } catch (error) { tell(errorText(error), 'error'); } finally { busy.value = false; } }

const mode = computed(() => props.mode);
async function loadMode(): Promise<void> { if (props.mode === 'browse') await loadPublic(true); if (props.mode === 'installed') await loadInstalled(); if (props.mode === 'mine') await loadOwn(); }
watch(() => props.mode, () => void loadMode());
watch(() => props.auth, () => { if (props.mode === 'mine') void loadOwn(); });
onMounted(() => void loadMode());
</script>

<style scoped lang="scss">
.cw-wb-notice { position: sticky; top: 0; z-index: 7; margin-bottom: 10px; padding: 8px 11px; border-radius: 8px; color: #37624d; background: #e6f0e8; }
.cw-wb-notice.error, .cw-wb-error { color: #9d373a; background: #f7dfda; }
.cw-wb-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 10px; }
.cw-wb-card { display: flex; flex-direction: column; gap: 8px; padding: 13px; border: 1px solid var(--cw-line); border-radius: 11px; background: color-mix(in srgb, var(--cw-paper-2) 45%, transparent); }
.cw-wb-card.selected { margin-bottom: 10px; }
.cw-wb-card h2, .cw-wb-card h3, .cw-wb-installed h3, .cw-wb-form-title h3 { margin: 0; color: var(--cw-ink); }
.cw-wb-card p, .cw-wb-meta, .cw-wb-installed p, .cw-wb-form-title p { margin: 0; color: var(--cw-muted); font-size: 13px; }
.cw-wb-card code, .cw-wb-installed code { overflow-wrap: anywhere; color: var(--cw-red); font-size: 12px; }
.cw-wb-card-head, .cw-wb-form-title { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
.cw-wb-meta { display: flex; flex-wrap: wrap; gap: 5px 12px; }
.cw-wb-relations { display: flex; flex-wrap: wrap; gap: 5px; }
.cw-wb-relations span { padding: 2px 7px; border: 1px solid var(--cw-line); border-radius: 99px; font-size: 11px; }
.cw-wb-relations .exclude { color: #a35a31; }.cw-wb-relations .replace { color: #3d7180; }.cw-wb-relations .require { color: var(--cw-green); }
.cw-wb-installed { grid-template-columns: minmax(0, 1fr) auto auto; }
.cw-wb-warning, .cw-wb-error { margin-top: 7px; padding: 7px 9px; border-radius: 7px; font-size: 12px; }
.cw-wb-warning { color: #91612b; background: #f5e8c9; }
.cw-info-button { flex: none; width: 34px; height: 34px; border: 1px solid var(--cw-red); border-radius: 50%; color: white; background: var(--cw-red); cursor: pointer; font: 700 18px/1 serif; }
.cw-info-button.small { width: 27px; height: 27px; font-size: 15px; }
.cw-wb-upload { margin-bottom: 12px; }.cw-wb-validation { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 8px; border-radius: 8px; background: color-mix(in srgb, var(--cw-green) 14%, transparent); }
.cw-wb-owner-layout { margin-top: 12px; }.cw-wb-guide { position: relative; width: min(760px, calc(100% - 24px)); max-height: min(760px, calc(100% - 24px)); overflow: auto; padding: 20px; border: 1px solid var(--cw-line); border-radius: 14px; color: var(--cw-ink); background: var(--cw-paper); box-shadow: 0 20px 70px #0008; }
.cw-wb-guide .cw-close { position: absolute; top: 8px; right: 8px; }.cw-wb-guide pre { overflow-x: auto; padding: 10px; border-radius: 8px; white-space: pre-wrap; background: var(--cw-paper-2); }.cw-wb-guide dt { margin-top: 9px; font-weight: 700; }.cw-wb-guide dd { margin: 3px 0 0; color: var(--cw-muted); }
@media (max-width: 700px) { .cw-wb-installed { grid-template-columns: 1fr; }.cw-wb-owner-layout { grid-template-columns: 1fr; } }
</style>
