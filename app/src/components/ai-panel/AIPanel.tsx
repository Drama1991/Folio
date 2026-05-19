"use client";

import { useEffect, useRef, useState } from "react";
import { useAIPanel } from "@/lib/store/ai-panel";
import { suggs } from "@/lib/ai/replies";
import { AIHistoryDrawer } from "./AIHistory";

export function AIPanel() {
  const { open, context, history, typing, setOpen, send } = useAIPanel();
  const [input, setInput] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const msgsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
  }, [history.length, typing]);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, setOpen]);

  if (!open) return null;

  const list = suggs[context.key] ?? suggs.home;

  return (
    <div
      className="slide-in"
      style={{
        position: "fixed", right: "max(0px, calc((100vw - 900px) / 2))", top: 54, bottom: 0,
        width: 290, background: "var(--bg)", borderLeft: "0.5px solid var(--border)",
        display: "flex", flexDirection: "column", zIndex: 30,
      }}
    >
      <div style={{ padding: "12px 16px", borderBottom: "0.5px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
          <p style={{ fontFamily: "var(--serif)", fontSize: 14, fontWeight: 500 }}>{context.title}</p>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => setHistoryOpen(true)} className="btn" style={{ fontSize: 11, padding: "4px 9px" }} aria-label="历史">
              <i className="ti ti-history" style={{ fontSize: 12 }} />
            </button>
            <button onClick={() => setOpen(false)} className="btn" style={{ fontSize: 11, padding: "4px 9px" }} aria-label="关闭">×</button>
          </div>
        </div>
        <p style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)", marginTop: 4 }}>{context.subtitle}</p>
      </div>

      <div ref={msgsRef} style={{ flex: 1, overflowY: "auto", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {history.map((m, i) => (
          <div
            key={i}
            className="fade-up"
            style={{
              padding: "9px 13px", borderRadius: "var(--r2)", fontSize: 12, lineHeight: 1.65,
              maxWidth: 210, background: m.role === "ai" ? "var(--bg2)" : "var(--text)",
              color: m.role === "ai" ? "var(--text)" : "var(--bg)",
              alignSelf: m.role === "ai" ? "flex-start" : "flex-end",
            }}
          >
            {m.text}
          </div>
        ))}
        {typing && (
          <div style={{ alignSelf: "flex-start", display: "flex", gap: 4, padding: "9px 13px" }}>
            {[0, 1, 2].map((i) => (
              <span key={i} style={{
                width: 5, height: 5, borderRadius: "50%", background: "var(--text3)",
                animation: "pulse 1.2s infinite", animationDelay: `${i * 0.2}s`,
              }} />
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: "10px 14px", borderTop: "0.5px solid var(--border)" }}>
        <div style={{ display: "flex", gap: 5, marginBottom: 8, flexWrap: "wrap" }}>
          {list.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              style={{
                fontSize: 11, padding: "4px 10px", borderRadius: 999,
                border: "0.5px solid var(--border)", color: "var(--text2)",
                cursor: "pointer", background: "none", whiteSpace: "nowrap", fontFamily: "inherit",
              }}
            >
              {s}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!input.trim()) return;
            send(input);
            setInput("");
          }}
          style={{ display: "flex", gap: 6 }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="问点什么…"
            style={{
              flex: 1, padding: "8px 11px", border: "0.5px solid var(--border)",
              borderRadius: "var(--r2)", background: "var(--bg2)", fontSize: 12,
              outline: "none", fontFamily: "inherit",
            }}
          />
          <button type="submit" className="btn primary" style={{ fontSize: 12, padding: "8px 12px" }}>
            发送
          </button>
        </form>
      </div>

      <AIHistoryDrawer open={historyOpen} onClose={() => setHistoryOpen(false)} />
    </div>
  );
}
