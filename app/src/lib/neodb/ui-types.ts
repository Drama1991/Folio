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
  comment?: string;
  createdAt: string;
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
