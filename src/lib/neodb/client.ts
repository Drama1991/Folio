import "server-only";
import { getSession } from "@/lib/auth/cookie";
import type {
  NeoDBCollection,
  NeoDBCollectionItem,
  NeoDBItemBase,
  NeoDBMark,
  NeoDBNote,
  NeoDBPaged,
  NeoDBPost,
  NeoDBReview,
  NeoDBSearchResult,
  NeoDBShelfType,
  NeoDBTag,
  NeoDBVisibility,
} from "./types";
import type { MastodonNotification } from "./mastodon-types";
import { endpointSegment, toNeoDBCategory, trendingSegment } from "./mediumMap";
import type { UiMedium } from "./ui-types";

class NeoDBError extends Error {
  /** 上游响应头 Retry-After 的原始值（仅 429 时填充）。proxy 层透传给前端。 */
  retryAfter?: string;
  constructor(public status: number, message: string) {
    super(message);
  }
}

interface RequestOpts {
  method?: string;
  body?: BodyInit;
  headers?: Record<string, string>;
  /** if true, attempts unauthenticated request when no session */
  publicOk?: boolean;
  cache?: RequestCache;
  next?: { revalidate?: number; tags?: string[] };
}

async function authBaseAndHeaders(): Promise<{ base: string; headers: Record<string, string> }> {
  const session = await getSession();
  if (!session) throw new NeoDBError(401, "no_session");
  return {
    base: `https://${session.instance}`,
    headers: { Authorization: `Bearer ${session.token}` },
  };
}

/** 匿名可用：session 存在则带 token + 用户 home instance；否则裸调 neodb.social。
 *  专给 NeoDB 后端是 `OptionalOAuthAccessTokenAuth` 的端点用，如 item posts。 */
async function optionalAuthBaseAndHeaders(): Promise<{ base: string; headers: Record<string, string> }> {
  const session = await getSession();
  if (session) {
    return {
      base: `https://${session.instance}`,
      headers: { Authorization: `Bearer ${session.token}` },
    };
  }
  return {
    base: "https://neodb.social",
    headers: {},
  };
}

async function neodb<T>(path: string, opts: RequestOpts = {}): Promise<T> {
  const { base, headers } = opts.publicOk
    ? await optionalAuthBaseAndHeaders()
    : await authBaseAndHeaders();
  const res = await fetch(`${base}${path}`, {
    method: opts.method ?? "GET",
    headers: { ...headers, ...(opts.headers ?? {}) },
    body: opts.body,
    cache: opts.cache,
    next: opts.next,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const err = new NeoDBError(res.status, text || `${res.status} ${res.statusText}`);
    if (res.status === 429) {
      const ra = res.headers.get("retry-after");
      if (ra) err.retryAfter = ra;
    }
    throw err;
  }
  // 204 / empty
  if (res.status === 204) return undefined as T;
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) return undefined as T;
  return (await res.json()) as T;
}

const READ_REVALIDATE = 60;

const cached = (tags: string[]): RequestOpts => ({ next: { revalidate: READ_REVALIDATE, tags } });
const noStore = (): RequestOpts => ({ cache: "no-store" });

/** 集中管理的缓存 tag。写操作通过 revalidateTag 命中这些 key 让对应页面下次取新数据。 */
export const tags = {
  me: () => "neodb:me",
  shelf: (type: NeoDBShelfType, category?: UiMedium) =>
    category ? `neodb:shelf:${type}:${category}` : `neodb:shelf:${type}`,
  /** 所有 shelf 列表的总开关（mark 写入时一刀切失效） */
  shelfAny: () => "neodb:shelf",
  myMark: (uuid: string) => `neodb:my-mark:${uuid}`,
  myReviews: () => "neodb:my-reviews",
  review: (uuid: string) => `neodb:review:${uuid}`,
  myNotes: (uuid: string) => `neodb:my-notes:${uuid}`,
  item: (uuid: string) => `neodb:item:${uuid}`,
  itemPosts: (uuid: string, type: string) => `neodb:item-posts:${uuid}:${type}`,
  trending: (medium: UiMedium) => `neodb:trending:${medium}`,
  myCollections: () => "neodb:my-collections",
  collectionItems: (uuid: string) => `neodb:collection-items:${uuid}`,
  myTags: () => "neodb:my-tags",
};

