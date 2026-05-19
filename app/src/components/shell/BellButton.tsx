"use client";

import Link from "next/link";

export function BellButton({ hasUnread }: { hasUnread?: boolean }) {
  return (
    <Link
      href="/notifications"
      aria-label="通知"
      style={{
        position: "relative", width: 28, height: 28, borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "var(--text2)", textDecoration: "none",
      }}
      onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg2)"; }}
      onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      <i className="ti ti-bell" style={{ fontSize: 15 }} />
      {hasUnread && (
        <span
          style={{
            position: "absolute", top: 5, right: 5, width: 6, height: 6,
            borderRadius: "50%", background: "var(--gold)", border: "1px solid var(--bg)",
          }}
        />
      )}
    </Link>
  );
}
