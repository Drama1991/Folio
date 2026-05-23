import Link from "next/link";
import { gradientFor } from "@/lib/format/cover-gradient";
import { relativeTime } from "@/lib/format/dates";
import { statusVerb, mediumLabel, type UiMedium, type ShelfStatus } from "@/lib/format/verbs";
import type { UiTimelineEntry } from "@/lib/neodb/ui-types";

export function BentoTop({
  featured,
  continueWatching,
  continuePanelTitle = "继续看",
  continuePanelHref = "/timeline",
}: {
  featured: UiTimelineEntry | null;
  continueWatching: UiTimelineEntry[];
  continuePanelTitle?: string;
  continuePanelHref?: string;
}) {
  return (
    <div
      className="home-bento-top"
      style={{
        display: "grid",
        gap: 10,
        marginBottom: 10,
        alignItems: "stretch",
      }}
    >
      <FeaturedCard entry={featured} />
      <ContinuePanel items={continueWatching} title={continuePanelTitle} href={continuePanelHref} />
    </div>
  );
}

function ContinuePanel({ items, title, href }: { items: UiTimelineEntry[]; title: string; href: string }) {
  const slots: (UiTimelineEntry | null)[] = [items[0] ?? null, items[1] ?? null];
  return (
    <div
      style={{
        border: "0.5px solid var(--border)",
        borderRadius: "var(--r)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        minHeight: 196,
        background: "var(--bg)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          borderBottom: "0.5px solid var(--border)",
        }}
      >
        <span className="section-label">{title}</span>
        <Link
          href={href}
          style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", textDecoration: "none" }}
        >
          全部 →
        </Link>
      </div>
      <div style={{ flex: 1, display: "grid", gridTemplateRows: "1fr 1fr" }}>
        {slots.map((it, i) =>
          it ? (
            <ContinueCard key={it.uuid} entry={it} divider={i === 0} />
          ) : (
            <EmptySlot key={`empty-${i}`} divider={i === 0} />
          ),
        )}
      </div>
    </div>
  );
}

function ContinueCard({ entry, divider }: { entry: UiTimelineEntry; divider: boolean }) {
  const grad = gradientFor(entry.uuid);
  return (
    <Link
      href={`/detail/${entry.medium}/${entry.uuid}`}
      className="cell-link"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 14px",
        borderBottom: divider ? "0.5px solid var(--border)" : "none",
        minWidth: 0,
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div
        aria-hidden
        className={entry.cover ? undefined : grad}
        style={{
          flexShrink: 0,
          width: 38,
          height: 54,
          borderRadius: 4,
          background: entry.cover ? `url(${entry.cover}) center/cover no-repeat` : undefined,
          border: "0.5px solid var(--border)",
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: "var(--serif)",
            fontSize: 14,
            fontWeight: 500,
            lineHeight: 1.25,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {entry.title}
        </p>
        <p
          style={{
            fontFamily: "var(--mono)",
            fontSize: 11,
            color: "var(--text3)",
            marginTop: 4,
          }}
        >
          {statusVerb(entry.medium as UiMedium, entry.status as ShelfStatus)} · {mediumLabel(entry.medium as UiMedium)} · {relativeTime(entry.createdAt)}
        </p>
      </div>
    </Link>
  );
}

function EmptySlot({ divider }: { divider: boolean }) {
  return (
    <Link
      href="/discover"
      className="cell-link"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: "10px 14px",
        borderBottom: divider ? "0.5px solid var(--border)" : "none",
        color: "var(--text3)",
        fontFamily: "var(--mono)",
        fontSize: 11,
        textDecoration: "none",
      }}
    >
      + 再追一部
    </Link>
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
      <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--gold)", letterSpacing: ".05em" }}>
        {label}
      </span>
    </span>
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
        <span style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: ".1em" }}>暂无在看</span>
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
              <span style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: ".1em", color: "var(--gold)" }}>
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