// ─── Account ─────────────────────────────────────────────────────────
export interface NeoDBMe {
  id: string;
  username: string;
  acct: string;
  display_name?: string;
  avatar?: string;
  url?: string;
  note?: string;
  created_at?: string;
}

export async function getMe(): Promise<NeoDBMe> {
  return neodb<NeoDBMe>("/api/me", cached([tags.me()]));
}

// ─── Shelf list ──────────────────────────────────────────────────────
export async function listShelf(opts: {
  type: NeoDBShelfType;
  category?: UiMedium;
  page?: number;
}): Promise<NeoDBPaged<NeoDBMark>> {
  const params = new URLSearchParams();
  if (opts.category) params.set("category", toNeoDBCategory(opts.category));
  if (opts.page) params.set("page", String(opts.page));
  const qs = params.toString();
  return neodb<NeoDBPaged<NeoDBMark>>(
    `/api/me/shelf/${opts.type}${qs ? "?" + qs : ""}`,
    cached([tags.shelfAny(), tags.shelf(opts.type, opts.category)]),
  );
}

/**
 * 完整拉取某分区 shelf。
 *
 * 解决 P0-3：wishlist / archive / timeline 之前只取 page=1，超过 20 项后第 21+ 静默丢失。
 *
 * 算法：先取 page=1，按 count 字段推算总页数后并发取 2..N；
 * 没 count 时降级为「按 page=1 的 length 推断 perPage，sequential 探测直到 data.length < perPage」。
 * cap 默认 500 项，防止极端账户把 SSR 打爆。
 */
export async function listShelfAll(opts: {
  type: NeoDBShelfType;
  category?: UiMedium;
  cap?: number;
}): Promise<{ data: NeoDBMark[]; count: number }> {
  const cap = opts.cap ?? 500;
  const first = await listShelf({ type: opts.type, category: opts.category, page: 1 });
  const data = [...(first.data ?? [])];
  const total = typeof first.count === "number" ? first.count : data.length;

  if (data.length === 0 || data.length >= total) {
    return { data: data.slice(0, cap), count: total };
  }

  const perPage = data.length;
  const lastPage = Math.min(
    Math.ceil(total / perPage),
    Math.ceil(cap / perPage),
  );

  if (lastPage <= 1) {
    return { data: data.slice(0, cap), count: total };
  }

  const more = await Promise.all(
    Array.from({ length: lastPage - 1 }, (_, i) =>
      listShelf({ type: opts.type, category: opts.category, page: i + 2 })
        .catch(() => ({ data: [] as NeoDBMark[] })),
    ),
  );
  for (const p of more) data.push(...(p.data ?? []));
  return { data: data.slice(0, cap), count: total };
}

export async function shelfCount(opts: { type: NeoDBShelfType; category?: UiMedium }): Promise<number> {
  // P1-6：count 缺失时不再用 data.length 兜底（封顶 20，统计低估）。
  // 改为按 pages 字段拉最后一页，得到 (pages-1)*perPage + lastPage.data.length 的精确值。
  try {
    const first = await listShelf({ type: opts.type, category: opts.category, page: 1 });
    if (typeof first.count === "number") return first.count;
    const perPage = first.data?.length ?? 0;
    if (typeof first.pages === "number" && first.pages > 1 && perPage > 0) {
      const last = await listShelf({ type: opts.type, category: opts.category, page: first.pages })
        .catch(() => null);
      const lastLen = last?.data?.length ?? 0;
      return (first.pages - 1) * perPage + lastLen;
    }
    return perPage;
  } catch {
    return 0;
  }
}

// ─── Item / detail ──────────────────────────────────────────────────
export async function getItem(opts: { medium: UiMedium; uuid: string }): Promise<NeoDBItemBase> {
  const cat = toNeoDBCategory(opts.medium);
  const seg = endpointSegment(cat);
  return neodb<NeoDBItemBase>(`/api/${seg}/${opts.uuid}`, cached([tags.item(opts.uuid)]));
}

// ─── Mark on item ───────────────────────────────────────────────────
export interface NeoDBMarkOnItem {
  shelf_type: NeoDBShelfType;
  visibility: NeoDBVisibility;
  rating_grade?: number;
  comment_text?: string;
  created_time?: string;
  tags?: string[];
  post_to_fediverse?: boolean;
}

