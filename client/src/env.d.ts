/// <reference types="@dcloudio/types" />

declare module '*.vue' {
  import { DefineComponent } from 'vue';
  const component: DefineComponent<object, object, unknown>;
  export default component;
}

// uni-app 生命周期钩子（<script setup> 编译器宏）
declare function onLoad(callback: (query?: Record<string, string>) => void): void;
declare function onShow(callback: () => void): void;
declare function onReady(callback: () => void): void;
declare function onHide(callback: () => void): void;
declare function onUnload(callback: () => void): void;
declare function onPullDownRefresh(callback: () => void): void;
declare function onReachBottom(callback: () => void): void;
