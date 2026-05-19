import Link from "next/link";
import { Cover } from "@/components/shared/Cover";
import { Stars } from "@/components/shared/Stars";
import { statusVerb, type UiMedium } from "@/lib/format/verbs";
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

  return (
    <Link
      href={`/detail/${entry.medium}/${entry.uuid}`}
      style={{
        background: "#1C1C1A",
        borderRadius: "var(--r)",
        padding: 22,
        display: "grid",
        gridTemplateColumns: "auto 1fr",
        gap: 18,
        minHeight: 196,
        cursor: "pointer",
        textDecoration: "none",
      }}
    >
      <Cover
        src={entry.cover ?? undefined}
        seed={entry.uuid}
        width={100}
        height={150}
        style={{ borderRadius: 6, aspectRatio: "2/3", height: "auto", alignSelf: "center" }}
      />
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", minWidth: 0 }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: ".1em", color: "#888780" }}>
          {statusVerb(entry.medium as UiMedium, entry.status)}
        </span>
        <div style={{ minWidth: 0 }}>
          <p
            style={{
              fontFamily: "var(--serif)",
              fontSize: 24,
              fontWeight: 500,
              color: "#F1EFE8",
              lineHeight: 1.15,
              marginBottom: 5,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {entry.title}
          </p>
          <p
            style={{
              fontSize: 11,
              color: "#5F5E5A",
              marginBottom: 12,
              fontFamily: "var(--mono)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {[entry.creator, entry.year].filter(Boolean).join(" · ")}
          </p>
          {entry.rating ? <Stars value={entry.rating} size={12} /> : null}
        </div>
      </div>
    </Link>
  );
}
