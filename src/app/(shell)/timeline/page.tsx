import Link from "next/link";
import { listShelfAll } from "@/lib/neodb/client";
import { markToTimelineEntry } from "@/lib/neodb/mappers";
import { formatMonthLabel, relativeTime } from "@/lib/format/dates";
import { statusVerb, mediumLabel, type UiMedium } from "@/lib/format/verbs";
import { ALL_UI_MEDIUMS } from "@/lib/neodb/mediumMap";
import { Cover } from "@/components/shared/Cover";
import { RatingTag } from "@/components/shared/RatingTag";
import { TimelineStatusFilter, type TimelineStatus } from "@/components/timeline/TimelineStatusFilter";
import { TimelineEmptyCTA } from "@/components/timeline/TimelineEmptyCTA";

const STATUS_VALUES: TimelineStatus[] = ["all", "complete", "progress", "wishlist"];

interface PageProps {
  searchParams: Promise<{ filter?: string; status?: string }>;
}

function timelineUrl(filter: UiMedium | undefined, status: TimelineStatus): string {
  const qs = new URLSearchParams();
  if (filter) qs.set("filter", filter);
  if (status !== "all") qs.set("status", status);
  const s = qs.toString();
  return `/timeline${s ? `?${s}` : ""}`;
}

export default async function TimelinePage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const filterMedium = ALL_UI_MEDIUMS.includes(sp.filter as UiMedium) ? (sp.filter as UiMedium) : undefined;
  const status: TimelineStatus = STATUS_VALUES.includes(sp.status as TimelineStatus) ? (sp.status as TimelineStatus) : "all";

  const shelves =
    status === "all"
      ? (["complete", "progress", "wishlist"] as const)
      : ([status] as const);

  const results = await Promise.all(
    shelves.map((t) =>
      listShelfAll({ type: t, category: filterMedium }).catch(() => ({ data: [] as never[] })),
    ),
  );

  const all = results
    .flatMap((r) => r.data ?? [])
    .map(markToTimelineEntry)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  // group by year-month
  const groups = new Map<string, typeof all>();
  for (const entry of all) {
    const d = new Date(entry.createdAt);
    if (Number.isNaN(d.getTime())) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const list = groups.get(key) ?? [];
    list.push(entry);
    groups.set(key, list);
  }
  const sortedGroups = Array.from(groups.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));

  const statusUrls: Record<TimelineStatus, string> = {
    all: timelineUrl(filterMedium, "all"),
    complete: timelineUrl(filterMedium, "complete"),
    progress: timelineUrl(filterMedium, "progress"),
    wishlist: timelineUrl(filterMedium, "wishlist"),
  };

  return (
    <div className="timeline-page">
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <Link href="/home" className="crumb">首页</Link>
        <span style={{ color: "var(--text3)", fontFamily: "var(--mono)", fontSize: 11 }}>/</span>
        <span className="crumb cur">时间线</span>
      </div>
      <p style={{ fontFamily: "var(--serif)", fontSize: 26, fontWeight: 500, lineHeight: 1 }}>时间线</p>

      <div className="timeline-filter-row">
        <p className="timeline-stats">
          共 {all.length} 条 · 按月分组
        </p>
        <div className="timeline-chips">
          <Link href={timelineUrl(undefined, status)} className={`chip${!filterMedium ? " on" : ""}`}>全部</Link>
          {ALL_UI_MEDIUMS.map((m) => (
            <Link key={m} href={timelineUrl(m, status)} className={`chip${filterMedium === m ? " on" : ""}`}>
              {mediumLabel(m)}
            </Link>
          ))}
        </div>
      </div>

      {sortedGroups.length === 0 && <TimelineEmptyCTA />}

      {sortedGroups.map(([key, list], idx) => (
        <div key={key} style={{ marginBottom: 22 }}>
          {idx === 0 ? (
            <div className="timeline-month-row">
              <p className="section-label" style={{ margin: 0 }}>{formatMonthLabel(`${key}-01`)} · {list.length} 条</p>
              <TimelineStatusFilter current={status} urls={statusUrls} />
            </div>
          ) : (
            <p className="section-label" style={{ marginBottom: 10 }}>{formatMonthLabel(`${key}-01`)} · {list.length} 条</p>
          )}
          <div style={{ border: "0.5px solid var(--border)", borderRadius: "var(--r)", overflow: "hidden" }}>
            {list.map((e) => (
              <Link key={`${e.uuid}-${e.createdAt}`} href={`/detail/${e.medium}/${e.uuid}`} className="row" style={{ textDecoration: "none", color: "inherit" }}>
                <Cover src={e.cover ?? undefined} seed={e.uuid} width={38} height={54} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: "var(--serif)", fontSize: 14, fontWeight: 500 }}>{e.title}</p>
                  <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", marginTop: 2 }}>
                    {[mediumLabel(e.medium), e.year, e.creator].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <RatingTag own={e.rating} external={e.externalRating} />
                  <span style={{ fontSize: 11, color: "var(--text3)", fontFamily: "var(--mono)" }}>{statusVerb(e.medium, e.status)}</span>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)" }}>{relativeTime(e.createdAt)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
