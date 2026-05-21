import { ratingToUi } from "@/components/shared/Stars";
import { fromNeoDBCategory } from "./mediumMap";
import type { NeoDBItemBase, NeoDBMark, NeoDBPost, NeoDBPostRelated, NeoDBReview, NeoDBShelfType } from "./types";
import type {
  ShelfCounts,
  UiArchiveRow,
  UiCommunityComment,
  UiCommunityReview,
  UiItem,
  UiMark,
  UiMedium,
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
