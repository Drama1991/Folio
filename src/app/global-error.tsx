"use client";

import { useEffect } from "react";

/**
 * 根 global-error.tsx：仅在根 layout 自身崩溃时触发。
 * 必须自带 <html><body>（旁路根 layout）。
 * 业务侧的 5xx 由 (shell)/error.tsx 接管，这里只兜底"全站塌方"。
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error]", error);
  }, [error]);

  return (
    <html lang="zh-CN">
      <body
        style={{
          margin: 0,
          background: "#F5F2EA",
          color: "#1C1C1A",
          fontFamily: "Georgia, serif",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <p style={{ fontFamily: "monospace", fontSize: 11, color: "#9F9D98", letterSpacing: "0.12em" }}>
            FATAL · APP CRASHED
          </p>
          <p style={{ fontSize: 24, fontWeight: 500, marginTop: 12 }}>folion 暂时无法启动。</p>
          <p style={{ fontSize: 13, color: "#5F5E5A", marginTop: 10, lineHeight: 1.7 }}>
            刷新页面通常能修复。如果一直如此，请联系作者。
          </p>
          {error.digest && (
            <p style={{ fontFamily: "monospace", fontSize: 11, color: "#9F9D98", marginTop: 16 }}>
              digest: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              marginTop: 24,
              padding: "8px 16px",
              borderRadius: 6,
              border: "0.5px solid #D8D6D0",
              background: "#ECE9E4",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            重新加载
          </button>
        </div>
      </body>
    </html>
  );
}
