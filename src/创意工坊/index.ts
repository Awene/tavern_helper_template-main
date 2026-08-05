import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './App.vue';
import { workshopService } from './service';
import './style.scss';
import type { WorkshopBridge } from './types';
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
  hostDocument.body.appendChild(mount);
  const transplantedStyles = transplantStyles(hostDocument);
  app.mount(mount);

  const bridge: WorkshopBridge = {
    version: '0.3.0',
    open: openWorkshop,
    close: closeWorkshop,
    matchImages: request => workshopService.matchImages(request),
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

function resolveHostWindow(): Window {
  try {
    if (window.parent && window.parent !== window && window.parent.document?.body) return window.parent;
  } catch (error) {
    console.warn('[创意工坊] 无法访问酒馆父页面，将使用当前脚本页面:', error);
  }
  return window;
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
