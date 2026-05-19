// ─── UI 端类型（组件只见 UiMedium 命名，与 NeoDB 解耦） ────────────────

import type { UiMedium } from "@/lib/format/verbs";
export type { UiMedium } from "@/lib/format/verbs";

export type UiShelfStatus = "wishlist" | "progress" | "complete" | "dropped";

export interface UiItem {
  uuid: string;
  medium: UiMedium;
  title: string;
  cover?: string | null;
  year?: number | string;
  creator?: string; // director / author / artist
  brief?: string;
  externalRating?: number; // NeoDB rating（0-10）
  externalRatingCount?: number;
  tags?: string[];
  /** 媒介专属元数据 (按需读取) */
  raw?: Record<string, unknown>;
}

export interface UiMark {
  item: UiItem;
  status: UiShelfStatus;
  /** UI 0-5 (允许小数) */
  rating?: number;
  comment?: string;
  visibility: 0 | 1 | 2;
  createdAt: string;
  tags?: string[];
}

export interface UiArchiveRow {
  uuid: string;
  medium: UiMedium;
  title: string;
  cover?: string | null;
  year?: number | string;
  creator?: string;
  status: UiShelfStatus;
  rating?: number;
  comment?: string;
  updatedAt: string;
}

export interface UiTimelineEntry {
  uuid: string;
  medium: UiMedium;
  title: string;
  cover?: string | null;
  year?: number | string;
  creator?: string;
  status: UiShelfStatus;
  rating?: number;
  /** NeoDB 社区评分（0-5），当用户自己未评分时作为 fallback */
  externalRating?: number;
  comment?: string;
  createdAt: string;
  /** 最新 note 派生的进度短文本，如 "p.187" / "S2 E04" */
  progressLabel?: string;
}

export interface ShelfCounts {
  wishlist: number;
  progress: number;
  complete: number;
  dropped: number;
}

export interface UiReviewSummary {
  uuid: string;
  itemUuid: string;
  itemMedium: UiMedium;
  itemTitle: string;
  title: string;
  body: string;
  createdAt: string;
}

// ─── 社区视图（其他用户在 item 上的发帖） ─────────────────────────

interface UiCommunityAuthor {
  displayName: string;
  handle: string;        // user@domain
  avatar: string;
  profileUrl: string;
}

interface UiCommunityPostBase {
  id: string;
  /** post 永久链接 */
  url: string;
  author: UiCommunityAuthor;
  createdAt: string;
  /** UI 0-5 */
  rating?: number;
}

export interface UiCommunityComment extends UiCommunityPostBase {
  kind: "comment";
  text: string;
}

export interface UiCommunityReview extends UiCommunityPostBase {
  kind: "review";
  title: string;
  excerpt: string;
  /** 直链到 NeoDB review 页（href，区分于发帖 url） */
  reviewUrl?: string;
}
