"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export type TimelineStatus = "all" | "complete" | "progress" | "wishlist";

const OPTIONS: Array<{ value: TimelineStatus; label: string; hint: string }> = [
  { value: "all", label: "全部状态", hint: "完成 / 进行 / 心愿" },
  { value: "complete", label: "已完成", hint: "看过 · 读过 · 听过" },
  { value: "progress", label: "进行中", hint: "在看 · 在读 · 在听" },
  { value: "wishlist", label: "心愿单", hint: "想看 · 想读 · 想听" },
];

export function TimelineStatusFilter({
  current,
  urls,
}: {
  current: TimelineStatus;
  urls: Record<TimelineStatus, string>;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const curLabel = OPTIONS.find((o) => o.value === current)?.label ?? "全部状态";

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="sort-trigger"
      >
        <i className="ti ti-filter" style={{ fontSize: 13 }} />
        <span>{curLabel}</span>
        <i
          className="ti ti-chevron-down"
          style={{ fontSize: 12, transition: "transform .15s", transform: open ? "rotate(180deg)" : "none" }}
        />
      </button>

      {open && (
        <div role="menu" className="sort-menu">
          {OPTIONS.map((o) => {
            const on = o.value === current;
            return (
              <Link
                key={o.value}
                role="menuitemradio"
                aria-checked={on}
                href={urls[o.value]}
                onClick={() => setOpen(false)}
                className={`sort-item${on ? " on" : ""}`}
              >
                <span className="sort-item__label">{o.label}</span>
                <span className="sort-item__hint">{o.hint}</span>
                {on && <i className="ti ti-check" style={{ fontSize: 13, marginLeft: "auto" }} />}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
