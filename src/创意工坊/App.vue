<template>
  <Transition name="cw-fade">
    <div v-if="workshopVisible" class="cw-overlay" :class="{ 'cw-dark': darkMode }" @mousedown.self="closeWorkshop">
      <section class="cw-shell" role="dialog" aria-modal="true" aria-label="本格数值化修仙创意工坊">
        <header class="cw-header">
          <div>
            <div class="cw-kicker">本格数值化修仙</div>
            <h1>创意工坊</h1>
          </div>
          <div class="cw-header-actions">
            <button class="cw-theme-toggle" type="button" @click="toggleTheme">
              {{ darkMode ? '☀ 日间' : '🌙 夜间' }}
            </button>
            <button v-if="auth" class="cw-user" type="button" @click="activeTab = 'mine'">
              {{ auth.user.globalName || auth.user.username }}
            </button>
            <button
              v-else
              class="cw-btn cw-btn-primary"
              type="button"
              :disabled="busy && !loginPending"
              @click="handleLoginClick"
            >
              {{ loginPending ? '取消等待' : 'Discord 登录' }}
            </button>
            <button class="cw-close" type="button" aria-label="关闭" @click="closeWorkshop">×</button>
          </div>
        </header>

        <nav class="cw-tabs" aria-label="创意工坊页面">
          <button :class="{ active: activeTab === 'browse' }" type="button" @click="switchTab('browse')">
            浏览图包
          </button>
          <button :class="{ active: activeTab === 'installed' }" type="button" @click="switchTab('installed')">
            已安装图包 <span>{{ installed.length }}</span>
          </button>
          <button :class="{ active: activeTab === 'mine' }" type="button" @click="switchTab('mine')">我的图包</button>
          <button :class="{ active: activeTab === 'worldbooks' }" type="button" @click="switchTab('worldbooks')">
            浏览世界书
          </button>
          <button
            :class="{ active: activeTab === 'installed-worldbooks' }"
            type="button"
            @click="switchTab('installed-worldbooks')"
          >
            已安装世界书
          </button>
          <button :class="{ active: activeTab === 'my-worldbooks' }" type="button" @click="switchTab('my-worldbooks')">
            我的世界书
          </button>
          <button :class="{ active: activeTab === 'settings' }" type="button" @click="switchTab('settings')">
            设置
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
                <button
                  class="cw-card-main"
                  type="button"
                  :aria-label="`查看图包 ${pack.name}`"
                  @click="openPack(pack)"
                >
                  <div class="cw-card-media">
                    <WorkshopImage
                      :src="workshopImageUrl(pack.preview_image_id)"
                      :alt="`${pack.name} 预览图`"
                      fit="contain"
                      blur-background
                      :pending="workshopImagePending(pack.preview_image_id, false)"
                      :failed="workshopImageFailed(pack.preview_image_id, false)"
                      :requestable="Boolean(pack.preview_image_id)"
                      empty-label="暂无预览"
                      @request="loadPackPreview(pack)"
                    />
                    <div class="cw-card-badges">
                      <span class="cw-glass-pill">{{ pack.category }}</span>
                      <span class="cw-glass-pill">{{ pack.image_count || 0 }} 张</span>
                    </div>
                    <div class="cw-card-glass">
                      <div class="cw-title-row">
                        <h2>{{ pack.name }}</h2>
                        <span class="cw-version">v{{ pack.version }}</span>
                      </div>
                      <div class="cw-card-meta">
                        <span>{{ pack.owner_name || '未知作者' }}</span>
                        <span>上传于 {{ formatDate(pack.published_at) }}</span>
                      </div>
                      <div class="cw-card-stats">
                        <span>♡ {{ pack.like_count || 0 }}</span>
                        <span>⇩ {{ pack.download_count || 0 }}</span>
                      </div>
                    </div>
                  </div>
                </button>
                <div class="cw-card-actions">
                  <button
                    class="cw-btn cw-like-btn"
                    :class="{ active: likedPackIds.has(pack.id) }"
                    type="button"
                    :aria-pressed="likedPackIds.has(pack.id)"
                    @click="toggleLike(pack)"
                  >
                    {{ likedPackIds.has(pack.id) ? '♥ 已赞' : '♡ 点赞' }} {{ pack.like_count || 0 }}
                  </button>
                  <button
                    class="cw-btn cw-btn-primary"
                    type="button"
                    :disabled="Boolean(downloadProgress[pack.id]) || isInstalled(pack.id)"
                    @click="install(pack)"
                  >
                    {{ isInstalled(pack.id) ? '已下载' : downloadProgress[pack.id] || '下载图包' }}
                  </button>
                </div>
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
              <div class="cw-section-actions">
                <input
                  ref="offlineInput"
                  class="cw-native-file"
                  type="file"
                  accept=".cwp,application/vnd.cultivation-workshop-pack"
                  @change="importOfflinePack"
                />
                <button class="cw-btn" type="button" :disabled="busy" @click="chooseOfflinePack">导入离线包</button>
                <button class="cw-btn" type="button" :disabled="busy" @click="checkAllUpdates">立即检查更新</button>
              </div>
            </div>
            <div v-if="!installed.length" class="cw-empty">尚未下载任何图包。请先在“浏览图包”中选择并下载。</div>
            <div v-else class="cw-list">
              <article v-for="pack in installed" :key="pack.id" class="cw-installed">
                <div class="cw-installed-info">
                  <div class="cw-card-top">
                    <span class="cw-category">{{ pack.manifest.pack.category }}</span>
                    <span v-if="pack.source === 'offline'" class="cw-offline-tag">离线包</span>
                  </div>
                  <div class="cw-title-row">
                    <h3>{{ pack.manifest.pack.name }}</h3>
                    <span class="cw-version">v{{ pack.manifest.pack.version }}</span>
                  </div>
                  <p>
                    {{ pack.manifest.images.length }} 张 · {{ formatBytes(pack.localBytes) }}
                    <span v-if="pack.updateError" class="cw-error"> · {{ pack.updateError }}</span>
                  </p>
                </div>
                <div class="cw-installed-actions">
                  <button
                    v-if="pack.source !== 'offline'"
                    class="cw-btn"
                    type="button"
                    :disabled="busy"
                    @click="checkOneUpdate(pack)"
                  >
                    检查更新
                  </button>
                  <button class="cw-btn cw-btn-danger" type="button" @click="uninstall(pack)">卸载</button>
                </div>
                <button
                  class="cw-btn cw-pack-toggle"
                  :class="pack.enabled ? 'is-enabled' : 'is-disabled'"
                  type="button"
                  :disabled="togglingPackIds.has(pack.id)"
                  :aria-pressed="pack.enabled"
                  @click="togglePack(pack)"
                >
                  <span class="cw-toggle-dot" aria-hidden="true"></span>
                  {{ pack.enabled ? '已启用' : '已停用' }}
                </button>
              </article>
            </div>
          </section>

          <section v-else-if="activeTab === 'mine'" class="cw-page">
            <div v-if="!auth" class="cw-login-prompt">
              <h2>用 Discord 管理自己的图包</h2>
              <p>任何 Discord 用户都可以创建、修改、发布和下架多个图包。</p>
              <button
                class="cw-btn cw-btn-primary"
                type="button"
                :disabled="busy && !loginPending"
                @click="handleLoginClick"
              >
                {{ loginPending ? '取消等待' : 'Discord 登录' }}
              </button>
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
                      <button class="cw-btn" type="button" :disabled="busy" @click="exportCurrentPack">离线导出</button>
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
                      class="cw-native-file"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      required
                      @change="pickUploadFile"
                    />
                    <div class="cw-file-picker wide" :class="{ selected: uploadFiles.length }">
                      <div class="cw-file-copy">
                        <span>图片文件</span>
                        <strong :title="uploadFiles.map(file => file.name).join('、')">{{
                          uploadSelectionLabel()
                        }}</strong>
                        <small v-if="uploadFiles.length">总计 {{ formatBytes(uploadSelectionBytes()) }}</small>
                        <small v-else>支持多选 JPEG、PNG、WebP，单张最大 6 MB</small>
                      </div>
                      <button class="cw-btn" type="button" :disabled="busy" @click="chooseUploadFile">
                        {{ uploadFiles.length ? '重新选择' : '选择图片' }}
                      </button>
                    </div>
                    <div class="cw-upload-fields wide" :class="{ 'without-character': editPack.category !== '人物' }">
                      <label
                        ><span>图片类型</span
                        ><select v-model="upload.rating">
                          <option value="sfw">SFW</option>
                          <option value="nsfw">NSFW</option>
                        </select></label
                      >
                      <label v-if="editPack.category === '人物'"
                        ><span>角色名</span
                        ><input v-model="upload.characterName" maxlength="60" required
                      /></label>
                      <label v-if="editPack.category === '人物'" class="cw-upload-aliases"
                        ><span>角色别名（可选，逗号分隔）</span
                        ><input v-model="upload.aliases" placeholder="例如：璇玑，慕姑娘"
                      /></label>
                    </div>
                    <div class="cw-upload-footer wide">
                      <p>上传前会移除元数据，并把最大边等比压缩到 1600px；不支持 GIF。</p>
                      <button class="cw-btn cw-btn-primary" :disabled="busy || !uploadFiles.length">
                        {{
                          uploadProgress.total
                            ? `正在上传 ${uploadProgress.current}/${uploadProgress.total}`
                            : busy
                              ? '正在处理…'
                              : uploadFiles.length > 1
                                ? `处理并上传 ${uploadFiles.length} 张`
                                : '处理并上传'
                        }}
                      </button>
                    </div>
                  </form>

                  <div v-if="ownDetail.images.length" class="cw-image-manager">
                    <div class="cw-image-manager-head">
                      <div>
                        <strong>管理已上传图片</strong>
                        <span>已选择 {{ selectedOwnImageIds.size }} / {{ ownDetail.images.length }} 张</span>
                      </div>
                      <div class="cw-inline-actions">
                        <button class="cw-btn" type="button" :disabled="busy" @click="selectAllOwnImages">全选</button>
                        <button
                          class="cw-btn"
                          type="button"
                          :disabled="busy || !selectedOwnImageIds.size"
                          @click="clearOwnImageSelection"
                        >
                          取消选择
                        </button>
                      </div>
                    </div>
                    <div v-if="selectedOwnImageIds.size" class="cw-batch-editor">
                      <button class="cw-btn cw-btn-danger" type="button" :disabled="busy" @click="deleteSelectedImages">
                        删除所选
                      </button>
                    </div>
                  </div>

                  <div class="cw-image-grid">
                    <article
                      v-for="image in ownDetail.images"
                      :key="image.id"
                      class="cw-image-card cw-own-image-card"
                      :class="{ selected: selectedOwnImageIds.has(image.id) }"
                    >
                      <label
                        class="cw-image-select"
                        :class="{ 'is-selected': selectedOwnImageIds.has(image.id) }"
                        :title="selectedOwnImageIds.has(image.id) ? '取消选择这张图片' : '选择这张图片'"
                      >
                        <input
                          type="checkbox"
                          :checked="selectedOwnImageIds.has(image.id)"
                          :disabled="busy"
                          :aria-label="`${selectedOwnImageIds.has(image.id) ? '取消选择' : '选择'}图片 ${image.character_name || image.id}`"
                          @change="toggleOwnImageSelection(image.id)"
                        />
                        <span aria-hidden="true">{{ selectedOwnImageIds.has(image.id) ? '✓' : '＋' }}</span>
                      </label>
                      <WorkshopImage
                        :src="workshopImageUrl(image.id)"
                        :alt="image.character_name || ownDetail.pack.name"
                        :pending="workshopImagePending(image.id, true)"
                        :failed="workshopImageFailed(image.id, true)"
                        requestable
                        @request="loadWorkshopImage(image, true)"
                      />
                      <div class="cw-image-info">
                        <strong>{{ image.character_name || '无角色名' }}</strong
                        ><span :class="['cw-rating', image.rating]">{{ image.rating.toUpperCase() }}</span>
                        <p v-if="image.aliases?.length">别名：{{ image.aliases.join('、') }}</p>
                        <div class="cw-inline-actions">
                          <button
                            class="cw-btn cw-preview-btn"
                            :class="{ active: ownDetail.pack.preview_image_id === image.id }"
                            type="button"
                            :disabled="busy || ownDetail.pack.preview_image_id === image.id"
                            @click="setPreviewImage(image.id)"
                          >
                            {{ ownDetail.pack.preview_image_id === image.id ? '★ 当前预览' : '☆ 设为预览' }}
                          </button>
                          <button class="cw-btn" type="button" :disabled="busy" @click="beginImageEdit(image)">
                            修改
                          </button>
                          <button
                            class="cw-btn cw-btn-danger"
                            type="button"
                            :disabled="busy"
                            @click="deleteCurrentImage(image.id)"
                          >
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

          <WorldbookWorkshop
            v-else-if="
              activeTab === 'worldbooks' || activeTab === 'installed-worldbooks' || activeTab === 'my-worldbooks'
            "
            :mode="activeTab === 'worldbooks' ? 'browse' : activeTab === 'installed-worldbooks' ? 'installed' : 'mine'"
            :auth="auth"
            @login="login"
          />

          <section v-else-if="activeTab === 'settings'" class="cw-page">
            <div class="cw-settings-grid">
              <label class="cw-setting-card cw-toggle-setting" :class="{ 'is-enabled': settings.autoInsert }">
                <span class="cw-setting-copy">
                  <span class="cw-setting-title-row">
                    <strong>自动插入图片</strong>
                    <span class="cw-setting-status">{{ settings.autoInsert ? '已开启' : '已关闭' }}</span>
                  </span>
                  <small>
                    {{
                      settings.autoInsert
                        ? '按本楼角色名出现频率选择图片；无角色时依次使用风景、其他图包。'
                        : '不会执行选图，也不会改变正文。'
                    }}
                  </small>
                </span>
                <input
                  v-model="settings.autoInsert"
                  class="cw-switch-input"
                  type="checkbox"
                  role="switch"
                  :aria-checked="settings.autoInsert"
                  @change="saveAutoInsert"
                />
                <span class="cw-switch" aria-hidden="true"><span class="cw-switch-thumb"></span></span>
              </label>
              <div class="cw-setting-card wide">
                <span
                  ><strong>本地占用</strong
                  ><small>{{ installed.length }} 个图包，{{ formatBytes(storageBytes) }}</small></span
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
                <p>浏览和下载无需登录；上传和修改需要登录。</p>
              </div>
              <button v-if="auth" class="cw-btn" type="button" @click="logout">退出登录</button>
              <button
                v-else
                class="cw-btn cw-btn-primary"
                type="button"
                :disabled="busy && !loginPending"
                @click="handleLoginClick"
              >
                {{ loginPending ? '取消等待' : 'Discord 登录' }}
              </button>
            </div>
          </section>
        </main>
      </section>

      <div v-if="detail" class="cw-suboverlay" @mousedown.self="detail = null">
        <section class="cw-detail">
          <button class="cw-close" type="button" @click="detail = null">×</button>
          <div class="cw-card-top">
            <span class="cw-category">{{ detail.pack.category }}</span>
          </div>
          <div class="cw-title-row">
            <h2>{{ detail.pack.name }}</h2>
            <span class="cw-version">v{{ detail.pack.version }}</span>
          </div>
          <div class="cw-detail-description">
            <span class="cw-detail-description-label">图包简介</span>
            <p>{{ detail.pack.description || '作者没有填写简介。' }}</p>
          </div>
          <div class="cw-detail-stats">
            <span>作者：{{ detail.pack.owner_name || '未知作者' }}</span>
            <span>上传于 {{ formatDate(detail.pack.published_at) }}</span>
            <span>♥ {{ detail.pack.like_count || 0 }}</span>
            <span>⇩ {{ detail.pack.download_count || 0 }}</span>
          </div>
          <div class="cw-detail-actions">
            <button
              class="cw-btn cw-like-btn"
              :class="{ active: likedPackIds.has(detail.pack.id) }"
              type="button"
              :aria-pressed="likedPackIds.has(detail.pack.id)"
              @click="toggleLike(detail.pack)"
            >
              {{ likedPackIds.has(detail.pack.id) ? '♥ 已点赞' : '♡ 点赞' }}
            </button>
            <button
              class="cw-btn cw-btn-primary"
              :disabled="isInstalled(detail.pack.id) || Boolean(downloadProgress[detail.pack.id])"
              @click="install(detail.pack)"
            >
              {{ isInstalled(detail.pack.id) ? '已下载' : downloadProgress[detail.pack.id] || '下载完整图包' }}
            </button>
          </div>
          <div class="cw-image-grid detail-images">
            <article v-for="image in detail.images" :key="image.id" class="cw-image-card">
              <WorkshopImage
                :src="workshopImageUrl(image.id)"
                :alt="image.character_name || detail.pack.name"
                :pending="workshopImagePending(image.id, false)"
                :failed="workshopImageFailed(image.id, false)"
                requestable
                @request="loadWorkshopImage(image, false)"
              />
              <div class="cw-image-info">
                <strong>{{ image.character_name || detail.pack.name }}</strong
                ><span :class="['cw-rating', image.rating]">{{ image.rating.toUpperCase() }}</span>
                <p v-if="image.aliases?.length">别名：{{ image.aliases.join('、') }}</p>
              </div>
            </article>
          </div>
        </section>
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
          <label v-if="editPack.category === '人物'"
            ><span>角色别名（可选，逗号分隔）</span><input v-model="imageEdit.aliases"
          /></label>
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
import { onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { WorkshopApiError } from './api';
import { prepareUploadImage } from './image';
import { workshopService } from './service';
import type { AuthRecord, InstalledPack, PackImage, PackManifest, PackSummary, WorkshopSettings } from './types';
import { closeWorkshop, workshopVisible } from './ui-state';
import WorkshopImage from './WorkshopImage.vue';
import WorldbookWorkshop from './WorldbookWorkshop.vue';

type Tab = 'browse' | 'installed' | 'mine' | 'worldbooks' | 'installed-worldbooks' | 'my-worldbooks' | 'settings';

const activeTab = ref<Tab>('browse');
const busy = ref(false);
const loginPending = ref(false);
const notice = ref('');
const noticeType = ref<'success' | 'error'>('success');
const auth = ref<AuthRecord>();
const settings = reactive<WorkshopSettings>({
  key: 'main',
  apiBase: '',
  autoInsert: true,
  updateIntervalHours: 6,
  lastUpdateCheck: 0,
  packPreferences: {},
});
const publicPacks = ref<PackSummary[]>([]);
const installed = ref<InstalledPack[]>([]);
const ownPacks = ref<PackSummary[]>([]);
const ownDetail = ref<PackManifest>();
const workshopImageUrls = reactive<Record<string, string>>({});
const detail = ref<PackManifest | null>(null);
const query = ref('');
const category = ref('');
const nextOffset = ref<number | null>(0);
const downloadProgress = reactive<Record<string, string>>({});
const likedPackIds = ref<Set<string>>(new Set());
const failedWorkshopImages = ref<Set<string>>(new Set());
const loadingWorkshopImages = ref<Set<string>>(new Set());
const togglingPackIds = ref<Set<string>>(new Set());
const storageBytes = ref(0);
const showCreatePack = ref(false);
const newPack = reactive({ name: '', description: '', category: '人物' });
const editPack = reactive({ name: '', description: '', category: '人物' });
const upload = reactive({ rating: 'sfw', characterName: '', aliases: '' });
const uploadFiles = ref<File[]>([]);
const uploadProgress = reactive({ current: 0, total: 0 });
const uploadInput = ref<HTMLInputElement>();
const imageEdit = ref<{ id: string; rating: 'sfw' | 'nsfw'; characterName: string; aliases: string } | null>(null);
const selectedOwnImageIds = ref<Set<string>>(new Set());
const offlineInput = ref<HTMLInputElement>();
const darkMode = ref(false);
const THEME_KEY = 'rb-theme';

function readSharedTheme(): void {
  try {
    darkMode.value = window.parent.localStorage.getItem(THEME_KEY) !== 'light';
  } catch {
    darkMode.value = true;
  }
}

function handleThemeChange(event: Event): void {
  const theme = (event as CustomEvent<string>).detail;
  if (theme === 'light' || theme === 'dark') darkMode.value = theme === 'dark';
  else readSharedTheme();
}

function toggleTheme(): void {
  const theme = darkMode.value ? 'light' : 'dark';
  darkMode.value = theme === 'dark';
  try {
    window.parent.localStorage.setItem(THEME_KEY, theme);
    window.parent.dispatchEvent(new CustomEvent('rb-theme-change', { detail: theme }));
  } catch {
    // 主题仍会在当前创意工坊会话中切换。
  }
}

function aliasTerms(value: string): string[] {
  return [
    ...new Set(
      value
        .split(/[，,\n]/u)
        .map(item => item.normalize('NFKC').trim())
        .filter(Boolean),
    ),
  ];
}

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
function formatDate(timestamp?: number | null): string {
  if (!timestamp) return '尚未发布';
  return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' }).format(
    new Date(timestamp * 1000),
  );
}
function isInstalled(packId: string): boolean {
  return installed.value.some(pack => pack.id === packId);
}

