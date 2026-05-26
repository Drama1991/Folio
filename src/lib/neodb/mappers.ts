import { ratingToUi } from "@/components/shared/Stars";
import { fromNeoDBCategory } from "./mediumMap";
import type { NeoDBItemBase, NeoDBMark, NeoDBPost, NeoDBPostRelated, NeoDBReview, NeoDBShelfType } from "./types";
import type { MastodonNotification } from "./mastodon-types";
import type {
  ShelfCounts,
  UiArchiveRow,
  UiCommunityComment,
  UiCommunityReview,
  UiItem,
  UiMark,
  UiMedium,
  UiNotification,
  UiNotificationKind,
  UiReviewSummary,
  UiShelfStatus,
  UiTimelineEntry,
} from "./ui-types";

function pickCreator(item: NeoDBItemBase): string | undefined {
  const cat = item.category;
  const get = (k: string): string | undefined => {
    const v = (item as Record<string, unknown>)[k];
    if (Array.isArray(v) && v.length) {
      const first = v[0];
      if (typeof first === "string") return first;
      if (first && typeof first === "object" && "name" in first) {
        return String((first as Record<string, unknown>).name);
      }
    }
    if (typeof v === "string") return v;
    return undefined;
  };
  switch (cat) {
    case "movie":
    case "tv":
      return get("director") || get("playwright") || get("actor");
    case "book":
      return get("author") || get("translator");
    case "music":
      return get("artist");
    case "podcast":
      return get("host");
    case "game":
      return get("developer") || get("publisher");
    default:
      return undefined;
  }
}

function pickYear(item: NeoDBItemBase): number | string | undefined {
  if (item.year) return item.year;
  for (const k of ["release_date", "pub_date", "release_year", "year"]) {
    const v = (item as Record<string, unknown>)[k];
    if (typeof v === "string" || typeof v === "number") {
      const s = String(v);
      const m = s.match(/(\d{4})/);
      if (m) return Number(m[1]);
    }
  }
  return undefined;
}

export function itemToUi(item: NeoDBItemBase): UiItem {
  return {
    uuid: item.uuid,
    medium: fromNeoDBCategory(item.category),
    title: item.display_title || item.title || "(无标题)",
    cover: item.cover_image_url || undefined,
    year: pickYear(item),
    creator: pickCreator(item),
    brief: item.brief,
    externalRating: typeof item.rating === "number" ? item.rating : undefined,
    externalRatingCount: typeof item.rating_count === "number" ? item.rating_count : undefined,
    tags: item.tags,
    raw: item as Record<string, unknown>,
  };
}

export function markToUi(mark: NeoDBMark): UiMark {
  return {
    item: itemToUi(mark.item),
    status: mark.shelf_type,
    rating: ratingToUi(mark.rating_grade ?? undefined),
    comment: mark.comment_text ?? undefined,
    visibility: mark.visibility,
    createdAt: mark.created_time,
    tags: mark.tags,
  };
}

export function markToArchiveRow(mark: NeoDBMark): UiArchiveRow {
  const ui = itemToUi(mark.item);
  return {
    uuid: ui.uuid,
    medium: ui.medium,
    title: ui.title,
    cover: ui.cover ?? undefined,
    year: ui.year,
    creator: ui.creator,
    status: mark.shelf_type,
    rating: ratingToUi(mark.rating_grade ?? undefined),
    externalRating: ui.externalRating ? ui.externalRating / 2 : undefined,
    comment: mark.comment_text ?? undefined,
    updatedAt: mark.created_time,
  };
}

export function markToTimelineEntry(mark: NeoDBMark): UiTimelineEntry {
  const ui = itemToUi(mark.item);
  return {
    uuid: ui.uuid,
    medium: ui.medium,
    title: ui.title,
    cover: ui.cover ?? undefined,
    year: ui.year,
    creator: ui.creator,
    brief: ui.brief,
    status: mark.shelf_type,
    rating: ratingToUi(mark.rating_grade ?? undefined),
    externalRating: ui.externalRating ? ui.externalRating / 2 : undefined,
    comment: mark.comment_text ?? undefined,
    createdAt: mark.created_time,
  };
}

/**
 * NeoDB review API 不返回 uuid 字段，需要从 url / api_url 提取。
 * 兼容：
 *   - 绝对 URL：https://x/review/{uuid}/
 *   - 相对路径：/review/{uuid}  ← NeoDB /me/review 实际返回这种
 *   - 双斜杠 bug：/api//review/{uuid}
 * 策略：剥 query/hash → split("/") → 取最后一个非空段。
 */
function parseReviewUuid(url?: string): string {
  if (!url) return "";
  const path = url.split("?")[0].split("#")[0];
  const parts = path.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? "";
}

export function reviewToUi(review: NeoDBReview): UiReviewSummary {
  const ui = itemToUi(review.item);
  const uuid = review.uuid || parseReviewUuid(review.url) || parseReviewUuid(review.api_url);
  if (!uuid) {
    console.warn(
      "[reviewToUi] uuid empty — raw review payload:\n" +
      JSON.stringify({
        keys: Object.keys(review),
        url: review.url,
        api_url: review.api_url,
        title: review.title,
        item_uuid: review.item?.uuid,
      }, null, 2),
    );
  }
  return {
    uuid,
    itemUuid: ui.uuid,
    itemMedium: ui.medium,
    itemTitle: ui.title,
    title: review.title,
    body: review.body,
    createdAt: review.created_time,
  };
}

