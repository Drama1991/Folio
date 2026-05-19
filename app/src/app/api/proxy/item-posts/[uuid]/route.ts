import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/cookie";
import { listItemPosts } from "@/lib/neodb/client";
import { postToUiComment, postToUiReview } from "@/lib/neodb/mappers";
import type { UiCommunityComment, UiCommunityReview } from "@/lib/neodb/ui-types";

type PostType = "comment" | "review";

function parseType(v: string | null): PostType | null {
  return v === "comment" || v === "review" ? v : null;
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ uuid: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { uuid } = await ctx.params;
  const url = new URL(req.url);
  const type = parseType(url.searchParams.get("type"));
  if (!type) return NextResponse.json({ error: "invalid_type" }, { status: 400 });
  const pageRaw = Number(url.searchParams.get("page") ?? "1");
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.min(pageRaw, 99) : 1;

  try {
    const res = await listItemPosts({ uuid, type, page });
    const data: (UiCommunityComment | UiCommunityReview)[] =
      type === "comment"
        ? res.data.map(postToUiComment).filter((c): c is UiCommunityComment => c !== null)
        : res.data.map(postToUiReview).filter((r): r is UiCommunityReview => r !== null);
    return NextResponse.json({ data, pages: res.pages ?? 1, count: res.count ?? data.length, page });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "fetch_failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
