import { createSSRApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { createPersistPlugin, setupPersistConfigs } from '@/utils/piniaPersist';

export function createApp() {
  const app = createSSRApp(App);
  const pinia = createPinia();

  // 注册持久化配置，安装插件
  setupPersistConfigs();
  pinia.use(createPersistPlugin());

  app.use(pinia);

  return {
    app,
    pinia,
  };
}
