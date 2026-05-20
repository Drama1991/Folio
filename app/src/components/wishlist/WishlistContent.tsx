"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Cover } from "@/components/shared/Cover";
import { useToast } from "@/components/shared/Toast";
import { useRecordModal } from "@/lib/store/record-modal";
import { relativeTime } from "@/lib/format/dates";
import { mediumLabel } from "@/lib/format/verbs";
import type { UiArchiveRow } from "@/lib/neodb/ui-types";

const DAY = 86_400_000;

export function WishlistContent({ rows, totalCount }: { rows: UiArchiveRow[]; totalCount: number }) {
  const router = useRouter();
  const showToast = useToast((s) => s.show);
  const showModal = useRecordModal((s) => s.show);

  const [pick, setPick] = useState<UiArchiveRow | null>(null);
  const [view, setView] = useState<"list" | "grid">("list");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // 「语调」统计（基于当前页 rows；总数走 totalCount）
  const stats = useMemo(() => {
    const now = Date.now();
    let monthAdded = 0;
    let stale90 = 0;
    let oldest = 0;
    rows.forEach((r) => {
      const ageDays = Math.floor((now - +new Date(r.updatedAt)) / DAY);
      if (ageDays <= 30) monthAdded++;
      if (ageDays >= 90) stale90++;
      if (ageDays > oldest) oldest = ageDays;
    });
    return { monthAdded, stale90, oldest };
  }, [rows]);

  function rollPick() {
    if (!rows.length) return;
    let next: UiArchiveRow;
    do {
      next = rows[Math.floor(Math.random() * rows.length)];
    } while (rows.length > 1 && pick && next.uuid === pick.uuid);
    setPick(next);
  }

  function go(row: UiArchiveRow) {
    router.push(`/detail/${row.medium}/${row.uuid}`);
  }

  async function quickMark(row: UiArchiveRow, status: "complete" | "dropped") {
    setPendingId(row.uuid);
    try {
      const res = await fetch(`/api/proxy/mark/${row.uuid}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      showToast(`已标记《${row.title}》${status === "complete" ? "看过" : "弃"}`);
      if (pick?.uuid === row.uuid) setPick(null);
      startTransition(() => router.refresh());
    } catch {
      showToast("标记失败");
    } finally {
      setPendingId(null);
    }
  }

  function openEdit(row: UiArchiveRow) {
    showModal({
      item: {
        uuid: row.uuid,
        medium: row.medium,
        title: row.title,
        cover: row.cover ?? undefined,
        year: row.year,
        creator: row.creator,
      },
      prefill: {
        status: row.status,
        rating: row.rating,
        comment: row.comment,
      },
    });
  }

  return (
    <>
      {/* 语调 + 操作行 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
        <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)" }}>
          共 <span style={{ color: "var(--text2)" }}>{totalCount}</span> 项
          {rows.length > 0 && (
            <>
              {" · 本月新增 "}
              <span style={{ color: "var(--text2)" }}>{stats.monthAdded}</span>
              {stats.stale90 > 0 && (
                <>
                  {" · 搁置 90 天 "}
                  <span style={{ color: "#A86515" }}>{stats.stale90}</span>
                </>
              )}
              {stats.oldest > 30 && (
                <>
                  {" · 最久 "}
                  <span style={{ color: "var(--text2)" }}>{stats.oldest}</span>
                  {" 天"}
                </>
              )}
            </>
          )}
        </p>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div className="view-toggle" role="group" aria-label="视图切换">
            <button
              onClick={() => setView("list")}
              className={view === "list" ? "on" : ""}
              aria-pressed={view === "list"}
              title="列表"
            >
              <i className="ti ti-list" style={{ fontSize: 14 }} />
            </button>
            <button
              onClick={() => setView("grid")}
              className={view === "grid" ? "on" : ""}
              aria-pressed={view === "grid"}
              title="海报墙"
            >
              <i className="ti ti-layout-grid" style={{ fontSize: 13 }} />
            </button>
          </div>
          <button onClick={rollPick} className="btn" disabled={!rows.length}>
            <i className="ti ti-dice" style={{ fontSize: 13 }} /> 今晚随机选一个
          </button>
        </div>
      </div>

      {/* 随机选中卡片 + 双按钮 */}
      {pick && (
        <div
          className="fade-up"
          style={{
            marginBottom: 12, padding: "14px 16px",
            background: "linear-gradient(135deg, #FCEFD2 0%, #F8E4B5 100%)",
            borderRadius: "var(--r)", border: "0.5px solid #EFC97A",
            display: "flex", alignItems: "center", gap: 14,
          }}
        >
          <Cover src={pick.cover ?? undefined} seed={pick.uuid} width={42} height={60} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: "var(--mono)", fontSize: 10, color: "#854F0B", marginBottom: 4, letterSpacing: ".04em" }}>
              今晚就它了 ↓
            </p>
            <p style={{ fontFamily: "var(--serif)", fontSize: 17, fontWeight: 500, color: "#412402", lineHeight: 1.2 }}>
              {pick.title}
            </p>
            <p style={{ fontFamily: "var(--mono)", fontSize: 10.5, color: "#854F0B", marginTop: 3 }}>
              {[mediumLabel(pick.medium), pick.creator, pick.year].filter(Boolean).join(" · ")}
            </p>
          </div>
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <button
              onClick={rollPick}
              className="btn"
              style={{ borderColor: "#D9A66A", color: "#6B3F08", background: "rgba(255,255,255,0.6)" }}
            >
              <i className="ti ti-refresh" style={{ fontSize: 12 }} /> 再来一个
            </button>
            <button
              onClick={() => go(pick)}
              className="modal-save-btn"
              style={{ padding: "8px 14px", fontSize: 12, fontWeight: 500 }}
            >
              就它了 →
            </button>
          </div>
        </div>
      )}

      {/* 主体：list 或 grid */}
      {rows.length === 0 ? (
        <div style={{
          border: "0.5px solid var(--border)", borderRadius: "var(--r)",
          padding: "32px 20px", textAlign: "center", color: "var(--text3)", fontSize: 12,
        }}>
          心愿单还空着。去 /home 或 /discover 加点想看的吧。
        </div>
      ) : view === "list" ? (
        <div style={{ border: "0.5px solid var(--border)", borderRadius: "var(--r)", overflow: "hidden" }}>
          {rows.map((r) => {
            const reason = r.comment?.trim();
            return (
              <div
                key={r.uuid}
                className="row"
                onClick={() => go(r)}
                role="link"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter") go(r); }}
                style={{ opacity: pendingId === r.uuid ? 0.55 : 1 }}
              >
                <Cover src={r.cover ?? undefined} seed={r.uuid} width={38} height={54} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: "var(--serif)", fontSize: 14, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.title}
                  </p>
                  <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", marginTop: 3 }}>
                    {[mediumLabel(r.medium), r.creator, r.year].filter(Boolean).join(" · ")}
                  </p>
                  {reason && (
                    <p style={{
                      fontSize: 11.5, color: "var(--text2)", marginTop: 4,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      fontStyle: "italic",
                    }}>
                      “{reason}”
                    </p>
                  )}
                </div>
                <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)", flexShrink: 0 }}>
                  {relativeTime(r.updatedAt)}
                </span>
                <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="row-act-btn good"
                    title="已看过"
                    aria-label="已看过"
                    disabled={pendingId === r.uuid}
                    onClick={() => quickMark(r, "complete")}
                  >
                    <i className="ti ti-check" style={{ fontSize: 13 }} />
                  </button>
                  <button
                    className="row-act-btn danger"
                    title="不想看了"
                    aria-label="不想看了"
                    disabled={pendingId === r.uuid}
                    onClick={() => quickMark(r, "dropped")}
                  >
                    <i className="ti ti-x" style={{ fontSize: 13 }} />
                  </button>
                  <button
                    className="row-act-btn"
                    title="编辑"
                    aria-label="编辑"
                    onClick={() => openEdit(r)}
                  >
                    <i className="ti ti-pencil" style={{ fontSize: 12 }} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="poster-grid">
          {rows.map((r) => (
            <div
              key={r.uuid}
              className="poster-tile"
              onClick={() => go(r)}
              role="link"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter") go(r); }}
              style={{ opacity: pendingId === r.uuid ? 0.55 : 1 }}
            >
              <Cover src={r.cover ?? undefined} seed={r.uuid} width="100%" height="100%" />
              <div className="poster-tile-overlay">
                <p className="poster-tile-title">{r.title}</p>
                <p className="poster-tile-meta">
                  {[mediumLabel(r.medium), r.year].filter(Boolean).join(" · ")}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
