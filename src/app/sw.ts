/// <reference lib="esnext" />
/// <reference lib="webworker" />

// Folio Service Worker（Serwist 驱动）
// 仅生产构建启用（next.config.ts 里 `disable: isDev`）。
// 策略：默认缓存（图片/字体/静态资源 stale-while-revalidate），导航预加载开启。
// 业务 API（/api/*）不做缓存，避免缓存到登录后的私有数据。

import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();
