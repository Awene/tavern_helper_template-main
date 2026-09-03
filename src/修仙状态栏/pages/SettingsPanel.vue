<template>
  <transition name="xy-fade">
    <div v-if="state.settingsOpen" class="xy-confirm-overlay" @click="close" @contextmenu.prevent>
      <div class="xy-settings-box" @click.stop>
        <div class="xy-confirm-title">设置</div>

        <!-- ========== 变量更新方式 ========== -->
        <section class="xy-set-section">
          <div class="xy-set-label">变量更新方式</div>
          <div class="xy-set-hint">
            切换后会自动开关世界书与预设里对应的条目。选「额外API」还需在 MVU 扩展里
            设好额外模型的地址与密钥（一次性）。
          </div>

          <div class="xy-set-options" :class="{ busy: loading }">
            <button
              type="button"
              class="xy-set-opt"
              :class="{ active: mode === '额外API' }"
              :disabled="loading"
              @click="switchMode('额外API')"
            >
              <span class="xy-set-opt-name">额外API输出</span>
              <span class="xy-set-opt-tag">推荐 · 正文更干净</span>
              <span v-if="mode === '额外API'" class="xy-set-opt-check">✓</span>
            </button>
            <button
              type="button"
              class="xy-set-opt"
              :class="{ active: mode === '随主API' }"
              :disabled="loading"
              @click="switchMode('随主API')"
            >
              <span class="xy-set-opt-name">随主AI输出</span>
              <span class="xy-set-opt-tag">开箱即用 · 长文易出错</span>
              <span v-if="mode === '随主API'" class="xy-set-opt-check">✓</span>
            </button>
          </div>
          <div class="xy-set-state">
            {{ loading ? '读取中…' : `当前：${mode === '额外API' ? '额外API输出' : '随主AI输出'}` }}
          </div>
        </section>

        <section class="xy-set-section xy-unicode-section">
          <div class="xy-set-section-head">
            <div>
              <div class="xy-set-label">Unicode 转码</div>
              <div class="xy-set-hint">角色卡内置的输入编码与回复还原。设置会保存在当前浏览器中。</div>
            </div>
            <span v-if="unicodeReady" class="xy-set-status" :class="{ active: unicodeSettings.enabled }">
              {{ unicodeSettings.enabled ? '转码中' : '未启用' }}
            </span>
          </div>

          <div v-if="unicodeLoading" class="xy-set-loading">正在连接 Unicode 转码脚本…</div>
          <div v-else-if="unicodeError" class="xy-set-error">
            <span>{{ unicodeError }}</span>
            <button type="button" class="xy-mini-btn" @click="loadUnicodeSettings">重新连接</button>
          </div>
          <template v-else>
            <div class="xy-toggle-list">
              <label class="xy-toggle-card">
                <span class="xy-toggle-copy">
                  <strong>转码输出</strong>
                  <small>要求 AI 转码指定范围，并在生成结束后自动还原。</small>
                </span>
                <input
                  v-model="unicodeSettings.enabled"
                  type="checkbox"
                  @change="updateUnicodeBoolean('enabled')"
                />
                <span class="xy-switch" aria-hidden="true"></span>
              </label>

              <label class="xy-toggle-card">
                <span class="xy-toggle-copy">
                  <strong>编码用户输入</strong>
                  <small>编码发给主 AI 的用户输入副本；聊天楼层仍保留原文。</small>
                </span>
                <input
                  v-model="unicodeSettings.encodeUserPrompt"
                  type="checkbox"
                  @change="updateUnicodeBoolean('encodeUserPrompt')"
                />
                <span class="xy-switch" aria-hidden="true"></span>
              </label>

              <label class="xy-toggle-card" :class="{ disabled: !unicodeSettings.enabled }">
                <span class="xy-toggle-copy">
                  <strong>间隔转码</strong>
                  <small>每隔 2～3 个自然词转码一字；仍发生截断时可关闭。</small>
                </span>
                <input
                  v-model="unicodeSettings.sparseOutputEncoding"
                  type="checkbox"
                  :disabled="!unicodeSettings.enabled"
                  @change="updateUnicodeBoolean('sparseOutputEncoding')"
                />
                <span class="xy-switch" aria-hidden="true"></span>
              </label>
            </div>

            <div class="xy-set-subtitle">编码范围</div>
            <div class="xy-unicode-segments" :class="{ disabled: !unicodeSettings.enabled }">
              <button
                v-for="scope in unicodeScopes"
                :key="scope.id"
                type="button"
                :class="{ active: unicodeSettings.encodingScope === scope.id }"
                :disabled="!unicodeSettings.enabled"
                :title="scope.target"
                @click="setUnicodeScope(scope.id)"
              >
                {{ scope.name }}
              </button>
            </div>

            <div class="xy-set-subtitle">编码方案</div>
            <select
              v-model="unicodeSettings.encodingScheme"
              class="xy-unicode-select"
              :disabled="!unicodeSettings.enabled"
              @change="setUnicodeScheme"
            >
              <option v-for="scheme in unicodeSchemes" :key="scheme.id" :value="scheme.id">
                {{ scheme.name }}{{ scheme.badge ? ` · ${scheme.badge}` : '' }}
              </option>
            </select>
            <div v-if="selectedScheme" class="xy-unicode-protocol">
              <div>
                <strong>{{ selectedScheme.name }}</strong>
                <span v-if="selectedScheme.badge">{{ selectedScheme.badge }}</span>
              </div>
              <p>{{ selectedScheme.description }}</p>
              <code>{{ selectedScheme.example }}</code>
            </div>

            <label class="xy-set-inline-check">
              <input
                v-model="unicodeSettings.fixedCharacterReplacement"
                type="checkbox"
                @change="updateUnicodeBoolean('fixedCharacterReplacement')"
              />
              <span>兼容修复少量已知错字</span>
            </label>

            <div class="xy-unicode-note">
              标签、面板骨架与 JSON Patch 始终保持明文；当前预设继续决定模块及输出顺序。
            </div>
            <button type="button" class="xy-unicode-retry" @click="retryLatestDecode">重新解码最新 AI 楼层</button>
          </template>
        </section>

        <div class="xy-confirm-actions">
          <button type="button" class="xy-btn" @click="close">关闭</button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { state, showToast } from '../composables';
