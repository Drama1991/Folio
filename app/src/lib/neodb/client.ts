import "server-only";
import { getSession } from "@/lib/auth/cookie";
import type {
  NeoDBItemBase,
  NeoDBMark,
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
    cache: opts.cache ?? "no-store",
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
  return neodb<NeoDBMe>("/api/me");
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
  return neodb<NeoDBPaged<NeoDBMark>>(`/api/me/shelf/${opts.type}${qs ? "?" + qs : ""}`);
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
  return neodb<NeoDBItemBase>(`/api/${seg}/${opts.uuid}`);
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
    return await neodb<NeoDBMarkOnItem>(`/api/me/shelf/item/${uuid}`);
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
  });
}

export async function deleteMark(uuid: string): Promise<void> {
  await neodb<void>(`/api/me/shelf/item/${uuid}`, { method: "DELETE" });
}

// ─── Search ─────────────────────────────────────────────────────────
export async function search(opts: { q: string; category?: UiMedium; page?: number }): Promise<NeoDBSearchResult> {
  const params = new URLSearchParams({ query: opts.q });
  if (opts.category) params.set("category", toNeoDBCategory(opts.category));
  if (opts.page) params.set("page", String(opts.page));
  return neodb<NeoDBSearchResult>(`/api/catalog/search?${params.toString()}`);
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
  });
}

export async function listMyReviews(opts: { page?: number; category?: UiMedium } = {}): Promise<NeoDBPaged<NeoDBReview>> {
  const params = new URLSearchParams();
  if (opts.category) params.set("category", toNeoDBCategory(opts.category));
  if (opts.page) params.set("page", String(opts.page));
  const qs = params.toString();
  try {
    return await neodb<NeoDBPaged<NeoDBReview>>(`/api/me/review${qs ? "?" + qs : ""}`);
  } catch {
    return { data: [] };
  }
}

// ─── Trending ───────────────────────────────────────────────────────
export async function listTrending(opts: { medium: UiMedium }): Promise<NeoDBItemBase[]> {
  const cat = toNeoDBCategory(opts.medium);
  const seg = endpointSegment(cat);
  try {
    const res = await neodb<{ data: NeoDBItemBase[] } | NeoDBItemBase[]>(`/api/trending/${seg}/`);
    if (Array.isArray(res)) return res;
    return res.data ?? [];
  } catch {
    return [];
  }
}

export { NeoDBError };
