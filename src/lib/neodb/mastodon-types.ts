// Mastodon-compatible API types
//
// NeoDB 同时提供两套 API：原生 NeoDB（catalog/shelf/mark/review/etc.，路径 /api/...）
// 与 Mastodon 兼容（社交层：notifications/timelines/statuses，路径 /api/v1/...）。
// 同一个 OAuth access token 即可访问两套，鉴权层是统一的。
// 本文件只列出 Folio 实际消费的 Mastodon 字段子集（subset，非穷举）。

export type MastodonNotificationType =
  | "mention"
  | "status"
  | "reblog"
  | "follow"
  | "follow_request"
  | "favourite"
  | "poll"
  | "update";

export interface MastodonAccount {
  id: string;
  username: string;
  /** user@domain (本实例用户没有 @domain) */
  acct: string;
  display_name: string;
  avatar: string;
  /** ActivityPub profile URL（外站可达） */
  url: string;
}

export interface MastodonStatus {
  id: string;
  uri: string;
  /** 浏览器可点开的 status 网页 URL（NeoDB 实例域下） */
  url: string;
  account: MastodonAccount;
  /** HTML，需要 strip 后才能 inline 展示 */
  content: string;
  spoiler_text?: string;
  created_at: string;
  visibility: "public" | "unlisted" | "private" | "direct";
}

export interface MastodonNotification {
  id: string;
  /** Mastodon 在演进中新增 type，运行时见到未知值时按 "other" 兜底 */
  type: MastodonNotificationType | string;
  created_at: string;
  account: MastodonAccount;
  /** mention / favourite / reblog / status / update 通常带 status；follow 不带 */
  status?: MastodonStatus;
}