async function refreshLocal(): Promise<void> {
  installed.value = await workshopService.listInstalled();
  storageBytes.value = await workshopService.localStorageUsage();
  auth.value = await workshopService.getAuth();
  if (auth.value) {
    try {
      likedPackIds.value = new Set((await workshopService.api.listMyLikes()).pack_ids);
    } catch {
      auth.value = await workshopService.getAuth();
      likedPackIds.value = new Set();
    }
  } else {
    likedPackIds.value = new Set();
  }
  Object.assign(settings, await workshopService.getSettings());
}

async function switchTab(tab: Tab): Promise<void> {
  activeTab.value = tab;
  if (tab === 'browse' && !publicPacks.value.length) await loadPublicPacks(true);
  if (tab === 'installed') await refreshLocal();
  if (tab === 'mine' && auth.value) await loadOwnPacks();
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
    await loadPublicPacks(true);
  } catch (error) {
    tell(errorText(error), 'error');
  } finally {
    delete downloadProgress[pack.id];
  }
}

function applyEngagement(packId: string, likeCount: number, downloadCount: number): void {
  for (const pack of publicPacks.value) {
    if (pack.id === packId) Object.assign(pack, { like_count: likeCount, download_count: downloadCount });
  }
  if (detail.value?.pack.id === packId) {
    Object.assign(detail.value.pack, { like_count: likeCount, download_count: downloadCount });
  }
  for (const pack of installed.value) {
    if (pack.id === packId) Object.assign(pack.manifest.pack, { like_count: likeCount, download_count: downloadCount });
  }
}

