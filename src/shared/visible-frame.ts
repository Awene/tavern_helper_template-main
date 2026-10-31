import { onBeforeUnmount, onMounted, ref } from 'vue';

// 返回当前 iframe 在外层视口中可见的纵向区间，单位为当前文档 CSS 像素。
export function visibleFrameBounds(target: Window): { top: number; height: number } {
  let top = 0;
  let bottom = target.innerHeight;
  let offset = 0;
  let scale = 1;
  let current = target;
  while (current.parent !== current) {
    try {
      const frame = current.frameElement as HTMLElement | null;
      if (!frame) break;
      const rect = frame.getBoundingClientRect();
      const frameScale = frame.offsetHeight ? rect.height / frame.offsetHeight : 1;
      if (frameScale <= 0) break;
      offset = rect.top + frame.clientTop * frameScale + offset * frameScale;
      scale *= frameScale;
      current = current.parent;
      const viewport = current.visualViewport;
      let viewTop = viewport?.offsetTop ?? 0;
      let viewBottom = viewTop + (viewport?.height ?? current.innerHeight);
      // 酒馆聊天区自身也会裁剪 iframe，底部输入栏并不属于可用区域。
      for (let ancestor = frame.parentElement; ancestor; ancestor = ancestor.parentElement) {
        if (!/^(auto|scroll|hidden|clip)$/.test(current.getComputedStyle(ancestor).overflowY)) continue;
        const box = ancestor.getBoundingClientRect();
        const ancestorScale = ancestor.offsetHeight ? box.height / ancestor.offsetHeight : 1;
        const contentTop = box.top + ancestor.clientTop * ancestorScale;
        viewTop = Math.max(viewTop, contentTop);
        viewBottom = Math.min(viewBottom, contentTop + ancestor.clientHeight * ancestorScale);
      }
      top = Math.max(top, (viewTop - offset) / scale);
      bottom = Math.min(bottom, (viewBottom - offset) / scale);
    } catch {
      break;
    }
  }
  return { top: Math.max(0, top), height: Math.max(0, bottom - top) };
}

export function useVisibleFrame() {
  const bounds = ref(visibleFrameBounds(window));
  const cleanup: Array<() => void> = [];
  const update = () => {
    bounds.value = visibleFrameBounds(window);
  };
  onMounted(() => {
    let current = window;
    while (true) {
      const host = current;
      host.addEventListener('scroll', update, true);
      host.addEventListener('resize', update);
      host.visualViewport?.addEventListener('resize', update);
      host.visualViewport?.addEventListener('scroll', update);
      cleanup.push(() => {
        host.removeEventListener('scroll', update, true);
        host.removeEventListener('resize', update);
        host.visualViewport?.removeEventListener('resize', update);
        host.visualViewport?.removeEventListener('scroll', update);
      });
      try {
        const frame = current.frameElement;
        if (frame) {
          const observer = new ResizeObserver(update);
          observer.observe(frame);
          cleanup.push(() => observer.disconnect());
        }
        if (current.parent === current || !current.parent.document) break;
        current = current.parent;
      } catch {
        break;
      }
    }
    update();
  });
  onBeforeUnmount(() => cleanup.forEach(stop => stop()));
  return bounds;
}
