"use client";

import { useEpisodeProgress } from "@/lib/store/local-progress";
import { relativeTime } from "@/lib/format/dates";

export function EpisodeTracker({ uuid, totalHint }: { uuid: string; totalHint?: number }) {
  const { episodes, total, watched, lastUpdate, toggle, setTotal } = useEpisodeProgress(uuid, totalHint || 12);
  const pct = total ? Math.round((watched / total) * 100) : 0;
  const showGrid = total > 0 && total <= 24;
  const cols = total <= 12 ? total : 12;

  return (
    <div style={{ border: "0.5px solid var(--border)", borderRadius: "var(--r)", padding: "14px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span className="section-label">集数追踪</span>
        <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)" }}>
          {lastUpdate ? relativeTime(lastUpdate) : "本机"}
        </span>
      </div>
      <p style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text2)", marginBottom: 8 }}>
        第 <span style={{ color: "var(--text)", fontWeight: 600 }}>{watched}</span> / {total} 集 · {pct}%
      </p>
      <div style={{ height: 3, background: "var(--bg2)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ height: "100%", background: "var(--text)", width: `${pct}%`, borderRadius: 2 }} />
      </div>
      {showGrid && (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols},1fr)`, gap: 5, marginTop: 12 }}>
          {Array.from({ length: total }, (_, i) => {
            const n = i + 1;
            const on = !!episodes[String(n)];
            return (
              <button
                key={n}
                title={`第 ${n} 集`}
                onClick={() => toggle(n)}
                style={{
                  aspectRatio: "1",
                  borderRadius: 3,
                  background: on ? "var(--text)" : "var(--bg2)",
                  border: on ? "none" : "0.5px solid var(--border)",
                  cursor: "pointer",
                  padding: 0,
                }}
              />
            );
          })}
        </div>
      )}
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 12 }}>
        <button
          onClick={() => toggle(watched + 1)}
          disabled={watched >= total}
          style={{ background: "none", border: "none", color: "var(--text3)", fontSize: 11, cursor: "pointer", fontFamily: "inherit", padding: 0 }}
        >
          + 标记第 {watched + 1} 集已看
        </button>
        <span style={{ flex: 1 }} />
        <label style={{ fontSize: 10, color: "var(--text3)", fontFamily: "var(--mono)" }}>
          总集数{" "}
          <input
            type="number"
            min={1}
            value={total}
            onChange={(e) => setTotal(Math.max(1, Number(e.target.value) || 1))}
            style={{ width: 50, fontSize: 10, padding: "2px 4px", border: "0.5px solid var(--border)", borderRadius: 3, background: "var(--bg)", fontFamily: "var(--mono)" }}
          />
        </label>
      </div>
    </div>
  );
}
