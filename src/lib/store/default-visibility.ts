"use client";

import { useEffect, useState } from "react";

/** 0 公开 · 1 仅关注者 · 2 仅提及 —— 与 NeoDBVisibility 对齐 */
export type DefaultVisibility = 0 | 1 | 2;

const KEY = "folio:default-visibility";
const DEFAULT: DefaultVisibility = 0;

function read(): DefaultVisibility {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw === null) return DEFAULT;
    const n = Number(raw);
    if (n === 0 || n === 1 || n === 2) return n;
    return DEFAULT;
  } catch {
    return DEFAULT;
  }
}

/** 同步读取（供非 hook 场景：RecordModal 的 onOpen 等）。 */
export function getDefaultVisibility(): DefaultVisibility {
  return read();
}

export function useDefaultVisibility() {
  const [v, setV] = useState<DefaultVisibility>(DEFAULT);

  useEffect(() => {
    setV(read());
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setV(read());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  function set(next: DefaultVisibility) {
    try {
      window.localStorage.setItem(KEY, String(next));
    } catch {
      /* ignore */
    }
    setV(next);
  }

  return { visibility: v, set };
}

export const VISIBILITY_LABELS: Record<DefaultVisibility, string> = {
  0: "公开",
  1: "仅关注者",
  2: "仅提及",
};
