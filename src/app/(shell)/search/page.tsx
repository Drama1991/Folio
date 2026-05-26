"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Cover } from "@/components/shared/Cover";
import { MediumBadge } from "@/components/shared/MediumBadge";
import { Stars } from "@/components/shared/Stars";
import { EmptyState } from "@/components/shared/EmptyState";
import { STATUS_ICONS } from "@/components/shared/StatusControl";
import { ALL_UI_MEDIUMS } from "@/lib/neodb/mediumMap";
import { mediumLabel, statusVerb, type UiMedium } from "@/lib/format/verbs";
import type { UiItem, UiShelfStatus } from "@/lib/neodb/ui-types";

type SearchPhase = "idle" | "loading" | "error" | "ok";

export default function SearchPage() {
  const router = useRouter();
  const params = useSearchParams();
  const initialQ = params.get("q") ?? "";
  const initialCat = params.get("category") as UiMedium | null;
  const [q, setQ] = useState(initialQ);
  const [category, setCategory] = useState<UiMedium | null>(initialCat);
  const [results, setResults] = useState<UiItem[]>([]);
  const [phase, setPhase] = useState<SearchPhase>("idle");
  const [retryNonce, setRetryNonce] = useState(0);
  // marks-check：results 出来后批量查"当前用户对这批 uuid 的标记"
  const [myMarks, setMyMarks] = useState<Map<string, UiShelfStatus | null>>(new Map());
  const fetchedUuidsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const term = q.trim();
    if (!term) { setResults([]); setPhase("idle"); return; }
    setPhase("loading");
    // P1-9：AbortController 防竞态——慢请求被新输入覆盖时直接放弃 setState
    const controller = new AbortController();
    const id = setTimeout(async () => {
      try {
        const url = new URL("/api/proxy/search", window.location.origin);
        url.searchParams.set("q", term);
        if (category) url.searchParams.set("category", category);
        const res = await fetch(url.toString(), { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (json?.error) throw new Error(json.error);
        if (controller.signal.aborted) return;
        setResults((json.data ?? []) as UiItem[]);
        setPhase("ok");
      } catch (err) {
        if ((err as { name?: string })?.name === "AbortError") return;
        setResults([]);
        setPhase("error");
      }
    }, 280);
    return () => {
      clearTimeout(id);
      controller.abort();
    };
  }, [q, category, retryNonce]);

  // results 变化时把新 uuid 送到 marks-check 端点；fetchedUuidsRef 防重复查
  useEffect(() => {
    if (results.length === 0) return;
    const unknown = results
      .map((r) => r.uuid)
      .filter((u) => !fetchedUuidsRef.current.has(u));
    if (unknown.length === 0) return;
    unknown.forEach((u) => fetchedUuidsRef.current.add(u));

    const controller = new AbortController();
    fetch(`/api/proxy/marks-check?uuids=${encodeURIComponent(unknown.join(","))}`, {
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : { data: {} }))
      .then((j) => {
        const data = (j.data ?? {}) as Record<string, UiShelfStatus | null>;
        setMyMarks((prev) => {
          const next = new Map(prev);
          for (const [uuid, status] of Object.entries(data)) {
            next.set(uuid, status);
          }
          return next;
        });
      })
      .catch(() => {});
    return () => controller.abort();
  }, [results]);

  useEffect(() => {
    const u = new URL(window.location.href);
    if (q) u.searchParams.set("q", q); else u.searchParams.delete("q");
    if (category) u.searchParams.set("category", category); else u.searchParams.delete("category");
    router.replace(u.pathname + (u.search || ""));
  }, [q, category, router]);

  const grouped = new Map<UiMedium, UiItem[]>();
  for (const it of results) {
    const arr = grouped.get(it.medium) ?? [];
    arr.push(it);
    grouped.set(it.medium, arr);
  }

  return (
    <div style={{ padding: "20px 24px 28px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <i className="ti ti-search" style={{ fontSize: 20, color: "var(--text3)" }} />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜索…"
          style={{
            flex: 1, fontFamily: "var(--serif)", fontSize: 24, fontWeight: 500,
            border: "none", outline: "none", background: "none", color: "var(--text)",
            letterSpacing: "-0.01em",
          }}
        />
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 16, borderBottom: "0.5px solid var(--border)", paddingBottom: 6 }}>
        <button onClick={() => setCategory(null)} className={`tab${!category ? " on" : ""}`}>全部</button>
        {ALL_UI_MEDIUMS.map((m) => (
          <button key={m} onClick={() => setCategory(m)} className={`tab${category === m ? " on" : ""}`}>
            {mediumLabel(m)}
          </button>
        ))}
      </div>

      {!q && (
        <div style={{ padding: "26px 20px", textAlign: "center", color: "var(--text3)", fontSize: 12 }}>
          输入关键词开始搜索 · NeoDB 全库
        </div>
      )}
      {q && phase === "loading" && (
        <div style={{ padding: "18px 20px", fontSize: 12, color: "var(--text3)" }}>搜索中…</div>
      )}
      {q && phase === "error" && (
        <EmptyState
          tone="error"
          icon="ti-cloud-off"
          title="搜索没成功"
          description={<>NeoDB 这会儿没回话，或者网络抖了一下。关键词「{q}」还在，可以重试。</>}
          actions={[{ label: "重试", primary: true, onClick: () => setRetryNonce((n) => n + 1) }]}
        />
      )}
      {q && phase === "ok" && results.length === 0 && (
        <EmptyState
          title="没有结果"
          description={<>关键词「{q}」在 NeoDB 没有匹配。换个说法试试。</>}
        />
      )}

      {Array.from(grouped.entries()).map(([m, items]) => (
        <div key={m} style={{ marginBottom: 18 }}>
          <p className="section-label" style={{ marginBottom: 8 }}>{mediumLabel(m)} · {items.length}</p>
          <div style={{ border: "0.5px solid var(--border)", borderRadius: "var(--r)", overflow: "hidden" }}>
            {items.map((it) => {
              const mySt = myMarks.get(it.uuid);
              return (
                <Link key={it.uuid} href={`/detail/${it.medium}/${it.uuid}`} className="row" style={{ textDecoration: "none", color: "inherit" }}>
                  <Cover src={it.cover ?? undefined} seed={it.uuid} medium={it.medium} width={38} height={54} alt={it.title} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: "var(--serif)", fontSize: 14, fontWeight: 500 }}>{it.title}</p>
                    <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", marginTop: 3 }}>
                      {[it.year, it.creator].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {mySt && (
                      <span
                        title={`你已${statusVerb(it.medium, mySt)}`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 3,
                          fontFamily: "var(--mono)",
                          fontSize: 10,
                          color: "var(--gold)",
                        }}
                      >
                        <i className={`ti ${STATUS_ICONS[mySt]}`} aria-hidden style={{ fontSize: 11 }} />
                        已{statusVerb(it.medium, mySt)}
                      </span>
                    )}
                    {typeof it.externalRating === "number" && it.externalRating > 0 && (
                      <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text2)" }}>
                        NeoDB <Stars value={it.externalRating / 2} size={10} /> {it.externalRating.toFixed(1)}
                      </span>
                    )}
                    <MediumBadge medium={it.medium} small />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
