"use client";

import { statusVerb, type UiMedium } from "@/lib/format/verbs";
import type { UiShelfStatus } from "@/lib/neodb/ui-types";

const VISIBLE_STATUSES: UiShelfStatus[] = ["complete", "progress", "wishlist", "dropped"];
export const STATUS_ICONS: Record<UiShelfStatus, string> = {
  complete: "ti-check",
  progress: "ti-player-play",
  wishlist: "ti-bookmark",
  dropped: "ti-x",
};

interface Props {
  value: UiShelfStatus | null;
  onChange: (status: UiShelfStatus) => void;
  medium: UiMedium;
  disabled?: boolean;
  /** RecordModal 等定宽容器用：每按钮 flex:1 平分宽度、不换行 */
  fillRow?: boolean;
}

/**
 * 4 状态切换：complete / progress / wishlist / dropped
 * 视觉：complete / progress / wishlist 走 .chip / .chip.on 米黄渐变激活态；
 * dropped 走冷灰激活态（var(--text3) 描边 + var(--bg2) 底）——不庆祝"放弃"。
 * 同状态再点是 no-op（删除走调用方的 ⋯ 菜单/外部逻辑）。
 */
export function StatusControl({ value, onChange, medium, disabled, fillRow }: Props) {
  const baseStyle = fillRow
    ? { flex: 1, justifyContent: "center" as const }
    : undefined;

  return (
    <div style={{ display: "flex", gap: 6, flexWrap: fillRow ? "nowrap" : "wrap" }}>
      {VISIBLE_STATUSES.map((s) => {
        const on = value === s;
        const cursor = disabled ? "default" : "pointer";

        if (s === "dropped") {
          return (
            <button
              key={s}
              type="button"
              onClick={() => onChange(s)}
              disabled={disabled}
              className="chip"
              style={{
                ...baseStyle,
                cursor,
                background: on ? "var(--bg2)" : "var(--bg)",
                borderColor: "var(--text3)",
                color: on ? "var(--text)" : "var(--text3)",
                fontWeight: on ? 500 : 400,
                opacity: on ? 1 : 0.75,
                boxShadow: "none",
              }}
            >
              <i className={`ti ${STATUS_ICONS[s]}`} aria-hidden style={{ fontSize: 11 }} />
              {statusVerb(medium, s)}
            </button>
          );
        }

        return (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            disabled={disabled}
            className={`chip${on ? " on" : ""}`}
            style={{ ...baseStyle, cursor }}
          >
            <i className={`ti ${STATUS_ICONS[s]}`} aria-hidden style={{ fontSize: 11 }} />
            {statusVerb(medium, s)}
          </button>
        );
      })}
    </div>
  );
}