async function toggleLike(pack: PackSummary): Promise<void> {
  if (!auth.value) {
    tell('登录 Discord 后即可点赞图包', 'error');
    return;
  }
  try {
    const currentlyLiked = likedPackIds.value.has(pack.id);
    const result = currentlyLiked
      ? await workshopService.api.unlikePack(pack.id)
      : await workshopService.api.likePack(pack.id);
    const next = new Set(likedPackIds.value);
    if (result.liked) next.add(pack.id);
    else next.delete(pack.id);
    likedPackIds.value = next;
    applyEngagement(pack.id, result.like_count, result.download_count);
  } catch (error) {
    tell(errorText(error), 'error');
  }
}

async function togglePack(pack: InstalledPack): Promise<void> {
  if (togglingPackIds.value.has(pack.id)) return;
  const enabled = !pack.enabled;
  const pending = new Set(togglingPackIds.value);
  pending.add(pack.id);
  togglingPackIds.value = pending;
  pack.enabled = enabled;
  try {
    await workshopService.setPackEnabled(pack.id, enabled);
  } catch (error) {
    pack.enabled = !enabled;
    tell(errorText(error), 'error');
  } finally {
    const next = new Set(togglingPackIds.value);
    next.delete(pack.id);
    togglingPackIds.value = next;
  }
}

