"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Cover } from "@/components/shared/Cover";
import { RatingTag } from "@/components/shared/RatingTag";
import { useToast } from "@/components/shared/Toast";
import { useRecordModal } from "@/lib/store/record-modal";
import { relativeTime } from "@/lib/format/dates";
import { statusVerb } from "@/lib/format/verbs";
import type { UiArchiveRow } from "@/lib/neodb/ui-types";
import type { NeoDBShelfType } from "@/lib/neodb/types";

const STATUS_PILL: Record<string, { bg: string; fg: string }> = {
  complete: { bg: "var(--bg2)", fg: "var(--text3)" },
  progress: { bg: "#EEF6E8", fg: "#0F6E56" },
  wishlist: { bg: "#FAEEDA", fg: "#854F0B" },
  dropped: { bg: "#F4E8E8", fg: "#8C3B52" },
};

export function ArchiveRow({ row }: { row: UiArchiveRow }) {
  const router = useRouter();
  const showToast = useToast((s) => s.show);
  const showModal = useRecordModal((s) => s.show);
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();
  const pill = STATUS_PILL[row.status] ?? STATUS_PILL.complete;

  function go() {
    router.push(`/detail/${row.medium}/${row.uuid}`);
  }

  async function quickMark(next: NeoDBShelfType, verb: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/proxy/mark/${row.uuid}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next, ratingUi: row.rating, comment: row.comment ?? "" }),
      });
      if (!res.ok) throw new Error();
      showToast(`已将《${row.title}》标记为${verb}`);
      startTransition(() => router.refresh());
    } catch {
      showToast("标记失败");
    } finally {
      setBusy(false);
    }
  }

  async function deleteMark() {
    if (!window.confirm(`确定删除《${row.title}》的记录？`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/proxy/mark/${row.uuid}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      showToast(`已删除《${row.title}》的记录`);
      startTransition(() => router.refresh());
    } catch {
      showToast("删除失败");
    } finally {
      setBusy(false);
    }
  }

  function openEdit() {
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
    <div
      className="row"
      onClick={go}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter") go(); }}
      style={{ opacity: busy ? 0.55 : 1 }}
    >
      <Cover src={row.cover ?? undefined} seed={row.uuid} width={38} height={54} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: "var(--serif)", fontSize: 14, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {row.title}
        </p>
        <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", marginTop: 3 }}>
          {[row.year, row.creator].filter(Boolean).join(" · ")}
        </p>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <RatingTag own={row.rating} external={row.externalRating} size={11} />
        <span className="badge" style={{ background: pill.bg, color: pill.fg }}>{statusVerb(row.medium, row.status)}</span>
        <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)" }}>{relativeTime(row.updatedAt)}</span>
      </div>
      <div className="row-actions" onClick={(e) => e.stopPropagation()}>
        {row.status === "complete" && (
          <button className="row-act-btn" title="编辑" aria-label="编辑" onClick={openEdit}>
            <i className="ti ti-pencil" style={{ fontSize: 12 }} />
          </button>
        )}
        {row.status === "progress" && (
          <>
            <button className="row-act-btn good" title="已完成" aria-label="已完成" disabled={busy} onClick={() => quickMark("complete", "已完成")}>
              <i className="ti ti-check" style={{ fontSize: 13 }} />
            </button>
            <button className="row-act-btn" title="编辑" aria-label="编辑" onClick={openEdit}>
              <i className="ti ti-pencil" style={{ fontSize: 12 }} />
            </button>
          </>
        )}
        {row.status === "wishlist" && (
          <>
            <button className="row-act-btn good" title="已看过" aria-label="已看过" disabled={busy} onClick={() => quickMark("complete", "已看过")}>
              <i className="ti ti-check" style={{ fontSize: 13 }} />
            </button>
            <button className="row-act-btn danger" title="不想看了" aria-label="不想看了" disabled={busy} onClick={() => quickMark("dropped", "已弃")}>
              <i className="ti ti-x" style={{ fontSize: 13 }} />
            </button>
            <button className="row-act-btn" title="编辑" aria-label="编辑" onClick={openEdit}>
              <i className="ti ti-pencil" style={{ fontSize: 12 }} />
            </button>
          </>
        )}
        {row.status === "dropped" && (
          <>
            <button className="row-act-btn warn" title="重新加入心愿单" aria-label="重新加入心愿单" disabled={busy} onClick={() => quickMark("wishlist", "想看")}>
              <i className="ti ti-bookmark" style={{ fontSize: 12 }} />
            </button>
            <button className="row-act-btn danger" title="删除记录" aria-label="删除记录" disabled={busy} onClick={deleteMark}>
              <i className="ti ti-trash" style={{ fontSize: 12 }} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
