import Link from "next/link";
import { statusVerb, type UiMedium } from "@/lib/format/verbs";
import { relativeTime } from "@/lib/format/dates";
import { RatingTag } from "@/components/shared/RatingTag";
import { Cover } from "@/components/shared/Cover";
import type { UiTimelineEntry } from "@/lib/neodb/ui-types";

const STATUS_PILL: Record<string, { bg: string; fg: string }> = {
  complete: { bg: "var(--bg2)", fg: "var(--text3)" },
  progress: { bg: "#EEF6E8", fg: "#0F6E56" },
  wishlist: { bg: "#FAEEDA", fg: "#854F0B" },
  dropped: { bg: "#F4E8E8", fg: "#8C3B52" },
};

const MEDIUM_LABEL: Record<string, string> = {
  movie: "电影", series: "剧集", book: "书籍", music: "音乐", podcast: "播客", game: "游戏",
};

export function ActivityStrip({ recent }: { recent: UiTimelineEntry[] }) {
  return (
    <div style={{ border: "0.5px solid var(--border)", borderRadius: "var(--r)", overflow: "hidden", marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 18px", borderBottom: "0.5px solid var(--border)" }}>
        <span className="section-label">最近动态</span>
        <Link href="/timeline" style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)", textDecoration: "none" }}>
          全部 →
        </Link>
      </div>
      {recent.length === 0 ? (
        <div style={{ padding: "26px 20px", textAlign: "center", color: "var(--text3)", fontSize: 12 }}>
          还没有动态。开始记录第一条吧。
        </div>
      ) : (
        recent.map((e) => <ActivityRow key={`${e.uuid}-${e.createdAt}`} e={e} />)
      )}
    </div>
  );
}

function ActivityRow({ e }: { e: UiTimelineEntry }) {
  const pill = STATUS_PILL[e.status] ?? STATUS_PILL.complete;
  return (
    <Link href={`/detail/${e.medium}/${e.uuid}`} className="row" style={{ textDecoration: "none", color: "inherit" }}>
      <Cover src={e.cover ?? undefined} seed={e.uuid} width={32} height={46} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: "var(--serif)", fontSize: 14, fontWeight: 500 }}>{e.title}</p>
        <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", marginTop: 2 }}>
          {[MEDIUM_LABEL[e.medium], e.year, e.creator].filter(Boolean).join(" · ")}
        </p>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <RatingTag own={e.rating} external={e.externalRating} />
        <span className="badge" style={{ background: pill.bg, color: pill.fg }}>
          {statusVerb(e.medium as UiMedium, e.status)}
        </span>
        <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)" }}>{relativeTime(e.createdAt)}</span>
      </div>
    </Link>
  );
}
