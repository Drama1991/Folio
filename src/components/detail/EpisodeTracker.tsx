"use client";

import { useEpisodeProgress } from "@/lib/store/local-progress";
import { relativeTime } from "@/lib/format/dates";

export function EpisodeTracker({ uuid, totalHint }: { uuid: string; totalHint?: number }) {
  const { episodes, total, watched, lastUpdate, toggle, setTotal } = useEpisodeProgress(uuid, totalHint ?? 0);
  const pct = total ? Math.round((watched / total) * 100) : 0;
  const showGrid = total > 0 && total <= 24;
  const cols = total <= 12 ? total : 12;
  const unknown = total === 0;

  return (
    <div style={{ border: "0.5px solid var(--border)", borderRadius: "var(--r)", padding: "14px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span className="section-label">集数追踪</span>
        <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)" }}>
          {lastUpdate ? relativeTime(lastUpdate) : "本机"}
        </span>
      </div>
      {unknown ? (
        <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", marginBottom: 8 }}>
          NeoDB 未提供总集数，请在下方填写后再追踪。
        </p>
      ) : (
        <>
          <p style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text2)", marginBottom: 8 }}>
            第 <span style={{ color: "var(--text)", fontWeight: 600 }}>{watched}</span> / {total} 集 · {pct}%
          </p>
          <div style={{ height: 3, background: "var(--bg2)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ height: "100%", background: "var(--text)", width: `${pct}%`, borderRadius: 2 }} />
          </div>
        </>
      )}
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
                  background: on ? "var(--gold)" : "var(--bg2)",
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
          disabled={unknown || watched >= total}
          style={{ background: "none", border: "none", color: "var(--text3)", fontSize: 11, cursor: unknown ? "not-allowed" : "pointer", fontFamily: "inherit", padding: 0, opacity: unknown ? 0.5 : 1 }}
        >
          + 标记第 {watched + 1} 集已看
        </button>
        <span style={{ flex: 1 }} />
        <label style={{ fontSize: 11, color: "var(--text3)", fontFamily: "var(--mono)" }}>
          总集数{" "}
          <input
            type="number"
            min={1}
            value={total || ""}
            placeholder="?"
            onChange={(e) => setTotal(Math.max(0, Number(e.target.value) || 0))}
            style={{ width: 50, fontSize: 11, padding: "2px 4px", border: "0.5px solid var(--border)", borderRadius: 3, background: "var(--bg)", fontFamily: "var(--mono)" }}
          />
        </label>
      </div>
    </div>
  );
}
