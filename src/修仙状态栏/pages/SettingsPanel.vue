<template>
  <transition name="xy-fade">
    <div class="xy-confirm-overlay" @click="close" @contextmenu.prevent>
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

        <!-- 未来可在此追加更多设置分区 -->

        <div class="xy-confirm-actions">
          <button type="button" class="xy-btn" @click="close">关闭</button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { state, showToast } from '../composables';
import { applyApiMode, getApiMode, type ApiMode } from '../../shared/apiMode';

const mode = ref<ApiMode>('额外API');
const loading = ref(true);

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

onMounted(async () => {
  try {
    mode.value = await getApiMode();
  } catch {
    /* 保底默认额外API */
  } finally {
    loading.value = false;
  }
});
</script>
