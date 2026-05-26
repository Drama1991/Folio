"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/shared/Toast";
import { formatUserError, USER_MESSAGE } from "@/lib/user-message";

interface Props {
  /** review uuid (用于编辑路由) */
  reviewUuid: string;
  /** item uuid (用于删除 API) */
  itemUuid: string;
}

export function ReviewActions({ reviewUuid, itemUuid }: Props) {
  const router = useRouter();
  const show = useToast((s) => s.show);
  const [deleting, setDeleting] = useState(false);

  async function onDelete() {
    if (!window.confirm("确定删除这篇长评？此操作不可撤销。")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/proxy/review/${itemUuid}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error ?? "delete_failed");
      }
      show("已删除");
      router.push("/profile/me");
      router.refresh();
    } catch (err) {
      show(formatUserError(err, USER_MESSAGE.DELETE_FAILED));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div style={{ display: "flex", gap: 2 }}>
      <Link
        href={`/review/edit/${reviewUuid}`}
        className="rev-act"
        aria-label="编辑"
        title="编辑"
      >
        {/* Pencil */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      </Link>
      <button
        onClick={onDelete}
        disabled={deleting}
        className="rev-act"
        aria-label={deleting ? "删除中" : "删除"}
        title={deleting ? "删除中" : "删除"}
      >
        {/* Trash */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6M14 11v6" />
          <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
        </svg>
      </button>
      <style>{`
        .rev-act {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          border-radius: 6px;
          border: none;
          background: transparent;
          color: var(--text3);
          cursor: pointer;
          text-decoration: none;
          transition: color 0.15s ease, background 0.15s ease, transform 0.15s ease;
        }
        .rev-act:hover {
          color: var(--gold);
          background: var(--bg2);
          transform: translateY(-1px);
        }
        .rev-act:active { transform: translateY(0); }
        .rev-act:disabled { opacity: 0.45; cursor: default; }
        .rev-act:disabled:hover {
          color: var(--text3);
          background: transparent;
          transform: none;
        }
      `}</style>
    </div>
  );
}
