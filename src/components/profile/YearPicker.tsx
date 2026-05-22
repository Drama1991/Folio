"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface Props {
  handle: string;
  /** 今年（用于决定 `?year=` 是否要省略） */
  currentYear: number;
  /** 当前正在显示的年份 */
  selected: number;
  /** 可选年份数量，从 currentYear 向过去回溯 N 年 */
  range?: number;
}

export function YearPicker({ handle, currentYear, selected, range = 20 }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // 打开时把选中项滚到可见区
  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-y="${selected}"]`);
    if (el) el.scrollIntoView({ block: "center" });
  }, [open, selected]);

  // 从 currentYear 起，向过去回溯 20 年（未来年份随时间自然生成）
  const years = Array.from({ length: range }, (_, i) => currentYear - i);

  function hrefFor(y: number) {
    return y === currentYear ? `/profile/${handle}` : `/profile/${handle}?year=${y}`;
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          height: 28,
          padding: "0 10px",
          border: "0.5px solid var(--border)",
          borderRadius: 999,
          background: open ? "var(--bg2)" : "var(--bg)",
          color: "var(--text)",
          cursor: "pointer",
          fontFamily: "var(--mono)",
          fontSize: 12,
          fontWeight: 500,
          letterSpacing: "0.02em",
          transition: "background 0.12s",
        }}
      >
        <span>{selected}</span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
          style={{ transition: "transform 0.15s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div
          ref={listRef}
          role="listbox"
          aria-label="选择年份"
          style={{
            position: "absolute",
            right: 0,
            top: "100%",
            marginTop: 6,
            width: 96,
            maxHeight: 232, // ~8 项 + padding
            overflowY: "auto",
            background: "var(--bg)",
            border: "0.5px solid var(--border)",
            borderRadius: 10,
            padding: 4,
            boxShadow: "0 10px 28px rgba(0,0,0,0.10)",
            zIndex: 20,
          }}
        >
          {years.map((y) => {
            const isSel = y === selected;
            return (
              <Link
                key={y}
                href={hrefFor(y)}
                role="option"
                aria-selected={isSel}
                data-y={y}
                onClick={() => setOpen(false)}
                style={{
                  display: "block",
                  padding: "6px 10px",
                  fontFamily: "var(--mono)",
                  fontSize: 12,
                  borderRadius: 6,
                  textDecoration: "none",
                  background: isSel ? "var(--gold)" : "transparent",
                  color: isSel ? "#3D2706" : "var(--text2)",
                  fontWeight: isSel ? 500 : 400,
                  textAlign: "right",
                  letterSpacing: "0.02em",
                }}
                className={isSel ? "year-opt sel" : "year-opt"}
              >
                {y}
              </Link>
            );
          })}
        </div>
      )}
      <style>{`
        .year-opt:not(.sel):hover { background: var(--bg2); color: var(--text); }
      `}</style>
    </div>
  );
}
