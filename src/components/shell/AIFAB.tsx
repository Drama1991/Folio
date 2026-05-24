"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAIPanel } from "@/lib/store/ai-panel";

const FAB_PATHS = ["/home", "/wishlist", "/discover"];
const IDLE_REVEAL_MS = 180;
const MOBILE_QUERY = "(max-width: 767px)";
const SCROLL_DELTA_PX = 2;

export function AIFAB() {
  const openAI = useAIPanel((s) => s.setOpen);
  const pathname = usePathname();
  const onAllowedPath = FAB_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const [scrolling, setScrolling] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(MOBILE_QUERY);
    // 桌面端永远静止 → 不挂监听，始终显示
    if (!mql.matches) return;

    let idleTimer: ReturnType<typeof setTimeout> | null = null;
    let lastY = window.scrollY;

    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - lastY) > SCROLL_DELTA_PX) {
        setScrolling(true);
        if (idleTimer) clearTimeout(idleTimer);
        idleTimer = setTimeout(() => setScrolling(false), IDLE_REVEAL_MS);
        lastY = y;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (idleTimer) clearTimeout(idleTimer);
    };
  }, []);

  if (!onAllowedPath) return null;

  return (
    <button
      type="button"
      onClick={(e) => openAI(true, "home", { x: e.clientX, y: e.clientY })}
      aria-label="AI 助手"
      title="AI 助手"
      className={`ai-fab${scrolling ? " ai-fab-hidden" : ""}`}
    >
      <i className="ti ti-sparkles" aria-hidden />
    </button>
  );
}
