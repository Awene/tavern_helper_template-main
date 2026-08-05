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
      loading="lazy"
      @load="handleLoad"
      @error="handleError"
    />

    <div v-if="state === 'loading'" class="cw-media-state cw-media-loading" role="status" aria-live="polite">
      <span class="cw-media-spinner" aria-hidden="true"></span>
      <small>图片加载中</small>
    </div>
    <div
      v-else-if="state === 'error'"
      class="cw-media-state cw-media-error"
      role="group"
      :aria-label="`${alt}加载失败`"
    >
      <button type="button" :aria-label="`重新加载${alt}`" @click.stop="retry">
        <span aria-hidden="true">!</span>
        <small>加载失败，点击重试</small>
      </button>
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
    requestable?: boolean;
    emptyLabel?: string;
    maxRetries?: number;
  }>(),
  {
    src: '',
    fit: 'cover',
    blurBackground: false,
    pending: false,
    failed: false,
    requestable: false,
    emptyLabel: '暂无图片',
    maxRetries: 2,
  },
);

const emit = defineEmits<{
  request: [];
}>();

const root = ref<HTMLElement>();
const activeSrc = ref('');
const state = ref<LoadState>('idle');
const visible = ref(false);
const backdropImage = computed(() => (activeSrc.value ? `url(${JSON.stringify(activeSrc.value)})` : 'none'));

let observer: IntersectionObserver | undefined;
let retryTimer: number | undefined;
let retryCount = 0;
let requestedDeferredSource = false;

function clearRetryTimer(): void {
  if (retryTimer !== undefined) window.clearTimeout(retryTimer);
  retryTimer = undefined;
}

function retryUrl(source: string): string {
  if (!/^https?:/iu.test(source)) return source;
  const url = new URL(source);
  url.searchParams.set('cw_retry', String(Date.now()));
  return url.toString();
}

function fail(): void {
  clearRetryTimer();
  activeSrc.value = '';
  state.value = 'error';
}

function requestSource(force = false): void {
  if (!props.requestable || requestedDeferredSource || props.pending || (!force && props.failed) || !visible.value)
    return;
  requestedDeferredSource = true;
  state.value = 'loading';
  emit('request');
}

function startLoad(): void {
  const source = props.src?.trim();
  if (!source || props.pending || props.failed || !visible.value) {
    if (!source) requestSource();
    return;
  }
  state.value = 'loading';
  activeSrc.value = source;
}

function reset(): void {
  clearRetryTimer();
  activeSrc.value = '';
  retryCount = 0;
  if (props.src?.trim()) requestedDeferredSource = false;
  if (props.failed) {
    requestedDeferredSource = false;
    state.value = 'error';
  } else if (props.pending) state.value = 'loading';
  else if (!props.src?.trim()) {
    state.value = props.requestable ? 'loading' : 'empty';
    requestSource();
  } else {
    state.value = 'loading';
    startLoad();
  }
}

function handleLoad(): void {
  clearRetryTimer();
  state.value = 'loaded';
}

function handleError(): void {
  if (retryCount < props.maxRetries && props.src?.trim()) {
    retryCount += 1;
    activeSrc.value = '';
    state.value = 'loading';
    clearRetryTimer();
    retryTimer = window.setTimeout(() => {
      void nextTick(() => {
        activeSrc.value = retryUrl(props.src!.trim());
      });
    }, 800 * retryCount);
    return;
  }
  fail();
}

function retry(): void {
  clearRetryTimer();
  retryCount = 0;
  if (props.requestable && !props.src?.trim()) {
    requestedDeferredSource = false;
    requestSource(true);
    return;
  }
  const source = props.src?.trim();
  if (!source) return;
  state.value = 'loading';
  activeSrc.value = '';
  void nextTick(() => {
    activeSrc.value = retryUrl(source);
  });
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
  clearRetryTimer();
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
.cw-media-loading small {
  width: fit-content;
  margin: auto;
  padding: 3px 8px;
  border: 1px solid color-mix(in srgb, var(--cw-line) 72%, transparent);
  border-radius: 999px;
  color: var(--cw-ink);
  background: color-mix(in srgb, var(--cw-paper) 88%, transparent);
  box-shadow: 0 2px 8px rgba(46, 34, 25, 0.13);
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
.cw-media-error {
  pointer-events: auto;
}
.cw-media-error button {
  display: grid;
  gap: 7px;
  padding: 8px 10px;
  border: 0;
  border-radius: 9px;
  color: var(--cw-red);
  background: color-mix(in srgb, var(--cw-paper) 90%, transparent);
  box-shadow: 0 3px 12px rgba(46, 34, 25, 0.14);
  cursor: pointer;
  font: inherit;
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
.cw-media-error small {
  color: var(--cw-ink);
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
