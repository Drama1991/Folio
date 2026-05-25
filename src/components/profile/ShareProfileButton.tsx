"use client";
import { useState } from "react";

interface Props {
  url: string;
  /** "pill" = 桌面端胶囊按钮；"icon" = 移动端 40x40 方块按钮 */
  variant?: "pill" | "icon";
}

export function ShareProfileButton({ url, variant = "pill" }: Props) {
  const [done, setDone] = useState(false);
  const onClick = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setDone(true);
      setTimeout(() => setDone(false), 1600);
    } catch {
      /* no-op */
    }
  };

  if (variant === "icon") {
    return (
      <button
        type="button"
        className="profile-me-icon"
        onClick={onClick}
        aria-label={done ? "已复制主页链接" : "分享主页"}
        title={done ? "已复制 ✓" : "复制主页链接"}
      >
        <i className={`ti ${done ? "ti-check" : "ti-share"}`} aria-hidden />
      </button>
    );
  }

  return (
    <button
      className="btn"
      onClick={onClick}
      title="复制主页链接"
    >
      {done ? "已复制 ✓" : "分享主页"}
    </button>
  );
}
