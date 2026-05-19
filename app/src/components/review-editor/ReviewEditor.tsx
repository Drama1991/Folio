"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Cover } from "@/components/shared/Cover";
import { MediumBadge } from "@/components/shared/MediumBadge";
import { useToast } from "@/components/shared/Toast";
import type { UiMedium } from "@/lib/format/verbs";

interface Props {
  uuid: string;
  medium: UiMedium;
  title: string;
  cover?: string;
  year?: number | string;
  creator?: string;
}

export function ReviewEditor({ uuid, medium, title, cover, year, creator }: Props) {
  const router = useRouter();
  const show = useToast((s) => s.show);
  const [t, setT] = useState("");
  const [body, setBody] = useState("");
  const [visibility, setVisibility] = useState<0 | 1 | 2>(0);
  const [saving, setSaving] = useState(false);

  const len = body.length;
  const minLen = 50;

  async function publish() {
    if (!t.trim()) return show("请填写标题");
    if (body.trim().length < minLen) return show(`正文至少 ${minLen} 字`);
    setSaving(true);
    try {
      const res = await fetch(`/api/proxy/review/${uuid}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: t, body, visibility }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error ?? "post_failed");
      }
      show("已发布长评");
      router.push(`/detail/${medium}/${uuid}`);
    } catch (err) {
      show(`发布失败：${err instanceof Error ? err.message : ""}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ padding: "20px 24px 28px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <Link href="/home" className="crumb">首页</Link>
        <span style={{ color: "var(--text3)", fontFamily: "var(--mono)", fontSize: 11 }}>/</span>
        <Link href={`/detail/${medium}/${uuid}`} className="crumb">{title}</Link>
        <span style={{ color: "var(--text3)", fontFamily: "var(--mono)", fontSize: 11 }}>/</span>
        <span className="crumb cur">写长评</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, background: "var(--bg2)", borderRadius: "var(--r)", marginBottom: 18 }}>
        <Cover src={cover ?? undefined} seed={uuid} width={42} height={60} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: "var(--serif)", fontSize: 15, fontWeight: 500 }}>{title}</p>
          <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", marginTop: 3 }}>
            {[year, creator].filter(Boolean).join(" · ")}
          </p>
        </div>
        <MediumBadge medium={medium} />
      </div>

      <input
        value={t}
        onChange={(e) => setT(e.target.value)}
        placeholder="标题"
        style={{
          width: "100%", fontFamily: "var(--serif)", fontSize: 24, fontWeight: 500,
          border: "none", outline: "none", background: "none", marginBottom: 14,
          letterSpacing: "-0.01em",
        }}
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="把想说的写下来…"
        rows={20}
        style={{
          width: "100%", fontFamily: "var(--serif)", fontSize: 15, lineHeight: 1.8,
          border: "0.5px solid var(--border)", outline: "none",
          background: "var(--bg)", padding: "14px 16px",
          borderRadius: "var(--r)", resize: "vertical",
        }}
      />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14 }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: len < minLen ? "#A03B3B" : "var(--text3)" }}>
          {len} 字{len < minLen ? ` · 还差 ${minLen - len}` : ""}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <label style={{ fontSize: 11, color: "var(--text3)", display: "flex", gap: 6, alignItems: "center" }}>
            可见性
            <select
              value={visibility}
              onChange={(e) => setVisibility(Number(e.target.value) as 0 | 1 | 2)}
              style={{ fontSize: 11, padding: "3px 6px", border: "0.5px solid var(--border)", borderRadius: 4, background: "var(--bg)", fontFamily: "var(--mono)" }}
            >
              <option value={0}>公开</option>
              <option value={1}>仅关注者</option>
              <option value={2}>仅提及者</option>
            </select>
          </label>
          <Link href={`/detail/${medium}/${uuid}`} className="btn" style={{ fontSize: 12 }}>取消</Link>
          <button onClick={publish} disabled={saving} className="btn primary" style={{ fontSize: 13 }}>
            {saving ? "发布中…" : "发布"}
          </button>
        </div>
      </div>
    </div>
  );
}
