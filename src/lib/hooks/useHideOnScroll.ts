"use client";

import { useEffect, useState } from "react";

const SHOW_THRESHOLD_PX = 5;
const DELTA_THRESHOLD_PX = 5;
const IDLE_REVEAL_MS = 140;
const MOBILE_QUERY = "(max-width: 767px)";

export function useHideOnScroll(): boolean {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(MOBILE_QUERY);
    let lastY = window.scrollY;
    let idleTimer: ReturnType<typeof setTimeout> | null = null;
    let attached = false;

    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY;
      if (y < SHOW_THRESHOLD_PX) {
        setHidden(false);
      } else if (delta > DELTA_THRESHOLD_PX) {
        setHidden(true);
      } else if (delta < -DELTA_THRESHOLD_PX) {
        setHidden(false);
      }
      lastY = y;
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => setHidden(false), IDLE_REVEAL_MS);
    };

    const attach = () => {
      if (attached) return;
      lastY = window.scrollY;
      window.addEventListener("scroll", onScroll, { passive: true });
      attached = true;
    };
    const detach = () => {
      if (!attached) return;
      window.removeEventListener("scroll", onScroll);
      if (idleTimer) clearTimeout(idleTimer);
      setHidden(false);
      attached = false;
    };

    if (mql.matches) attach();

    const onMql = (e: MediaQueryListEvent) => {
      if (e.matches) attach();
      else detach();
    };
    mql.addEventListener("change", onMql);

    return () => {
      mql.removeEventListener("change", onMql);
      detach();
    };
  }, []);

  return hidden;
}
