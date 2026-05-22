import "server-only";
import type { SearchProvider, SearchResult } from "../types";

const ENDPOINT = "https://api.search.brave.com/res/v1/web/search";
const DEFAULT_COUNT = 5;
const TIMEOUT_MS = 8000;

interface BraveWebResult {
  title?: string;
  url?: string;
  description?: string;
}

interface BraveResponse {
  web?: { results?: BraveWebResult[] };
}

function domainOf(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; }
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

export function makeBraveSearchProvider(apiKey: string): SearchProvider {
  return {
    name: "brave",
    async search(query, opts = {}) {
      const count = Math.max(1, Math.min(10, opts.count ?? DEFAULT_COUNT));
      const params = new URLSearchParams({ q: query, count: String(count), safesearch: "moderate" });
      const ac = new AbortController();
      const timer = setTimeout(() => ac.abort(), TIMEOUT_MS);
      const signal = opts.signal
        ? composeSignal(opts.signal, ac.signal)
        : ac.signal;
      try {
        const res = await fetch(`${ENDPOINT}?${params.toString()}`, {
          method: "GET",
          headers: {
            "X-Subscription-Token": apiKey,
            "Accept": "application/json",
          },
          signal,
        });
        if (!res.ok) {
          throw new Error(`brave_search_${res.status}`);
        }
        const data = (await res.json()) as BraveResponse;
        const items = data.web?.results ?? [];
        return items
          .filter((r) => r.url && r.title)
          .slice(0, count)
          .map<SearchResult>((r) => ({
            title: stripHtml(r.title ?? ""),
            url: r.url!,
            snippet: stripHtml(r.description ?? ""),
            domain: domainOf(r.url!),
          }));
      } finally {
        clearTimeout(timer);
      }
    },
  };
}

function composeSignal(a: AbortSignal, b: AbortSignal): AbortSignal {
  const ac = new AbortController();
  const onAbort = () => ac.abort();
  if (a.aborted || b.aborted) ac.abort();
  else {
    a.addEventListener("abort", onAbort, { once: true });
    b.addEventListener("abort", onAbort, { once: true });
  }
  return ac.signal;
}
