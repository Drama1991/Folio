"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Cover } from "@/components/shared/Cover";
import { RatingTag } from "@/components/shared/RatingTag";
import { useToast } from "@/components/shared/Toast";
import { EmptyState } from "@/components/shared/EmptyState";
import { useRecordModal } from "@/lib/store/record-modal";
import { relativeTime } from "@/lib/format/dates";
import { mediumLabel, type UiMedium } from "@/lib/format/verbs";
import type { UiArchiveRow } from "@/lib/neodb/ui-types";
import { USER_MESSAGE } from "@/lib/user-message";

const DAY = 86_400_000;

export function WishlistContent({
  rows,
  totalCount,
  counts,
  filterMedium,
}: {
  rows: UiArchiveRow[];
  totalCount: number;
  counts: Array<{ medium: UiMedium; count: number }>;
  filterMedium?: UiMedium;
}) {
  const router = useRouter();
  const showToast = useToast((s) => s.show);
  const showModal = useRecordModal((s) => s.show);

  const [pick, setPick] = useState<UiArchiveRow | null>(null);
  const [view, setView] = useState<"list" | "grid">("list");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [rolling, setRolling] = useState(false);
  const rollTimerRef = useRef<number | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => () => {
    if (rollTimerRef.current) window.clearTimeout(rollTimerRef.current);
  }, []);

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
    if (!rows.length || rolling) return;
    setRolling(true);
    let next: UiArchiveRow;
    do {
      next = rows[Math.floor(Math.random() * rows.length)];
    } while (rows.length > 1 && pick && next.uuid === pick.uuid);
    setPick(next);
    if (rollTimerRef.current) window.clearTimeout(rollTimerRef.current);
    rollTimerRef.current = window.setTimeout(() => setRolling(false), 650);
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
      showToast(USER_MESSAGE.MARK_FAILED);
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
      {/* 标题：点一下摇一摇 */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 16, gap: 16 }}>
        <div>
          <button
            type="button"
            onClick={rollPick}
            disabled={!rows.length}
            aria-label={rows.length ? "心愿单 · 点一下随机选一个" : "心愿单为空"}
            title={rows.length ? "点一下，摇一摇" : "心愿单为空"}
            className={`wishlist-title-btn${rolling ? " rolling" : ""}`}
          >
            <span>心愿单</span>
            <i className="ti ti-dice-5 wishlist-title-dice" aria-hidden />
          </button>
          <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", marginTop: 5 }}>
            想看 · 想读 · 想听 — 我准备走入的世界
          </p>
        </div>
      </div>

      {/* 类别筛选 */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto", paddingBottom: 2 }}>
        <Link href="/wishlist" className={`chip${!filterMedium ? " on" : ""}`}>
          全部 <span className="chip-count">{totalCount}</span>
        </Link>
        {counts.map((c) => (
          <Link
            key={c.medium}
            href={`/wishlist?filter=${c.medium}`}
            className={`chip${filterMedium === c.medium ? " on" : ""}`}
          >
            {mediumLabel(c.medium)} <span className="chip-count">{c.count}</span>
          </Link>
        ))}
      </div>

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
          <Cover src={pick.cover ?? undefined} seed={pick.uuid} medium={pick.medium} width={42} height={60} alt={pick.title} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "#854F0B", marginBottom: 4, letterSpacing: ".04em" }}>
              今晚就它了 ↓
            </p>
            <p style={{ fontFamily: "var(--serif)", fontSize: 17, fontWeight: 500, color: "#412402", lineHeight: 1.2 }}>
              {pick.title}
            </p>
            <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "#854F0B", marginTop: 3 }}>
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
        <EmptyState
          icon="ti-bookmark"
          title="心愿单还空着"
          description="想看的电影、书、播客 — 先存一个起来，回头需要点什么的时候有得挑。"
          actions={[
            {
              label: "搜一个想看的",
              primary: true,
              onClick: () => showModal({ prefill: { status: "wishlist" } }),
            },
          ]}
        />
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
                <Cover src={r.cover ?? undefined} seed={r.uuid} medium={r.medium} width={38} height={54} alt={r.title} />
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
                <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", flexShrink: 0, display: "flex", alignItems: "center", gap: 10 }}>
                  <RatingTag own={r.rating} external={r.externalRating} size={11} />
                  <span>{relativeTime(r.updatedAt)}</span>
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
              <Cover src={r.cover ?? undefined} seed={r.uuid} medium={r.medium} width="100%" height="100%" alt={r.title} />
              {r.rating ? (
                <span className="poster-tile-corner own">★ {r.rating.toFixed(1)}</span>
              ) : r.externalRating ? (
                <span className="poster-tile-corner">★ {r.externalRating.toFixed(1)}</span>
              ) : null}
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
