"use client";

import { useRecordModal } from "@/lib/store/record-modal";

/**
 * Home Featured 区域的"暂无在看"空态 CTA。
 * 视觉与 FeaturedCard 已记录态保持一致（同 minHeight、同暗底卡），
 * 但内容是行动卡：直接把用户带去 RecordModal SearchStep 记下第一条。
 *
 * 此组件必须是 client component，因为要调 useRecordModal hook。
 */
export function FeaturedEmptyCTA() {
  const show = useRecordModal((s) => s.show);
  return (
    <div
      style={{
        background: "#1C1C1A",
        borderRadius: "var(--r)",
        padding: "22px 24px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        minHeight: 196,
        color: "#888780",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <span style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: ".1em", color: "var(--gold)" }}>
        开始你的第一条
      </span>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <p style={{ fontFamily: "var(--serif)", fontSize: 24, color: "#F1EFE8", lineHeight: 1.2, fontWeight: 500, letterSpacing: "-0.01em" }}>
          记录第一部作品
        </p>
        <p style={{ fontSize: 13, color: "#B5B3AC", lineHeight: 1.65, maxWidth: 380 }}>
          搜任意电影、书、播客、剧集——记下你正在看、想看、看过的，
          慢慢长出你的档案。
        </p>
      </div>
      <button
        type="button"
        onClick={() => show()}
        className="btn primary"
        style={{ alignSelf: "flex-start", padding: "10px 16px", fontSize: 13 }}
      >
        <i className="ti ti-search" style={{ fontSize: 13 }} />
        搜索并记录
      </button>
    </div>
  );
}
