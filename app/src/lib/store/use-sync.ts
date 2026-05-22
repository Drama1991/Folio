"use client";

import { useCallback, useEffect, useRef } from "react";
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
 *  document.hidden 时跳过那一次，避免后台 tab 浪费请求。 */
export function useAutoSync() {
  const { prefs } = useSyncPrefs();
  const trigger = useTriggerSync();
  const ranBootRef = useRef(false);

  useEffect(() => {
    const ms = frequencyToMs(prefs.frequency);
    if (ms === null) return;

    // 启动时若距上次同步超过 ms，立即补一次
    if (!ranBootRef.current) {
      ranBootRef.current = true;
      const last = prefs.lastSyncTs ?? 0;
      if (Date.now() - last > ms) {
        if (!document.hidden) void trigger("boot");
      }
    }

    const id = window.setInterval(() => {
      if (document.hidden) return;
      void trigger("auto");
    }, ms);
    return () => window.clearInterval(id);
    // 不依赖 lastSyncTs，避免每次同步重启 interval
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefs.frequency, trigger]);
}
