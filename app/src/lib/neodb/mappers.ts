import { ratingToUi } from "@/components/shared/Stars";
import { fromNeoDBCategory } from "./mediumMap";
import type { NeoDBItemBase, NeoDBMark, NeoDBReview, NeoDBShelfType } from "./types";
import type {
  ShelfCounts,
  UiArchiveRow,
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
    status: mark.shelf_type,
    rating: ratingToUi(mark.rating_grade ?? undefined),
    comment: mark.comment_text ?? undefined,
    createdAt: mark.created_time,
  };
}

export function reviewToUi(review: NeoDBReview): UiReviewSummary {
  const ui = itemToUi(review.item);
  return {
    uuid: review.uuid,
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
