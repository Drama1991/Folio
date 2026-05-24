"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useRecordModal } from "@/lib/store/record-modal";
import { useToast } from "@/components/shared/Toast";
import { Cover } from "@/components/shared/Cover";
import { MediumBadge } from "@/components/shared/MediumBadge";
import { statusVerb, type UiMedium } from "@/lib/format/verbs";
import type { UiItem, UiShelfStatus } from "@/lib/neodb/ui-types";

const STATUS_OPTIONS: UiShelfStatus[] = ["complete", "progress", "wishlist", "dropped"];
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
    <div onClick={hide} className="record-modal-mask">
      <div onClick={(e) => e.stopPropagation()} className="record-modal-card">
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
    // P1-9：AbortController 防竞态——慢请求被新输入覆盖时直接放弃
    const controller = new AbortController();
    const id = setTimeout(async () => {
      try {
        const res = await fetch(`/api/proxy/search?q=${encodeURIComponent(term)}`, {
          signal: controller.signal,
        }).then((r) => r.json());
        setResults((res.data ?? []) as UiItem[]);
      } catch (err) {
        if ((err as { name?: string })?.name === "AbortError") return;
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 280);
    return () => {
      clearTimeout(id);
      controller.abort();
    };
  }, [q]);

  return (
    <>
      <div style={{ padding: "20px 22px 18px", borderBottom: "0.5px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--bg2)", padding: "10px 12px", borderRadius: "var(--r2)" }}>
          <i className="ti ti-search" style={{ fontSize: 15, color: "var(--text3)" }} />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索电影、书籍、音乐…"
            style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: 14, color: "var(--text)", fontFamily: "inherit" }}
          />
          {q && (
            <button onClick={() => setQ("")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text3)", fontSize: 16, lineHeight: 1, padding: 0 }}>
              ×
            </button>
          )}
          <button onClick={onClose} className="btn modal-esc-btn" style={{ fontSize: 11, padding: "3px 7px" }}>
            <span className="esc-desktop">ESC</span>
            <span className="esc-mobile">取消</span>
          </button>
        </div>
      </div>
      <div style={{ overflowY: "auto", flex: 1, minHeight: 120 }}>
        {loading && (
          <div style={{ padding: "26px 22px", fontSize: 12, color: "var(--text3)", fontFamily: "var(--mono)" }}>
            搜索中…
          </div>
        )}
        {!loading && q && results.length === 0 && (
          <div style={{ padding: "32px 22px", textAlign: "center", color: "var(--text3)", fontSize: 12 }}>
            没找到。换个关键词试试。
          </div>
        )}
        {!loading && !q && (
          <div style={{ padding: "32px 22px", textAlign: "center", color: "var(--text3)", fontSize: 12, fontFamily: "var(--mono)" }}>
            输入标题、作者或关键词开始搜索
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
              display: "flex", alignItems: "center", gap: 14, padding: "12px 22px",
              cursor: "pointer", borderBottom: "0.5px solid var(--border)",
              width: "100%", background: "var(--bg)", border: "none", textAlign: "left", fontFamily: "inherit",
              transition: "background 0.1s",
            }}
            onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg2)"; }}
            onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg)"; }}
          >
            <Cover src={it.cover ?? undefined} seed={it.uuid} width={38} height={54} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: "var(--serif)", fontSize: 14, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {it.title}
              </p>
              <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", marginTop: 3 }}>
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
      {/* Hero —— 模糊海报作底 + 大封面 + 信息浮上，呼应 BentoTop 设计语言 */}
      <div style={{ position: "relative", minHeight: 170, overflow: "hidden" }}>
        {item.cover && (
          <div
            aria-hidden
            style={{
              position: "absolute", inset: -24,
              background: `url(${item.cover}) center/cover no-repeat`,
              filter: "blur(28px) saturate(1.2)",
              transform: "scale(1.10)",
              opacity: 0.92,
            }}
          />
        )}
        <div
          aria-hidden
          style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(115deg, rgba(15,12,8,0.78) 0%, rgba(15,12,8,0.55) 60%, rgba(15,12,8,0.40) 100%)",
          }}
        />
        <div style={{ position: "relative", display: "flex", gap: 18, padding: "22px 22px 24px" }}>
          <Cover
            src={item.cover ?? undefined}
            seed={item.uuid}
            width={92}
            height={132}
            style={{
              boxShadow: "0 10px 26px rgba(0,0,0,0.50)",
              border: "0.5px solid rgba(255,255,255,0.12)",
              borderRadius: 5,
            }}
          />
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", paddingTop: 2, gap: 8 }}>
            <div>
              <MediumBadge medium={item.medium} small />
            </div>
            <p style={{
              fontFamily: "var(--serif)", fontSize: 21, fontWeight: 500, color: "#F1EFE8",
              lineHeight: 1.2, letterSpacing: "-0.01em",
              overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
            }}>
              {item.title}
            </p>
            <p style={{
              fontFamily: "var(--mono)", fontSize: 11, color: "rgba(241,239,232,0.72)",
              letterSpacing: ".02em",
              overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
            }}>
              {[item.year, item.creator].filter(Boolean).join(" · ") || " "}
            </p>
          </div>
        </div>
      </div>

      <div style={{ padding: "20px 22px", overflowY: "auto", flex: 1 }}>
        <p className="section-label" style={{ marginBottom: 10 }}>状态</p>
        <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
          {STATUS_OPTIONS.map((s) => {
            const on = s === status;
            return (
              <button
                key={s}
                onClick={() => setStatus(s)}
                style={{
                  flex: 1, padding: "11px 8px", borderRadius: "var(--r2)",
                  border: `0.5px solid ${on ? "#A86515" : "var(--border)"}`,
                  background: on
                    ? "linear-gradient(135deg, #E0B270 0%, #D38A30 100%)"
                    : "var(--bg)",
                  color: on ? "#FFF6E6" : "var(--text2)",
                  boxShadow: on
                    ? "0 3px 10px rgba(150,88,18,0.28), inset 0 1px 0 rgba(255,245,220,0.40)"
                    : "none",
                  cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  fontFamily: "inherit", fontWeight: on ? 500 : 400,
                  transition: "all 0.15s",
                }}
              >
                <i className={`ti ${STATUS_ICON[s]}`} style={{ fontSize: 13 }} />
                {statusVerb(item.medium, s)}
              </button>
            );
          })}
        </div>

        <p className="section-label" style={{ marginBottom: 10 }}>评分</p>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 20 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setRating(rating === n ? 0 : n)}
              onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1.12)"; }}
              onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
              style={{
                background: "none", border: "none", padding: "2px 1px", cursor: "pointer",
                lineHeight: 1, transition: "transform 0.12s",
              }}
              aria-label={`${n} 星`}
            >
              <i
                className={`ti ti-star${rating >= n ? "-filled" : ""}`}
                style={{ fontSize: 24, color: rating >= n ? "var(--gold)" : "var(--border)" }}
              />
            </button>
          ))}
          {rating > 0 && (
            <button
              onClick={() => setRating(0)}
              style={{ background: "none", border: "none", color: "var(--text3)", fontSize: 11, cursor: "pointer", marginLeft: 10, fontFamily: "var(--mono)" }}
            >
              清除
            </button>
          )}
        </div>

        <p className="section-label" style={{ marginBottom: 10 }}>短评</p>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="写下想法（可选）"
          rows={4}
          style={{
            width: "100%", background: "var(--bg2)", border: "0.5px solid var(--border)", borderRadius: "var(--r2)",
            padding: "12px 14px", fontSize: 13, color: "var(--text)", fontFamily: "inherit",
            resize: "none", outline: "none", lineHeight: 1.65,
            transition: "border-color 0.15s",
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "#D9A66A"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
        />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16 }}>
          <label style={{ fontSize: 11, color: "var(--text3)", display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--mono)" }}>
            可见性
            <select
              value={visibility}
              onChange={(e) => setVisibility(Number(e.target.value) as 0 | 1 | 2)}
              style={{ fontSize: 11, padding: "3px 7px", border: "0.5px solid var(--border)", borderRadius: 4, background: "var(--bg)", fontFamily: "var(--mono)", cursor: "pointer" }}
            >
              <option value={0}>公开</option>
              <option value={1}>仅关注者</option>
              <option value={2}>仅提及者</option>
            </select>
          </label>
          <button onClick={onClose} className="btn" style={{ fontSize: 11 }}>取消</button>
        </div>
      </div>

      <div style={{ padding: "14px 22px 18px", borderTop: "0.5px solid var(--border)" }}>
        <button
          onClick={save}
          disabled={saving}
          className="modal-save-btn"
          style={{ width: "100%" }}
        >
          {saving ? "保存中…" : `保存到 NeoDB`}
        </button>
      </div>
    </>
  );
}
