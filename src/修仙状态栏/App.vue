<template>
  <div v-if="store.data" class="xy-app">
    <!-- 装饰背景：远山 + 仙鹤 + 印章 -->
    <div class="xy-bg" aria-hidden="true">
      <svg class="xy-bg-mountain" viewBox="0 0 1200 240" preserveAspectRatio="none">
        <defs>
          <linearGradient id="mtGrad" x1="0" y1="0" x2="0" y2="1">
            <stop class="xy-mt-stop-1" offset="0%" />
            <stop class="xy-mt-stop-2" offset="100%" />
          </linearGradient>
          <linearGradient id="mtGrad2" x1="0" y1="0" x2="0" y2="1">
            <stop class="xy-mt-stop-3" offset="0%" />
            <stop class="xy-mt-stop-4" offset="100%" />
          </linearGradient>
        </defs>
        <path d="M0,200 Q120,80 220,140 T420,120 T620,160 T840,100 T1060,150 T1200,130 L1200,240 L0,240 Z" fill="url(#mtGrad)" />
        <path d="M0,220 Q150,150 280,200 T520,180 T780,210 T1020,170 T1200,200 L1200,240 L0,240 Z" fill="url(#mtGrad2)" />
      </svg>
      <svg class="xy-crane xy-crane-1" viewBox="0 0 80 60">
        <path
          class="xy-crane-body"
          d="M5,40 Q15,28 28,30 Q34,22 42,26 Q50,20 56,28 Q62,26 70,32 Q66,38 58,38 Q52,44 44,42 Q38,48 30,44 Q22,48 14,44 Q8,46 5,40 Z"
        />
        <circle cx="62" cy="29" r="1.2" fill="#b13a3a" />
        <path class="xy-crane-tail" d="M64,28 L72,24" stroke-width="1" fill="none" />
      </svg>
      <svg class="xy-crane xy-crane-2" viewBox="0 0 80 60">
        <path
          class="xy-crane-body xy-crane-body--soft"
          d="M5,40 Q15,28 28,30 Q34,22 42,26 Q50,20 56,28 Q62,26 70,32 Q66,38 58,38 Q52,44 44,42 Q38,48 30,44 Q22,48 14,44 Q8,46 5,40 Z"
        />
      </svg>
    </div>

    <!-- 主体卷轴 -->
    <div class="xy-scroll" :class="{ 'xy-scroll-collapsed': state.appCollapsed }">
      <!-- ============ 总折叠条（始终可见） ============ -->
      <div class="xy-app-collapse-bar">
        <button
          v-if="!state.appCollapsed"
          type="button"
          class="xy-edit-toggle"
          :class="{ active: state.editMode }"
          :title="state.editMode ? '关闭编辑模式' : '允许编辑数据'"
          @click="state.editMode = !state.editMode"
        >
          <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" aria-hidden="true">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
          </svg>
          <span>{{ state.editMode ? '编辑中' : '编辑' }}</span>
        </button>
        <span v-if="state.appCollapsed" class="xy-app-collapse-tag">
          {{ store.data.姓名 }} · {{ store.data.修炼进度.境界 }}
        </span>
        <button
          type="button"
          class="xy-app-collapse-btn"
          :title="state.appCollapsed ? '展开状态栏' : '收起状态栏'"
          @click="state.appCollapsed = !state.appCollapsed"
        >
          <span class="xy-app-collapse-caret">{{ state.appCollapsed ? '▸' : '▾' }}</span>
          <span class="xy-app-collapse-label">{{ state.appCollapsed ? '展开' : '收起' }}</span>
        </button>
      </div>

      <div v-show="!state.appCollapsed" class="xy-app-body">
      <!-- ============ 头部 · 道号 / 境界 / 资源 ============ -->
      <header class="xy-hero">
        <div class="xy-hero-top">
          <div class="xy-name-block">
            <div
              class="xy-user-avatar"
              :class="{ 'has-img': getNpcAvatar(USER_AVATAR_KEY) }"
              @click="onAvatarClick(USER_AVATAR_KEY, $event)"
            >
              <img
                v-if="getNpcAvatar(USER_AVATAR_KEY)"
                :src="getNpcAvatar(USER_AVATAR_KEY)"
                :alt="store.data.姓名"
                class="xy-user-avatar-img"
              />
              <span v-else class="xy-user-avatar-char">{{ avatarChar(store.data.姓名) }}</span>
              <button
                type="button"
                class="xy-user-avatar-cam"
                :title="getNpcAvatar(USER_AVATAR_KEY) ? '更换头像（右键清除）' : '上传头像'"
                @click.stop="triggerAvatarUpload(USER_AVATAR_KEY)"
                @contextmenu.prevent.stop="getNpcAvatar(USER_AVATAR_KEY) && clearNpcAvatar(USER_AVATAR_KEY)"
              >
                <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" aria-hidden="true">
                  <path d="M9.5 4l-1.7 2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-3.8L14.5 4h-5zm2.5 4a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
                </svg>
              </button>
            </div>
            <div class="xy-name-meta">
              <h1 class="xy-name">{{ store.data.姓名 }}</h1>
              <div class="xy-realm">
                <span class="xy-realm-label">境界</span>
                <span class="xy-realm-value">{{ store.data.修炼进度.境界 }}</span>
                <span v-if="store.data.修炼进度.天谴 > 0 || state.editMode" class="xy-tianqian">
                  天谴 <EditableValue v-model.number="store.data.修炼进度.天谴" type="number" label="天谴" :min="0" />
                </span>
              </div>
            </div>
          </div>
          <div class="xy-meta-line">
            <span class="xy-meta-item"><i>种</i><EditableValue v-model="store.data.种族" label="种族" /></span>
            <span class="xy-meta-item">
              <i>寿</i><EditableValue v-model.number="store.data.寿元.年龄" type="number" label="年龄" :min="0" />
              / <EditableValue v-model.number="store.data.寿元.寿命" type="number" label="寿命" :min="1" />
            </span>
            <span class="xy-meta-item">
              <i>貌</i><EditableValue v-model.number="store.data.寿元.外观年龄" type="number" label="外观年龄" :min="0" />
            </span>
            <span class="xy-meta-item xy-time">
              <i>时</i>
              <EditableValue v-model.number="store.data.时间.年" type="number" label="年" /> 年
              <EditableValue v-model.number="store.data.时间.月" type="number" label="月" :min="1" :max="12" /> 月
              <EditableValue v-model.number="store.data.时间.日" type="number" label="日" :min="1" :max="31" /> 日 ·
              <EditableValue v-model="store.data.时间.时辰" label="时辰" />
            </span>
          </div>
          <div class="xy-meta-line">
            <span class="xy-meta-item xy-loc">
              <i>地</i>{{ store.data.地点.世界 }} · {{ store.data.地点.地域 }} · {{ store.data.地点.具体地点 }}
            </span>
          </div>
        </div>

        <!-- 三脉资源 -->
        <div class="xy-resources">
          <div class="xy-bar xy-bar-cultivation">
            <div class="xy-bar-head">
              <span class="xy-bar-label">修为</span>
              <span class="xy-bar-num">
                <EditableValue v-model.number="store.data.修炼进度.当前进度" type="number" label="当前修为" :min="0" />
                /
                <EditableValue v-model.number="store.data.修炼进度.进度上限" type="number" label="修为上限" :min="1" />
              </span>
            </div>
            <div class="xy-bar-track">
              <div class="xy-bar-fill" :style="{ width: barPct(store.data.修炼进度.当前进度, store.data.修炼进度.进度上限) + '%' }" />
              <div class="xy-bar-shimmer" :style="{ width: barPct(store.data.修炼进度.当前进度, store.data.修炼进度.进度上限) + '%' }" />
            </div>
          </div>
          <div class="xy-bar xy-bar-blood">
            <div class="xy-bar-head">
              <span class="xy-bar-label">气血</span>
              <span class="xy-bar-num">
                <EditableValue v-model.number="store.data.资源池.气血.现值" type="number" label="气血现值" :min="0" />
                /
                <EditableValue v-model.number="store.data.资源池.气血.上限" type="number" label="气血上限" :min="1" />
              </span>
            </div>
            <div class="xy-bar-track">
              <div class="xy-bar-fill" :style="{ width: barPct(store.data.资源池.气血.现值, store.data.资源池.气血.上限) + '%' }" />
              <div class="xy-bar-shimmer" :style="{ width: barPct(store.data.资源池.气血.现值, store.data.资源池.气血.上限) + '%' }" />
            </div>
          </div>
          <div class="xy-bar xy-bar-spirit">
            <div class="xy-bar-head">
              <span class="xy-bar-label">灵气</span>
              <span class="xy-bar-num">
                <EditableValue v-model.number="store.data.资源池.灵气.现值" type="number" label="灵气现值" :min="0" />
                /
                <EditableValue v-model.number="store.data.资源池.灵气.上限" type="number" label="灵气上限" :min="1" />
              </span>
            </div>
            <div class="xy-bar-track">
              <div class="xy-bar-fill" :style="{ width: barPct(store.data.资源池.灵气.现值, store.data.资源池.灵气.上限) + '%' }" />
              <div class="xy-bar-shimmer" :style="{ width: barPct(store.data.资源池.灵气.现值, store.data.资源池.灵气.上限) + '%' }" />
            </div>
          </div>
          <div class="xy-resource-extra">
            <span class="xy-extra-item"><i>遁速</i><EditableValue v-model.number="store.data.资源池.遁速" type="number" label="遁速" :min="0" /> m/s</span>
          </div>
        </div>

        <!-- 状态效果横条 -->
        <div v-if="!_.isEmpty(store.data.状态效果)" class="xy-buff-strip">
          <button
            v-for="(eff, name) in store.data.状态效果"
            :key="name"
            type="button"
            class="xy-buff-chip"
            :class="['xy-buff-' + (eff.类型 || '特殊'), { active: state.openedBuff === name }]"
            @click="state.openedBuff = state.openedBuff === name ? null : (name as string)"
          >
            {{ name }}<small v-if="eff.层数 > 1">x{{ eff.层数 }}</small>
          </button>
        </div>
        <transition name="xy-fade">
          <div
            v-if="openedBuffData"
            class="xy-buff-detail"
            :class="['xy-buff-' + (openedBuffData.类型 || '特殊')]"
          >
            <div class="xy-buff-detail-head">
              <span class="xy-buff-detail-name">{{ state.openedBuff }}</span>
              <span class="xy-buff-tag">{{ openedBuffData.类型 }}</span>
              <span v-if="openedBuffData.层数 > 1" class="xy-buff-detail-stack">x{{ openedBuffData.层数 }}</span>
              <span class="xy-buff-time">{{ openedBuffData.剩余时间 }}</span>
              <button type="button" class="xy-buff-detail-close" @click="state.openedBuff = null">×</button>
            </div>
            <div v-if="!_.isEmpty(openedBuffData.效果) || state.editMode" class="xy-buff-effects">
              <EffectList v-model="openedBuffData.效果" line-class="xy-buff-effect" />
            </div>
            <div v-if="openedBuffData.来源" class="xy-buff-source">来源：{{ openedBuffData.来源 }}</div>
          </div>
        </transition>
      </header>

      <!-- ============ Tab 导航 ============ -->
      <nav class="xy-tabs">
        <button
          v-for="(t, i) in tabs"
          :key="i"
          :class="['xy-tab', { active: state.currentTab === i }]"
          @click="state.currentTab = i"
        >
          <span class="xy-tab-icon" v-html="t.icon" />
          <span class="xy-tab-label">{{ t.label }}</span>
        </button>
      </nav>

      <!-- ============ Tab 内容 ============ -->
      <transition name="xy-fade" mode="out-in">
        <main :key="state.currentTab" class="xy-content">
          <!-- ▼ 道身 ▼ -->
          <section v-if="state.currentTab === 0" class="xy-page xy-page-persona">
            <!-- 灵根（默认折叠） -->
            <div class="xy-card xy-card-root">
              <button
                type="button"
                class="xy-card-title xy-card-title-clickable"
                :class="{ open: state.userRootOpen }"
                @click="state.userRootOpen = !state.userRootOpen"
              >
                <span class="xy-card-name">灵根</span>
                <span class="xy-card-summary">
                  <span class="xy-card-summary-tag">{{ store.data.灵根.品阶 }}</span>
                  <span>{{ store.data.灵根.名称 }}</span>
                </span>
                <span class="xy-collapse-caret">▾</span>
              </button>
              <div v-show="state.userRootOpen" class="xy-card-body">
                <div class="xy-root-name">
                  <span class="xy-root-rank"><EditableValue v-model="store.data.灵根.品阶" label="灵根品阶" /></span>
                  <span class="xy-root-fullname"><EditableValue v-model="store.data.灵根.名称" label="灵根名称" /></span>
                </div>
                <div class="xy-root-elements">
                  <span
                    v-for="el in store.data.灵根.五行"
                    :key="el"
                    class="xy-element"
                    :style="{ '--el': elColor(el) }"
                  >
                    {{ el === '未知' ? '未' : el }}
                  </span>
                </div>
              </div>
            </div>

            <!-- 体质（默认折叠） -->
            <div class="xy-card xy-card-body-card">
              <button
                type="button"
                class="xy-card-title xy-card-title-clickable"
                :class="{ open: state.userBodyOpen }"
                @click="state.userBodyOpen = !state.userBodyOpen"
              >
                <span class="xy-card-name">体质</span>
                <span class="xy-card-summary">
                  <span>{{ store.data.体质.名称 }}</span>
                </span>
                <span class="xy-collapse-caret">▾</span>
              </button>
              <div v-show="state.userBodyOpen" class="xy-card-body">
                <div class="xy-body-name"><EditableValue v-model="store.data.体质.名称" label="体质名称" /></div>
                <div class="xy-attr-grid">
                  <div class="xy-attr">
                    <span class="xy-attr-label">悟性</span>
                    <span class="xy-attr-value"><EditableValue v-model.number="store.data.体质.悟性" type="number" label="悟性" :min="0" /></span>
                  </div>
                  <div class="xy-attr">
                    <span class="xy-attr-label">根骨</span>
                    <span class="xy-attr-value"><EditableValue v-model.number="store.data.体质.根骨" type="number" label="根骨" :min="0" /></span>
                  </div>
                  <div class="xy-attr">
                    <span class="xy-attr-label">气感</span>
                    <span class="xy-attr-value"><EditableValue v-model.number="store.data.体质.气感" type="number" label="气感" :min="0" /></span>
                  </div>
                </div>
                <div v-if="!_.isEmpty(store.data.体质.效果) || state.editMode" class="xy-body-effects">
                  <EffectList v-model="store.data.体质.效果" line-class="xy-body-effect" />
                </div>
              </div>
            </div>

            <!-- 技艺（默认折叠） -->
            <div class="xy-card xy-card-skill">
              <button
                type="button"
                class="xy-card-title xy-card-title-clickable"
                :class="{ open: state.userSkillOpen }"
                @click="state.userSkillOpen = !state.userSkillOpen"
              >
                <span class="xy-card-name">技艺</span>
                <span class="xy-card-summary"></span>
                <span class="xy-collapse-caret">▾</span>
              </button>
              <div v-show="state.userSkillOpen" class="xy-card-body">
                <div class="xy-skill-group">
                  <div class="xy-skill-group-title">生产</div>
                  <div class="xy-skill-grid">
                    <div v-for="(v, n) in store.data.技艺.生产类" :key="'p-'+n" class="xy-skill">
                      <span class="xy-skill-name">{{ n }}</span>
                      <span class="xy-skill-bar">
                        <span class="xy-skill-fill" :style="{ width: skillPct(v, store.data.修炼进度.境界) + '%' }" />
                      </span>
                      <span class="xy-skill-num">
                        <EditableValue
                          :model-value="v"
                          type="number"
                          :label="String(n)"
                          :min="0"
                          :format="formatSkillNum"
                          @update:model-value="store.data.技艺.生产类[n] = Number($event)"
                        />
                      </span>
                    </div>
                  </div>
                </div>
                <div class="xy-skill-group">
                  <div class="xy-skill-group-title">战斗</div>
                  <div class="xy-skill-grid">
                    <div v-for="(v, n) in store.data.技艺.战斗类" :key="'c-'+n" class="xy-skill">
                      <span class="xy-skill-name">{{ n }}</span>
                      <span class="xy-skill-bar">
                        <span class="xy-skill-fill" :style="{ width: skillPct(v, store.data.修炼进度.境界) + '%' }" />
                      </span>
                      <span class="xy-skill-num">
                        <EditableValue
                          :model-value="v"
                          type="number"
                          :label="String(n)"
                          :min="0"
                          :format="formatSkillNum"
                          @update:model-value="store.data.技艺.战斗类[n] = Number($event)"
                        />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 状态（默认折叠） -->
            <div v-if="!_.isEmpty(store.data.状态效果)" class="xy-card xy-card-buff">
              <button
                type="button"
                class="xy-card-title xy-card-title-clickable"
                :class="{ open: state.userBuffOpen }"
                @click="state.userBuffOpen = !state.userBuffOpen"
              >
                <span class="xy-card-name">状态</span>
                <span class="xy-card-summary">
                  <span>共 {{ Object.keys(store.data.状态效果).length }} 项</span>
                </span>
                <span class="xy-collapse-caret">▾</span>
              </button>
              <div v-show="state.userBuffOpen" class="xy-buff-list xy-card-body">
                <div
                  v-for="(eff, name) in store.data.状态效果"
                  :key="name"
                  class="xy-buff-item"
                  :class="['xy-buff-' + (eff.类型 || '特殊')]"
                >
                  <button
                    type="button"
                    class="xy-trash"
                    title="删除此状态"
                    @click.stop="requestDelete('user-buff', name as string, name as string)"
                  >
                    <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" aria-hidden="true">
                      <path d="M9 3v1H4v2h16V4h-5V3H9zM6 8l1 13h10l1-13H6zm3 2h2v9H9v-9zm4 0h2v9h-2v-9z" />
                    </svg>
                  </button>
                  <div class="xy-buff-head">
                    <span class="xy-buff-name">{{ name }}</span>
                    <span class="xy-buff-tag">{{ eff.类型 }}</span>
                    <span class="xy-buff-time">{{ eff.剩余时间 }}</span>
                  </div>
                  <div v-if="!_.isEmpty(eff.效果) || state.editMode" class="xy-buff-effects">
                    <EffectList v-model="eff.效果" line-class="xy-buff-effect" />
                  </div>
                  <div v-if="eff.来源" class="xy-buff-source">来源：{{ eff.来源 }}</div>
                </div>
              </div>
            </div>
          </section>

          <!-- ▼ 功法 ▼ -->
          <PageArts v-else-if="state.currentTab === 1" />

          <!-- ▼ 储物 ▼ -->
          <PageStorage v-else-if="state.currentTab === 2" />

          <!-- ▼ 关系 ▼ -->
          <PageRelations v-else-if="state.currentTab === 3" />

          <!-- ▼ 传闻 ▼ -->
          <PageRumors v-else-if="state.currentTab === 4" />
        </main>
      </transition>
      </div>
    </div>

    <!-- 全局头像上传 input（始终挂载，避免在道身页面无法触发） -->
    <input
      ref="avatarFileInput"
      type="file"
      accept="image/*"
      class="xy-avatar-file"
      @change="onAvatarFileChange"
    />

    <!-- ============ 头像放大查看 ============ -->
    <transition name="xy-fade">
      <div
        v-if="state.lightboxImage"
        class="xy-lightbox"
        @click="closeLightbox"
        @contextmenu.prevent
      >
        <img :src="state.lightboxImage" class="xy-lightbox-img" alt="头像大图" @click.stop />
        <button
          type="button"
          class="xy-lightbox-close"
          aria-label="关闭"
          @click.stop="closeLightbox"
        >
          ×
        </button>
      </div>
    </transition>

    <!-- ============ 删除确认 ============ -->
    <transition name="xy-fade">
      <div
        v-if="state.confirmDelete"
        class="xy-confirm-overlay"
        @click="cancelDelete"
        @contextmenu.prevent
      >
        <div class="xy-confirm-box" @click.stop>
          <div class="xy-confirm-title">确认删除</div>
          <div class="xy-confirm-msg">
            是否删除「<strong>{{ state.confirmDelete.label }}</strong>」？此操作无法撤销。
          </div>
          <div class="xy-confirm-actions">
            <button type="button" class="xy-btn xy-btn-cancel" @click.stop="cancelDelete">取消</button>
            <button type="button" class="xy-btn xy-btn-danger" @click.stop="performDelete">确认删除</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ============ Toast 提示 ============ -->
    <transition name="xy-toast">
      <div v-if="state.toast" class="xy-toast" @click="state.toast = ''">
        {{ state.toast }}
      </div>
    </transition>

    <!-- 主题切换悬浮按钮 -->
    <button
      type="button"
      class="xy-floating-theme"
      :title="isDark ? '切换日间' : '切换夜间'"
      @click="toggleTheme"
    >
      {{ isDark ? '☀' : '🌙' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import _ from 'lodash';
import { onMounted, ref } from 'vue';
import { useDataStore } from './store';
import PageArts from './pages/PageArts.vue';
import PageStorage from './pages/PageStorage.vue';
import PageRelations from './pages/PageRelations.vue';
import PageRumors from './pages/PageRumors.vue';
import EditableValue from './pages/EditableValue.vue';
import EffectList from './pages/EffectList.vue';
import {
  state,
  tabs,
  USER_AVATAR_KEY,
  avatarFileInput,
  openedBuffData,
  barPct,
  skillPct,
  skillCap,
  formatSkillNum,
  elColor,
  avatarChar,
  getNpcAvatar,
  triggerAvatarUpload,
  clearNpcAvatar,
  onAvatarClick,
  onAvatarFileChange,
  closeLightbox,
  requestDelete,
  cancelDelete,
  performDelete,
} from './composables';

const store = useDataStore();

// 主题：日间 / 夜间
const THEME_KEY = 'xy-theme';
const isDark = ref(false);
function applyTheme(theme: 'light' | 'dark') {
  isDark.value = theme === 'dark';
  const el = document.documentElement;
  if (theme === 'dark') el.setAttribute('data-theme', 'dark');
  else el.removeAttribute('data-theme');
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* ignore */
  }
}
function toggleTheme() {
  applyTheme(isDark.value ? 'light' : 'dark');
}
onMounted(() => {
  let saved: 'light' | 'dark' = 'light';
  try {
    const v = localStorage.getItem(THEME_KEY);
    if (v === 'dark' || v === 'light') saved = v;
  } catch {
    /* ignore */
  }
  applyTheme(saved);
});
</script>
