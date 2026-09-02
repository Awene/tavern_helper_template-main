<template>
  <button
    type="button"
    class="xy-copy-name"
    :title="`复制${label}`"
    :aria-label="`复制${label}：${text}`"
    @click.stop="copyText(text, label)"
  >
    <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" aria-hidden="true">
      <path
        d="M8 7V3h11a2 2 0 0 1 2 2v11h-4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3Zm2 0h5a2 2 0 0 1 2 2v5h2V5h-9v2Zm-5 2v10h10V9H5Z"
      />
    </svg>
  </button>
</template>

<script setup lang="ts">
import { copyText } from '../composables';

withDefaults(defineProps<{ text: string; label?: string }>(), { label: '名称' });
</script>
