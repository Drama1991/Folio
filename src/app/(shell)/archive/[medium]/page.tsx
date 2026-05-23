import { notFound } from "next/navigation";
import Link from "next/link";
import { listShelfAll } from "@/lib/neodb/client";
import { markToArchiveRow } from "@/lib/neodb/mappers";
import { ArchiveHeader } from "@/components/archive/ArchiveHeader";
import { ArchiveRow } from "@/components/archive/ArchiveRow";
import { SortDropdown, type SortBy } from "@/components/archive/SortDropdown";
import { Cover } from "@/components/shared/Cover";
import { ALL_UI_MEDIUMS } from "@/lib/neodb/mediumMap";
import { mediumLabel, statusVerb, type UiMedium } from "@/lib/format/verbs";
import type { NeoDBShelfType } from "@/lib/neodb/types";
import type { UiArchiveRow } from "@/lib/neodb/ui-types";

const STATUS_FILTERS: NeoDBShelfType[] = ["complete", "progress", "wishlist", "dropped"];
const SORT_VALUES = ["time", "rating", "title", "year"] as const;

interface ArchiveParams {
  status: NeoDBShelfType;
  view: "list" | "grid";
  sort: SortBy;
  year: string; // "all" | "2025" | ... | "older"
}

function parseParams(sp: Record<string, string | undefined>): ArchiveParams {
  return {
    status: STATUS_FILTERS.includes(sp.status as NeoDBShelfType) ? (sp.status as NeoDBShelfType) : "complete",
    view: sp.view === "grid" ? "grid" : "list",
    sort: SORT_VALUES.includes(sp.sort as SortBy) ? (sp.sort as SortBy) : "time",
    year: sp.year ?? "all",
  };
}

function archiveUrl(medium: UiMedium, current: ArchiveParams, override: Partial<ArchiveParams>): string {
  const next = { ...current, ...override };
  const qs = new URLSearchParams();
  if (next.status !== "complete") qs.set("status", next.status);
  if (next.view !== "list") qs.set("view", next.view);
  if (next.sort !== "time") qs.set("sort", next.sort);
  if (next.year !== "all") qs.set("year", next.year);
  const s = qs.toString();
  return `/archive/${medium}${s ? `?${s}` : ""}`;
}

function getReleaseYear(r: UiArchiveRow): number | null {
  if (typeof r.year === "number") return r.year;
  if (typeof r.year === "string") {
    const m = r.year.match(/\d{4}/);
    return m ? Number(m[0]) : null;
  }
  return null;
}

function applyYearFilter(rows: UiArchiveRow[], year: string, olderThreshold: number): UiArchiveRow[] {
  if (year === "all") return rows;
  if (year === "older") {
    return rows.filter((r) => {
      const y = getReleaseYear(r);
      return y !== null && y < olderThreshold;
    });
  }
  const y = Number(year);
  return rows.filter((r) => getReleaseYear(r) === y);
}

function applySort(rows: UiArchiveRow[], sort: SortBy): UiArchiveRow[] {
  const copy = [...rows];
  if (sort === "rating") {
    copy.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || +new Date(b.updatedAt) - +new Date(a.updatedAt));
  } else if (sort === "title") {
    copy.sort((a, b) => a.title.localeCompare(b.title, "zh-CN"));
  } else if (sort === "year") {
    copy.sort((a, b) => (getReleaseYear(b) ?? 0) - (getReleaseYear(a) ?? 0));
  }
  // "time" = default order (createdAt desc from API)
  return copy;
}

function computeYears(rows: UiArchiveRow[]): { values: number[]; olderThreshold: number | null } {
  const set = new Set<number>();
  rows.forEach((r) => { const y = getReleaseYear(r); if (y) set.add(y); });
  const sorted = Array.from(set).sort((a, b) => b - a);
  if (sorted.length <= 5) return { values: sorted, olderThreshold: null };
  return { values: sorted.slice(0, 4), olderThreshold: sorted[3] };
}

