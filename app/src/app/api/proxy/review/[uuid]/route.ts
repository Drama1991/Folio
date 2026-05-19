import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/cookie";
import { postReview, tags as cacheTags } from "@/lib/neodb/client";
import type { NeoDBVisibility } from "@/lib/neodb/types";
import { revalidateTag } from "next/cache";

export async function POST(req: NextRequest, ctx: { params: Promise<{ uuid: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { uuid } = await ctx.params;
  const body = (await req.json().catch(() => null)) as { title?: string; body?: string; visibility?: NeoDBVisibility } | null;
  if (!body?.title || !body.body) return NextResponse.json({ error: "missing_fields" }, { status: 400 });

  try {
    const res = await postReview(uuid, {
      title: body.title,
      body: body.body,
      visibility: (body.visibility ?? 0) as NeoDBVisibility,
    });
    revalidateTag(cacheTags.myReviews());
    return NextResponse.json({ ok: true, review: res ?? null });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "post_failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
