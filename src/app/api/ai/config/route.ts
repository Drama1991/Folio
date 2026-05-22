import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/cookie";
import {
  getAIConfig,
  setAIConfig,
  maskedConfig,
  mergeForUpdate,
  isProviderReady,
} from "@/lib/ai/config";
import type { AIConfig } from "@/lib/ai/types";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const cfg = await getAIConfig();
  return NextResponse.json({ config: maskedConfig(cfg), ready: isProviderReady(cfg) });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => null)) as Partial<AIConfig> | null;
  if (!body) return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  const current = await getAIConfig();
  const next = mergeForUpdate(current, body);
  await setAIConfig(next);
  return NextResponse.json({ config: maskedConfig(next), ready: isProviderReady(next) });
}
