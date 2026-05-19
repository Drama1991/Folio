"use client";

import { aiHistory } from "@/lib/ai/replies";

export function AIHistoryDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div
      className="slide-in"
      style={{
        position: "absolute", inset: 0, background: "var(--bg)", padding: "12px 16px",
        display: "flex", flexDirection: "column", zIndex: 5,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <p style={{ fontFamily: "var(--serif)", fontSize: 14, fontWeight: 500 }}>对话历史</p>
        <button className="btn" style={{ fontSize: 11, padding: "4px 9px" }} onClick={onClose}>返回</button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
        {aiHistory.map((h) => (
          <div key={h.id} style={{ border: "0.5px solid var(--border)", borderRadius: "var(--r2)", padding: "10px 12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)" }}>{h.ctxLabel}</span>
              <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)" }}>{h.date} · {h.time}</span>
            </div>
            <p style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.55 }}>{h.preview}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
