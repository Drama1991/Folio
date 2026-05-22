import "server-only";
import type { AIProvider, ChatMessage, ChatRequest } from "../types";

interface GeminiOpts {
  baseUrl: string;       // 通常 "https://generativelanguage.googleapis.com"
  apiKey: string;
  defaultModel: string;
}

interface GeminiContent {
  role: "user" | "model";
  parts: { text: string }[];
}

/**
 * Google Generative Language (Gemini) 适配。和 OpenAI 协议不同：
 * - role 字段 user|model（assistant 映射到 model）
 * - system 单独走 systemInstruction
 * - 流式走 :streamGenerateContent?alt=sse；每条 data 行是完整 candidates JSON，
 *   没有 [DONE]，靠流结束信号关闭。
 */
export function makeGeminiProvider(opts: GeminiOpts): AIProvider {
  const base = opts.baseUrl.replace(/\/+$/, "");
  return {
    name: "gemini",
    async *chatStream(req: ChatRequest) {
      const model = req.model ?? opts.defaultModel;
      const { systemPrompt, contents } = toGeminiPayload(req.messages);

      const url = `${base}/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse&key=${encodeURIComponent(opts.apiKey)}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          ...(systemPrompt ? { systemInstruction: { parts: [{ text: systemPrompt }] } } : {}),
          generationConfig: { temperature: req.temperature ?? 0.7 },
        }),
      });
      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => "");
        throw new Error(`gemini ${res.status}: ${text || res.statusText}`);
      }

      const decoder = new TextDecoder();
      const reader = res.body.getReader();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        let nl = buf.indexOf("\n");
        while (nl !== -1) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          nl = buf.indexOf("\n");
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim();
          if (!data) continue;
          try {
            const json = JSON.parse(data) as {
              candidates?: { content?: { parts?: { text?: string }[] } }[];
            };
            const parts = json.candidates?.[0]?.content?.parts ?? [];
            for (const p of parts) {
              if (typeof p.text === "string" && p.text.length > 0) yield p.text;
            }
          } catch {
            // ignore
          }
        }
      }
    },
  };
}

function toGeminiPayload(messages: ChatMessage[]): { systemPrompt?: string; contents: GeminiContent[] } {
  let systemPrompt: string | undefined;
  const contents: GeminiContent[] = [];
  for (const m of messages) {
    if (m.role === "system") {
      // 多条 system 合并
      systemPrompt = systemPrompt ? `${systemPrompt}\n\n${m.content}` : m.content;
      continue;
    }
    contents.push({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    });
  }
  return { systemPrompt, contents };
}
