import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './App.vue';
import { workshopService } from './service';
import './style.scss';
import type { WorkshopBridge, WorkshopMatchResult, WorkshopPlayerData } from './types';
import { closeWorkshop, openWorkshop } from './ui-state';

const GLOBAL_NAME = 'CultivationWorkshop';
let booted = false;

bootWorkshop();

function bootWorkshop(): void {
  if (booted) return;
  booted = true;

  const hostWindow = resolveHostWindow();
  const hostDocument = hostWindow.document;
  const app = createApp(App).use(createPinia());
  const mount = hostDocument.createElement('div');
  mount.dataset.cultivationWorkshop = 'root';
  // 酒馆在移动端可能把脚本放进多层 iframe。显式建立一个完整视口的
  // 挂载层，避免宿主页面针对普通 div 的布局规则把弹窗压成一条边框。
  mount.style.cssText = [
    'position:fixed',
    'inset:0',
    'width:100vw',
    'height:100vh',
    'height:100dvh',
    'z-index:2147483200',
    'pointer-events:none',
  ].join(';');
  hostDocument.body.appendChild(mount);
  const transplantedStyles = transplantStyles(hostDocument);
  app.mount(mount);

  const bridge: WorkshopBridge = {
    version: '0.4.3',
    open: openWorkshop,
    close: closeWorkshop,
    matchImages: async request => toCompatibleMatchResult(await workshopService.matchImages(request)),
    setPreferredPack: (subjectKey, packId) => workshopService.setPreferredPack(subjectKey, packId),
    confirmDisplayed: request => workshopService.confirmDisplayed(request),
    getSettings: () => workshopService.getSettings(),
    setAutoInsert: enabled => workshopService.setAutoInsert(enabled),
    getInstalledSummary: async () => {
      const packs = await workshopService.listInstalled();
      return { installed: packs.length, enabled: packs.filter(pack => pack.enabled).length };
    },
  };

  try {
    (hostWindow as Window & { CultivationWorkshop?: WorkshopBridge }).CultivationWorkshop = bridge;
    hostWindow.dispatchEvent(new CustomEvent('cultivation-workshop-ready'));
  } catch (error) {
    console.warn('[创意工坊] 无法向酒馆主页面共享接口:', error);
  }
  try {
    initializeGlobal(GLOBAL_NAME, bridge);
  } catch (error) {
    console.warn('[创意工坊] 酒馆助手全局接口注册失败，已保留父页面直连接口:', error);
  }

  void workshopService.initialize().catch(error => console.error('[创意工坊] 初始化失败:', error));
  console.info('[创意工坊] 客户端脚本已加载');

  $(window).on('pagehide', () => {
    try {
      const host = hostWindow as Window & { CultivationWorkshop?: WorkshopBridge };
      if (host.CultivationWorkshop === bridge) delete host.CultivationWorkshop;
    } catch {
      // ignore
    }
    app.unmount();
    mount.remove();
    transplantedStyles.forEach(style => style.remove());
    booted = false;
  });
}

function toCompatibleMatchResult(player: WorkshopPlayerData | null): WorkshopMatchResult | null {
  if (!player) return null;
  const preferredPack =
    player.packs.find(
      pack => pack.id === player.preferredPackId && pack.images.some(image => image.rating === player.initialRating),
    ) ??
    player.packs.find(pack => pack.images.some(image => image.rating === player.initialRating)) ??
    player.packs[0];
  const image = preferredPack?.images.find(image => image.rating === player.initialRating) ?? preferredPack?.images[0];
  const legacyImages = image
    ? [
        {
          id: image.id,
          rating: image.rating,
          blob: image.blob,
          characterName: player.kind === 'character' ? player.title : '',
          packName: preferredPack.name,
          author: preferredPack.author,
        },
      ]
    : [];
  return Object.assign(legacyImages, player) as WorkshopMatchResult;
}

function resolveHostWindow(): Window {
  let hostWindow: Window = window;
  let candidate: Window = window;

  // 不能只取直接父窗口：移动端酒馆可能存在“脚本 iframe → 中间 iframe →
  // 酒馆主页面”的结构，中间层的可视高度有时只有几像素。
  while (candidate.parent && candidate.parent !== candidate) {
    try {
      const parentWindow = candidate.parent;
      if (!parentWindow.document?.body) break;
      hostWindow = parentWindow;
      candidate = parentWindow;
    } catch (error) {
      console.warn('[创意工坊] 已到达不可跨域访问的父页面，将使用最高可访问页面:', error);
      break;
    }
  }
  return hostWindow;
}

function transplantStyles(hostDocument: Document): HTMLStyleElement[] {
  if (hostDocument === document) return [];
  return Array.from(document.head.querySelectorAll('style')).map(style => {
    const clone = style.cloneNode(true) as HTMLStyleElement;
    clone.dataset.cultivationWorkshop = 'style';
    hostDocument.head.appendChild(clone);
    return clone;
  });
}
