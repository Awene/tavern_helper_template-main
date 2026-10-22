<template>
  <div class="component-check" :aria-busy="busy">
    <div class="check-overview">
      <span class="check-seal" aria-hidden="true">检</span>
      <div>
        <h3>{{ busy ? '正在检查行囊…' : error ? '检测未完成' : issues ? `${issues} 项需要留意` : '启程准备就绪' }}</h3>
        <p>检查当前环境与本卡验证基线。仅检测，不会自动安装、更新或改动设置。</p>
      </div>
      <button type="button" :disabled="busy" @click="refresh">{{ busy ? '检测中' : '重新检测' }}</button>
    </div>
    <p v-if="error" class="check-error" role="alert">{{ error }}</p>
    <div class="check-grid" aria-live="polite">
      <article v-for="row in rows" :key="row.id" class="check-item" :class="row.state">
        <div class="check-item-head">
          <strong>{{ row.name }}</strong
          ><span>{{ labels[row.state] }}</span>
        </div>
        <div class="check-version">{{ row.current }}</div>
        <small>验证基线 {{ row.expected }}</small>
        <p>{{ row.detail }}</p>
      </article>
    </div>
    <p class="check-footnote">
      版本基线随角色卡更新，不代表插件的在线最新版本。未标注版本的旧文件会提示确认；更新后请刷新酒馆再检测。
    </p>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { inspectComponents, type ComponentCheck } from './componentCheck';
const rows = ref<ComponentCheck[]>([]),
  busy = ref(true),
  error = ref('');
const issues = computed(() => rows.value.filter(row => row.state !== 'ok').length);
const labels = { ok: '就绪', warning: '需确认', missing: '缺失', unknown: '未知' };
async function refresh() {
  busy.value = true;
  error.value = '';
  try {
    rows.value = await inspectComponents();
  } catch {
    error.value = '检测未完成，请确认酒馆助手已启用后重试。';
  } finally {
    busy.value = false;
  }
}
onMounted(refresh);
</script>
<style scoped>
.component-check {
  color: inherit;
}
.check-overview {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px;
  border: 1px solid #96815755;
  border-radius: 14px;
  background: linear-gradient(120deg, #688d7b16, #b4955710);
}
.check-seal {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border: 1px solid #98855c;
  border-radius: 50%;
  font-size: 23px;
}
h3 {
  margin: 0 0 6px;
  font-size: 19px;
}
p {
  font-size: 12px;
  line-height: 1.7;
  opacity: 0.8;
  margin: 8px 0 0;
}
button {
  margin-left: auto;
  flex-shrink: 0;
  border: 1px solid #8f805a77;
  padding: 8px 12px;
  border-radius: 8px;
  color: inherit;
  background: transparent;
  cursor: pointer;
}
.check-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 16px;
}
.check-item {
  min-width: 0;
  padding: 16px;
  border: 1px solid #9a8b6a44;
  border-left: 3px solid #678c7d;
  border-radius: 10px;
  background: #8c806009;
  overflow-wrap: anywhere;
}
.check-item.warning,
.check-item.unknown {
  border-left-color: #b58e43;
}
.check-item.missing {
  border-left-color: #ba6250;
}
.check-item-head {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
  font-size: 14px;
}
.check-item-head span {
  font-size: 10px;
  padding: 3px 7px;
  border-radius: 20px;
  background: #8c806018;
}
.check-version {
  font-size: 17px;
  margin: 14px 0 4px;
  font-variant-numeric: tabular-nums;
}
small {
  font-size: 11px;
  opacity: 0.6;
}
.check-footnote {
  margin-top: 16px;
}
.check-error {
  color: #bb6553;
}
@media (max-width: 520px) {
  .check-grid {
    grid-template-columns: 1fr;
  }
  .check-overview {
    flex-wrap: wrap;
    padding: 14px;
  }
  .check-overview > div {
    min-width: 0;
    flex: 1;
  }
}
</style>
