"use client";

import { useEffect, useState } from "react";
import { useAIPanel, listSessionsForCurrentContext } from "@/lib/store/ai-panel";
import { deleteSession, type AISession } from "@/lib/store/ai-sessions";

export function AIHistoryDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const context = useAIPanel((s) => s.context);
  const loadSession = useAIPanel((s) => s.loadSession);
  const currentSid = useAIPanel((s) => s.sessionId);
  const [sessions, setSessions] = useState<AISession[]>([]);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSessions(listSessionsForCurrentContext(context));
    setConfirmId(null);
  }, [open, context]);

  if (!open) return null;

  function onPick(s: AISession) {
    loadSession(s);
    onClose();
  }

  function onDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (confirmId !== id) {
      setConfirmId(id);
      return;
    }
    deleteSession(id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
    setConfirmId(null);
  }

  return (
    <div
      className="slide-in"
      style={{
        position: "absolute", inset: 0, background: "var(--bg)", padding: "12px 16px",
        display: "flex", flexDirection: "column", zIndex: 5,
      }}
      onClick={() => setConfirmId(null)}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <p style={{ fontFamily: "var(--serif)", fontSize: 14, fontWeight: 500 }}>对话历史</p>
        <button className="btn" style={{ fontSize: 11, padding: "4px 9px" }} onClick={onClose}>返回</button>
      </div>
      <p style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)", marginBottom: 10 }}>
        {context.subtitle} · {sessions.length} 条
      </p>
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
        {sessions.length === 0 && (
          <p style={{ fontSize: 12, color: "var(--text3)", padding: "20px 4px", textAlign: "center" }}>
            还没有保存的对话。
          </p>
        )}
        {sessions.map((s) => {
          const isCurrent = s.id === currentSid;
          const preview = previewOf(s);
          const ts = formatTs(s.updatedAt);
          const confirming = confirmId === s.id;
          return (
            <div
              key={s.id}
              onClick={(e) => { e.stopPropagation(); onPick(s); }}
              style={{
                border: `0.5px solid ${isCurrent ? "var(--text)" : "var(--border)"}`,
                borderRadius: "var(--r2)",
                padding: "10px 12px",
                cursor: "pointer",
                position: "relative",
                background: isCurrent ? "var(--bg2)" : "var(--bg)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)" }}>
                  {isCurrent ? "当前 · " : ""}{ts.date} · {ts.time}
                </span>
                <button
                  type="button"
                  onClick={(e) => onDelete(s.id, e)}
                  aria-label={confirming ? "确认删除" : "删除"}
                  title={confirming ? "再点一次确认删除" : "删除这条对话"}
                  style={{
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    padding: 2,
                    color: confirming ? "#A03B3B" : "var(--text3)",
                    fontSize: 11,
                    fontFamily: confirming ? "var(--mono)" : "inherit",
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                  }}
                >
                  {confirming ? "确认?" : <i className="ti ti-trash" style={{ fontSize: 13 }} />}
                </button>
              </div>
              <p style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.55, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {preview}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function previewOf(s: AISession): string {
  // 优先显示第一条 user 消息，再不行用最后一条 ai 消息
  const firstUser = s.messages.find((m) => m.role === "user");
  if (firstUser) return firstUser.text;
  const lastAi = [...s.messages].reverse().find((m) => m.role === "ai");
  if (lastAi) return lastAi.text;
  return "(空对话)";
}

function formatTs(ts: number): { date: string; time: string } {
  const d = new Date(ts);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}
