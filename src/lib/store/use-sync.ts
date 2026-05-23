"use client";

import { useCallback, useEffect } from "react";
import {
  useSyncPrefs,
  frequencyToMs,
  type SyncLogEntry,
} from "@/lib/store/sync-prefs";

interface SyncApiOk {
  ok: true;
  ts: number;
  durationMs: number;
  total: number;
}
interface SyncApiErr {
  ok: false;
  ts: number;
  durationMs: number;
  error: string;
}

/** P1-10：读 localStorage 最新 lastSyncTs（绕过当前 tab 的 useState 闭包）。
 *  其它 tab 写完会通过 storage event 反向同步 prefs，这里只在 interval tick 时
 *  额外做一次防抖：如果窗口内已被任何 tab 同步过，就跳过当次。 */
function readFreshLastSyncTs(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem("folio:sync");
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as { lastSyncTs?: number | null };
    return typeof parsed.lastSyncTs === "number" ? parsed.lastSyncTs : 0;
  } catch {
    return 0;
  }
}

/** 单次触发同步：调 /api/data/sync，把结果记到 sync-prefs.logs。 */
export function useTriggerSync() {
  const { recordLog } = useSyncPrefs();

  return useCallback(
    async (trigger: SyncLogEntry["trigger"]) => {
      const t0 = Date.now();
      try {
        const res = await fetch("/api/data/sync", { method: "POST" });
        const j = (await res.json().catch(() => null)) as SyncApiOk | SyncApiErr | null;
        if (res.ok && j && j.ok) {
          recordLog({
            ts: j.ts,
            ok: true,
            durationMs: j.durationMs,
            totalItems: j.total,
            trigger,
          });
          return { ok: true, total: j.total };
        }
        const err = j && !j.ok ? j.error : `HTTP ${res.status}`;
        recordLog({ ts: Date.now(), ok: false, durationMs: Date.now() - t0, err, trigger });
        return { ok: false, err };
      } catch (e) {
        const err = e instanceof Error ? e.message : "network_error";
        recordLog({ ts: Date.now(), ok: false, durationMs: Date.now() - t0, err, trigger });
        return { ok: false, err };
      }
    },
    [recordLog],
  );
}

/** 按 frequency 跑定时同步。仅在 frequency 不是 manual 时挂表，
 *  document.hidden 时跳过那一次，避免后台 tab 浪费请求。
 *  P1-10：interval 触发前重读 localStorage 最新 lastSyncTs；若距上次同步
 *  小于 ms/2（多 tab 已有人触发，且 storage event 还未传到本 tab 闭包），
 *  本次跳过。
 *  P2-8：boot-once 逻辑独立成 mount-only effect，interval effect 不再隐式依赖
 *  ranBootRef，消除原 eslint-disable。 */
export function useAutoSync() {
  const { prefs } = useSyncPrefs();
  const trigger = useTriggerSync();

  // ── Boot：挂载时若距上次同步超过当时的 frequency 周期，立即补一次。
  // 只跑一次（mount 时读 prefs.frequency 的当时值，后续不再 re-trigger）。
  useEffect(() => {
    const ms = frequencyToMs(prefs.frequency);
    if (ms === null) return;
    const last = readFreshLastSyncTs();
    if (Date.now() - last > ms && !document.hidden) {
      void trigger("boot");
    }
    // mount-only —— prefs.frequency 后续变化由下面的 interval effect 接管
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Interval：frequency 改变就重挂；ticker 内部按需读 localStorage 最新 ts。
  useEffect(() => {
    const ms = frequencyToMs(prefs.frequency);
    if (ms === null) return;

    const dedupeWindow = Math.min(ms / 2, 60_000);
    const id = window.setInterval(() => {
      if (document.hidden) return;
      const last = readFreshLastSyncTs();
      if (Date.now() - last < dedupeWindow) return; // 其它 tab 刚同步过，跳过
      void trigger("auto");
    }, ms);
    return () => window.clearInterval(id);
  }, [prefs.frequency, trigger]);
}