async function uninstall(pack: InstalledPack): Promise<void> {
  if (!window.parent.confirm(`确定卸载「${pack.manifest.pack.name}」并删除其本地图片吗？`)) return;
  await workshopService.uninstallPack(pack.id);
  await refreshLocal();
  tell('图包已卸载');
}

function chooseOfflinePack(): void {
  offlineInput.value?.click();
}

async function importOfflinePack(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  busy.value = true;
  try {
    const pack = await workshopService.importOfflinePack(file);
    await refreshLocal();
    tell(`「${pack.manifest.pack.name}」已作为离线图包导入并启用`);
  } catch (error) {
    tell(errorText(error), 'error');
  } finally {
    busy.value = false;
    input.value = '';
  }
}

async function exportCurrentPack(): Promise<void> {
  if (!ownDetail.value) return;
  busy.value = true;
  try {
    const exported = await workshopService.exportOwnPack(ownDetail.value);
    const url = URL.createObjectURL(exported.blob);
    const anchor = window.parent.document.createElement('a');
    anchor.href = url;
    anchor.download = exported.filename;
    anchor.style.display = 'none';
    window.parent.document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
    tell(`「${ownDetail.value.pack.name}」离线包已导出`);
  } catch (error) {
    tell(errorText(error), 'error');
  } finally {
    busy.value = false;
  }
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
  loginPending.value = true;
  notice.value = '正在等待 Discord 授权完成…';
  noticeType.value = 'success';
  try {
    auth.value = await workshopService.api.login();
    likedPackIds.value = new Set((await workshopService.api.listMyLikes()).pack_ids);
    tell('Discord 登录成功');
    if (activeTab.value === 'mine') await loadOwnPacks();
  } catch (error) {
    if (error instanceof WorkshopApiError && error.status === 499) tell(error.message);
    else tell(errorText(error), 'error');
  } finally {
    loginPending.value = false;
    busy.value = false;
  }
}

