"use client";

import { useReadingProgress } from "@/lib/store/local-progress";
import { relativeTime } from "@/lib/format/dates";

export function ReadingProgress({ uuid, totalHint }: { uuid: string; totalHint?: number }) {
  const { current, total, lastRead, update } = useReadingProgress(uuid, totalHint || 0);
  const pct = total ? Math.round((current / total) * 100) : 0;
  const radius = 28;
  const stroke = 5;
  const c = 2 * Math.PI * radius;
  const offset = c * (1 - pct / 100);

  return (
    <div style={{ border: "0.5px solid var(--border)", borderRadius: "var(--r)", padding: "14px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span className="section-label">阅读进度</span>
        <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)" }}>
          {lastRead ? relativeTime(lastRead) : "本机"}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <svg width="68" height="68" viewBox="0 0 68 68" style={{ flexShrink: 0 }}>
          <circle cx="34" cy="34" r={radius} fill="none" stroke="var(--bg2)" strokeWidth={stroke} />
          <circle
            cx="34" cy="34" r={radius}
            fill="none"
            stroke="var(--text)"
            strokeWidth={stroke}
            strokeDasharray={c}
            strokeDashoffset={offset}
            transform="rotate(-90 34 34)"
            strokeLinecap="round"
          />
          <text x="34" y="38" textAnchor="middle" fontSize="13" fontWeight="600" fill="var(--text)" fontFamily="var(--mono)">
            {pct}%
          </text>
        </svg>
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text2)", marginBottom: 8 }}>
            <span style={{ color: "var(--text)", fontWeight: 600 }}>{current}</span> / {total || "?"} 页
          </p>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              type="number" min={0} max={total || undefined} value={current}
              onChange={(e) => update(Math.max(0, Number(e.target.value) || 0))}
              style={{ width: 60, fontSize: 12, padding: "4px 6px", border: "0.5px solid var(--border)", borderRadius: 4, background: "var(--bg)", fontFamily: "var(--mono)" }}
            />
            <span style={{ fontSize: 11, color: "var(--text3)", lineHeight: "26px" }}>/</span>
            <input
              type="number" min={1} value={total || ""}
              onChange={(e) => update(current, Math.max(0, Number(e.target.value) || 0))}
              placeholder="总页"
              style={{ width: 60, fontSize: 12, padding: "4px 6px", border: "0.5px solid var(--border)", borderRadius: 4, background: "var(--bg)", fontFamily: "var(--mono)" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
