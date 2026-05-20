import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/cookie";
import { getAIConfig, isProviderReady } from "@/lib/ai/config";
import { getProvider } from "@/lib/ai/provider-factory";
import { buildHomeSystemPrompt, buildItemSystemPrompt, buildSearchContextSection, makeSystemMessage } from "@/lib/ai/prompts";
import { getSearchProvider, isSearchReady } from "@/lib/ai/search";
import type { ChatMessage, SearchResult } from "@/lib/ai/types";
import type { UiMedium } from "@/lib/format/verbs";

// 与前端 store 一致的 history 行格式
interface HistoryLine {
  role: "ai" | "user";
  text: string;
}

interface ItemContext {
  kind: "item";
  item: {
    medium: UiMedium;
    title: string;
    year?: string | number;
    creator?: string;
    brief?: string;
  };
}

interface HomeContext {
  kind: "home";
}

interface ChatBody {
  history?: HistoryLine[];
  user: string;
  context: HomeContext | ItemContext;
  /** 联网搜索开关：true 时先调 search provider 把结果注入 system prompt 末尾 */
  webSearch?: boolean;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as ChatBody | null;
  if (!body || !body.user || !body.context) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const cfg = await getAIConfig();
  if (!isProviderReady(cfg)) {
    return NextResponse.json({ error: "not_configured" }, { status: 400 });
  }
  const provider = getProvider(cfg);
  if (!provider) {
    return NextResponse.json({ error: "not_configured" }, { status: 400 });
  }

  // 可选：联网搜索（失败不阻塞，降级为普通对话）
  let searchResults: SearchResult[] = [];
  if (body.webSearch && isSearchReady(cfg)) {
    const sp = getSearchProvider(cfg);
    if (sp) {
      try {
        searchResults = await sp.search(body.user, { count: 5 });
      } catch (e) {
        console.warn("[ai/chat] search failed:", e instanceof Error ? e.message : e);
      }
    }
  }

  const baseSystem =
    body.context.kind === "home"
      ? await buildHomeSystemPrompt()
      : buildItemSystemPrompt(body.context.item);
  const systemPrompt =
    searchResults.length > 0
      ? `${baseSystem}\n\n${buildSearchContextSection(searchResults)}`
      : baseSystem;

  const messages: ChatMessage[] = [
    makeSystemMessage(systemPrompt),
    ...(body.history ?? []).map<ChatMessage>((m) => ({
      role: m.role === "ai" ? "assistant" : "user",
      content: m.text,
    })),
    { role: "user", content: body.user },
  ];

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        // sources sentinel：stream 首行 `__SOURCES__:{json}\n`，前端解析后挂到 AI 消息
        if (searchResults.length > 0) {
          const meta = searchResults.map((s) => ({ title: s.title, url: s.url, domain: s.domain }));
          controller.enqueue(encoder.encode(`__SOURCES__:${JSON.stringify({ sources: meta })}\n`));
        }
        for await (const delta of provider.chatStream({ messages })) {
          controller.enqueue(encoder.encode(delta));
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "stream_failed";
        controller.enqueue(encoder.encode(`\n\n[AI 出错] ${msg}`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
