import "server-only";
import type { AIProvider, ChatRequest, ProviderKind } from "../types";

interface OpenAICompatOpts {
  baseUrl: string;       // 例如 "https://api.openai.com/v1" 或聚合站的 base
  apiKey: string;
  defaultModel: string;
  /** 仅作日志/上报区分用 */
  name: ProviderKind;
}

/**
 * OpenAI Chat Completions 兼容协议。聚合站（one-api / OpenRouter / OhMyGPT 等）
 * 和 OpenAI 直连都走这一份实现，仅 baseUrl 不同。
 *
 * SSE 解析：每行 `data: {...}`，结尾 `data: [DONE]`。
 * 取 choices[0].delta.content 增量。
 */
export function makeOpenAICompatProvider(opts: OpenAICompatOpts): AIProvider {
  const base = opts.baseUrl.replace(/\/+$/, "");
  return {
    name: opts.name,
    async *chatStream(req: ChatRequest) {
      const res = await fetch(`${base}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${opts.apiKey}`,
        },
        body: JSON.stringify({
          model: req.model ?? opts.defaultModel,
          messages: req.messages,
          temperature: req.temperature ?? 0.7,
          stream: true,
        }),
      });
      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => "");
        throw new Error(`${opts.name} ${res.status}: ${text || res.statusText}`);
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
          if (data === "[DONE]") return;
          try {
            const json = JSON.parse(data) as {
              choices?: { delta?: { content?: string } }[];
            };
            const delta = json.choices?.[0]?.delta?.content;
            if (typeof delta === "string" && delta.length > 0) yield delta;
          } catch {
            // 部分聚合站偶发心跳/注释行，忽略
          }
        }
      }
    },
  };
}
