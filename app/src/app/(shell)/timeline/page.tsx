import Link from "next/link";
import { listShelf } from "@/lib/neodb/client";
import { markToTimelineEntry } from "@/lib/neodb/mappers";
import { formatMonthLabel, relativeTime } from "@/lib/format/dates";
import { statusVerb, mediumLabel, type UiMedium } from "@/lib/format/verbs";
import { ALL_UI_MEDIUMS } from "@/lib/neodb/mediumMap";
import { gradientFor } from "@/lib/format/cover-gradient";
import { Stars } from "@/components/shared/Stars";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ filter?: string }>;
}

export default async function TimelinePage({ searchParams }: PageProps) {
  const { filter } = await searchParams;
  const filterMedium = ALL_UI_MEDIUMS.includes(filter as UiMedium) ? (filter as UiMedium) : undefined;

  const [complete, progress, wishlist] = await Promise.all([
    listShelf({ type: "complete", category: filterMedium, page: 1 }).catch(() => ({ data: [] as never[] })),
    listShelf({ type: "progress", category: filterMedium, page: 1 }).catch(() => ({ data: [] as never[] })),
    listShelf({ type: "wishlist", category: filterMedium, page: 1 }).catch(() => ({ data: [] as never[] })),
  ]);

  const all = [...(complete.data ?? []), ...(progress.data ?? []), ...(wishlist.data ?? [])]
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

  return (
    <div style={{ padding: "20px 24px 28px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <Link href="/home" className="crumb">首页</Link>
        <span style={{ color: "var(--text3)", fontFamily: "var(--mono)", fontSize: 11 }}>/</span>
        <span className="crumb cur">时间线</span>
      </div>
      <p style={{ fontFamily: "var(--serif)", fontSize: 26, fontWeight: 500, lineHeight: 1 }}>时间线</p>
      <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", marginTop: 5, marginBottom: 14 }}>
        共 {all.length} 条 · 按月分组
      </p>

      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        <Link href={`/timeline`} className={`btn${!filterMedium ? " primary" : ""}`} style={{ borderRadius: 999, fontSize: 11, textDecoration: "none" }}>全部</Link>
        {ALL_UI_MEDIUMS.map((m) => (
          <Link key={m} href={`/timeline?filter=${m}`} className={`btn${filterMedium === m ? " primary" : ""}`} style={{ borderRadius: 999, fontSize: 11, textDecoration: "none" }}>
            {mediumLabel(m)}
          </Link>
        ))}
      </div>

      {sortedGroups.length === 0 && (
        <div style={{ padding: "26px 20px", textAlign: "center", color: "var(--text3)", fontSize: 12, border: "0.5px solid var(--border)", borderRadius: "var(--r)" }}>
          这个区间还没有记录。
        </div>
      )}

      {sortedGroups.map(([key, list]) => (
        <div key={key} style={{ marginBottom: 22 }}>
          <p className="section-label" style={{ marginBottom: 10 }}>{formatMonthLabel(`${key}-01`)} · {list.length} 条</p>
          <div style={{ border: "0.5px solid var(--border)", borderRadius: "var(--r)", overflow: "hidden" }}>
            {list.map((e) => (
              <Link key={`${e.uuid}-${e.createdAt}`} href={`/detail/${e.medium}/${e.uuid}`} className="row" style={{ textDecoration: "none", color: "inherit" }}>
                <div className={gradientFor(e.uuid)} style={{ width: 3, height: 34, borderRadius: 2 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: "var(--serif)", fontSize: 14, fontWeight: 500 }}>{e.title}</p>
                  <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", marginTop: 2 }}>
                    {[mediumLabel(e.medium), e.year, e.creator].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {e.rating ? <Stars value={e.rating} size={11} /> : null}
                  <span style={{ fontSize: 10, color: "var(--text3)", fontFamily: "var(--mono)" }}>{statusVerb(e.medium, e.status)}</span>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)" }}>{relativeTime(e.createdAt)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
