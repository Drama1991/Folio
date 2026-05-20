import Link from "next/link";
import { gradientFor } from "@/lib/format/cover-gradient";
import { statusVerb, mediumLabel, type UiMedium } from "@/lib/format/verbs";
import type { UiTimelineEntry } from "@/lib/neodb/ui-types";

interface Stats {
  progress: number;
  wishlist: number;
  complete: number;
  dropped: number;
}

export function BentoTop({ featured, stats }: { featured: UiTimelineEntry | null; stats: Stats }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0,3fr) minmax(0,2fr)",
        gap: 10,
        marginBottom: 10,
      }}
    >
      <FeaturedCard entry={featured} />
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <StatBox label="在看" value={stats.progress} />
          <StatBox label="想看" value={stats.wishlist} />
          <StatBox label="累计" value={stats.complete} muted />
          <StatBox label="弃" value={stats.dropped} muted />
        </div>
      </div>
    </div>
  );
}

function ProgressBadge({ progress, medium }: { progress?: string; medium: UiMedium }) {
  const label = progress || mediumLabel(medium);
  const isProgress = !!progress;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        flexShrink: 0,
      }}
    >
      {isProgress ? (
        <span aria-hidden style={{ width: 5, height: 5, borderRadius: 999, background: "var(--gold)" }} />
      ) : null}
      <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--gold)", letterSpacing: ".05em" }}>
        {label}
      </span>
    </span>
  );
}

function StatBox({ label, value, muted }: { label: string; value: number; muted?: boolean }) {
  return (
    <div
      style={{
        background: muted ? "var(--bg2)" : "#FAEEDA",
        borderRadius: "var(--r2)",
        padding: "12px 14px",
      }}
    >
      <p style={{ fontFamily: "var(--mono)", fontSize: 10, color: muted ? "var(--text3)" : "#854F0B", marginBottom: 4 }}>
        {label}
      </p>
      <p style={{ fontSize: 20, fontWeight: 500, color: muted ? "var(--text)" : "#412402" }}>{value}</p>
    </div>
  );
}

function FeaturedCard({ entry }: { entry: UiTimelineEntry | null }) {
  if (!entry) {
    return (
      <div
        style={{
          background: "#1C1C1A",
          borderRadius: "var(--r)",
          padding: 22,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          minHeight: 196,
          color: "#888780",
        }}
      >
        <span style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: ".1em" }}>暂无在看</span>
        <p style={{ fontFamily: "var(--serif)", fontSize: 18, color: "#F1EFE8", lineHeight: 1.2 }}>
          先去 &laquo;记录新内容&raquo; 开始追一部吧。
        </p>
      </div>
    );
  }

  const grad = gradientFor(entry.uuid);

  return (
    <Link
      href={`/detail/${entry.medium}/${entry.uuid}`}
      style={{
        display: "block",
        position: "relative",
        background: "#1C1C1A",
        borderRadius: "var(--r)",
        minHeight: 196,
        overflow: "hidden",
        textDecoration: "none",
      }}
    >
      {/* 1. 模糊海报作为氛围背景 */}
      {entry.cover && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: -24,
            background: `url(${entry.cover}) center/cover no-repeat`,
            filter: "blur(28px) saturate(1.15)",
            transform: "scale(1.08)",
            opacity: 0.88,
          }}
        />
      )}
      {/* 2. 暗化渐变（右侧重色保文字可读，因海报在左） */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(280deg, rgba(15,12,8,0.80) 0%, rgba(15,12,8,0.65) 40%, rgba(15,12,8,0.45) 75%, rgba(15,12,8,0.30) 100%)",
        }}
      />
      {/* 3. 内容：左侧海报 + 右侧文字 */}
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "stretch",
          minHeight: 196,
        }}
      >
        <div
          aria-hidden
          className={entry.cover ? undefined : grad}
          style={{
            flexShrink: 0,
            width: 125,
            marginLeft: 22,
            marginRight: 20,
            marginTop: 4,
            marginBottom: 4,
            borderRadius: "var(--r2)",
            background: entry.cover ? `url(${entry.cover}) center/cover no-repeat` : undefined,
            boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
            border: "0.5px solid rgba(255,255,255,0.10)",
          }}
        />
        <div
          style={{
            flex: 1,
            minWidth: 0,
            padding: "14px 22px 22px 0",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
              {entry.status === "progress" && (
                <span
                  aria-hidden
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 999,
                    background: "#4ADE80",
                    flexShrink: 0,
                    boxShadow: "0 0 6px rgba(74,222,128,0.55)",
                    animation: "pulse 2.4s infinite",
                  }}
                />
              )}
              <span style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: ".1em", color: "var(--gold)" }}>
                {statusVerb(entry.medium as UiMedium, entry.status)}
              </span>
            </span>
            <ProgressBadge progress={entry.progressLabel} medium={entry.medium as UiMedium} />
          </div>
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 10,
              minWidth: 0,
            }}
          >
            <p
              style={{
                fontFamily: "var(--serif)",
                fontSize: 22,
                fontWeight: 500,
                color: "#F1EFE8",
                lineHeight: 1.15,
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              }}
            >
              {entry.title}
            </p>
            {entry.brief && (
              <p
                style={{
                  fontSize: 12,
                  color: "#D6D4CD",
                  lineHeight: 1.55,
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {entry.brief.slice(0, 110)}
                {entry.brief.length > 110 ? "…" : ""}
              </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
