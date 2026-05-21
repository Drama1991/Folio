"use client";
import { useState } from "react";

export function ShareProfileButton({ url }: { url: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      className="btn"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        } catch {
          /* no-op */
        }
      }}
      title="复制主页链接"
    >
      {done ? "已复制 ✓" : "分享主页"}
    </button>
  );
}
