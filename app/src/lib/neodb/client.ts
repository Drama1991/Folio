import "server-only";
import { getSession } from "@/lib/auth/cookie";
import type {
  NeoDBItemBase,
  NeoDBMark,
  NeoDBNote,
  NeoDBPaged,
  NeoDBReview,
  NeoDBSearchResult,
  NeoDBShelfType,
  NeoDBVisibility,
} from "./types";
import { endpointSegment, toNeoDBCategory } from "./mediumMap";
import type { UiMedium } from "./ui-types";

class NeoDBError extends Error {
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

async function neodb<T>(path: string, opts: RequestOpts = {}): Promise<T> {
  const { base, headers } = await authBaseAndHeaders();
  const res = await fetch(`${base}${path}`, {
    method: opts.method ?? "GET",
    headers: { ...headers, ...(opts.headers ?? {}) },
    body: opts.body,
    cache: opts.cache,
    next: opts.next,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new NeoDBError(res.status, text || `${res.status} ${res.statusText}`);
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
  myNotes: (uuid: string) => `neodb:my-notes:${uuid}`,
  item: (uuid: string) => `neodb:item:${uuid}`,
  trending: (medium: UiMedium) => `neodb:trending:${medium}`,
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

export async function shelfCount(opts: { type: NeoDBShelfType; category?: UiMedium }): Promise<number> {
  // 取 page=1 读 count 字段；NeoDB 通常返回 count；若无则用 data.length
  try {
    const p = await listShelf({ type: opts.type, category: opts.category, page: 1 });
    if (typeof p.count === "number") return p.count;
    return p.data.length;
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

// ─── Notes ──────────────────────────────────────────────────────────
export async function listMyNotes(uuid: string): Promise<NeoDBPaged<NeoDBNote>> {
  try {
    return await neodb<NeoDBPaged<NeoDBNote>>(`/api/me/note/item/${uuid}/`, cached([tags.myNotes(uuid)]));
  } catch {
    return { data: [] };
  }
}

// ─── Trending ───────────────────────────────────────────────────────
export async function listTrending(opts: { medium: UiMedium }): Promise<NeoDBItemBase[]> {
  const cat = toNeoDBCategory(opts.medium);
  const seg = endpointSegment(cat);
  try {
    const res = await neodb<{ data: NeoDBItemBase[] } | NeoDBItemBase[]>(
      `/api/trending/${seg}/`,
      cached([tags.trending(opts.medium)]),
    );
    if (Array.isArray(res)) return res;
    return res.data ?? [];
  } catch {
    return [];
  }
}

export { NeoDBError };
