"use client";

import { useEffect, useState } from "react";

export type SyncFrequency = "manual" | "5m" | "1h";

export interface SyncLogEntry {
  ts: number;
  ok: boolean;
  durationMs: number;
  totalItems?: number;
  err?: string;
  trigger: "manual" | "auto" | "boot";
}

export interface SyncPrefs {
  frequency: SyncFrequency;
  broadcast: boolean;
  lastSyncTs: number | null;
  lastSyncOk: boolean | null;
  lastSyncItems: number | null;
  logs: SyncLogEntry[];
}

export const DEFAULT_SYNC_PREFS: SyncPrefs = {
  frequency: "5m",
  broadcast: true,
  lastSyncTs: null,
  lastSyncOk: null,
  lastSyncItems: null,
  logs: [],
};

const KEY = "folio:sync";
const MAX_LOGS = 20;

function read(): SyncPrefs {
  if (typeof window === "undefined") return DEFAULT_SYNC_PREFS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SYNC_PREFS;
    const parsed = JSON.parse(raw) as Partial<SyncPrefs>;
    return {
      ...DEFAULT_SYNC_PREFS,
      ...parsed,
      logs: Array.isArray(parsed.logs) ? parsed.logs.slice(0, MAX_LOGS) : [],
    };
  } catch {
    return DEFAULT_SYNC_PREFS;
  }
}

function write(p: SyncPrefs) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

export function frequencyToMs(f: SyncFrequency): number | null {
  if (f === "5m") return 5 * 60 * 1000;
  if (f === "1h") return 60 * 60 * 1000;
  return null;
}

export function useSyncPrefs() {
  const [prefs, setPrefs] = useState<SyncPrefs>(DEFAULT_SYNC_PREFS);

  useEffect(() => {
    setPrefs(read());
    // 跨 tab 同步
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setPrefs(read());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  function patch<K extends keyof SyncPrefs>(k: K, v: SyncPrefs[K]) {
    setPrefs((cur) => {
      const next = { ...cur, [k]: v };
      write(next);
      return next;
    });
  }

  function recordLog(entry: SyncLogEntry) {
    setPrefs((cur) => {
      const logs = [entry, ...cur.logs].slice(0, MAX_LOGS);
      const next: SyncPrefs = {
        ...cur,
        logs,
        lastSyncTs: entry.ts,
        lastSyncOk: entry.ok,
        lastSyncItems: entry.ok ? entry.totalItems ?? null : cur.lastSyncItems,
      };
      write(next);
      return next;
    });
  }

  function clearLogs() {
    setPrefs((cur) => {
      const next = { ...cur, logs: [] };
      write(next);
      return next;
    });
  }

  return { prefs, patch, recordLog, clearLogs };
}
