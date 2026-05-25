import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth/cookie";
import { getItem, getMyMark, listItemPosts } from "@/lib/neodb/client";
import { itemToUi, postToUiComment, postToUiReview } from "@/lib/neodb/mappers";
import { ratingToUi } from "@/components/shared/Stars";
import { fromNeoDBCategory } from "@/lib/neodb/mediumMap";
import { ALL_UI_MEDIUMS } from "@/lib/neodb/mediumMap";
import { DetailHero } from "@/components/detail/DetailHero";
import { MyRecordCard } from "@/components/detail/MyRecordCard";
import { MetaKVList } from "@/components/detail/MetaKVList";
import { EpisodeTracker } from "@/components/detail/EpisodeTracker";
import { ReadingProgress } from "@/components/detail/ReadingProgress";
import { CommunityPosts } from "@/components/detail/CommunityPosts";
import type { UiCommunityComment, UiCommunityReview } from "@/lib/neodb/ui-types";
import type { UiMedium } from "@/lib/format/verbs";

interface PageProps {
  params: Promise<{ medium: string; uuid: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { medium: rawMedium, uuid } = await params;
  if (!ALL_UI_MEDIUMS.includes(rawMedium as UiMedium)) {
    return { title: "未找到 · Folio" };
  }
  const medium = rawMedium as UiMedium;
  try {
    const item = await getItem({ medium, uuid });
    const ui = itemToUi(item);
    const title = `${ui.title} · Folio`;
    const description = ui.brief?.slice(0, 160) || `在 Folio 上查看 ${ui.title} 的档案`;
    const images = ui.cover ? [{ url: ui.cover }] : undefined;
    return {
      title,
      description,
      openGraph: { title, description, type: "article", images },
      twitter: { card: "summary_large_image", title, description, images: images?.map((i) => i.url) },
    };
  } catch {
    return { title: "未找到 · Folio" };
  }
}

export default async function DetailPage({ params }: PageProps) {
  const { medium: rawMedium, uuid } = await params;
  if (!ALL_UI_MEDIUMS.includes(rawMedium as UiMedium)) notFound();
  const medium = rawMedium as UiMedium;
  const session = await getSession();
  const homeInstance = session?.instance ?? null;

  // 4 个 NeoDB endpoint 互相独立，全部并行（原本 3 段串行 RTT，现在压成 1 段）。
  // getItem 404 需要 notFound()，所以用 sentinel null 在 Promise.all 里捕获，外层再判断。
  const itemPromise = getItem({ medium, uuid }).catch((err) => {
    const status = (err as { status?: number })?.status;
    if (status === 404) return null;
    throw err;
  });
  const [item, mark, commentPage, reviewPage] = await Promise.all([
    itemPromise,
    getMyMark(uuid).catch(() => null),
    listItemPosts({ uuid, type: "comment", page: 1 }).catch(() => ({ data: [], count: 0, pages: 1 })),
    listItemPosts({ uuid, type: "review", page: 1 }).catch(() => ({ data: [], count: 0, pages: 1 })),
  ]);
  if (!item) notFound();
  // verify category match
  if (fromNeoDBCategory(item.category) !== medium && medium !== "music") {
    // music ↔ album shift is allowed
  }

  const comments: UiCommunityComment[] = commentPage.data
    .map(postToUiComment)
    .filter((c): c is UiCommunityComment => c !== null);
  const reviews: UiCommunityReview[] = reviewPage.data
    .map(postToUiReview)
    .filter((r): r is UiCommunityReview => r !== null);

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
    <div className="detail-page">
      <Crumbs medium={medium} title={ui.title} />
      <DetailHero ui={ui} medium={medium} />
      <div className="detail-main">
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
          <CommunityPosts
            uuid={uuid}
            initialComments={comments}
            initialCommentPages={commentPage.pages ?? 1}
            commentCount={commentPage.count ?? comments.length}
            initialReviews={reviews}
            initialReviewPages={reviewPage.pages ?? 1}
            reviewCount={reviewPage.count ?? reviews.length}
            homeInstance={homeInstance}
          />
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
  const v = item.episode_count;
  return typeof v === "number" && v > 0 ? v : undefined;
}

function pickTotalPages(item: Record<string, unknown>): number | undefined {
  const v = item.pages;
  return typeof v === "number" ? v : undefined;
}
