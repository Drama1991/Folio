"use client";

import { usePathname } from "next/navigation";
import { useRecordModal } from "@/lib/store/record-modal";

const FAB_PATHS = ["/home", "/wishlist", "/discover"];

export function RecordFAB() {
  const pathname = usePathname();
  const show = useRecordModal((s) => s.show);

  // 精确匹配 / 或子路由（如 /discover/movie）
  const visible = FAB_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (!visible) return null;

  return (
    <button
      onClick={() => show()}
      aria-label="记录新内容"
      title="记录新内容"
      className="record-fab"
    >
      <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden>
        {/* 主加号 —— 双层做浮雕：底层暗影 + 顶层亮 */}
        <line x1="15" y1="9" x2="15" y2="21" stroke="rgba(110,65,12,0.45)" strokeWidth="3.2" strokeLinecap="round" transform="translate(0.5,0.8)" />
        <line x1="9" y1="15" x2="21" y2="15" stroke="rgba(110,65,12,0.45)" strokeWidth="3.2" strokeLinecap="round" transform="translate(0.5,0.8)" />
        <line x1="15" y1="9" x2="15" y2="21" stroke="#FFF6E6" strokeWidth="3.2" strokeLinecap="round" />
        <line x1="9" y1="15" x2="21" y2="15" stroke="#FFF6E6" strokeWidth="3.2" strokeLinecap="round" />
        {/* 右上小 sparkle 装饰 —— 呼应 AI logo 的星座意象 */}
        <path d="M23 6.5 L23.5 8 L25 8.5 L23.5 9 L23 10.5 L22.5 9 L21 8.5 L22.5 8 Z" fill="#FFF6E6" opacity="0.85" />
      </svg>
    </button>
  );
}


