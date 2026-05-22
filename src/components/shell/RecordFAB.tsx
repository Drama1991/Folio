"use client";

import { usePathname } from "next/navigation";
import { useRecordModal } from "@/lib/store/record-modal";

const FAB_PATHS = ["/home", "/wishlist", "/discover"];

export function RecordFAB() {
  const pathname = usePathname();
  const show = useRecordModal((s) => s.show);

  const visible = FAB_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (!visible) return null;

  return (
    <button
      onClick={() => show()}
      aria-label="记录新内容"
      title="记录新内容"
      className="record-fab"
    >
      <i className="ti ti-feather" aria-hidden />
    </button>
  );
}
