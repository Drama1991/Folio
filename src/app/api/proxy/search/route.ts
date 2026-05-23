import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/cookie";
import { search } from "@/lib/neodb/client";
import { neodbErrorResponse } from "@/lib/neodb/proxy-error";
import { itemToUi } from "@/lib/neodb/mappers";
import type { UiMedium } from "@/lib/format/verbs";
import { ALL_UI_MEDIUMS } from "@/lib/neodb/mediumMap";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ data: [] });
  const catRaw = url.searchParams.get("category");
  const category = catRaw && ALL_UI_MEDIUMS.includes(catRaw as UiMedium) ? (catRaw as UiMedium) : undefined;

  try {
    const res = await search({ q, category });
    return NextResponse.json({ data: (res.data ?? []).map(itemToUi) });
  } catch (err) {
    return neodbErrorResponse(err);
  }
}
