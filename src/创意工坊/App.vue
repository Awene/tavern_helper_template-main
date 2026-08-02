<template>
  <Transition name="cw-fade">
    <div v-if="workshopVisible" class="cw-overlay" @mousedown.self="closeWorkshop">
      <section class="cw-shell" role="dialog" aria-modal="true" aria-label="本格数值化修仙创意工坊">
        <header class="cw-header">
          <div>
            <div class="cw-kicker">本格数值化修仙</div>
            <h1>创意工坊</h1>
          </div>
          <div class="cw-header-actions">
            <button v-if="auth" class="cw-user" type="button" @click="activeTab = 'mine'">
              {{ auth.user.globalName || auth.user.username }}
            </button>
            <button v-else class="cw-btn cw-btn-primary" type="button" :disabled="busy" @click="login">
              Discord 登录
            </button>
            <button class="cw-close" type="button" aria-label="关闭" @click="closeWorkshop">×</button>
          </div>
        </header>

        <nav class="cw-tabs" aria-label="创意工坊页面">
          <button :class="{ active: activeTab === 'browse' }" type="button" @click="switchTab('browse')">
            浏览图包
          </button>
          <button :class="{ active: activeTab === 'installed' }" type="button" @click="switchTab('installed')">
            已安装 <span>{{ installed.length }}</span>
          </button>
          <button :class="{ active: activeTab === 'mine' }" type="button" @click="switchTab('mine')">我的图包</button>
          <button :class="{ active: activeTab === 'settings' }" type="button" @click="switchTab('settings')">
            设置
          </button>
          <button
            v-if="auth?.user.isAdmin"
            :class="{ active: activeTab === 'reports' }"
            type="button"
            @click="switchTab('reports')"
          >
            举报管理
          </button>
        </nav>

        <main class="cw-body">
          <div v-if="notice" class="cw-notice" :class="noticeType">{{ notice }}</div>

          <section v-if="activeTab === 'browse'" class="cw-page">
            <div class="cw-toolbar">
              <label class="cw-search">
                <span>搜索</span>
                <input
                  v-model="query"
                  type="search"
                  placeholder="图包、作者或简介"
                  @keyup.enter="loadPublicPacks(true)"
                />
              </label>
              <label>
                <span>类别</span>
                <select v-model="category" @change="loadPublicPacks(true)">
                  <option value="">全部</option>
                  <option value="风景">风景</option>
                  <option value="人物">人物</option>
                  <option value="其他">其他</option>
                </select>
              </label>
              <button class="cw-btn" type="button" :disabled="busy" @click="loadPublicPacks(true)">刷新</button>
            </div>

            <div v-if="busy && !publicPacks.length" class="cw-empty">正在读取工坊目录……</div>
            <div v-else-if="!publicPacks.length" class="cw-empty">没有找到符合条件的图包。</div>
            <div v-else class="cw-grid">
              <article v-for="pack in publicPacks" :key="pack.id" class="cw-card">
                <button class="cw-card-main" type="button" @click="openPack(pack)">
                  <div class="cw-card-top">
                    <span class="cw-category">{{ pack.category }}</span>
                    <span>v{{ pack.version }}</span>
                  </div>
                  <h2>{{ pack.name }}</h2>
                  <p>{{ pack.description || '作者没有填写简介。' }}</p>
                  <div class="cw-card-meta">
                    <span>{{ pack.owner_name || '未知作者' }}</span>
                    <span>{{ pack.image_count || 0 }} 张</span>
                  </div>
                </button>
                <button
                  class="cw-btn cw-btn-primary"
                  type="button"
                  :disabled="Boolean(downloadProgress[pack.id]) || isInstalled(pack.id)"
                  @click="install(pack)"
                >
                  {{ isInstalled(pack.id) ? '已下载' : downloadProgress[pack.id] || '下载图包' }}
                </button>
              </article>
            </div>
            <button
              v-if="nextOffset !== null"
              class="cw-btn cw-more"
              type="button"
              :disabled="busy"
              @click="loadPublicPacks(false)"
            >
              加载更多
            </button>
          </section>

          <section v-else-if="activeTab === 'installed'" class="cw-page">
            <div class="cw-section-head">
              <div>
                <h2>已安装图包</h2>
                <p>只有已下载且启用的图包会参与正文匹配。</p>
              </div>
              <button class="cw-btn" type="button" :disabled="busy" @click="checkAllUpdates">立即检查更新</button>
            </div>
            <div v-if="!installed.length" class="cw-empty">尚未下载任何图包。请先在“浏览图包”中选择并下载。</div>
            <div v-else class="cw-list">
              <article v-for="pack in installed" :key="pack.id" class="cw-installed">
                <div class="cw-installed-info">
                  <div class="cw-card-top">
                    <span class="cw-category">{{ pack.manifest.pack.category }}</span>
                    <span>v{{ pack.manifest.pack.version }}</span>
                  </div>
                  <h3>{{ pack.manifest.pack.name }}</h3>
                  <p>
                    {{ pack.manifest.images.length }} 张 · {{ formatBytes(pack.localBytes) }}
                    <span v-if="pack.updateError" class="cw-error"> · {{ pack.updateError }}</span>
                  </p>
                </div>
                <div class="cw-installed-actions">
                  <label class="cw-switch">
                    <input :checked="pack.enabled" type="checkbox" @change="togglePack(pack, $event)" />
                    <span>{{ pack.enabled ? '已启用' : '已停用' }}</span>
                  </label>
                  <button class="cw-btn" type="button" :disabled="busy" @click="checkOneUpdate(pack)">检查更新</button>
                  <button class="cw-btn cw-btn-danger" type="button" @click="uninstall(pack)">卸载</button>
                </div>
              </article>
            </div>
          </section>

          <section v-else-if="activeTab === 'mine'" class="cw-page">
            <div v-if="!auth" class="cw-login-prompt">
              <h2>用 Discord 管理自己的图包</h2>
              <p>任何 Discord 用户都可以创建、修改、发布和下架多个图包。</p>
              <button class="cw-btn cw-btn-primary" type="button" :disabled="busy" @click="login">Discord 登录</button>
            </div>
            <template v-else>
              <div class="cw-section-head">
                <div>
                  <h2>我的图包</h2>
                  <p>校验通过后可立即发布，不经过发布前人工审核。</p>
                </div>
                <button class="cw-btn cw-btn-primary" type="button" @click="showCreatePack = !showCreatePack">
                  新建图包
                </button>
              </div>

              <form v-if="showCreatePack" class="cw-form-card" @submit.prevent="createPack">
                <label><span>名称</span><input v-model="newPack.name" maxlength="60" required /></label>
                <label
                  ><span>类别</span
                  ><select v-model="newPack.category">
                    <option>风景</option>
                    <option>人物</option>
                    <option>其他</option>
                  </select></label
                >
                <label class="wide"
                  ><span>简介</span><textarea v-model="newPack.description" maxlength="500"></textarea>
                </label>
                <div class="cw-form-actions">
                  <button class="cw-btn" type="button" @click="showCreatePack = false">取消</button
                  ><button class="cw-btn cw-btn-primary" :disabled="busy">创建</button>
                </div>
              </form>

              <div class="cw-owner-layout">
                <aside class="cw-owner-list">
                  <button
                    v-for="pack in ownPacks"
                    :key="pack.id"
                    :class="{ active: ownDetail?.pack.id === pack.id }"
                    type="button"
                    @click="loadOwnDetail(pack.id)"
                  >
                    <strong>{{ pack.name }}</strong
                    ><span>{{ pack.status }} · {{ pack.image_count || 0 }} 张</span>
                  </button>
                  <div v-if="!ownPacks.length" class="cw-empty compact">还没有图包。</div>
                </aside>

                <div v-if="ownDetail" class="cw-owner-editor">
                  <form class="cw-form-card compact" @submit.prevent="savePack">
                    <label><span>名称</span><input v-model="editPack.name" maxlength="60" required /></label>
                    <label
                      ><span>类别</span
                      ><select v-model="editPack.category">
                        <option>风景</option>
                        <option>人物</option>
                        <option>其他</option>
                      </select></label
                    >
                    <label class="wide"
                      ><span>简介</span><textarea v-model="editPack.description" maxlength="500"></textarea>
                    </label>
                    <div class="cw-form-actions wide">
                      <button class="cw-btn" :disabled="busy">保存资料</button>
                      <button
                        v-if="ownDetail.pack.status !== 'published'"
                        class="cw-btn cw-btn-primary"
                        type="button"
                        :disabled="busy"
                        @click="publishCurrent"
                      >
                        发布
                      </button>
                      <button v-else class="cw-btn" type="button" :disabled="busy" @click="unpublishCurrent">
                        下架
                      </button>
                      <button class="cw-btn cw-btn-danger" type="button" :disabled="busy" @click="deleteCurrentPack">
                        删除
                      </button>
                    </div>
                  </form>

                  <form class="cw-upload" @submit.prevent="uploadCurrentImage">
                    <h3>添加图片</h3>
                    <input
                      ref="uploadInput"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      required
                      @change="pickUploadFile"
                    />
                    <label
                      ><span>图片类别</span
                      ><select v-model="upload.rating">
                        <option value="sfw">SFW</option>
                        <option value="nsfw">NSFW</option>
                      </select></label
                    >
                    <label v-if="editPack.category === '人物'"
                      ><span>角色名</span><input v-model="upload.characterName" maxlength="60" required
                    /></label>
                    <label class="wide"
                      ><span>关键词（逗号分隔）</span><input v-model="upload.keywords" required
                    /></label>
                    <p class="wide">上传前会在本地重新编码、移除元数据，并把最大边压缩到 1600px。GIF 不受支持。</p>
                    <button class="cw-btn cw-btn-primary" :disabled="busy || !uploadFile">处理并上传</button>
                  </form>

                  <div class="cw-image-grid">
                    <article v-for="image in ownDetail.images" :key="image.id" class="cw-image-card">
                      <img
                        :src="ownImageUrls[image.id] || ''"
                        :alt="image.character_name || ownDetail.pack.name"
                        loading="lazy"
                      />
                      <div class="cw-image-info">
                        <strong>{{ image.character_name || '无角色名' }}</strong
                        ><span :class="['cw-rating', image.rating]">{{ image.rating.toUpperCase() }}</span>
                        <p>{{ image.keywords.join('、') }}</p>
                        <div class="cw-inline-actions">
                          <button class="cw-btn" type="button" @click="beginImageEdit(image)">修改</button>
                          <button class="cw-btn cw-btn-danger" type="button" @click="deleteCurrentImage(image.id)">
                            删除
                          </button>
                        </div>
                      </div>
                    </article>
                  </div>
                </div>
                <div v-else class="cw-empty">选择左侧图包进行管理。</div>
              </div>
            </template>
          </section>

          <section v-else-if="activeTab === 'settings'" class="cw-page">
            <div class="cw-settings-grid">
              <label class="cw-setting-card">
                <span><strong>自动插入图片</strong><small>关闭后不执行选图，也不改变正文。</small></span>
                <input v-model="settings.autoInsert" type="checkbox" @change="saveSettings" />
              </label>
              <label class="cw-setting-card">
                <span><strong>每楼最多插图</strong><small>所有图片统一插入正文末尾。</small></span>
                <input v-model.number="settings.maxPerMessage" type="number" min="1" max="6" @change="saveSettings" />
              </label>
              <label class="cw-setting-card wide">
                <span><strong>服务地址</strong><small>开发阶段使用本地地址；正式发布后由角色卡预置。</small></span>
                <input v-model="settings.apiBase" type="url" @change="saveSettings" />
              </label>
              <div class="cw-setting-card wide">
                <span
                  ><strong>本地占用</strong
                  ><small>{{ installed.length }} 个图包，{{ formatBytes(storageBytes) }}</small></span
                >
              </div>
              <div class="cw-setting-card wide">
                <span
                  ><strong>NSFW 显示规则</strong
                  ><small>NSFW 永远参与匹配，并在候选排序中优先于 SFW；不提供隐藏开关。</small></span
                >
              </div>
            </div>
            <div class="cw-section-head cw-account">
              <div v-if="auth">
                <h2>{{ auth.user.globalName || auth.user.username }}</h2>
                <p>Discord ID：{{ auth.user.id }}</p>
              </div>
              <div v-else>
                <h2>尚未登录</h2>
                <p>浏览和下载无需登录；上传、修改和举报需要登录。</p>
              </div>
              <button v-if="auth" class="cw-btn" type="button" @click="logout">退出登录</button>
              <button v-else class="cw-btn cw-btn-primary" type="button" @click="login">Discord 登录</button>
            </div>
          </section>

          <section v-else-if="activeTab === 'reports'" class="cw-page">
            <div class="cw-section-head">
              <div>
                <h2>举报管理</h2>
                <p>举报不会自动隐藏内容，需要管理员结合理由处置。</p>
              </div>
              <button class="cw-btn" @click="loadReports">刷新</button>
            </div>
            <div v-if="!reports.length" class="cw-empty">没有待处理举报。</div>
            <article v-for="report in reports" :key="String(report.id)" class="cw-report">
              <div>
                <strong>{{ report.target_type }} · {{ report.target_id }}</strong>
                <p>{{ report.reason }}</p>
                <small>{{ report.reporter_name }} · {{ formatDate(Number(report.created_at)) }}</small>
              </div>
              <div class="cw-inline-actions">
                <button class="cw-btn" @click="resolveReport(report, 'rejected')">驳回</button
                ><button class="cw-btn cw-btn-danger" @click="enforceReport(report)">
                  {{ report.target_type === 'image' ? '隐藏图片并结案' : '下架图包并结案' }}
                </button>
              </div>
            </article>
          </section>
        </main>
      </section>

      <div v-if="detail" class="cw-suboverlay" @mousedown.self="detail = null">
        <section class="cw-detail">
          <button class="cw-close" type="button" @click="detail = null">×</button>
          <div class="cw-card-top">
            <span class="cw-category">{{ detail.pack.category }}</span
            ><span>v{{ detail.pack.version }}</span>
          </div>
          <h2>{{ detail.pack.name }}</h2>
          <p>{{ detail.pack.description }}</p>
          <div class="cw-detail-actions">
            <button
              class="cw-btn cw-btn-primary"
              :disabled="isInstalled(detail.pack.id) || Boolean(downloadProgress[detail.pack.id])"
              @click="install(detail.pack)"
            >
              {{ isInstalled(detail.pack.id) ? '已下载' : downloadProgress[detail.pack.id] || '下载完整图包' }}
            </button>
            <button class="cw-btn" @click="openReport('pack', detail.pack.id)">举报图包</button>
          </div>
          <div class="cw-image-grid detail-images">
            <article v-for="image in detail.images" :key="image.id" class="cw-image-card">
              <img :src="image.download_url" :alt="image.character_name || detail.pack.name" loading="lazy" />
              <div class="cw-image-info">
                <strong>{{ image.character_name || detail.pack.name }}</strong
                ><span :class="['cw-rating', image.rating]">{{ image.rating.toUpperCase() }}</span>
                <p>{{ image.keywords.join('、') }}</p>
                <button class="cw-link" @click="openReport('image', image.id)">举报此图</button>
              </div>
            </article>
          </div>
        </section>
      </div>

      <div v-if="reportTarget" class="cw-suboverlay" @mousedown.self="reportTarget = null">
        <form class="cw-dialog" @submit.prevent="submitReport">
          <h2>提交举报</h2>
          <p>请填写具体理由。空理由或重复的未处理举报不会被接受。</p>
          <textarea
            v-model="reportReason"
            minlength="5"
            maxlength="500"
            required
            placeholder="请说明违规、侵权或分类错误的具体情况"
          ></textarea>
          <div class="cw-form-actions">
            <button class="cw-btn" type="button" @click="reportTarget = null">取消</button
            ><button class="cw-btn cw-btn-danger" :disabled="busy">提交举报</button>
          </div>
        </form>
      </div>

      <div v-if="imageEdit" class="cw-suboverlay" @mousedown.self="imageEdit = null">
        <form class="cw-dialog" @submit.prevent="saveImageEdit">
          <h2>修改图片资料</h2>
          <label
            ><span>类别</span
            ><select v-model="imageEdit.rating">
              <option value="sfw">SFW</option>
              <option value="nsfw">NSFW</option>
            </select></label
          >
          <label v-if="editPack.category === '人物'"
            ><span>角色名</span><input v-model="imageEdit.characterName" maxlength="60" required
          /></label>
          <label><span>关键词</span><input v-model="imageEdit.keywords" required /></label>
          <div class="cw-form-actions">
            <button class="cw-btn" type="button" @click="imageEdit = null">取消</button
            ><button class="cw-btn cw-btn-primary" :disabled="busy">保存</button>
          </div>
        </form>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { prepareUploadImage } from './image';
