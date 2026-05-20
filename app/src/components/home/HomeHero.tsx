"use client";
import { greeting, todayHeader } from "@/lib/format/dates";
import { useState, useEffect } from "react";
import { useAIPanel } from "@/lib/store/ai-panel";

export function HomeHero({ display }: { display: string }) {
  const [now, setNow] = useState<Date | null>(null);
  const openAI = useAIPanel((s) => s.setOpen);
  useEffect(() => setNow(new Date()), []);
  const g = now ? greeting(now) : "夜安";
  const hd = now ? todayHeader(now) : "";
  return (
    <div style={{ marginBottom: 16, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: "var(--serif)", fontSize: 40, fontWeight: 500, lineHeight: 1, letterSpacing: "-0.02em" }}>
          {g}。
        </p>
        <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", letterSpacing: ".06em", marginTop: 8 }}>
          {display} · {hd}
        </p>
      </div>
      <button
        onClick={(e) => openAI(true, "home", { x: e.clientX, y: e.clientY })}
        aria-label="AI 建议"
        title="AI 建议"
        className="ai-logo-btn"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
          {/* 主 sparkle —— 四角星，AI 行业视觉锚点 */}
          <path
            d="M12 2.5 L13.7 9.6 L20.8 11.3 L13.7 13.0 L12 20.1 L10.3 13.0 L3.2 11.3 L10.3 9.6 Z"
            fill="url(#aiGrad)"
          />
          {/* 副 sparkle —— 错位小星制造星座感 */}
          <path
            d="M18.8 3.4 L19.4 5.6 L21.6 6.2 L19.4 6.8 L18.8 9.0 L18.2 6.8 L16.0 6.2 L18.2 5.6 Z"
            fill="var(--gold)" opacity="0.65"
          />
          {/* 装饰点 */}
          <circle cx="4.5" cy="18" r="0.9" fill="var(--gold)" opacity="0.5" />
          <defs>
            <linearGradient id="aiGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FFB94A" />
              <stop offset="100%" stopColor="#D17A0A" />
            </linearGradient>
          </defs>
        </svg>
      </button>
    </div>
  );
}
