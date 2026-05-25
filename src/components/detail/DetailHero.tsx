"use client";

import { useRecordModal } from "@/lib/store/record-modal";
import { useAIPanel, detailContext } from "@/lib/store/ai-panel";
import { Cover } from "@/components/shared/Cover";
import { Stars } from "@/components/shared/Stars";
import { STATUS_ICONS } from "@/components/shared/StatusControl";
import type { UiItem, UiShelfStatus } from "@/lib/neodb/ui-types";
import { statusVerb, type UiMedium } from "@/lib/format/verbs";

const AI_LABEL: Record<UiMedium, string> = {
  movie: "AI 聊聊",
  series: "AI 聊聊",
  book: "AI 解读",
  music: "AI 聊聊",
  podcast: "AI 聊聊",
  game: "AI 聊聊",
};

export function DetailHero({ ui, medium, myStatus }: { ui: UiItem; medium: UiMedium; myStatus?: UiShelfStatus }) {
  const showModal = useRecordModal((s) => s.show);
  const openAI = useAIPanel((s) => s.setOpen);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "114px 1fr", gap: 18, marginBottom: 8 }}>
      <Cover src={ui.cover ?? undefined} seed={ui.uuid} width={114} height={170} alt={ui.title} style={{ borderRadius: "var(--r)", aspectRatio: "2/3", height: "auto" }} />
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontFamily: "var(--serif)", fontSize: 28, fontWeight: 500, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
            {ui.title}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            {ui.year && (
              <>
                <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text2)" }}>{ui.year}</span>
                <span style={{ color: "var(--border2)" }}>·</span>
              </>
            )}
            {ui.creator && (
              <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text2)" }}>{ui.creator}</span>
            )}
          </div>
          {typeof ui.externalRating === "number" && ui.externalRating > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
              <Stars value={ui.externalRating / 2} size={13} />
              <span style={{ fontSize: 13, fontWeight: 500 }}>{ui.externalRating.toFixed(1)}</span>
              {typeof ui.externalRatingCount === "number" && (
                <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)" }}>
                  NeoDB · {ui.externalRatingCount} 人评
                </span>
              )}
            </div>
          )}
          {myStatus && (
            <div style={{ marginTop: 10 }}>
              <a
                href="#my-record"
                className="chip"
                style={{
                  textDecoration: "none",
                  color: "var(--gold)",
                  borderColor: "var(--gold)",
                  background: "var(--bg)",
                  fontWeight: 500,
                }}
                aria-label={`跳到我的记录：已${statusVerb(medium, myStatus)}`}
              >
                <i className={`ti ${STATUS_ICONS[myStatus]}`} aria-hidden style={{ fontSize: 11 }} />
                我已{statusVerb(medium, myStatus)}
              </a>
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          <button
            className="btn primary"
            onClick={() =>
              showModal({
                item: {
                  uuid: ui.uuid,
                  medium,
                  title: ui.title,
                  cover: ui.cover ?? undefined,
                  year: ui.year,
                  creator: ui.creator,
                },
              })
            }
          >
            <i className="ti ti-edit" style={{ fontSize: 12 }} /> 编辑记录
          </button>
          <a href={`/review/new/${medium}/${ui.uuid}`} className="btn">
            <i className="ti ti-pencil" style={{ fontSize: 12 }} /> 写长评
          </a>
          <button className="btn" onClick={(e) => openAI(true, detailContext(medium, ui.uuid, ui.title, ui.year, ui.creator, ui.brief), { x: e.clientX, y: e.clientY })} style={{ borderStyle: "dashed" }}>
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M7 1L8.5 5.5L13 7L8.5 8.5L7 13L5.5 8.5L1 7L5.5 5.5Z" fill="currentColor" />
            </svg>
            {AI_LABEL[medium]}
          </button>
        </div>
      </div>
    </div>
  );
}
