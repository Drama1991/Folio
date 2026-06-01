"use client";

import { useState, useTransition, useEffect } from "react";
import { greeting } from "@/lib/format/dates";
import { describeOAuthError } from "@/lib/auth/oauth-errors";

const COMMON_INSTANCES = [
  { id: "neodb.social", tag: "主要" },
  { id: "eggplant.place" },
  { id: "minreol.dk" },
  { id: "读写人.club" },
];

export function LoginCard({ initialError }: { initialError?: string }) {
  const [instance, setInstance] = useState("neodb.social");
  const [error, setError] = useState<string | null>(describeOAuthError(initialError));
  const [pending, startTransition] = useTransition();
  const [hello, setHello] = useState("夜安");
  useEffect(() => { setHello(greeting(new Date())); }, []);

  function go() {
    if (!instance.trim()) {
      setError("请填写实例域名");
      return;
    }
    setError(null);
    startTransition(() => {
      const u = new URL("/api/auth/start", window.location.origin);
      u.searchParams.set("instance", instance.trim());
      window.location.href = u.toString();
    });
  }

  return (
    <div style={{ maxWidth: 460, width: "100%", animation: "fadeUp .35s ease" }}>
      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <img
          src="/folion-logo.png"
          alt="folion"
          className="brand-mark"
          draggable={false}
          style={{ height: 56, margin: "0 auto" }}
        />
      </div>

      {/* Hero */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <p style={{ fontFamily: "var(--serif)", fontSize: 36, fontWeight: 500, lineHeight: 1.1, letterSpacing: "-0.025em" }}>
          {hello}。
        </p>
        <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", marginTop: 10, letterSpacing: ".06em", textTransform: "uppercase" }}>
          基于 NeoDB 的个人媒体档案
        </p>
      </div>

      {/* Card */}
      <div style={{ background: "var(--bg)", border: "0.5px solid var(--border)", borderRadius: 14, padding: "24px 24px 20px", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
        <p className="section-label" style={{ marginBottom: 14 }}>
          用 NeoDB 账号登录
        </p>

        <p style={{ fontSize: 11, color: "var(--text3)", marginBottom: 8, fontFamily: "var(--mono)", textTransform: "uppercase", letterSpacing: ".06em" }}>
          你的 NeoDB 实例
        </p>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <div className="instance-input" style={{
            display: "flex", alignItems: "center", background: "var(--bg)", border: "0.5px solid var(--border)",
            borderRadius: "var(--r2)", padding: "10px 14px", flex: 1, transition: "border-color .15s",
          }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: 13, color: "var(--text3)", marginRight: 6 }}>https://</span>
            <input
              value={instance}
              onChange={(e) => setInstance(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && go()}
              placeholder="neodb.social"
              autoFocus
              style={{ flex: 1, border: "none", outline: "none", background: "none", fontFamily: "var(--mono)", fontSize: 13, color: "var(--text)" }}
            />
          </div>
          <button onClick={go} disabled={pending} className="btn primary" style={{ padding: "10px 18px", fontSize: 13 }}>
            {pending ? "跳转中…" : "继续"}
            {!pending && <i className="ti ti-arrow-right" style={{ fontSize: 13 }} />}
          </button>
        </div>

        <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>
          常用实例
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {COMMON_INSTANCES.map((c) => (
            <button
              key={c.id}
              onClick={() => setInstance(c.id)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--mono)", fontSize: 11,
                padding: "6px 11px", borderRadius: 999, border: "0.5px solid var(--border)", color: "var(--text2)",
                background: "var(--bg)", cursor: "pointer",
              }}
            >
              {c.id}
              {c.tag && (
                <span style={{ fontSize: 11, color: "var(--gold)", background: "rgba(239,159,39,0.12)", padding: "1px 6px", borderRadius: 999, letterSpacing: ".04em", textTransform: "uppercase" }}>
                  {c.tag}
                </span>
              )}
            </button>
          ))}
        </div>

        {error && (
          <p style={{ marginTop: 14, fontSize: 12, color: "#A03B3B", fontFamily: "var(--mono)" }}>{error}</p>
        )}
      </div>

      {/* 3-step explainer */}
      <div style={{ marginTop: 30, padding: "0 6px" }}>
        <p className="section-label" style={{ marginBottom: 16 }}>联邦登录 · 三步完成</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Step n={1} cur title="选择你的 NeoDB 实例" body="所有实例数据互通，但账户独立。没账号？任选一个公开实例注册。" />
          <Step n={2} title="在 NeoDB 中授权 folion" body="OAuth 2.0 标准流程 · folion 永远不会看到你的密码。" />
          <Step n={3} title="回到 folion · 完成" body="导入书架、评分、短评、合集，从你停下的地方继续。" />
        </div>
      </div>

      <div style={{ marginTop: 28, textAlign: "center", fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", letterSpacing: ".06em" }}>
        没有账号？任选一个公开实例（如 neodb.social）即可注册
      </div>
    </div>
  );
}

function Step({ n, cur, title, body }: { n: number; cur?: boolean; title: string; body: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
      <div style={{
        width: 26, height: 26, borderRadius: "50%",
        background: cur ? "var(--text)" : "var(--bg)",
        border: "0.5px solid " + (cur ? "var(--text)" : "var(--border)"),
        color: cur ? "var(--bg)" : "var(--text2)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "var(--mono)", fontSize: 11, flexShrink: 0,
      }}>
        {n}
      </div>
      <div style={{ flex: 1, paddingTop: 3 }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: cur ? "var(--text)" : "var(--text2)" }}>{title}</p>
        <p style={{ fontSize: 11, color: "var(--text2)", marginTop: 3, lineHeight: 1.55, fontFamily: "var(--serif)" }}>{body}</p>
      </div>
    </div>
  );
}
