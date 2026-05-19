"use client";

import { useRecordModal } from "@/lib/store/record-modal";
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
    rating: number;
    comment: string;
    visibility: 0 | 1 | 2;
    createdAt: string;
  } | null;
}

const VISIBLE_STATUSES: UiShelfStatus[] = ["complete", "progress", "wishlist"];
const ICONS: Record<UiShelfStatus, string> = {
  complete: "ti-check",
  progress: "ti-player-play",
  wishlist: "ti-bookmark",
  dropped: "ti-x",
};

export function MyRecordCard({ uuid, medium, myRecord, title, cover, year, creator }: Props) {
  const show = useRecordModal((s) => s.show);

  function open(prefillStatus?: UiShelfStatus) {
    show({
      item: { uuid, medium, title, cover, year, creator },
      prefill: prefillStatus
        ? { status: prefillStatus }
        : myRecord
          ? { status: myRecord.status, rating: myRecord.rating, comment: myRecord.comment, visibility: myRecord.visibility }
          : undefined,
    });
  }

  return (
    <div style={{ border: "0.5px solid var(--border)", borderRadius: "var(--r)", overflow: "hidden" }}>
      <div style={{ padding: "11px 16px", borderBottom: "0.5px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className="section-label">我的记录</span>
        <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)" }}>
          {myRecord ? new Date(myRecord.createdAt).toLocaleDateString("zh-CN") : "未记录"}
        </span>
      </div>

      <div style={{ padding: "12px 16px", borderBottom: "0.5px solid var(--border)" }}>
        <p style={{ fontSize: 11, color: "var(--text3)", marginBottom: 8 }}>状态</p>
        <div style={{ display: "flex", gap: 7 }}>
          {VISIBLE_STATUSES.map((s) => {
            const on = myRecord?.status === s;
            return (
              <button
                key={s}
                onClick={() => open(s)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  padding: "5px 11px", borderRadius: 999, fontSize: 12,
                  background: "var(--bg2)",
                  border: `0.5px solid ${on ? "var(--border2)" : "var(--border)"}`,
                  color: on ? "var(--text)" : "var(--text2)",
                  fontWeight: on ? 500 : 400,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
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
        {myRecord && myRecord.rating > 0 ? (
          <Stars value={myRecord.rating} size={18} />
        ) : (
          <button onClick={() => open()} style={{ background: "none", border: "none", color: "var(--text3)", fontSize: 12, fontStyle: "italic", cursor: "pointer", padding: 0 }}>
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
            <button onClick={() => open()} style={{ background: "none", border: "none", color: "var(--text2)", textDecoration: "underline", cursor: "pointer", padding: 0, fontSize: 13 }}>
              写一篇
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