function handleLoginClick(): void {
  if (loginPending.value) {
    workshopService.api.cancelLogin();
    return;
  }
  void login();
}

async function logout(): Promise<void> {
  await workshopService.api.logout();
  auth.value = undefined;
  likedPackIds.value = new Set();
  ownPacks.value = [];
  ownDetail.value = undefined;
  clearOwnImageSelection();
  clearWorkshopImageUrls();
  tell('已退出登录');
}
async function saveSettings(): Promise<void> {
  Object.assign(settings, await workshopService.updateSettings(settings));
  tell('设置已保存');
}

async function saveAutoInsert(): Promise<void> {
  const desired = settings.autoInsert;
  try {
    const saved = await workshopService.updateSettings({ autoInsert: desired });
    Object.assign(settings, saved);
    tell(desired ? '自动插入图片已开启' : '自动插入图片已关闭');
  } catch (error) {
    settings.autoInsert = !desired;
    tell(`自动插入图片设置保存失败：${errorText(error)}`, 'error');
  }
}

async function loadOwnPacks(): Promise<void> {
  busy.value = true;
  try {
    await refreshOwnPackSummaries();
  } catch (error) {
    tell(errorText(error), 'error');
  } finally {
    busy.value = false;
  }
}

async function refreshOwnPackSummaries(): Promise<void> {
  ownPacks.value = (await workshopService.api.listOwnPacks()).items;
  if (!ownDetail.value) return;
  const currentSummary = ownPacks.value.find(pack => pack.id === ownDetail.value?.pack.id);
  if (currentSummary) Object.assign(ownDetail.value.pack, currentSummary);
}

