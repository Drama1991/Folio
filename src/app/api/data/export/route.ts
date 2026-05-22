import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/cookie";
import {
  getMe,
  listShelf,
  listMyReviews,
  listMyCollections,
  listCollectionItems,
  listMyTags,
} from "@/lib/neodb/client";
import type {
  NeoDBCollection,
  NeoDBCollectionItem,
  NeoDBMark,
  NeoDBPaged,
  NeoDBReview,
  NeoDBShelfType,
} from "@/lib/neodb/types";

export const dynamic = "force-dynamic";

/** 防御性上限：避免 NeoDB 返回错误的 pages 字段导致死循环。
 *  按 NeoDB 默认 page_size=20，2000 页 ≈ 4 万条，远超个人用户量级。 */
const MAX_PAGES = 2000;

async function fetchAllPaged<T>(
  fetcher: (page: number) => Promise<NeoDBPaged<T>>,
): Promise<T[]> {
  const out: T[] = [];
  let page = 1;
  // 先拿首页拿 pages 字段
  const first = await fetcher(page);
  out.push(...first.data);
  const totalPages = Math.min(first.pages ?? 1, MAX_PAGES);
  for (page = 2; page <= totalPages; page++) {
    const p = await fetcher(page);
    if (!p.data.length) break;
    out.push(...p.data);
  }
  return out;
}

const SHELF_TYPES: NeoDBShelfType[] = ["wishlist", "progress", "complete", "dropped"];

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let me: Awaited<ReturnType<typeof getMe>> | null = null;
  try {
    me = await getMe();
  } catch {
    /* getMe 失败不致命，account 退化 */
  }

  // 4 个 shelf 并发
  const shelfPairs = await Promise.all(
    SHELF_TYPES.map(async (type) => {
      const items = await fetchAllPaged<NeoDBMark>((page) => listShelf({ type, page }));
      return [type, items] as const;
    }),
  );
  const shelves: Record<NeoDBShelfType, NeoDBMark[]> = {
    wishlist: [],
    progress: [],
    complete: [],
    dropped: [],
  };
  for (const [type, items] of shelfPairs) shelves[type] = items;

  // reviews / tags 并发
  const [reviews, tags] = await Promise.all([
    fetchAllPaged<NeoDBReview>((page) => listMyReviews({ page })),
    listMyTags(),
  ]);

  // collections + 每个 collection 的 items
  const collectionsList = await fetchAllPaged<NeoDBCollection>((page) =>
    listMyCollections({ page }),
  );
  const collections = await Promise.all(
    collectionsList.map(async (c) => {
      const items = await fetchAllPaged<NeoDBCollectionItem>((page) =>
        listCollectionItems(c.uuid, { page }),
      );
      return { collection: c, items };
    }),
  );

  const stats = {
    shelves: {
      wishlist: shelves.wishlist.length,
      progress: shelves.progress.length,
      complete: shelves.complete.length,
      dropped: shelves.dropped.length,
    },
    reviews: reviews.length,
    collections: collections.length,
    tags: tags.length,
  };

  return NextResponse.json({
    $schema: "https://folio.app/archive/v1.json",
    version: 1,
    exportedAt: new Date().toISOString(),
    exportedBy: "folio/0.1.0",
    account: {
      acct: me?.acct ?? session.acct ?? "",
      instance: session.instance,
      display: me?.display_name ?? "",
      handle: me?.username ?? "",
    },
    shelves,
    reviews,
    collections,
    tags,
    stats,
  });
}
