"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useRecordModal } from "@/lib/store/record-modal";
import { useToast } from "@/components/shared/Toast";
import { Cover } from "@/components/shared/Cover";
import { MediumBadge } from "@/components/shared/MediumBadge";
import { statusVerb, type UiMedium } from "@/lib/format/verbs";
import type { UiItem, UiShelfStatus } from "@/lib/neodb/ui-types";

const STATUS_OPTIONS: UiShelfStatus[] = ["complete", "progress", "wishlist"];
const STATUS_ICON: Record<UiShelfStatus, string> = {
  complete: "ti-check",
  progress: "ti-player-play",
  wishlist: "ti-bookmark",
  dropped: "ti-x",
};

export function RecordModal() {
  const { open, step, initial, prefill, hide, setItem } = useRecordModal();
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") hide(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, hide]);

  if (!open) return null;

  return (
    <div
      onClick={hide}
      style={{
        position: "fixed", inset: 0, background: "rgba(20,20,18,0.5)",
        zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20, animation: "fadeIn .15s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg)", border: "0.5px solid var(--border)", borderRadius: 14,
          width: "100%", maxWidth: 480, maxHeight: "86vh",
          display: "flex", flexDirection: "column", overflow: "hidden",
          animation: "fadeUp .2s ease", boxShadow: "0 24px 64px rgba(0,0,0,0.22)",
        }}
      >
        {step === "search" || !initial ? (
          <SearchStep onSelect={(it) => setItem(it)} onClose={hide} />
        ) : (
          <FormStep
            item={initial}
            prefill={prefill}
            onClose={hide}
            onSaved={() => {
              hide();
              router.refresh();
            }}
          />
        )}
      </div>
    </div>
  );
}

// ───────────────────────── Search step ─────────────────────────

function SearchStep({ onSelect, onClose }: { onSelect: (it: { uuid: string; medium: UiMedium; title: string; cover?: string; year?: number | string; creator?: string }) => void; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<UiItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const term = q.trim();
    if (!term) { setResults([]); return; }
    setLoading(true);
    const id = setTimeout(async () => {
      try {
        const res = await fetch(`/api/proxy/search?q=${encodeURIComponent(term)}`).then((r) => r.json());
        setResults((res.data ?? []) as UiItem[]);
      } finally {
        setLoading(false);
      }
    }, 280);
    return () => clearTimeout(id);
  }, [q]);

  return (
    <>
      <div style={{ padding: "16px 20px", borderBottom: "0.5px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
        <i className="ti ti-search" style={{ fontSize: 16, color: "var(--text3)" }} />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜索想记录的内容…"
          style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: 15, color: "var(--text)", fontFamily: "inherit" }}
        />
        {q && (
          <button onClick={() => setQ("")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text3)", fontSize: 18, lineHeight: 1, padding: 0 }}>
            ×
          </button>
        )}
        <button onClick={onClose} className="btn" style={{ fontSize: 11 }}>ESC</button>
      </div>
      <div style={{ overflowY: "auto", flex: 1, minHeight: 80 }}>
        {loading && <div style={{ padding: "18px 20px", fontSize: 12, color: "var(--text3)" }}>搜索中…</div>}
        {!loading && q && results.length === 0 && (
          <div style={{ padding: "26px 20px", textAlign: "center", color: "var(--text3)", fontSize: 12 }}>
            没找到。换个关键词试试。
          </div>
        )}
        {results.map((it) => (
          <button
            key={it.uuid}
            onClick={() =>
              onSelect({
                uuid: it.uuid, medium: it.medium, title: it.title,
                cover: it.cover ?? undefined, year: it.year, creator: it.creator,
              })
            }
            style={{
              display: "flex", alignItems: "center", gap: 12, padding: "12px 20px",
              cursor: "pointer", borderBottom: "0.5px solid var(--border)",
              width: "100%", background: "var(--bg)", border: "none", textAlign: "left", fontFamily: "inherit",
            }}
            onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg2)"; }}
            onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg)"; }}
          >
            <Cover src={it.cover ?? undefined} seed={it.uuid} width={34} height={48} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: "var(--serif)", fontSize: 14, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {it.title}
              </p>
              <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", marginTop: 2 }}>
                {[it.year, it.creator].filter(Boolean).join(" · ")}
              </p>
            </div>
            <MediumBadge medium={it.medium} small />
          </button>
        ))}
      </div>
    </>
  );
}

// ───────────────────────── Form step ─────────────────────────

interface FormStepProps {
  item: { uuid: string; medium: UiMedium; title: string; cover?: string; year?: number | string; creator?: string };
  prefill?: { status?: UiShelfStatus; rating?: number; comment?: string; visibility?: 0 | 1 | 2 };
  onClose: () => void;
  onSaved: () => void;
}

