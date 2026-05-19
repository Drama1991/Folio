import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { DEFAULT_AI_CONFIG, type AIConfig, type ProviderKind } from "./types";

const AI_COOKIE_NAME = "folio_ai";
const TTL_SECONDS = 365 * 24 * 60 * 60;

function getSecret(): Uint8Array {
  const raw = process.env.FOLIO_JWT_SECRET;
  if (!raw || raw.length < 16) throw new Error("FOLIO_JWT_SECRET is missing or too short");
  return new TextEncoder().encode(raw);
}

/** 从 cookie 中读取配置；缺失或损坏时返回默认配置（空 key）。 */
export async function getAIConfig(): Promise<AIConfig> {
  const store = await cookies();
  const raw = store.get(AI_COOKIE_NAME)?.value;
  if (!raw) return DEFAULT_AI_CONFIG;
  try {
    const { payload } = await jwtVerify(raw, getSecret(), { algorithms: ["HS256"] });
    const data = (payload as { config?: unknown }).config;
    return mergeWithDefaults(data);
  } catch {
    return DEFAULT_AI_CONFIG;
  }
}

export async function setAIConfig(next: AIConfig): Promise<void> {
  const jwt = await new SignJWT({ config: next })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${365}d`)
    .sign(getSecret());
  const store = await cookies();
  store.set(AI_COOKIE_NAME, jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TTL_SECONDS,
  });
}

/** 输出给前端时把 apiKey 掩码：sk-abcd...wxyz 这种 */
export function maskKey(k: string): string {
  if (!k) return "";
  if (k.length <= 10) return "•".repeat(k.length);
  return `${k.slice(0, 4)}…${k.slice(-4)}`;
}

export function maskedConfig(cfg: AIConfig): AIConfig {
  return {
    provider: cfg.provider,
    aggregator: { ...cfg.aggregator, apiKey: maskKey(cfg.aggregator.apiKey) },
    openai: { ...cfg.openai, apiKey: maskKey(cfg.openai.apiKey) },
    gemini: { ...cfg.gemini, apiKey: maskKey(cfg.gemini.apiKey) },
  };
}

/** POST 进来的 partial config 合并到当前存量。前端若把 apiKey 留空则保留旧 key（不擦除）。 */
export function mergeForUpdate(current: AIConfig, patch: Partial<AIConfig>): AIConfig {
  const next: AIConfig = {
    provider: (patch.provider as ProviderKind) || current.provider,
    aggregator: mergeCreds(current.aggregator, patch.aggregator),
    openai: mergeCreds(current.openai, patch.openai),
    gemini: mergeCreds(current.gemini, patch.gemini),
  };
  return next;
}

function mergeCreds(cur: AIConfig["aggregator"], patch: Partial<AIConfig["aggregator"]> | undefined) {
  if (!patch) return cur;
  return {
    baseUrl: patch.baseUrl ?? cur.baseUrl,
    apiKey: patch.apiKey && patch.apiKey.length > 0 ? patch.apiKey : cur.apiKey,
    model: patch.model ?? cur.model,
  };
}

function mergeWithDefaults(data: unknown): AIConfig {
  if (!data || typeof data !== "object") return DEFAULT_AI_CONFIG;
  const d = data as Partial<AIConfig>;
  return {
    provider: (d.provider as ProviderKind) || DEFAULT_AI_CONFIG.provider,
    aggregator: { ...DEFAULT_AI_CONFIG.aggregator, ...(d.aggregator || {}) },
    openai: { ...DEFAULT_AI_CONFIG.openai, ...(d.openai || {}) },
    gemini: { ...DEFAULT_AI_CONFIG.gemini, ...(d.gemini || {}) },
  };
}

/** 当前 provider 是否已经具备调用条件（key + model + 必要 baseUrl） */
export function isProviderReady(cfg: AIConfig): boolean {
  const c = cfg[cfg.provider];
  if (!c.apiKey || !c.model) return false;
  if (cfg.provider === "aggregator" && !c.baseUrl) return false;
  return true;
}