async function loadOwnDetail(packId: string): Promise<void> {
  busy.value = true;
  try {
    const switchingPack = ownDetail.value?.pack.id !== packId;
    if (switchingPack) {
      ownDetail.value = undefined;
      clearOwnImageSelection();
    }
    const manifest = await workshopService.api.getOwnPack(packId);
    const currentImageIds = new Set(manifest.images.map(image => image.id));
    selectedOwnImageIds.value = new Set([...selectedOwnImageIds.value].filter(imageId => currentImageIds.has(imageId)));
    ownDetail.value = manifest;
    Object.assign(editPack, {
      name: manifest.pack.name,
      description: manifest.pack.description,
      category: manifest.pack.category,
    });
  } catch (error) {
    tell(errorText(error), 'error');
  } finally {
    busy.value = false;
  }
}

function workshopImageKey(imageId: string, authenticated: boolean): string {
  return `${authenticated ? 'own' : 'public'}:${imageId}`;
}

function workshopImageUrl(imageId?: string | null): string {
  return imageId ? workshopImageUrls[imageId] || '' : '';
}

function workshopImagePending(imageId: string | null | undefined, authenticated: boolean): boolean {
  return Boolean(imageId && loadingWorkshopImages.value.has(workshopImageKey(imageId, authenticated)));
}

function workshopImageFailed(imageId: string | null | undefined, authenticated: boolean): boolean {
  return Boolean(imageId && failedWorkshopImages.value.has(workshopImageKey(imageId, authenticated)));
}

