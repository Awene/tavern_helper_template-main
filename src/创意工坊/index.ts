import { createScriptIdDiv, teleportStyle } from '@util/script';
import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './App.vue';
import { workshopService } from './service';
import './style.scss';
import type { WorkshopBridge } from './types';
import { closeWorkshop, openWorkshop } from './ui-state';

const GLOBAL_NAME = 'CultivationWorkshop';

$(() => {
  const app = createApp(App).use(createPinia());
  const $mount = createScriptIdDiv().appendTo('body');
  const { destroy } = teleportStyle();
  app.mount($mount[0]!);

  const bridge: WorkshopBridge = {
    version: '0.1.0',
    open: openWorkshop,
    close: closeWorkshop,
    matchImages: request => workshopService.matchImages(request),
    confirmDisplayed: request => workshopService.confirmDisplayed(request),
    getSettings: () => workshopService.getSettings(),
    setAutoInsert: enabled => workshopService.setAutoInsert(enabled),
    getInstalledSummary: async () => {
      const packs = await workshopService.listInstalled();
      return { installed: packs.length, enabled: packs.filter(pack => pack.enabled).length };
    },
  };

  initializeGlobal(GLOBAL_NAME, bridge);
  try {
    (window.parent as Window & { CultivationWorkshop?: WorkshopBridge }).CultivationWorkshop = bridge;
    window.parent.dispatchEvent(new CustomEvent('cultivation-workshop-ready'));
  } catch (error) {
    console.warn('[创意工坊] 无法向父页面共享接口:', error);
  }

  appendInexistentScriptButtons([{ name: '创意工坊', visible: true }]);
  const stopButton = eventOn(getButtonEvent('创意工坊'), openWorkshop);
  void workshopService.initialize().catch(error => console.error('[创意工坊] 初始化失败:', error));
  console.info('[创意工坊] 客户端脚本已加载');

  $(window).on('pagehide', () => {
    stopButton?.stop?.();
    try {
      const parent = window.parent as Window & { CultivationWorkshop?: WorkshopBridge };
      if (parent.CultivationWorkshop === bridge) delete parent.CultivationWorkshop;
    } catch {
      // ignore
    }
    app.unmount();
    $mount.remove();
    destroy();
  });
});