export async function getMyMark(uuid: string): Promise<NeoDBMarkOnItem | null> {
  try {
    return await neodb<NeoDBMarkOnItem>(`/api/me/shelf/item/${uuid}`, cached([tags.myMark(uuid)]));
  } catch (err) {
    if (err instanceof NeoDBError && (err.status === 404 || err.status === 400)) return null;
    throw err;
  }
}

export async function upsertMark(uuid: string, mark: NeoDBMarkOnItem): Promise<void> {
  await neodb<void>(`/api/me/shelf/item/${uuid}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(mark),
    ...noStore(),
  });
}

export async function deleteMark(uuid: string): Promise<void> {
  await neodb<void>(`/api/me/shelf/item/${uuid}`, { method: "DELETE", ...noStore() });
}

// ─── Search ─────────────────────────────────────────────────────────
export async function search(opts: { q: string; category?: UiMedium; page?: number }): Promise<NeoDBSearchResult> {
  const params = new URLSearchParams({ query: opts.q });
  if (opts.category) params.set("category", toNeoDBCategory(opts.category));
  if (opts.page) params.set("page", String(opts.page));
  return neodb<NeoDBSearchResult>(`/api/catalog/search?${params.toString()}`, noStore());
}

// ─── Reviews ────────────────────────────────────────────────────────
export interface NeoDBReviewInput {
  title: string;
  body: string;
  visibility: NeoDBVisibility;
  created_time?: string;
}

export async function postReview(uuid: string, payload: NeoDBReviewInput): Promise<{ uuid: string; url?: string } | void> {
  return neodb(`/api/me/review/item/${uuid}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    ...noStore(),
  });
}

export async function listMyReviews(opts: { page?: number; category?: UiMedium } = {}): Promise<NeoDBPaged<NeoDBReview>> {
  const params = new URLSearchParams();
  if (opts.category) params.set("category", toNeoDBCategory(opts.category));
  if (opts.page) params.set("page", String(opts.page));
  const qs = params.toString();
  try {
    return await neodb<NeoDBPaged<NeoDBReview>>(
      `/api/me/review${qs ? "?" + qs : ""}`,
      cached([tags.myReviews()]),
    );
  } catch {
    return { data: [] };
  }
}

/**
 * 取当前用户对某 item 的 review（用于 ownership 检测 + 预填编辑器）。
 * 没有则返回 null（NeoDB 通常 404 或 403）。
 *
 * P1-12：原先 noStore() —— 每个登录用户访问任意长评页都多打一次 API。
 * 改用 tag cache：postReview / deleteReview 走的 proxy 都已 revalidate
 * `tags.myReviews()`，所以缓存命中期间数据不会陈旧。
 */
export async function getMyReviewOfItem(itemUuid: string): Promise<NeoDBReview | null> {
  try {
    return await neodb<NeoDBReview>(`/api/me/review/item/${itemUuid}`, cached([tags.myReviews()]));
  } catch (err) {
    if (err instanceof NeoDBError && (err.status === 404 || err.status === 403)) return null;
    throw err;
  }
}

export async function deleteReview(itemUuid: string): Promise<void> {
  await neodb<void>(`/api/me/review/item/${itemUuid}`, { method: "DELETE", ...noStore() });
}

/**
 * 公共 review 取详情（含 html_content）。NeoDB endpoint: GET /api/review/{uuid}/
 * 鉴权：OptionalOAuthAccessTokenAuth — 带 token 看私密可见性更宽，匿名也能取公开。
 */
export async function getReview(uuid: string): Promise<NeoDBReview> {
  return neodb<NeoDBReview>(`/api/review/${uuid}`, cached([tags.review(uuid)]));
}

// ─── Notes ──────────────────────────────────────────────────────────
export async function listMyNotes(uuid: string): Promise<NeoDBPaged<NeoDBNote>> {
  try {
    return await neodb<NeoDBPaged<NeoDBNote>>(`/api/me/note/item/${uuid}/`, cached([tags.myNotes(uuid)]));
  } catch {
    return { data: [] };
  }
}