interface PageProps {
  params: Promise<{ medium: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function ArchivePage({ params, searchParams }: PageProps) {
  const { medium: rawMedium } = await params;
  const sp = await searchParams;

  if (!ALL_UI_MEDIUMS.includes(rawMedium as UiMedium)) notFound();
  const medium = rawMedium as UiMedium;
  const p = parseParams(sp);

  const page = await listShelfAll({ type: p.status, category: medium }).catch(
    () => ({ data: [], count: 0 }) as { data: never[]; count: number },
  );
  const allRows = (page.data ?? []).map(markToArchiveRow);

  const yearInfo = computeYears(allRows);
  const filtered = applyYearFilter(allRows, p.year, yearInfo.olderThreshold ?? 0);
  const sorted = applySort(filtered, p.sort);

  const sortUrls: Record<SortBy, string> = {
    time: archiveUrl(medium, p, { sort: "time" }),
    rating: archiveUrl(medium, p, { sort: "rating" }),
    title: archiveUrl(medium, p, { sort: "title" }),
    year: archiveUrl(medium, p, { sort: "year" }),
  };

  return (
    <div className="archive-page">
      <Crumbs medium={medium} />
      <ArchiveHeader medium={medium} status={p.status} total={page.count ?? allRows.length} rows={allRows} />

      {/* Row 1: status chips | sort + view toggle */}
      <div className="archive-filter-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 14, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {STATUS_FILTERS.map((s) => (
            <Link
              key={s}
              href={archiveUrl(medium, p, { status: s, year: "all" })}
              className={`chip${s === p.status ? " on" : ""}`}
            >
              {labelOf(s, medium)}
            </Link>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <SortDropdown current={p.sort} urls={sortUrls} />
          <div className="view-toggle" role="tablist" aria-label="视图切换">
            <Link
              href={archiveUrl(medium, p, { view: "list" })}
              className={p.view === "list" ? "on" : ""}
              title="列表"
              role="tab"
              aria-selected={p.view === "list"}
              aria-label="列表视图"
            >
              <i className="ti ti-list" style={{ fontSize: 14 }} />
            </Link>
            <Link
              href={archiveUrl(medium, p, { view: "grid" })}
              className={p.view === "grid" ? "on" : ""}
              title="海报墙"
              role="tab"
              aria-selected={p.view === "grid"}
              aria-label="海报墙视图"
            >
              <i className="ti ti-layout-grid" style={{ fontSize: 13 }} />
            </Link>
          </div>
        </div>
      </div>

      {/* Row 2: year chips（仅在有多个年份时显示） */}
      {yearInfo.values.length >= 2 && (
        <div style={{ display: "flex", gap: 5, marginTop: 10, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", marginRight: 2 }}>年份</span>
          <Link href={archiveUrl(medium, p, { year: "all" })} className={`chip sm${p.year === "all" ? " on" : ""}`}>全部</Link>
          {yearInfo.values.map((y) => (
            <Link key={y} href={archiveUrl(medium, p, { year: String(y) })} className={`chip sm${p.year === String(y) ? " on" : ""}`}>{y}</Link>
          ))}
          {yearInfo.olderThreshold !== null && (
            <Link href={archiveUrl(medium, p, { year: "older" })} className={`chip sm${p.year === "older" ? " on" : ""}`}>更早</Link>
          )}
        </div>
      )}

      <div style={{ marginTop: 14 }}>
        {sorted.length === 0 ? (
          <div style={{ border: "0.5px solid var(--border)", borderRadius: "var(--r)", padding: "26px 20px", textAlign: "center", color: "var(--text3)", fontSize: 12 }}>
            没有匹配的内容。
          </div>
        ) : p.view === "list" ? (
          <div style={{ border: "0.5px solid var(--border)", borderRadius: "var(--r)", overflow: "hidden" }}>
            {sorted.map((r) => <ArchiveRow key={`${r.uuid}-${r.updatedAt}`} row={r} />)}
          </div>
        ) : (
          <div className="poster-grid">
            {sorted.map((r) => (
              <Link key={`${r.uuid}-${r.updatedAt}`} href={`/detail/${r.medium}/${r.uuid}`} className="poster-tile">
                <Cover src={r.cover ?? undefined} seed={r.uuid} width="100%" height="100%" />
                {r.rating ? (
                  <span className="poster-tile-corner own">★ {r.rating.toFixed(1)}</span>
                ) : r.externalRating ? (
                  <span className="poster-tile-corner">★ {r.externalRating.toFixed(1)}</span>
                ) : p.status !== "complete" ? (
                  <span className="poster-tile-corner">{statusVerb(r.medium, r.status)}</span>
                ) : null}
                <div className="poster-tile-overlay">
                  <p className="poster-tile-title">{r.title}</p>
                  <p className="poster-tile-meta">{[r.year, r.creator].filter(Boolean).join(" · ")}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Crumbs({ medium }: { medium: UiMedium }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
      <Link href="/home" className="crumb">首页</Link>
      <span style={{ color: "var(--text3)", fontFamily: "var(--mono)", fontSize: 11 }}>/</span>
      <span className="crumb cur">档案 · {mediumLabel(medium)}</span>
    </div>
  );
}

function labelOf(s: NeoDBShelfType, m: UiMedium): string {
  if (s === "complete") return m === "book" ? "读过" : m === "music" || m === "podcast" ? "听过" : m === "game" ? "玩过" : "看过";
  if (s === "progress") {
    if (m === "series") return "在追";
    if (m === "book") return "在读";
    if (m === "music" || m === "podcast") return "在听";
    if (m === "game") return "在玩";
    return "在看";
  }
  if (s === "wishlist") return m === "book" ? "想读" : m === "music" || m === "podcast" ? "想听" : m === "game" ? "想玩" : "想看";
  return "弃";
}
