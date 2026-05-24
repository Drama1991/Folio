"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Cover } from "@/components/shared/Cover";
import { MediumBadge } from "@/components/shared/MediumBadge";
import type { UiItem } from "@/lib/neodb/ui-types";

const MAX_INLINE = 8;
const DEBOUNCE_MS = 280;

export function HeaderSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<UiItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [total, setTotal] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // ⌘K / Ctrl+K 全局聚焦
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // 点击外部关闭
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // 搜索（debounce + AbortController 防竞态：慢请求被新输入覆盖时直接放弃，不再 setState）
  useEffect(() => {
    const term = q.trim();
    if (!term) {
      setResults([]);
      setTotal(0);
      return;
    }
    setLoading(true);
    const controller = new AbortController();
    const id = setTimeout(async () => {
      try {
        const url = new URL("/api/proxy/search", window.location.origin);
        url.searchParams.set("q", term);
        const r = await fetch(url.toString(), { signal: controller.signal }).then((r) => r.json());
        const data = (r.data ?? []) as UiItem[];
        setResults(data.slice(0, MAX_INLINE));
        setTotal(data.length);
        setActive(0);
      } catch (err) {
        if ((err as { name?: string })?.name === "AbortError") return;
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(id);
      controller.abort();
    };
  }, [q]);

  function go(item: UiItem) {
    setOpen(false);
    setQ("");
    inputRef.current?.blur();
    router.push(`/detail/${item.medium}/${item.uuid}`);
  }

  function goAll() {
    const term = q.trim();
    if (!term) return;
    setOpen(false);
    inputRef.current?.blur();
    router.push(`/search?q=${encodeURIComponent(term)}`);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      if (q) setQ("");
      else inputRef.current?.blur();
      setOpen(false);
      return;
    }
    if (!open || results.length === 0) {
      if (e.key === "Enter" && q.trim()) goAll();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = results[active];
      if (item) go(item);
    }
  }

  const term = q.trim();
  const showPanel = open && term.length > 0;

  return (
    <>
      {/* 移动端：点击直接跳 /search，不在 header 里展开 inline 搜索 */}
      <Link href="/search" className="search-mobile-link" aria-label="搜索">
        <i className="ti ti-search" aria-hidden />
      </Link>

      {/* 桌面端：原 inline search panel */}
      <div ref={wrapRef} className="search-desktop-wrap" style={{ position: "relative" }}>
      <div
        className="search-box"
        style={{ cursor: "text" }}
        onClick={() => inputRef.current?.focus()}
      >
        <i className="ti ti-search" style={{ fontSize: 13, color: "var(--text3)" }} />
        <input
          ref={inputRef}
          type="text"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (q.trim()) setOpen(true);
          }}
          onKeyDown={onKeyDown}
          placeholder="搜索..."
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            background: "transparent",
            fontSize: 12,
            color: "var(--text)",
            fontFamily: "inherit",
            minWidth: 0,
            padding: 0,
          }}
        />
        <span
          aria-hidden
          style={{
            fontSize: 11,
            color: "var(--text3)",
            background: "var(--bg)",
            border: "0.5px solid var(--border)",
            borderRadius: 4,
            padding: "1px 5px",
            fontFamily: "var(--mono)",
          }}
        >
          ⌘K
        </span>
      </div>

      {showPanel && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            width: 380,
            maxWidth: "calc(100vw - 48px)",
            border: "0.5px solid var(--border)",
            borderRadius: "var(--r)",
            background: "var(--bg)",
            boxShadow: "0 8px 28px rgba(0,0,0,0.10)",
            overflow: "hidden",
            zIndex: 30,
          }}
        >
          {loading && results.length === 0 && (
            <p style={{ padding: "14px 14px", fontSize: 11, color: "var(--text3)", fontFamily: "var(--mono)" }}>
              搜索中…
            </p>
          )}
          {!loading && results.length === 0 && (
            <p style={{ padding: "14px 14px", fontSize: 11, color: "var(--text3)", fontFamily: "var(--mono)" }}>
              没有结果
            </p>
          )}
          {results.length > 0 && (
            <>
              <div style={{ padding: 4 }}>
                {results.map((it, idx) => {
                  const on = idx === active;
                  return (
                    <button
                      key={it.uuid}
                      type="button"
                      onMouseEnter={() => setActive(idx)}
                      onClick={() => go(it)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        width: "100%",
                        textAlign: "left",
                        padding: "6px 8px",
                        border: "none",
                        background: on ? "var(--bg2)" : "transparent",
                        cursor: "pointer",
                        borderRadius: "var(--r2)",
                        fontFamily: "inherit",
                        color: "inherit",
                      }}
                    >
                      <Cover src={it.cover ?? undefined} seed={it.uuid} width={28} height={40} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            fontFamily: "var(--serif)",
                            fontSize: 13,
                            fontWeight: 500,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {it.title}
                        </p>
                        <p
                          style={{
                            fontFamily: "var(--mono)",
                            fontSize: 11,
                            color: "var(--text3)",
                            marginTop: 2,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {[it.year, it.creator].filter(Boolean).join(" · ") || "—"}
                        </p>
                      </div>
                      <MediumBadge medium={it.medium} small />
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={goAll}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "8px 14px",
                  border: "none",
                  borderTop: "0.5px solid var(--border)",
                  background: "var(--bg2)",
                  cursor: "pointer",
                  fontFamily: "var(--mono)",
                  fontSize: 11,
                  color: "var(--text2)",
                }}
              >
                <span>查看全部 {total} 个结果</span>
                <i className="ti ti-arrow-right" style={{ fontSize: 12 }} />
              </button>
            </>
          )}
        </div>
      )}
      </div>
    </>
  );
}
