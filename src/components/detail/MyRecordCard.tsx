"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useRecordModal } from "@/lib/store/record-modal";
import { useToast } from "@/components/shared/Toast";
import { Stars } from "@/components/shared/Stars";
import { statusVerb, type UiMedium } from "@/lib/format/verbs";
import type { UiShelfStatus } from "@/lib/neodb/ui-types";

interface Props {
  uuid: string;
  medium: UiMedium;
  title: string;
  cover?: string;
  year?: number | string;
  creator?: string;
  myRecord: {
    status: UiShelfStatus;
    rating?: number;
    comment: string;
    visibility: 0 | 1 | 2;
    createdAt: string;
  } | null;
}

const VISIBLE_STATUSES: UiShelfStatus[] = ["complete", "progress", "wishlist", "dropped"];
const ICONS: Record<UiShelfStatus, string> = {
  complete: "ti-check",
  progress: "ti-player-play",
  wishlist: "ti-bookmark",
  dropped: "ti-x",
};

export function MyRecordCard({ uuid, medium, myRecord, title, cover, year, creator }: Props) {
  const router = useRouter();
  const showModal = useRecordModal((s) => s.show);
  const showToast = useToast((s) => s.show);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [, startTransition] = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);

  // 点击菜单外部关闭
  useEffect(() => {
    if (!menuOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [menuOpen]);

  function openEdit() {
    showModal({
      item: { uuid, medium, title, cover, year, creator },
      prefill: myRecord
        ? { status: myRecord.status, rating: myRecord.rating, comment: myRecord.comment, visibility: myRecord.visibility }
        : undefined,
    });
  }

  async function setStatus(newStatus: UiShelfStatus) {
    if (pending) return;
    if (myRecord?.status === newStatus) return; // 同状态再点：no-op（删除走 ⋯ 菜单）
    setPending(true);
    try {
      const res = await fetch(`/api/proxy/mark/${uuid}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          // 保留已有评分/短评/可见性，只切 status
          ratingUi: myRecord?.rating ?? 0,
          comment: myRecord?.comment ?? "",
          visibility: myRecord?.visibility ?? 0,
        }),
      });
      if (!res.ok) throw new Error();
      showToast(`已${statusVerb(medium, newStatus)}《${title}》`);
      startTransition(() => router.refresh());
    } catch {
      showToast("切换失败，请重试");
    } finally {
      setPending(false);
    }
  }

  async function deleteMark() {
    if (pending) return;
    if (!window.confirm(`确认删除对《${title}》的标记？此操作不可恢复。`)) return;
    setMenuOpen(false);
    setPending(true);
    try {
      const res = await fetch(`/api/proxy/mark/${uuid}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      showToast(`已删除《${title}》的标记`);
      startTransition(() => router.refresh());
    } catch {
      showToast("删除失败，请重试");
    } finally {
      setPending(false);
    }
  }

  return (
    <div style={{ border: "0.5px solid var(--border)", borderRadius: "var(--r)", overflow: "hidden", opacity: pending ? 0.65 : 1, transition: "opacity 0.15s" }}>
      <div style={{ padding: "11px 16px", borderBottom: "0.5px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className="section-label">我的记录</span>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)" }}>
            {myRecord ? new Date(myRecord.createdAt).toLocaleDateString("zh-CN") : "未记录"}
          </span>
          {myRecord && (
            <div ref={menuRef} style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="更多操作"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                disabled={pending}
                style={{
                  background: "none",
                  border: "none",
                  cursor: pending ? "default" : "pointer",
                  color: "var(--text3)",
                  padding: "2px 4px",
                  borderRadius: 4,
                  lineHeight: 1,
                  fontSize: 16,
                }}
              >
                <i className="ti ti-dots" />
              </button>
              {menuOpen && (
                <div
                  role="menu"
                  style={{
                    position: "absolute",
                    top: "calc(100% + 4px)",
                    right: 0,
                    minWidth: 132,
                    background: "var(--bg)",
                    border: "0.5px solid var(--border)",
                    borderRadius: "var(--r2)",
                    boxShadow: "0 6px 20px rgba(0,0,0,0.10)",
                    zIndex: 10,
                    overflow: "hidden",
                  }}
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => { setMenuOpen(false); openEdit(); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      width: "100%", padding: "9px 12px",
                      background: "none", border: "none", cursor: "pointer",
                      fontSize: 12.5, color: "var(--text)", fontFamily: "inherit",
                      textAlign: "left",
                    }}
                    onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg2)"; }}
                    onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.background = "none"; }}
                  >
                    <i className="ti ti-pencil" style={{ fontSize: 12 }} />
                    编辑详情
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={deleteMark}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      width: "100%", padding: "9px 12px",
                      background: "none", border: "none", borderTop: "0.5px solid var(--border)", cursor: "pointer",
                      fontSize: 12.5, color: "#B0341F", fontFamily: "inherit",
                      textAlign: "left",
                    }}
                    onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(176,52,31,0.06)"; }}
                    onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.background = "none"; }}
                  >
                    <i className="ti ti-trash" style={{ fontSize: 12 }} />
                    删除记录
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: "12px 16px", borderBottom: "0.5px solid var(--border)" }}>
        <p style={{ fontSize: 11, color: "var(--text3)", marginBottom: 8 }}>状态</p>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {VISIBLE_STATUSES.map((s) => {
            const on = myRecord?.status === s;
            const isDropped = s === "dropped";
            // dropped 自走冷灰激活态（不庆祝"放弃"）；其他 3 态复用 .chip / .chip.on 米黄规范
            if (isDropped) {
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  disabled={pending}
                  className="chip"
                  style={{
                    background: on ? "var(--bg2)" : "var(--bg)",
                    borderColor: "var(--text3)",
                    color: on ? "var(--text)" : "var(--text3)",
                    fontWeight: on ? 500 : 400,
                    opacity: on ? 1 : 0.75,
                    boxShadow: "none",
                    cursor: pending ? "default" : "pointer",
                  }}
                >
                  <i className={`ti ${ICONS[s]}`} style={{ fontSize: 11 }} />
                  {statusVerb(medium, s)}
                </button>
              );
            }
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                disabled={pending}
                className={`chip${on ? " on" : ""}`}
                style={{ cursor: pending ? "default" : "pointer" }}
              >
                <i className={`ti ${ICONS[s]}`} style={{ fontSize: 11 }} />
                {statusVerb(medium, s)}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ padding: "12px 16px", borderBottom: "0.5px solid var(--border)" }}>
        <p style={{ fontSize: 11, color: "var(--text3)", marginBottom: 8 }}>我的评分</p>
        {myRecord?.rating ? (
          <Stars value={myRecord.rating} size={18} />
        ) : (
          <button type="button" onClick={openEdit} style={{ background: "none", border: "none", color: "var(--text3)", fontSize: 12, fontStyle: "italic", cursor: "pointer", padding: 0 }}>
            未评分 · 点击评分
          </button>
        )}
      </div>

      <div style={{ padding: "12px 16px" }}>
        <p style={{ fontSize: 11, color: "var(--text3)", marginBottom: 8 }}>我的短评</p>
        {myRecord?.comment ? (
          <p style={{ fontFamily: "var(--serif)", fontSize: 13, lineHeight: 1.65, color: "var(--text)" }}>{myRecord.comment}</p>
        ) : (
          <p style={{ fontSize: 13, color: "var(--text3)", fontStyle: "italic" }}>
            尚未写下短评 ·{" "}
            <button type="button" onClick={openEdit} style={{ background: "none", border: "none", color: "var(--text2)", textDecoration: "underline", cursor: "pointer", padding: 0, fontSize: 13 }}>
              写一篇
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
