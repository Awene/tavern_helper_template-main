<template>
  <div>
    <h2 class="xs-step-title">验 · 启程准备</h2>
    <p class="xs-step-subtitle">
      先检查组件，再选择模型与变量更新方式。警告不会阻止你继续，但缺少必要组件可能影响开局。
    </p>
    <ComponentCheckPanel />
    <div class="xs-actions">
      <button type="button" class="xs-btn" @click="store.prev">返回封面</button>
      <button type="button" class="xs-btn xs-btn-primary" @click="store.next">前往模型配置 ▸</button>
    </div>
  </div>
</template>
<script setup lang="ts">
import ComponentCheckPanel from '../../shared/ComponentCheckPanel.vue';
import { useStartStore } from '../store';
const store = useStartStore();
</script>