import { workshopService } from './service';
import type { AuthRecord, InstalledPack, PackImage, PackManifest, PackSummary, WorkshopSettings } from './types';
import { closeWorkshop, workshopVisible } from './ui-state';

type Tab = 'browse' | 'installed' | 'mine' | 'settings' | 'reports';

const activeTab = ref<Tab>('browse');
const busy = ref(false);
const notice = ref('');
const noticeType = ref<'success' | 'error'>('success');
const auth = ref<AuthRecord>();
const settings = reactive<WorkshopSettings>({
  key: 'main',
  apiBase: '',
  autoInsert: true,
  maxPerMessage: 1,
  updateIntervalHours: 6,
  lastUpdateCheck: 0,
});
const publicPacks = ref<PackSummary[]>([]);
const installed = ref<InstalledPack[]>([]);
const ownPacks = ref<PackSummary[]>([]);
const ownDetail = ref<PackManifest>();
const ownImageUrls = reactive<Record<string, string>>({});
const detail = ref<PackManifest | null>(null);
const query = ref('');
const category = ref('');
const nextOffset = ref<number | null>(0);
const downloadProgress = reactive<Record<string, string>>({});
const storageBytes = ref(0);
const showCreatePack = ref(false);
const newPack = reactive({ name: '', description: '', category: '人物' });
const editPack = reactive({ name: '', description: '', category: '人物' });
const upload = reactive({ rating: 'sfw', characterName: '', keywords: '' });
const uploadFile = ref<File>();
const uploadInput = ref<HTMLInputElement>();
const reports = ref<Record<string, unknown>[]>([]);
const reportTarget = ref<{ type: 'pack' | 'image'; id: string } | null>(null);
const reportReason = ref('');
const imageEdit = ref<{ id: string; rating: 'sfw' | 'nsfw'; characterName: string; keywords: string } | null>(null);