// ─── Item posts (community) ─────────────────────────────────────────
/**
 * 拉取某 item 上的公开 posts。type 是 NeoDB 文档里的标签集合，逗号分隔：
 * `comment | review | mark | collection | note`。默认 `comment,review`。
 * 鉴权：项目 session 存在则带 token（按可见性更宽），否则当作匿名调用——
 * 后端是 OptionalOAuthAccessTokenAuth，匿名也能取公开 post。
 */
export async function listItemPosts(opts: {
  uuid: string;
  type?: "comment" | "review" | "mark" | "collection" | "note";
  page?: number;
}): Promise<NeoDBPaged<NeoDBPost>> {
  const params = new URLSearchParams();
  if (opts.type) params.set("type", opts.type);
  if (opts.page) params.set("page", String(opts.page));
  const qs = params.toString();
  try {
    return await neodb<NeoDBPaged<NeoDBPost>>(
      `/api/item/${opts.uuid}/posts/${qs ? "?" + qs : ""}`,
      { ...cached([tags.itemPosts(opts.uuid, opts.type ?? "default")]), publicOk: true },
    );
  } catch {
    return { data: [] };
  }
}

// ─── Trending ───────────────────────────────────────────────────────
export async function listTrending(opts: { medium: UiMedium }): Promise<NeoDBItemBase[]> {
  const cat = toNeoDBCategory(opts.medium);
  const seg = trendingSegment(cat);
  try {
    const res = await neodb<{ data: NeoDBItemBase[] } | NeoDBItemBase[]>(
      `/api/trending/${seg}/`,
      cached([tags.trending(opts.medium)]),
    );
    if (Array.isArray(res)) return res;
    return res.data ?? [];
  } catch (e) {
    console.warn(`[listTrending] /api/trending/${seg}/ failed:`, e instanceof Error ? e.message : e);
    return [];
  }
}

// ─── Collections (合集) ─────────────────────────────────────────────
export async function listMyCollections(opts: { page?: number } = {}): Promise<NeoDBPaged<NeoDBCollection>> {
  const params = new URLSearchParams();
  if (opts.page) params.set("page", String(opts.page));
  const qs = params.toString();
  try {
    return await neodb<NeoDBPaged<NeoDBCollection>>(
      `/api/me/collection/${qs ? "?" + qs : ""}`,
      cached([tags.myCollections()]),
    );
  } catch {
    return { data: [] };
  }
}

export async function listCollectionItems(
  uuid: string,
  opts: { page?: number } = {},
): Promise<NeoDBPaged<NeoDBCollectionItem>> {
  const params = new URLSearchParams();
  if (opts.page) params.set("page", String(opts.page));
  const qs = params.toString();
  try {
    return await neodb<NeoDBPaged<NeoDBCollectionItem>>(
      `/api/me/collection/${uuid}/item/${qs ? "?" + qs : ""}`,
      cached([tags.collectionItems(uuid)]),
    );
  } catch {
    return { data: [] };
  }
}

// ─── Tags ───────────────────────────────────────────────────────────
export async function listMyTags(): Promise<NeoDBTag[]> {
  try {
    const res = await neodb<NeoDBPaged<NeoDBTag> | NeoDBTag[]>(
      `/api/me/tag/`,
      cached([tags.myTags()]),
    );
    if (Array.isArray(res)) return res;
    return res.data ?? [];
  } catch {
    return [];
  }
}

// ─── Notifications (Mastodon-compatible) ────────────────────────────
/**
 * 拉取通知列表。NeoDB 把 Mastodon 兼容 API 挂在同一鉴权层下，
 * 通知走 `GET /api/v1/notifications`（Mastodon 标准路径，注意带 v1）。
 * 不走 cache：通知就是要拉最新；调用方应控制访问频率（通常用户进通知页才调）。
 */
export async function listNotifications(opts: {
  limit?: number;
  max_id?: string;
  since_id?: string;
  min_id?: string;
} = {}): Promise<MastodonNotification[]> {
  const params = new URLSearchParams();
  if (opts.limit) params.set("limit", String(opts.limit));
  if (opts.max_id) params.set("max_id", opts.max_id);
  if (opts.since_id) params.set("since_id", opts.since_id);
  if (opts.min_id) params.set("min_id", opts.min_id);
  const qs = params.toString();
  try {
    return await neodb<MastodonNotification[]>(
      `/api/v1/notifications${qs ? "?" + qs : ""}`,
      noStore(),
    );
  } catch {
    return [];
  }
}

export { NeoDBError };
