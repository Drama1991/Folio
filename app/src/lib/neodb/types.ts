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

/** journal/models/note.py ProgressType */
export type NeoDBProgressType =
  | "page" | "chapter" | "part" | "episode" | "track" | "cycle" | "timestamp" | "percentage";

export interface NeoDBNote {
  uuid: string;
  visibility: NeoDBVisibility;
  item?: NeoDBItemBase;
  title?: string | null;
  content: string;
  sensitive?: boolean;
  progress_type?: NeoDBProgressType | null;
  progress_value?: string | null;
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

// ─── Item posts (Mastodon-compatible, subset) ───────────────────────
/** /api/item/{uuid}/posts/ 返回的 Mastodon 风格 Post，只保留 UI 用到的字段。 */
export interface NeoDBPostAccount {
  id: string;
  acct: string;          // user@domain
  username: string;
  url: string;           // profile URL
  display_name: string;
  avatar: string;
  avatar_static?: string;
}

/** ext_neodb.relatedWith 内的对象，按 type 区分子结构 */
export interface NeoDBPostRelated {
  type: "Status" | "Comment" | "Rating" | "Review" | "Note" | "Collection";
  href?: string;
  name?: string;
  content?: string;
  status?: string;       // shelf status, when type === "Status"
  value?: number;        // when type === "Rating"
  best?: number;
  worst?: number;
}

export interface NeoDBPostExt {
  tag?: { href: string; name: string; type: string; image?: string }[];
  relatedWith?: NeoDBPostRelated[];
}

export interface NeoDBPost {
  id: string;
  uri: string;
  url?: string | null;
  created_at: string;
  account: NeoDBPostAccount;
  content: string;        // HTML
  visibility: "public" | "unlisted" | "private" | "direct";
  sensitive?: boolean;
  spoiler_text?: string;
  language?: string | null;
  ext_neodb?: NeoDBPostExt | null;
}

export interface NeoDBTrendingItem extends NeoDBItemBase {}
