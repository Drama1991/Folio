import "server-only";
import type { AIConfig, AIProvider } from "./types";
import { makeOpenAICompatProvider } from "./providers/openai-compat";
import { makeGeminiProvider } from "./providers/gemini";

/**
 * 按 cfg.provider 装配出对应 provider。
 * 调用前应先 isProviderReady(cfg) 验证；这里只在 key/model 缺失时返回 null。
 */
export function getProvider(cfg: AIConfig): AIProvider | null {
  switch (cfg.provider) {
    case "aggregator": {
      const c = cfg.aggregator;
      if (!c.apiKey || !c.model || !c.baseUrl) return null;
      return makeOpenAICompatProvider({
        name: "aggregator",
        baseUrl: c.baseUrl,
        apiKey: c.apiKey,
        defaultModel: c.model,
      });
    }
    case "openai": {
      const c = cfg.openai;
      if (!c.apiKey || !c.model) return null;
      return makeOpenAICompatProvider({
        name: "openai",
        baseUrl: c.baseUrl || "https://api.openai.com/v1",
        apiKey: c.apiKey,
        defaultModel: c.model,
      });
    }
    case "gemini": {
      const c = cfg.gemini;
      if (!c.apiKey || !c.model) return null;
      return makeGeminiProvider({
        baseUrl: c.baseUrl || "https://generativelanguage.googleapis.com",
        apiKey: c.apiKey,
        defaultModel: c.model,
      });
    }
  }
}
