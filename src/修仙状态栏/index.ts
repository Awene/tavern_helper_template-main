import App from './App.vue';
import './global.css';

let initialized = false;

$(async () => {
  if (initialized) return;
  initialized = true;

  await waitGlobalInitialized('Mvu');

  // 直接挂载应用，让 store 自己处理数据初始化
  createApp(App).use(createPinia()).mount('#app');
});