function removeWorkshopImageUrl(imageId: string): void {
  const url = workshopImageUrls[imageId];
  if (url) URL.revokeObjectURL(url);
  delete workshopImageUrls[imageId];
}

function clearWorkshopImageUrls(): void {
  Object.keys(workshopImageUrls).forEach(removeWorkshopImageUrl);
  failedWorkshopImages.value = new Set();
  loadingWorkshopImages.value = new Set();
}

async function loadWorkshopImage(image: Pick<PackImage, 'id' | 'byte_size'>, authenticated: boolean): Promise<void> {
  const requestKey = workshopImageKey(image.id, authenticated);
  if (workshopImageUrls[image.id] || loadingWorkshopImages.value.has(requestKey)) return;
  failedWorkshopImages.value = new Set([...failedWorkshopImages.value].filter(key => key !== requestKey));
  loadingWorkshopImages.value = new Set([...loadingWorkshopImages.value, requestKey]);
  try {
    const blob = await workshopService.getPreviewImage({
      id: image.id,
      authenticated,
      expectedBytes: image.byte_size,
    });
    removeWorkshopImageUrl(image.id);
    workshopImageUrls[image.id] = URL.createObjectURL(blob);
    failedWorkshopImages.value = new Set([...failedWorkshopImages.value].filter(key => !key.endsWith(`:${image.id}`)));
  } catch (error) {
    failedWorkshopImages.value = new Set([...failedWorkshopImages.value, requestKey]);
    console.error(`[创意工坊] 图片 ${image.id} 预览加载失败：`, error);
  } finally {
    loadingWorkshopImages.value = new Set([...loadingWorkshopImages.value].filter(key => key !== requestKey));
  }
}

