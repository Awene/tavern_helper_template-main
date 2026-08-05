<template>
  <div
    ref="root"
    class="cw-media-loader"
    :class="[`is-${state}`, `fit-${fit}`, { 'has-blur': blurBackground }]"
    :aria-busy="state === 'loading'"
  >
    <div
      v-if="blurBackground && state === 'loaded'"
      class="cw-media-backdrop"
      :style="{ backgroundImage: backdropImage }"
      aria-hidden="true"
    ></div>
    <img
      v-if="activeSrc"
      class="cw-media-image"
      :class="{ visible: state === 'loaded' }"
      :src="activeSrc"
      :alt="alt"
      decoding="async"
      @load="handleLoad"
      @error="handleError"
    />

    <div v-if="state === 'loading'" class="cw-media-state cw-media-loading" role="status" aria-live="polite">
      <span class="cw-media-spinner" aria-hidden="true"></span>
      <small>图片加载中</small>
    </div>
    <div v-else-if="state === 'error'" class="cw-media-state cw-media-error" role="img" :aria-label="`${alt}加载失败`">
      <span aria-hidden="true">!</span>
      <small>图片加载失败</small>
    </div>
    <div v-else-if="state === 'empty'" class="cw-media-state cw-media-empty" aria-hidden="true">
      <span>图</span>
      <small>{{ emptyLabel }}</small>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

type LoadState = 'idle' | 'loading' | 'loaded' | 'error' | 'empty';

const props = withDefaults(
  defineProps<{
    src?: string | null;
    alt: string;
    fit?: 'cover' | 'contain';
    blurBackground?: boolean;
    pending?: boolean;
    failed?: boolean;
    emptyLabel?: string;
    timeoutMs?: number;
  }>(),
  {
    src: '',
    fit: 'cover',
    blurBackground: false,
    pending: false,
    failed: false,
    emptyLabel: '暂无图片',
    timeoutMs: 10_000,
  },
);

const root = ref<HTMLElement>();
const activeSrc = ref('');
const state = ref<LoadState>('idle');
const visible = ref(false);
const backdropImage = computed(() => (activeSrc.value ? `url(${JSON.stringify(activeSrc.value)})` : 'none'));

let observer: IntersectionObserver | undefined;
let timeoutId: number | undefined;
let retryCount = 0;

function clearLoadTimeout(): void {
  if (timeoutId !== undefined) window.clearTimeout(timeoutId);
  timeoutId = undefined;
}

function retryUrl(source: string): string {
  if (!/^https?:/iu.test(source)) return source;
  const url = new URL(source);
  url.searchParams.set('cw_retry', String(Date.now()));
  return url.toString();
}

function fail(): void {
  clearLoadTimeout();
  activeSrc.value = '';
  state.value = 'error';
}

function startLoad(): void {
  const source = props.src?.trim();
  if (!source || props.pending || props.failed || !visible.value) return;
  state.value = 'loading';
  activeSrc.value = source;
  clearLoadTimeout();
  timeoutId = window.setTimeout(fail, props.timeoutMs);
}

function reset(): void {
  clearLoadTimeout();
  activeSrc.value = '';
  retryCount = 0;
  if (props.failed) state.value = 'error';
  else if (props.pending) state.value = 'loading';
  else if (!props.src?.trim()) state.value = 'empty';
  else {
    state.value = 'loading';
    startLoad();
  }
}

function handleLoad(): void {
  clearLoadTimeout();
  state.value = 'loaded';
}

function handleError(): void {
  if (retryCount === 0 && props.src?.trim()) {
    retryCount = 1;
    activeSrc.value = '';
    void nextTick(() => {
      activeSrc.value = retryUrl(props.src!.trim());
    });
    return;
  }
  fail();
}

watch(() => [props.src, props.pending, props.failed] as const, reset, { immediate: true });

onMounted(() => {
  if (!root.value || typeof IntersectionObserver === 'undefined') {
    visible.value = true;
    reset();
    return;
  }
  observer = new IntersectionObserver(
    entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      visible.value = true;
      observer?.disconnect();
      observer = undefined;
      reset();
    },
    { rootMargin: '180px' },
  );
  observer.observe(root.value);
});

onBeforeUnmount(() => {
  clearLoadTimeout();
  observer?.disconnect();
});
</script>

<style scoped lang="scss">
.cw-media-loader {
  position: relative;
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;
  overflow: hidden;
  color: var(--cw-muted);
  background:
    radial-gradient(circle at 48% 40%, rgba(190, 139, 80, 0.13), transparent 37%),
    linear-gradient(145deg, var(--cw-paper-2), var(--cw-paper));
}
.cw-media-backdrop {
  position: absolute;
  inset: -12%;
  background-position: center;
  background-size: cover;
  filter: blur(18px) brightness(0.76) saturate(0.82);
  transform: scale(1.05);
}
.cw-media-image {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: block;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 0.24s ease;
}
.cw-media-image.visible {
  opacity: 1;
}
.fit-cover .cw-media-image {
  object-fit: cover;
}
.fit-contain .cw-media-image {
  object-fit: contain;
  filter: drop-shadow(0 5px 12px rgba(0, 0, 0, 0.28));
}
.cw-media-state {
  position: absolute;
  z-index: 2;
  inset: 0;
  display: grid;
  place-content: center;
  gap: 7px;
  text-align: center;
  pointer-events: none;
}
.cw-media-state small {
  font-size: 11px;
  letter-spacing: 0.08em;
}
.cw-media-spinner {
  width: 27px;
  height: 27px;
  margin: auto;
  border: 2px solid color-mix(in srgb, var(--cw-line) 72%, transparent);
  border-top-color: var(--cw-red);
  border-radius: 50%;
  box-shadow: 0 0 14px color-mix(in srgb, var(--cw-red) 16%, transparent);
  animation: cw-media-spin 0.78s linear infinite;
}
.cw-media-error span {
  display: grid;
  width: 28px;
  height: 28px;
  margin: auto;
  place-items: center;
  border: 1px solid color-mix(in srgb, var(--cw-red) 65%, var(--cw-line));
  border-radius: 50%;
  color: var(--cw-red);
  font: 700 17px/1 sans-serif;
}
.cw-media-empty span {
  color: #a96949;
  font-family: 'Ma Shan Zheng', 'KaiTi', serif;
  font-size: 38px;
}
@keyframes cw-media-spin {
  to {
    transform: rotate(360deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .cw-media-spinner {
    animation-duration: 1.8s;
  }
  .cw-media-image {
    transition: none;
  }
}
</style>
