<template>
  <section class="model-mode" :aria-busy="busy">
    <h3>模型模式</h3>
    <p>与当前使用的模型系列保持一致。这里只调整预设提示词，实际模型仍在酒馆 API 连接中选择。</p>
    <div class="model-mode-options" role="group" aria-label="预设模型模式">
      <button
        v-for="item in MODEL_MODES"
        :key="item"
        type="button"
        :disabled="busy || disabled"
        :class="{ selected: mode === item }"
        :aria-pressed="mode === item"
        @click="select(item)"
      >
        <span>{{ modelLabel(item) }}</span
        ><small>{{ item === 'Claude' ? '英文思维链' : '中文思维链' }}</small>
      </button>
    </div>
    <p v-if="error" class="model-mode-error" role="alert">
      {{ error }} <button type="button" @click="read">重新读取</button>
    </p>
    <p v-else class="model-mode-status" aria-live="polite">
      {{ busy ? '正在应用…' : mode ? `当前：${modelLabel(mode)} · 选择后自动保存` : '尚未选择唯一模型模式' }}
    </p>
  </section>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { MODEL_MODES, applyModelMode, getModelMode, modelLabel, type ModelMode } from './modelMode';
const props = defineProps<{ disabled?: boolean }>();
const emit = defineEmits<{ busy: [value: boolean] }>();
const mode = ref<ModelMode | null>(null);
const busy = ref(false),
  error = ref('');
function read() {
  try {
    mode.value = getModelMode();
    error.value = '';
  } catch {
    mode.value = null;
    error.value = '无法读取当前预设，请先选择本格修仙预设。';
  }
}
async function select(next: ModelMode) {
  if (busy.value || props.disabled) return;
  busy.value = true;
  emit('busy', true);
  error.value = '';
  try {
    await applyModelMode(next);
    mode.value = next;
  } catch (e) {
    error.value = e instanceof Error ? e.message : '切换失败';
  } finally {
    busy.value = false;
    emit('busy', false);
  }
}
onMounted(read);
</script>
<style scoped>
.model-mode {
  margin: 0 0 22px;
  color: inherit;
}
h3 {
  font-size: 17px;
  margin: 0 0 8px;
}
p {
  font-size: 12px;
  line-height: 1.7;
  opacity: 0.78;
  margin: 8px 0 12px;
}
.model-mode-options {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}
.model-mode-options button {
  border: 1px solid #93836055;
  border-radius: 10px;
  padding: 14px 6px;
  color: inherit;
  background: #9b885b0a;
  cursor: pointer;
}
.model-mode-options .selected {
  border-color: #548d80;
  background: #548d8022;
  box-shadow: inset 0 0 0 1px #548d80;
}
small {
  display: block;
  font-size: 10px;
  margin-top: 5px;
  opacity: 0.7;
}
.model-mode-error {
  color: #c66a54;
  opacity: 1;
}
button:disabled {
  opacity: 0.5;
  cursor: wait;
}
@media (max-width: 480px) {
  .model-mode-options {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