async function loadPackPreview(pack: PackSummary): Promise<void> {
  if (!pack.preview_image_id) return;
  await loadWorkshopImage({ id: pack.preview_image_id, byte_size: 0 }, false);
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

async function setPreviewImage(imageId: string): Promise<void> {
  if (!ownDetail.value || ownDetail.value.pack.preview_image_id === imageId) return;
  const packId = ownDetail.value.pack.id;
  busy.value = true;
  try {
    await workshopService.api.updatePack(packId, { preview_image_id: imageId });
    ownDetail.value.pack.preview_image_id = imageId;
    await refreshOwnPackSummaries();
    tell('预览图已更新');
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
  const removedImageIds = ownDetail.value.images.map(image => image.id);
  busy.value = true;
  try {
    await workshopService.api.deletePack(ownDetail.value.pack.id);
    for (const imageId of removedImageIds) {
      removeWorkshopImageUrl(imageId);
      void workshopService.removePreviewImage(imageId);
    }
    ownDetail.value = undefined;
    clearOwnImageSelection();
    await loadOwnPacks();
    tell('图包已删除');
  } catch (error) {
    tell(errorText(error), 'error');
  } finally {
    busy.value = false;
  }
}

function pickUploadFile(event: Event): void {
  uploadFiles.value = Array.from((event.target as HTMLInputElement).files ?? []);
}
function chooseUploadFile(): void {
  uploadInput.value?.click();
}
function uploadSelectionLabel(): string {
  if (!uploadFiles.value.length) return '尚未选择图片';
  if (uploadFiles.value.length === 1) return uploadFiles.value[0].name;
  return `已选择 ${uploadFiles.value.length} 张图片`;
}
function uploadSelectionBytes(): number {
  return uploadFiles.value.reduce((total, file) => total + file.size, 0);
}
async function uploadCurrentImage(): Promise<void> {
  if (!ownDetail.value || !uploadFiles.value.length) return;
  const aliases = aliasTerms(upload.aliases);
  const packId = ownDetail.value.pack.id;
  const files = [...uploadFiles.value];
  const sharedMetadata = {
    rating: upload.rating,
    characterName: upload.characterName,
    aliases,
  };
  const failures: Array<{ name: string; reason: string }> = [];
  let completed = 0;
  busy.value = true;
  Object.assign(uploadProgress, { current: 0, total: files.length });
  try {
    for (const [index, file] of files.entries()) {
      uploadProgress.current = index + 1;
      try {
        const prepared = await prepareUploadImage(file);
        const result = await workshopService.api.uploadImage(packId, {
          file: prepared.blob,
          filename: prepared.filename,
          ...sharedMetadata,
        });
        if (ownDetail.value?.pack.id === packId) {
          ownDetail.value.images.push(result.image);
          ownDetail.value.pack.image_count = ownDetail.value.images.length;
          ownDetail.value.pack.preview_image_id ??= result.image.id;
          removeWorkshopImageUrl(result.image.id);
          workshopImageUrls[result.image.id] = URL.createObjectURL(prepared.blob);
          failedWorkshopImages.value = new Set(
            [...failedWorkshopImages.value].filter(key => !key.endsWith(`:${result.image.id}`)),
          );
          void workshopService.cachePreviewImage(result.image.id, prepared.blob);
        }
        completed += 1;
      } catch (error) {
        failures.push({ name: file.name, reason: errorText(error) });
        console.error(`[创意工坊] 图片“${file.name}”上传失败：`, error);
      }
    }
    const inheritedCharacterName = editPack.category === '人物' ? upload.characterName.trim() : '';
    Object.assign(upload, {
      rating: 'sfw',
      characterName: inheritedCharacterName,
      aliases: '',
    });
    uploadFiles.value = [];
    if (uploadInput.value) uploadInput.value.value = '';
    if (completed > 0) {
      await loadOwnPacks();
    }
    if (failures.length) {
      const shown = failures.slice(0, 5).map(item => `${item.name}：${item.reason}`);
      const remaining = failures.length - shown.length;
      tell(
        `成功上传 ${completed} 张，已跳过 ${failures.length} 张：${shown.join('；')}${remaining ? `；另有 ${remaining} 张失败` : ''}`,
        'error',
      );
    } else {
      tell(`成功处理并上传 ${completed} 张图片`);
    }
  } finally {
    Object.assign(uploadProgress, { current: 0, total: 0 });
    busy.value = false;
  }
}

function toggleOwnImageSelection(imageId: string): void {
  const next = new Set(selectedOwnImageIds.value);
  if (next.has(imageId)) next.delete(imageId);
  else next.add(imageId);
  selectedOwnImageIds.value = next;
}

function selectAllOwnImages(): void {
  selectedOwnImageIds.value = new Set(ownDetail.value?.images.map(image => image.id) ?? []);
}

function clearOwnImageSelection(): void {
  selectedOwnImageIds.value = new Set();
}

async function deleteSelectedImages(): Promise<void> {
  if (!ownDetail.value || !selectedOwnImageIds.value.size) return;
  const targets = ownDetail.value.images.filter(image => selectedOwnImageIds.value.has(image.id));
  if (!window.parent.confirm(`确定删除所选的 ${targets.length} 张图片吗？此操作无法撤销。`)) return;
  const packId = ownDetail.value.pack.id;
  const deletedIds = new Set<string>();
  const failures: string[] = [];
  busy.value = true;
  try {
    for (const image of targets) {
      try {
        await workshopService.api.deleteImage(packId, image.id);
        deletedIds.add(image.id);
        removeWorkshopImageUrl(image.id);
        void workshopService.removePreviewImage(image.id);
      } catch (error) {
        failures.push(`${image.character_name || image.id}：${errorText(error)}`);
      }
    }
    if (deletedIds.size) {
      ownDetail.value = await workshopService.api.getOwnPack(packId);
      selectedOwnImageIds.value = new Set([...selectedOwnImageIds.value].filter(imageId => !deletedIds.has(imageId)));
      await refreshOwnPackSummaries();
    }
    if (failures.length) {
      tell(`已删除 ${deletedIds.size} 张，${failures.length} 张失败：${failures.slice(0, 3).join('；')}`, 'error');
    } else {
      tell(`已删除 ${deletedIds.size} 张图片`);
    }
  } finally {
    busy.value = false;
  }
}

function beginImageEdit(image: PackImage): void {
  imageEdit.value = {
    id: image.id,
    rating: image.rating,
    characterName: image.character_name,
    aliases: (image.aliases ?? []).join('，'),
  };
}
async function saveImageEdit(): Promise<void> {
  if (!ownDetail.value || !imageEdit.value) return;
  const edit = imageEdit.value;
  const aliases = aliasTerms(edit.aliases);
  busy.value = true;
  try {
    await workshopService.api.updateImage(ownDetail.value.pack.id, edit.id, {
      rating: edit.rating,
      character_name: edit.characterName,
      aliases,
    });
    const image = ownDetail.value.images.find(item => item.id === edit.id);
    if (image) Object.assign(image, { rating: edit.rating, character_name: edit.characterName, aliases });
    imageEdit.value = null;
    await refreshOwnPackSummaries();
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
    removeWorkshopImageUrl(imageId);
    void workshopService.removePreviewImage(imageId);
    selectedOwnImageIds.value = new Set([...selectedOwnImageIds.value].filter(id => id !== imageId));
    await loadOwnDetail(ownDetail.value.pack.id);
    await refreshOwnPackSummaries();
    tell('图片已删除');
  } catch (error) {
    tell(errorText(error), 'error');
  } finally {
    busy.value = false;
  }
}

onMounted(async () => {
  readSharedTheme();
  window.parent.addEventListener('rb-theme-change', handleThemeChange);
  window.parent.addEventListener('storage', readSharedTheme);
  await refreshLocal();
  await loadPublicPacks(true);
});

watch(workshopVisible, visible => {
  if (visible) readSharedTheme();
  else if (loginPending.value) workshopService.api.cancelLogin();
});

onBeforeUnmount(() => {
  workshopService.api.cancelLogin();
  clearWorkshopImageUrls();
  window.parent.removeEventListener('rb-theme-change', handleThemeChange);
  window.parent.removeEventListener('storage', readSharedTheme);
});
</script>