function FormStep({ item, prefill, onClose, onSaved }: FormStepProps) {
  const show = useToast((s) => s.show);
  const [status, setStatus] = useState<UiShelfStatus>(prefill?.status ?? "complete");
  const [rating, setRating] = useState<number>(prefill?.rating ?? 0);
  const [comment, setComment] = useState<string>(prefill?.comment ?? "");
  const [visibility, setVisibility] = useState<0 | 1 | 2>(prefill?.visibility ?? 0);
  const [saving, setSaving] = useState(false);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/proxy/mark/${item.uuid}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status, ratingUi: rating, comment, visibility,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error ?? "save_failed");
      }
      show(`已${statusVerb(item.medium, status)}《${item.title}》`);
      onSaved();
    } catch (err) {
      show(`保存失败：${err instanceof Error ? err.message : ""}`);
    } finally {
      setSaving(false);
    }
  }, [item, status, rating, comment, visibility, show, onSaved]);

  return (
    <>
      <div style={{ padding: "16px 20px", borderBottom: "0.5px solid var(--border)", display: "flex", alignItems: "center", gap: 12, background: "var(--bg2)" }}>
        <Cover src={item.cover ?? undefined} seed={item.uuid} width={34} height={48} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: "var(--serif)", fontSize: 14, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.title}</p>
          <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", marginTop: 2 }}>
            {[item.year, item.creator].filter(Boolean).join(" · ")}
          </p>
        </div>
        <MediumBadge medium={item.medium} small />
      </div>

      <div style={{ padding: 20, overflowY: "auto", flex: 1 }}>
        <p className="section-label" style={{ marginBottom: 8 }}>状态</p>
        <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
          {STATUS_OPTIONS.map((s) => {
            const on = s === status;
            return (
              <button
                key={s}
                onClick={() => setStatus(s)}
                style={{
                  flex: 1, padding: "10px 8px", borderRadius: "var(--r2)",
                  border: `0.5px solid ${on ? "var(--text)" : "var(--border)"}`,
                  background: on ? "var(--text)" : "var(--bg)",
                  color: on ? "var(--bg)" : "var(--text2)",
                  cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  fontFamily: "inherit",
                }}
              >
                <i className={`ti ${STATUS_ICON[s]}`} style={{ fontSize: 13 }} />
                {statusVerb(item.medium, s)}
              </button>
            );
          })}
        </div>

        <p className="section-label" style={{ marginBottom: 8 }}>评分</p>
        <div style={{ display: "flex", gap: 4, marginBottom: 18 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setRating(rating === n ? 0 : n)}
              style={{
                background: "none", border: "none", padding: 0, cursor: "pointer",
                fontSize: 26, color: rating >= n ? "var(--gold)" : "var(--border)",
                transition: "color .1s",
              }}
              aria-label={`${n} 星`}
            >
              ★
            </button>
          ))}
          {rating > 0 && (
            <button onClick={() => setRating(0)} style={{ background: "none", border: "none", color: "var(--text3)", fontSize: 11, cursor: "pointer", marginLeft: 8, fontFamily: "inherit" }}>
              清除
            </button>
          )}
        </div>

        <p className="section-label" style={{ marginBottom: 8 }}>短评</p>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="写下想法（可选）"
          rows={4}
          style={{
            width: "100%", background: "var(--bg2)", border: "0.5px solid var(--border)", borderRadius: "var(--r2)",
            padding: "10px 12px", fontSize: 13, color: "var(--text)", fontFamily: "inherit", resize: "none", outline: "none", lineHeight: 1.6,
          }}
        />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14 }}>
          <label style={{ fontSize: 11, color: "var(--text3)", display: "flex", alignItems: "center", gap: 8 }}>
            可见性
            <select
              value={visibility}
              onChange={(e) => setVisibility(Number(e.target.value) as 0 | 1 | 2)}
              style={{ fontSize: 11, padding: "3px 6px", border: "0.5px solid var(--border)", borderRadius: 4, background: "var(--bg)", fontFamily: "var(--mono)" }}
            >
              <option value={0}>公开</option>
              <option value={1}>仅关注者</option>
              <option value={2}>仅提及者</option>
            </select>
          </label>
          <button onClick={onClose} className="btn" style={{ fontSize: 11 }}>取消</button>
        </div>
      </div>

      <div style={{ padding: 16, borderTop: "0.5px solid var(--border)" }}>
        <button
          onClick={save}
          disabled={saving}
          style={{
            width: "100%", padding: 13, borderRadius: "var(--r2)",
            background: "var(--text)", color: "var(--bg)", border: "none",
            cursor: saving ? "default" : "pointer", fontSize: 14, fontWeight: 500,
            opacity: saving ? 0.5 : 1, fontFamily: "inherit",
          }}
        >
          {saving ? "保存中…" : `保存到 NeoDB`}
        </button>
      </div>
    </>
  );
}
