"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Shell 子树错误边界。
 * 捕获 detail / archive / wishlist 等页面的运行时异常 + 上游 5xx，给重试入口；
 * 与 404 区分（notFound() 走 not-found.tsx）。
 */
export default function ShellError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[shell-error]", error);
  }, [error]);

  return (
    <div style={{ padding: "60px 24px", textAlign: "center", maxWidth: 460, margin: "0 auto" }}>
      <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", letterSpacing: "0.12em" }}>
        500 · 出错了
      </p>
      <p
        style={{
          fontFamily: "var(--serif)",
          fontSize: 24,
          fontWeight: 500,
          letterSpacing: "-0.01em",
          marginTop: 12,
          lineHeight: 1.4,
        }}
      >
        这一页暂时打不开。
      </p>
      <p
        style={{
          fontSize: 13,
          color: "var(--text2)",
          fontFamily: "var(--serif)",
          marginTop: 10,
          lineHeight: 1.7,
        }}
      >
        可能是 NeoDB 临时抖动，也可能是网络波动。<br />
        稍后重试一次，或者回到首页继续。
      </p>
      {error.digest && (
        <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", marginTop: 16 }}>
          digest: {error.digest}
        </p>
      )}
      <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 24 }}>
        <button onClick={reset} className="btn primary">
          重试
        </button>
        <Link href="/home" className="btn">
          回首页
        </Link>
      </div>
    </div>
  );
}
