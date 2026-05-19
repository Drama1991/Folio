import { notFound } from "next/navigation";
import Link from "next/link";
import { getItem, getMyMark } from "@/lib/neodb/client";
import { itemToUi } from "@/lib/neodb/mappers";
import { ratingToUi } from "@/components/shared/Stars";
import { fromNeoDBCategory } from "@/lib/neodb/mediumMap";
import { ALL_UI_MEDIUMS } from "@/lib/neodb/mediumMap";
import { DetailHero } from "@/components/detail/DetailHero";
import { MyRecordCard } from "@/components/detail/MyRecordCard";
import { MetaKVList } from "@/components/detail/MetaKVList";
import { EpisodeTracker } from "@/components/detail/EpisodeTracker";
import { ReadingProgress } from "@/components/detail/ReadingProgress";
import type { UiMedium } from "@/lib/format/verbs";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ medium: string; uuid: string }>;
}

export default async function DetailPage({ params }: PageProps) {
  const { medium: rawMedium, uuid } = await params;
  if (!ALL_UI_MEDIUMS.includes(rawMedium as UiMedium)) notFound();
  const medium = rawMedium as UiMedium;

  let item;
  try {
    item = await getItem({ medium, uuid });
  } catch {
    notFound();
  }
  // verify category match
  if (fromNeoDBCategory(item.category) !== medium && medium !== "music") {
    // music ↔ album shift is allowed
  }

  const mark = await getMyMark(uuid).catch(() => null);

  const ui = itemToUi(item);
  const myRecord = mark
    ? {
        status: mark.shelf_type,
        rating: ratingToUi(mark.rating_grade ?? undefined),
        comment: mark.comment_text ?? "",
        visibility: mark.visibility,
        createdAt: mark.created_time ?? "",
      }
    : null;

  // 媒介专属 meta kv
  const meta = extractMetaKV(item, medium);

  return (
    <div style={{ padding: "18px 24px 24px" }}>
      <Crumbs medium={medium} title={ui.title} />
      <DetailHero ui={ui} medium={medium} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 240px", gap: 14, marginTop: 18 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <MyRecordCard uuid={uuid} medium={medium} myRecord={myRecord} title={ui.title} cover={ui.cover ?? undefined} year={ui.year} creator={ui.creator} />
          {ui.brief && (
            <div style={{ border: "0.5px solid var(--border)", borderRadius: "var(--r)", padding: "14px 16px" }}>
              <p className="section-label" style={{ marginBottom: 8 }}>简介</p>
              <p style={{ fontFamily: "var(--serif)", fontSize: 13, lineHeight: 1.7, color: "var(--text2)" }}>{ui.brief}</p>
            </div>
          )}
          {medium === "series" && <EpisodeTracker uuid={uuid} totalHint={pickTotalEpisodes(item)} />}
          {medium === "book" && <ReadingProgress uuid={uuid} totalHint={pickTotalPages(item)} />}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <MetaKVList items={meta} />
        </div>
      </div>
    </div>
  );
}

function Crumbs({ medium, title }: { medium: UiMedium; title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
      <Link href="/home" className="crumb">首页</Link>
      <span style={{ color: "var(--text3)", fontFamily: "var(--mono)", fontSize: 11 }}>/</span>
      <Link href={`/archive/${medium}`} className="crumb">档案 · {medium}</Link>
      <span style={{ color: "var(--text3)", fontFamily: "var(--mono)", fontSize: 11 }}>/</span>
      <span className="crumb cur">{title}</span>
    </div>
  );
}

function extractMetaKV(item: Record<string, unknown>, medium: UiMedium): [string, string][] {
  const pairs: [string, string][] = [];
  const push = (k: string, v: unknown) => {
    if (!v) return;
    if (Array.isArray(v)) {
      const names = v
        .map((x) => (typeof x === "string" ? x : (x as Record<string, unknown>)?.name ?? null))
        .filter(Boolean)
        .slice(0, 3);
      if (names.length) pairs.push([k, names.join(" · ")]);
      return;
    }
    if (typeof v === "string" || typeof v === "number") pairs.push([k, String(v)]);
  };

  switch (medium) {
    case "movie":
    case "series":
      push("导演", item.director);
      push("主演", item.actor);
      push("类型", item.genre);
      push("地区", item.area);
      push("语言", item.language);
      push("上映", item.release_date || item.year);
      break;
    case "book":
      push("作者", item.author);
      push("译者", item.translator);
      push("类型", item.genre);
      push("出版", item.publishing_house);
      push("语言", item.language);
      push("出版年", item.pub_year || item.year);
      push("ISBN", item.isbn);
      break;
    case "music":
      push("艺术家", item.artist);
      push("流派", item.genre);
      push("厂牌", item.company);
      push("语言", item.language);
      push("发行", item.release_date || item.year);
      push("曲目数", item.track_list);
      break;
    case "podcast":
      push("主播", item.host);
      push("分类", item.genre);
      push("更新", item.frequency);
      push("语言", item.language);
      push("首播", item.release_date || item.year);
      break;
    case "game":
      push("开发", item.developer);
      push("发行", item.publisher);
      push("平台", item.platform);
      push("类型", item.genre);
      push("发布", item.release_date || item.year);
      break;
  }
  return pairs;
}

function pickTotalEpisodes(item: Record<string, unknown>): number | undefined {
  const v = item.episode_count ?? item.season_count;
  return typeof v === "number" ? v : undefined;
}

function pickTotalPages(item: Record<string, unknown>): number | undefined {
  const v = item.pages;
  return typeof v === "number" ? v : undefined;
}
