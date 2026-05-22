"use client";

import { useAutoSync } from "@/lib/store/use-sync";

/** 挂载即生效的客户端定时同步钩子。仅渲染空。 */
export function SyncTicker() {
  useAutoSync();
  return null;
}
