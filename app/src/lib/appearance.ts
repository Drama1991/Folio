"use client";

import { useEffect, useState } from "react";

export type Theme = "light" | "dark" | "auto";
export type FontScale = "compact" | "normal" | "relaxed";
export type Density = "cozy" | "compact";
export type MotionPref = "auto" | "on" | "off";

export interface Appearance {
  theme: Theme;
  fontScale: FontScale;
  density: Density;
  motion: MotionPref;
}

export const DEFAULT_APPEARANCE: Appearance = {
  theme: "auto",
  fontScale: "normal",
  density: "cozy",
  motion: "auto",
};

const KEY = "folio:appearance";

function read(): Appearance {
  if (typeof window === "undefined") return DEFAULT_APPEARANCE;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_APPEARANCE;
    const parsed = JSON.parse(raw) as Partial<Appearance>;
    return { ...DEFAULT_APPEARANCE, ...parsed };
  } catch {
    return DEFAULT_APPEARANCE;
  }
}

function apply(a: Appearance) {
  const d = document.documentElement;
  d.dataset.theme = a.theme;
  d.dataset.fontScale = a.fontScale;
  d.dataset.density = a.density;
  d.dataset.motion = a.motion;
}

export function useAppearance(): {
  appearance: Appearance;
  set: <K extends keyof Appearance>(k: K, v: Appearance[K]) => void;
  reset: () => void;
} {
  const [appearance, setAppearance] = useState<Appearance>(DEFAULT_APPEARANCE);

  // 客户端首挂时从 localStorage 同步，避免 SSR/CSR 不一致
  useEffect(() => {
    setAppearance(read());
  }, []);

  function set<K extends keyof Appearance>(k: K, v: Appearance[K]) {
    setAppearance((prev) => {
      const next = { ...prev, [k]: v };
      try {
        window.localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* quota / privacy mode — 静默 */
      }
      apply(next);
      return next;
    });
  }

  function reset() {
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
    apply(DEFAULT_APPEARANCE);
    setAppearance(DEFAULT_APPEARANCE);
  }

  return { appearance, set, reset };
}
