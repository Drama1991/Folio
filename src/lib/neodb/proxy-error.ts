import { NextResponse } from "next/server";
import { NeoDBError } from "./client";

/**
 * 把 NeoDB 上游错误映射成稳定的 proxy 响应。
 * - 状态码原样保留（401/403/404/429），其余 4xx 归一到 400，5xx / 非 NeoDBError 归一到 502
 * - 响应体只回 enum 字符串（不透传上游 message，避免内部信息泄漏）
 * - 429 透传 Retry-After 响应头
 * - 总是 console.error 原始消息，方便服务端排查
 */
export function neodbErrorResponse(err: unknown): NextResponse {
  if (err instanceof NeoDBError) {
    console.error(`[proxy] NeoDB ${err.status}:`, err.message.slice(0, 200));
    const { status } = err;
    if (status === 401) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    if (status === 403) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    if (status === 404) return NextResponse.json({ error: "not_found" }, { status: 404 });
    if (status === 429) {
      const headers = new Headers();
      if (err.retryAfter) headers.set("retry-after", err.retryAfter);
      return NextResponse.json({ error: "rate_limited" }, { status: 429, headers });
    }
    if (status >= 500) return NextResponse.json({ error: "upstream_error" }, { status: 502 });
    if (status >= 400) return NextResponse.json({ error: "bad_request" }, { status: status });
  }
  console.error("[proxy] internal:", err instanceof Error ? err.message : String(err));
  return NextResponse.json({ error: "internal_error" }, { status: 502 });
}
