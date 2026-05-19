"use client";

import { useRecordModal } from "@/lib/store/record-modal";
import { useAIPanel } from "@/lib/store/ai-panel";

export function ActionBar() {
  const show = useRecordModal((s) => s.show);
  const openAI = useAIPanel((s) => s.setOpen);

  return (
    <div
      style={{
        background: "linear-gradient(135deg,#F5EFDD 0%,#EFE8D1 100%)",
        border: "0.5px solid #E5DCC2",
        borderRadius: "var(--r)",
        padding: "16px 20px",
        marginBottom: 14,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 14,
        boxShadow: "0 2px 8px rgba(82,60,20,0.06),inset 0 1px 0 rgba(255,255,255,0.5)",
      }}
    >
      <button
        onClick={() => show()}
        style={{
          display: "inline-flex", alignItems: "center", gap: 11,
          background: "#1C1C1A", color: "#F1EFE8", border: "none",
          padding: "10px 18px 10px 12px", borderRadius: "var(--r2)",
          cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 500,
          boxShadow: "0 4px 14px rgba(28,28,26,0.22),inset 0 1px 0 rgba(255,255,255,0.06)",
          transition: "transform .15s, box-shadow .15s",
        }}
      >
        <svg width="22" height="26" viewBox="0 0 24 28" fill="none">
          <path d="M3 2 H15 L21 8 V25 Q21 26 20 26 H4 Q3 26 3 25 V3 Q3 2 4 2 Z" fill="#3C3C38" />
          <path d="M15 2 L21 8 H15 Z" fill="#5C5C58" />
          <line x1="12" y1="12" x2="12" y2="20" stroke="#F1EFE8" strokeWidth="2" strokeLinecap="round" />
          <line x1="8" y1="16" x2="16" y2="16" stroke="#F1EFE8" strokeWidth="2" strokeLinecap="round" />
          <circle cx="7" cy="6" r="1.2" fill="#EF9F27" opacity="0.85" />
        </svg>
        记录新内容
      </button>
      <button
        onClick={() => openAI(true, "home")}
        style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "10px 18px", borderRadius: 999,
          background: "rgba(255,255,255,0.55)",
          border: "0.5px solid rgba(133,79,11,0.18)",
          color: "var(--text)", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 500,
        }}
      >
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
          <path d="M7 1L8.5 5.5L13 7L8.5 8.5L7 13L5.5 8.5L1 7L5.5 5.5Z" fill="#EF9F27" />
        </svg>
        今晚看什么？
      </button>
    </div>
  );
}