import { applyApiMode, getApiMode, type ApiMode } from '../../shared/apiMode';
import {
  getUnicodeTranscoderApi,
  type UnicodeEncodingScheme,
  type UnicodeEncodingScope,
  type UnicodeTranscoderApi,
  type UnicodeTranscoderSettings,
} from '../unicodeTranscoder';

const mode = ref<ApiMode>('额外API');
const loading = ref(true);
const unicodeLoading = ref(true);
const unicodeError = ref('');
const unicodeReady = ref(false);
const unicodeApi = ref<UnicodeTranscoderApi | null>(null);
const unicodeScopes = ref<UnicodeEncodingScope[]>([]);
const unicodeSchemes = ref<UnicodeEncodingScheme[]>([]);
const unicodeSettings = reactive<UnicodeTranscoderSettings>({
  enabled: false,
  encodeUserPrompt: false,
  encodeAllUserHistory: true,
  encodingScheme: 'unicode_compact_block',
  encodingScope: 'body',
  sparseOutputEncoding: true,
  sparseOutputMinWords: 2,
  sparseOutputMaxWords: 3,
  fixedCharacterReplacement: true,
  decodeAssistantOutput: true,
  runTagCleanerAfterDecode: true,
});

const selectedScheme = computed(() =>
  unicodeSchemes.value.find(scheme => scheme.id === unicodeSettings.encodingScheme),
);

function close() {
  state.settingsOpen = false;
}

async function switchMode(next: ApiMode) {
  if (loading.value || next === mode.value) return;
  loading.value = true;
  try {
    const res = await applyApiMode(next);
    if (res.ok) {
      mode.value = next;
      const label = next === '额外API' ? '额外API输出' : '随主AI输出';
      showToast(`已切换为「${label}」（世界书 ${res.worldbookChanged} 条 / 预设 ${res.presetChanged} 条）`);
    } else {
      showToast('切换失败，请检查酒馆环境');
    }
  } catch {
    showToast('切换失败');
  } finally {
    loading.value = false;
  }
}

function syncUnicodeSettings() {
  if (!unicodeApi.value) return;
  Object.assign(unicodeSettings, unicodeApi.value.getSettings());
}

async function loadUnicodeSettings() {
  unicodeLoading.value = true;
  unicodeError.value = '';
  unicodeReady.value = false;
  try {
    unicodeApi.value = await getUnicodeTranscoderApi();
    unicodeScopes.value = unicodeApi.value.listEncodingScopes();
    unicodeSchemes.value = unicodeApi.value.listEncodingSchemes();
    syncUnicodeSettings();
    unicodeReady.value = true;
  } catch (error) {
    unicodeApi.value = null;
    unicodeError.value = error instanceof Error ? error.message : 'Unicode 转码角色脚本未加载';
  } finally {
    unicodeLoading.value = false;
  }
}

function updateUnicodeBoolean(
  key: 'enabled' | 'encodeUserPrompt' | 'sparseOutputEncoding' | 'fixedCharacterReplacement',
) {
  const api = unicodeApi.value;
  if (!api) return;
  if (key === 'enabled') api.setMasterEnabled(unicodeSettings.enabled, { notify: false });
  if (key === 'encodeUserPrompt') api.setUserInputEncoding(unicodeSettings.encodeUserPrompt, { notify: false });
  if (key === 'sparseOutputEncoding') {
    api.setSparseOutputEncoding(unicodeSettings.sparseOutputEncoding, { notify: false });
  }
  if (key === 'fixedCharacterReplacement') {
    api.setFixedCharacterReplacement(unicodeSettings.fixedCharacterReplacement, { notify: false });
  }
  syncUnicodeSettings();
  showToast('Unicode 转码设置已保存');
}

function setUnicodeScope(scope: string) {
  if (!unicodeApi.value) return;
  unicodeApi.value.setEncodingScope(scope, { notify: false });
  syncUnicodeSettings();
  showToast('编码范围已保存');
}

function setUnicodeScheme() {
  if (!unicodeApi.value) return;
  unicodeApi.value.setEncodingScheme(unicodeSettings.encodingScheme, { notify: false });
  syncUnicodeSettings();
  showToast('编码方案已保存');
}

async function retryLatestDecode() {
  if (!unicodeApi.value) return;
  try {
    await unicodeApi.value.retryLatestDecode();
  } catch {
    showToast('重新解码失败');
  }
}

onMounted(async () => {
  void loadUnicodeSettings();
  try {
    mode.value = await getApiMode();
  } catch {
    /* 保底默认额外API */
  } finally {
    loading.value = false;
  }
});
</script>
