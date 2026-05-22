"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export type SortBy = "time" | "rating" | "title" | "year";

const OPTIONS: Array<{ value: SortBy; label: string; hint: string }> = [
  { value: "time", label: "最近", hint: "按标记时间倒序" },
  { value: "rating", label: "评分", hint: "高分在前" },
  { value: "title", label: "字母", hint: "按标题拼音/字母" },
  { value: "year", label: "年份", hint: "发行年份倒序" },
];

export function SortDropdown({
  current,
  urls,
}: {
  current: SortBy;
  urls: Record<SortBy, string>;
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

  const curLabel = OPTIONS.find((o) => o.value === current)?.label ?? "最近";

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="sort-trigger"
      >
        <i className="ti ti-arrows-sort" style={{ fontSize: 13 }} />
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
