import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/cookie";
import { getAIConfig, isProviderReady } from "@/lib/ai/config";
import { getProvider } from "@/lib/ai/provider-factory";
import { buildHomeSystemPrompt, buildItemSystemPrompt, makeSystemMessage } from "@/lib/ai/prompts";
import type { ChatMessage } from "@/lib/ai/types";
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

  const systemPrompt =
    body.context.kind === "home"
      ? await buildHomeSystemPrompt()
      : buildItemSystemPrompt(body.context.item);

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
        for await (const delta of provider.chatStream({ messages })) {
          controller.enqueue(encoder.encode(delta));
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "stream_failed";
        // 把错误以可见文本的方式写回流末尾，前端直接展示
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
