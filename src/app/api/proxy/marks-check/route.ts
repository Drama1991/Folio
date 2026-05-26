import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/cookie";
import { getMyMark } from "@/lib/neodb/client";
import type { NeoDBShelfType } from "@/lib/neodb/types";

/**
 * 批量查 "当前用户在这批 uuid 上的标记状态"。给搜索结果/RecordModal 搜索 step
 * 渲染"已标记"角标用。NeoDB 没有原生 batch 端点，这里 server-side 并发调
 * /api/me/shelf/item/{uuid}（getMyMark 已带 fetch cache，重复 query 命中缓存）。
 *
 * 入参：?uuids=a,b,c（最多 50 个，超出截断）
 * 出参：{ data: { [uuid]: "complete" | "progress" | "wishlist" | "dropped" | null } }
 *      null = 用户没标过；未登录直接返回 { data: {} }（搜索仍能用）
 */

const MAX_UUIDS = 50;
const CHUNK_SIZE = 8; // 每批 8 个并发，避免 NeoDB 端限流

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ data: {} });
  }

  const raw = req.nextUrl.searchParams.get("uuids") ?? "";
  const uuids = Array.from(
    new Set(raw.split(",").map((s) => s.trim()).filter(Boolean))
  ).slice(0, MAX_UUIDS);

  if (uuids.length === 0) {
    return NextResponse.json({ data: {} });
  }

  const out: Record<string, NeoDBShelfType | null> = {};
  for (let i = 0; i < uuids.length; i += CHUNK_SIZE) {
    const chunk = uuids.slice(i, i + CHUNK_SIZE);
    const results = await Promise.all(
      chunk.map(async (uuid) => {
        try {
          const mark = await getMyMark(uuid);
          return [uuid, mark?.shelf_type ?? null] as const;
        } catch {
          return [uuid, null] as const;
        }
      })
    );
    for (const [uuid, status] of results) {
      out[uuid] = status;
    }
  }

  return NextResponse.json({ data: out });
}
