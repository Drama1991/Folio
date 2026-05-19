"use client";

import Link from "next/link";
import { useState } from "react";
import { Cover } from "@/components/shared/Cover";
import { relativeTime } from "@/lib/format/dates";
import { mediumLabel } from "@/lib/format/verbs";
import type { UiArchiveRow } from "@/lib/neodb/ui-types";

export function WishlistContent({ rows }: { rows: UiArchiveRow[] }) {
  const [pick, setPick] = useState<UiArchiveRow | null>(null);

  function randomPick() {
    if (!rows.length) return;
    const r = rows[Math.floor(Math.random() * rows.length)];
    setPick(r);
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
        <button onClick={randomPick} className="btn" disabled={!rows.length}>
          <i className="ti ti-dice" style={{ fontSize: 13 }} /> 今晚随机选一个
        </button>
      </div>
      {pick && (
        <Link
          href={`/detail/${pick.medium}/${pick.uuid}`}
          className="fade-up"
          style={{
            display: "block", marginBottom: 12, padding: "13px 16px",
            background: "#FAEEDA", borderRadius: "var(--r)", border: "0.5px solid #EFC97A",
            textDecoration: "none", color: "inherit",
          }}
        >
          <p style={{ fontFamily: "var(--mono)", fontSize: 10, color: "#854F0B", marginBottom: 5 }}>今晚就它了 ↓</p>
          <p style={{ fontFamily: "var(--serif)", fontSize: 17, fontWeight: 500, color: "#412402" }}>{pick.title}</p>
          <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "#854F0B", marginTop: 4 }}>
            {[mediumLabel(pick.medium), pick.creator, pick.year].filter(Boolean).join(" · ")}
          </p>
        </Link>
      )}

      <div style={{ border: "0.5px solid var(--border)", borderRadius: "var(--r)", overflow: "hidden" }}>
        {rows.length === 0 ? (
          <div style={{ padding: "26px 20px", textAlign: "center", color: "var(--text3)", fontSize: 12 }}>
            想看的清单还空着。从 /home 或 /discover 加几个吧。
          </div>
        ) : (
          rows.map((r) => (
            <Link key={r.uuid} href={`/detail/${r.medium}/${r.uuid}`} className="row" style={{ textDecoration: "none", color: "inherit" }}>
              <Cover src={r.cover ?? undefined} seed={r.uuid} width={38} height={54} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: "var(--serif)", fontSize: 14, fontWeight: 500 }}>{r.title}</p>
                <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", marginTop: 3 }}>
                  {[mediumLabel(r.medium), r.creator, r.year].filter(Boolean).join(" · ")}
                </p>
              </div>
              <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)" }}>{relativeTime(r.updatedAt)}</span>
            </Link>
          ))
        )}
      </div>
    </>
  );
}
