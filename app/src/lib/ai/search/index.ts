import "server-only";
import type { AIConfig, SearchProvider } from "../types";
import { makeBraveSearchProvider } from "./brave";

/** 当前搜索配置是否具备调用条件（key 已填） */
export function isSearchReady(cfg: AIConfig): boolean {
  switch (cfg.search.provider) {
    case "brave":
      return !!cfg.search.brave.apiKey;
  }
}

export function getSearchProvider(cfg: AIConfig): SearchProvider | null {
  switch (cfg.search.provider) {
    case "brave": {
      const key = cfg.search.brave.apiKey;
      if (!key) return null;
      return makeBraveSearchProvider(key);
    }
  }
}
