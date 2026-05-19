import { notFound } from "next/navigation";
import Link from "next/link";
import { listShelf } from "@/lib/neodb/client";
import { markToArchiveRow } from "@/lib/neodb/mappers";
import { ArchiveHeader } from "@/components/archive/ArchiveHeader";
import { ArchiveTabs } from "@/components/archive/ArchiveTabs";
import { ArchiveRow } from "@/components/archive/ArchiveRow";
import { ALL_UI_MEDIUMS } from "@/lib/neodb/mediumMap";
import type { UiMedium } from "@/lib/format/verbs";
import type { NeoDBShelfType } from "@/lib/neodb/types";

export const dynamic = "force-dynamic";

const STATUS_FILTERS: NeoDBShelfType[] = ["complete", "progress", "wishlist", "dropped"];

interface PageProps {
  params: Promise<{ medium: string }>;
  searchParams: Promise<{ status?: string }>;
}

export default async function ArchivePage({ params, searchParams }: PageProps) {
  const { medium: rawMedium } = await params;
  const sp = await searchParams;

  if (!ALL_UI_MEDIUMS.includes(rawMedium as UiMedium)) notFound();
  const medium = rawMedium as UiMedium;
  const status: NeoDBShelfType = STATUS_FILTERS.includes(sp.status as NeoDBShelfType)
    ? (sp.status as NeoDBShelfType)
    : "complete";

  const page = await listShelf({ type: status, category: medium, page: 1 }).catch(
    () => ({ data: [], count: 0 }) as { data: never[]; count: number },
  );
  const rows = (page.data ?? []).map(markToArchiveRow);

  return (
    <div style={{ padding: "20px 24px 28px" }}>
      <Crumbs medium={medium} />
      <ArchiveHeader medium={medium} status={status} total={page.count ?? rows.length} />
      <ArchiveTabs current={medium} />
      <StatusFilters medium={medium} current={status} />
      <div style={{ border: "0.5px solid var(--border)", borderRadius: "var(--r)", overflow: "hidden", marginTop: 14 }}>
        {rows.length === 0 ? (
          <div style={{ padding: "26px 20px", textAlign: "center", color: "var(--text3)", fontSize: 12 }}>
            还没有内容。
          </div>
        ) : (
          rows.map((r) => <ArchiveRow key={`${r.uuid}-${r.updatedAt}`} row={r} />)
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
      <span className="crumb cur">档案 · {medium}</span>
    </div>
  );
}

function StatusFilters({ medium, current }: { medium: UiMedium; current: NeoDBShelfType }) {
  return (
    <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
      {STATUS_FILTERS.map((s) => (
        <Link
          key={s}
          href={`/archive/${medium}?status=${s}`}
          className={`btn${s === current ? " primary" : ""}`}
          style={{ borderRadius: 999, fontSize: 11, textDecoration: "none" }}
        >
          {labelOf(s, medium)}
        </Link>
      ))}
    </div>
  );
}

function labelOf(s: NeoDBShelfType, m: UiMedium): string {
  if (s === "complete") return m === "book" ? "读过" : m === "music" || m === "podcast" ? "听过" : "看过";
  if (s === "progress") {
    if (m === "series") return "在追";
    if (m === "book") return "在读";
    if (m === "music" || m === "podcast") return "在听";
    return "在看";
  }
  if (s === "wishlist") return m === "book" ? "想读" : m === "music" || m === "podcast" ? "想听" : "想看";
  return "弃";
}
