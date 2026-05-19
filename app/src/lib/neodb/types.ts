// ─── NeoDB API 原生类型（与 OpenAPI 对齐，仅保留我们用到的字段） ────────────────

export type NeoDBCategory =
  | "book" | "movie" | "tv" | "music" | "game" | "podcast" | "performance" | "people" | "collection";

export type NeoDBShelfType = "wishlist" | "progress" | "complete" | "dropped";

/** 0 public · 1 followers · 2 mentioned */
export type NeoDBVisibility = 0 | 1 | 2;

export interface NeoDBItemBase {
  id?: string;          // url-id like /movie/{uuid}
  type?: string;
  uuid: string;
  url?: string;
  api_url?: string;
  category: NeoDBCategory;
  parent_uuid?: string | null;
  display_title?: string;
  external_resources?: { url: string }[];
  title?: string;
  brief?: string;
  cover_image_url?: string | null;
  rating?: number | null;
  rating_count?: number | null;
  tags?: string[];
  /** 年份 (ISO 字符串通常存在 .release_date 等) */
  year?: number | string;
  // 媒介专属字段（统一为 any 不再强类型，mapper 中按类别取值）
  [extra: string]: unknown;
}

export interface NeoDBMark {
  shelf_type: NeoDBShelfType;
  visibility: NeoDBVisibility;
  item: NeoDBItemBase;
  /** 1-10 */
  rating_grade?: number | null;
  comment_text?: string | null;
  tags?: string[];
  created_time: string;
}

export interface NeoDBReview {
  uuid: string;
  url: string;
  title: string;
  body: string;
  html_content?: string;
  visibility: NeoDBVisibility;
  item: NeoDBItemBase;
  created_time: string;
}

export interface NeoDBSearchResult {
  data: NeoDBItemBase[];
  pages?: number;
  count?: number;
}

export interface NeoDBPaged<T> {
  data: T[];
  pages?: number;
  count?: number;
  page?: number;
}

export interface NeoDBTrendingItem extends NeoDBItemBase {}