const STATUSES: NeoDBShelfType[] = ["wishlist", "progress", "complete", "dropped"];

export function shelfCountsFromCounts(input: Partial<Record<NeoDBShelfType, number>>): ShelfCounts {
  return {
    wishlist: input.wishlist ?? 0,
    progress: input.progress ?? 0,
    complete: input.complete ?? 0,
    dropped: input.dropped ?? 0,
  };
}

export function emptyShelfCounts(): ShelfCounts {
  return { wishlist: 0, progress: 0, complete: 0, dropped: 0 };
}

export { STATUSES };

export type { UiShelfStatus, UiMedium };

// ─── Community posts ────────────────────────────────────────────────

function findRelated(rel: NeoDBPostRelated[] | undefined, type: NeoDBPostRelated["type"]) {
  return rel?.find((r) => r.type === type);
}

/** 把 ext_neodb.relatedWith 里的 Rating 转成 0-5 */
function pickPostRating(post: NeoDBPost): number | undefined {
  const r = findRelated(post.ext_neodb?.relatedWith, "Rating");
  if (!r || typeof r.value !== "number") return undefined;
  // NeoDB rating value 默认是 1-10。ratingToUi 走的就是 /2 的换算。
  return ratingToUi(r.value);
}

function mapAuthor(post: NeoDBPost) {
  const a = post.account;
  return {
    displayName: a.display_name || a.username || a.acct,
    handle: a.acct,
    avatar: a.avatar_static || a.avatar,
    profileUrl: a.url,
  };
}

export function postToUiComment(post: NeoDBPost): UiCommunityComment | null {
  const c = findRelated(post.ext_neodb?.relatedWith, "Comment");
  const text = (c?.content ?? "").trim();
  if (!text) return null;
  return {
    kind: "comment",
    id: post.id,
    url: post.url || post.uri,
    author: mapAuthor(post),
    createdAt: post.created_at,
    rating: pickPostRating(post),
    text,
  };
}

export function postToUiReview(post: NeoDBPost): UiCommunityReview | null {
  const r = findRelated(post.ext_neodb?.relatedWith, "Review");
  if (!r) return null;
  const title = (r.name ?? "").trim() || "（无标题）";
  const body = (r.content ?? "").replace(/\s+/g, " ").trim();
  const excerpt = body.length > 180 ? body.slice(0, 180) + "…" : body;
  return {
    kind: "review",
    id: post.id,
    url: post.url || post.uri,
    author: mapAuthor(post),
    createdAt: post.created_at,
    rating: pickPostRating(post),
    title,
    excerpt,
    reviewUrl: r.href,
  };
}

// ─── Mastodon Notification → UiNotification ─────────────────────────
// NeoDB 通知走 Mastodon 兼容 API。status.url 通常是 NeoDB 实例域下的网页 URL，
// 形如 `/movie/{uuid}` `/book/{uuid}` `/album/{uuid}` `/tv/{uuid}` `/podcast/{uuid}`
// `/game/{uuid}` `/review/{uuid}`。我们尽力识别能站内打开的路由，识别不出兜底外链。
// 保守原则：宁可外链跳出，不要把陌生 URL 错跳到 /detail/movie 这种伪路由。

const NEODB_ITEM_PATH = /^\/(movie|book|album|music|tv|podcast|game|performance)\/([A-Za-z0-9_-]+)/;
const NEODB_REVIEW_PATH = /^\/review\/([A-Za-z0-9_-]+)/;

function neodbUrlSegmentToMedium(seg: string): UiMedium | null {
  switch (seg) {
    case "movie": return "movie";
    case "tv": return "series";
    case "book": return "book";
    case "album": return "music";
    case "music": return "music";
    case "podcast": return "podcast";
    case "game": return "game";
    default: return null;
  }
}

function detectInternalRoute(url: string): string | null {
  try {
    const u = new URL(url);
    const path = u.pathname;
    const itemMatch = path.match(NEODB_ITEM_PATH);
    if (itemMatch) {
      const medium = neodbUrlSegmentToMedium(itemMatch[1]);
      if (medium) return `/detail/${medium}/${itemMatch[2]}`;
    }
    const reviewMatch = path.match(NEODB_REVIEW_PATH);
    if (reviewMatch) return `/review/${reviewMatch[1]}`;
    return null;
  } catch {
    return null;
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/p>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function toUiKind(t: string): UiNotificationKind {
  switch (t) {
    case "mention":
    case "favourite":
    case "reblog":
    case "follow":
    case "follow_request":
    case "status":
    case "update":
      return t;
    default:
      return "other";
  }
}

export function mastodonNotificationToUi(n: MastodonNotification): UiNotification {
  const author = {
    displayName: n.account.display_name || n.account.username || n.account.acct,
    handle: n.account.acct,
    avatar: n.account.avatar,
    profileUrl: n.account.url,
  };
  const preview = n.status ? stripHtml(n.status.content).slice(0, 140) : undefined;

  let target: UiNotification["target"];
  if (n.status?.url) {
    const internal = detectInternalRoute(n.status.url);
    target = internal
      ? { type: "internal", href: internal }
      : { type: "external", href: n.status.url };
  } else {
    // follow / follow_request / 其他兜底 → 关注者主页（外站可达）
    target = { type: "external", href: n.account.url || "#" };
  }

  return {
    id: n.id,
    kind: toUiKind(n.type),
    createdAt: n.created_at,
    author,
    preview,
    target,
  };
}