function tell(message: string, type: 'success' | 'error' = 'success'): void {
  notice.value = message;
  noticeType.value = type;
  window.setTimeout(() => {
    if (notice.value === message) notice.value = '';
  }, 5000);
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
function formatBytes(bytes: number): string {
  return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
function formatDate(seconds: number): string {
  return new Date(seconds * 1000).toLocaleString('zh-CN');
}
function isInstalled(packId: string): boolean {
  return installed.value.some(pack => pack.id === packId);
}

async function refreshLocal(): Promise<void> {
  installed.value = await workshopService.listInstalled();
  storageBytes.value = await workshopService.localStorageUsage();
  auth.value = await workshopService.getAuth();
  Object.assign(settings, await workshopService.getSettings());
}

async function switchTab(tab: Tab): Promise<void> {
  activeTab.value = tab;
  if (tab === 'browse' && !publicPacks.value.length) await loadPublicPacks(true);
  if (tab === 'installed') await refreshLocal();
  if (tab === 'mine' && auth.value) await loadOwnPacks();
  if (tab === 'reports' && auth.value?.user.isAdmin) await loadReports();
}

async function loadPublicPacks(reset: boolean): Promise<void> {
  busy.value = true;
  try {
    const offset = reset ? 0 : (nextOffset.value ?? 0);
    const result = await workshopService.publicPacks(query.value, category.value, offset);
    publicPacks.value = reset ? result.items : [...publicPacks.value, ...result.items];
    nextOffset.value = result.next_offset;
  } catch (error) {
    tell(errorText(error), 'error');
  } finally {
    busy.value = false;
  }
}

async function openPack(pack: PackSummary): Promise<void> {
  busy.value = true;
  try {
    detail.value = await workshopService.api.getPack(pack.id);
  } catch (error) {
    tell(errorText(error), 'error');
  } finally {
    busy.value = false;
  }
}

async function install(pack: PackSummary): Promise<void> {
  downloadProgress[pack.id] = '准备下载…';
  try {
    await workshopService.installPack(pack.id, progress => {
      downloadProgress[pack.id] = `${progress.completed}/${progress.total}`;
    });
    tell(`「${pack.name}」下载完成并已启用`);
    await refreshLocal();
  } catch (error) {
    tell(errorText(error), 'error');
  } finally {
    delete downloadProgress[pack.id];
  }
}

async function togglePack(pack: InstalledPack, event: Event): Promise<void> {
  const enabled = (event.target as HTMLInputElement).checked;
  await workshopService.setPackEnabled(pack.id, enabled);
  await refreshLocal();
}

async function uninstall(pack: InstalledPack): Promise<void> {
  if (!window.parent.confirm(`确定卸载「${pack.manifest.pack.name}」并删除其本地图片吗？`)) return;
  await workshopService.uninstallPack(pack.id);
  await refreshLocal();
  tell('图包已卸载');
}

async function checkOneUpdate(pack: InstalledPack): Promise<void> {
  busy.value = true;
  try {
    const result = await workshopService.checkPackUpdate(pack.id);
    tell(result === 'updated' ? '图包已自动更新' : result === 'hidden' ? '图包已被作者下架并停用' : '当前已经是最新版');
    await refreshLocal();
  } catch (error) {
    tell(errorText(error), 'error');
  } finally {
    busy.value = false;
  }
}

async function checkAllUpdates(): Promise<void> {
  busy.value = true;
  try {
    const result = await workshopService.checkAllUpdates(true);
    tell(`更新完成：更新 ${result.updated}，下架 ${result.hidden}，失败 ${result.failed}`);
    await refreshLocal();
  } catch (error) {
    tell(errorText(error), 'error');
  } finally {
    busy.value = false;
  }
}

async function login(): Promise<void> {
  busy.value = true;
  try {
    auth.value = await workshopService.api.login();
    tell('Discord 登录成功');
    if (activeTab.value === 'mine') await loadOwnPacks();
  } catch (error) {
    tell(errorText(error), 'error');
  } finally {
    busy.value = false;
  }
}

async function logout(): Promise<void> {
  await workshopService.api.logout();
  auth.value = undefined;
  ownPacks.value = [];
  ownDetail.value = undefined;
  clearOwnImageUrls();
  tell('已退出登录');
}
async function saveSettings(): Promise<void> {
  Object.assign(settings, await workshopService.updateSettings(settings));
  tell('设置已保存');
}

async function loadOwnPacks(): Promise<void> {
  busy.value = true;
  try {
    ownPacks.value = (await workshopService.api.listOwnPacks()).items;
    if (ownDetail.value) await loadOwnDetail(ownDetail.value.pack.id);
  } catch (error) {
    tell(errorText(error), 'error');
  } finally {
    busy.value = false;
  }
}

async function loadOwnDetail(packId: string): Promise<void> {
  busy.value = true;
  try {
    clearOwnImageUrls();
    ownDetail.value = await workshopService.api.getOwnPack(packId);
    await Promise.all(
      ownDetail.value.images.map(async image => {
        ownImageUrls[image.id] = URL.createObjectURL(await workshopService.api.getOwnImage(image.id));
      }),
    );
    Object.assign(editPack, {
      name: ownDetail.value.pack.name,
      description: ownDetail.value.pack.description,
      category: ownDetail.value.pack.category,
    });
  } catch (error) {
    tell(errorText(error), 'error');
  } finally {
    busy.value = false;
  }
}

function clearOwnImageUrls(): void {
  Object.values(ownImageUrls).forEach(url => URL.revokeObjectURL(url));
  Object.keys(ownImageUrls).forEach(key => delete ownImageUrls[key]);
}

async function createPack(): Promise<void> {
  busy.value = true;
  try {
    const created = await workshopService.api.createPack(newPack);
    showCreatePack.value = false;
    Object.assign(newPack, { name: '', description: '', category: '人物' });
    await loadOwnPacks();
    await loadOwnDetail(created.pack.id);
    tell('图包已创建，请添加图片');
  } catch (error) {
    tell(errorText(error), 'error');
  } finally {
    busy.value = false;
  }
}

async function savePack(): Promise<void> {
  if (!ownDetail.value) return;
  busy.value = true;
  try {
    await workshopService.api.updatePack(ownDetail.value.pack.id, editPack);
    await loadOwnPacks();
    tell('图包资料已更新');
  } catch (error) {
    tell(errorText(error), 'error');
  } finally {
    busy.value = false;
  }
}
async function publishCurrent(): Promise<void> {
  if (!ownDetail.value) return;
  busy.value = true;
  try {
    await workshopService.api.publishPack(ownDetail.value.pack.id);
    await loadOwnPacks();
    tell('图包已公开发布');
  } catch (error) {
    tell(errorText(error), 'error');
  } finally {
    busy.value = false;
  }
}
async function unpublishCurrent(): Promise<void> {
  if (!ownDetail.value) return;
  busy.value = true;
  try {
    await workshopService.api.unpublishPack(ownDetail.value.pack.id);
    await loadOwnPacks();
    tell('图包已下架');
  } catch (error) {
    tell(errorText(error), 'error');
  } finally {
    busy.value = false;
  }
}
async function deleteCurrentPack(): Promise<void> {
  if (!ownDetail.value || !window.parent.confirm(`确定删除「${ownDetail.value.pack.name}」吗？`)) return;
  busy.value = true;
  try {
    await workshopService.api.deletePack(ownDetail.value.pack.id);
    ownDetail.value = undefined;
    clearOwnImageUrls();
    await loadOwnPacks();
    tell('图包已删除');
  } catch (error) {
    tell(errorText(error), 'error');
  } finally {
    busy.value = false;
  }
}

function pickUploadFile(event: Event): void {
  uploadFile.value = (event.target as HTMLInputElement).files?.[0];
}
async function uploadCurrentImage(): Promise<void> {
  if (!ownDetail.value || !uploadFile.value) return;
  const keywords = upload.keywords
    .split(/[，,\n]/u)
    .map(value => value.trim())
    .filter(Boolean);
  if (!keywords.length) return tell('请填写关键词', 'error');
  busy.value = true;
  try {
    const prepared = await prepareUploadImage(uploadFile.value);
    await workshopService.api.uploadImage(ownDetail.value.pack.id, {
      file: prepared.blob,
      filename: prepared.filename,
      rating: upload.rating,
      characterName: upload.characterName,
      keywords,
    });
    Object.assign(upload, { rating: 'sfw', characterName: '', keywords: '' });
    uploadFile.value = undefined;
    if (uploadInput.value) uploadInput.value.value = '';
    await loadOwnDetail(ownDetail.value.pack.id);
    await loadOwnPacks();
    tell('图片已处理并上传');
  } catch (error) {
    tell(errorText(error), 'error');
  } finally {
    busy.value = false;
  }
}

function beginImageEdit(image: PackImage): void {
  imageEdit.value = {
    id: image.id,
    rating: image.rating,
    characterName: image.character_name,
    keywords: image.keywords.join('，'),
  };
}
async function saveImageEdit(): Promise<void> {
  if (!ownDetail.value || !imageEdit.value) return;
  busy.value = true;
  try {
    await workshopService.api.updateImage(ownDetail.value.pack.id, imageEdit.value.id, {
      rating: imageEdit.value.rating,
      character_name: imageEdit.value.characterName,
      keywords: imageEdit.value.keywords
        .split(/[，,\n]/u)
        .map(value => value.trim())
        .filter(Boolean),
    });
    imageEdit.value = null;
    await loadOwnDetail(ownDetail.value.pack.id);
    tell('图片资料已更新');
  } catch (error) {
    tell(errorText(error), 'error');
  } finally {
    busy.value = false;
  }
}
async function deleteCurrentImage(imageId: string): Promise<void> {
  if (!ownDetail.value || !window.parent.confirm('确定删除这张图片吗？')) return;
  busy.value = true;
  try {
    await workshopService.api.deleteImage(ownDetail.value.pack.id, imageId);
    await loadOwnDetail(ownDetail.value.pack.id);
    await loadOwnPacks();
    tell('图片已删除');
  } catch (error) {
    tell(errorText(error), 'error');
  } finally {
    busy.value = false;
  }
}

function openReport(type: 'pack' | 'image', id: string): void {
  if (!auth.value) {
    activeTab.value = 'settings';
    tell('请先登录 Discord 再举报', 'error');
    return;
  }
  reportTarget.value = { type, id };
  reportReason.value = '';
}
async function submitReport(): Promise<void> {
  if (!reportTarget.value) return;
  busy.value = true;
  try {
    await workshopService.api.report(reportTarget.value.type, reportTarget.value.id, reportReason.value);
    reportTarget.value = null;
    tell('举报已提交');
  } catch (error) {
    tell(errorText(error), 'error');
  } finally {
    busy.value = false;
  }
}
async function loadReports(): Promise<void> {
  busy.value = true;
  try {
    reports.value = (await workshopService.api.listReports()).items;
  } catch (error) {
    tell(errorText(error), 'error');
  } finally {
    busy.value = false;
  }
}
async function resolveReport(report: Record<string, unknown>, status: 'resolved' | 'rejected'): Promise<void> {
  const resolution = window.parent.prompt('填写处置说明（必填）');
  if (!resolution) return;
  busy.value = true;
  try {
    await workshopService.api.handleReport(String(report.id), status, resolution);
    await loadReports();
    tell('举报已处理');
  } catch (error) {
    tell(errorText(error), 'error');
  } finally {
    busy.value = false;
  }
}

async function enforceReport(report: Record<string, unknown>): Promise<void> {
  const resolution = window.parent.prompt('填写违规处置说明（必填）');
  if (!resolution) return;
  busy.value = true;
  try {
    if (report.target_type === 'image') {
      await workshopService.api.adminHideImage(String(report.target_id));
    } else {
      await workshopService.api.adminUnpublishPack(String(report.target_id));
    }
    await workshopService.api.handleReport(String(report.id), 'resolved', resolution);
    await loadReports();
    tell('违规内容已处置并结案');
  } catch (error) {
    tell(errorText(error), 'error');
  } finally {
    busy.value = false;
  }
}

onMounted(async () => {
  await refreshLocal();
  await loadPublicPacks(true);
});

onBeforeUnmount(clearOwnImageUrls);
</script>
