import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/cookie";
import { getAIConfig } from "@/lib/ai/config";
import type { ProviderKind } from "@/lib/ai/types";

interface Body {
  provider: ProviderKind;
  /** 可选；为空则用已保存的配置 */
  baseUrl?: string;
  apiKey?: string;
}

interface ModelListItem {
  id?: string;
}
interface ModelListResp {
  data?: ModelListItem[];
}

/**
 * 拉取 provider 当前支持的 model id 列表。
 * 聚合站 / OpenAI 直连走 GET {baseUrl}/models，Bearer 鉴权。
 * Gemini 暂未实现（其 model 列表协议不同；后续按需补）。
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body || !body.provider) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  if (body.provider === "gemini") {
    return NextResponse.json({ error: "gemini_models_unsupported" }, { status: 501 });
  }

  const cfg = await getAIConfig();
  const stored = body.provider === "aggregator" ? cfg.aggregator : cfg.openai;

  const baseUrl = (body.baseUrl && body.baseUrl.trim()) || stored.baseUrl || "";
  const apiKey = (body.apiKey && body.apiKey.trim()) || stored.apiKey;
  if (!baseUrl) return NextResponse.json({ error: "missing_base_url" }, { status: 400 });
  if (!apiKey) return NextResponse.json({ error: "missing_api_key" }, { status: 400 });

  try {
    const res = await fetch(`${baseUrl.replace(/\/+$/, "")}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      // 防止聚合站超时阻塞；多数实例几百毫秒返回
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return NextResponse.json(
        { error: `upstream_${res.status}`, message: text.slice(0, 240) },
        { status: 502 },
      );
    }
    const json = (await res.json().catch(() => null)) as ModelListResp | null;
    const list = (json?.data ?? [])
      .map((x) => (typeof x?.id === "string" ? x.id : null))
      .filter((s): s is string => !!s);
    list.sort((a, b) => a.localeCompare(b));
    return NextResponse.json({ models: list });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "fetch_failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
