"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type SectionKey = "account" | "neodb" | "ai" | "appearance" | "data" | "about";

const SECTIONS: { key: SectionKey; label: string; icon: string }[] = [
  { key: "account", label: "账号", icon: "ti-user" },
  { key: "neodb", label: "NeoDB", icon: "ti-database" },
  { key: "ai", label: "AI", icon: "ti-sparkles" },
  { key: "appearance", label: "外观", icon: "ti-palette" },
  { key: "data", label: "数据", icon: "ti-package" },
  { key: "about", label: "关于", icon: "ti-info-circle" },
];

interface Props {
  instance: string;
  handle: string;
  acct: string;
  display: string;
}

export function SettingsContent({ instance, handle, acct, display }: Props) {
  const [section, setSection] = useState<SectionKey>("account");
  const router = useRouter();

  return (
    <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", minHeight: "calc(100vh - 54px)" }}>
      <aside style={{ borderRight: "0.5px solid var(--border)", padding: "20px 14px" }}>
        <p className="section-label" style={{ marginBottom: 12, padding: "0 4px" }}>设置</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              onClick={() => setSection(s.key)}
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "8px 11px", borderRadius: "var(--r2)",
                background: section === s.key ? "var(--bg2)" : "transparent",
                border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13,
                color: section === s.key ? "var(--text)" : "var(--text2)",
                fontWeight: section === s.key ? 500 : 400, textAlign: "left",
              }}
            >
              <i className={`ti ${s.icon}`} style={{ fontSize: 14, color: "var(--text3)" }} />
              {s.label}
            </button>
          ))}
        </div>
      </aside>

      <main style={{ padding: "26px 28px" }}>
        {section === "account" && <AccountPanel display={display} handle={handle} acct={acct} />}
        {section === "neodb" && <NeoDBPanel instance={instance} onSync={() => router.refresh()} />}
        {section === "ai" && <AIPanel />}
        {section === "appearance" && <AppearancePanel />}
        {section === "data" && <DataPanel />}
        {section === "about" && <AboutPanel />}
      </main>
    </div>
  );
}

function PanelHeader({ title, hint }: { title: string; hint?: string }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <p style={{ fontFamily: "var(--serif)", fontSize: 22, fontWeight: 500, letterSpacing: "-0.01em" }}>{title}</p>
      {hint && <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", marginTop: 4 }}>{hint}</p>}
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "0.5px solid var(--border)" }}>
      <span style={{ fontSize: 13, color: "var(--text2)" }}>{k}</span>
      <span style={{ fontSize: 13, color: "var(--text)", fontFamily: "var(--mono)" }}>{v}</span>
    </div>
  );
}

function AccountPanel({ display, handle, acct }: { display: string; handle: string; acct: string }) {
  return (
    <>
      <PanelHeader title="账号" />
      <Row k="显示名" v={display} />
      <Row k="用户名" v={handle} />
      <Row k="联邦 handle" v={`@${acct}`} />
      <div style={{ marginTop: 22 }}>
        <a href="/api/auth/logout" className="btn" style={{ color: "#A03B3B", borderColor: "#E5C2BD" }}>
          <i className="ti ti-logout" style={{ fontSize: 13 }} />
          登出
        </a>
      </div>
    </>
  );
}

function NeoDBPanel({ instance, onSync }: { instance: string; onSync: () => void }) {
  return (
    <>
      <PanelHeader title="NeoDB 连接" hint="所有读写经由这个实例。" />
      <div
        style={{
          background: "linear-gradient(135deg,#F5EFDD 0%,#EFE8D1 100%)",
          border: "0.5px solid #E5DCC2",
          borderRadius: "var(--r)",
          padding: "16px 18px",
          marginBottom: 18,
        }}
      >
        <p style={{ fontFamily: "var(--mono)", fontSize: 10, color: "#854F0B", letterSpacing: ".06em" }}>实例</p>
        <p style={{ fontFamily: "var(--serif)", fontSize: 20, fontWeight: 500, color: "#412402", marginTop: 4 }}>{instance}</p>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button onClick={onSync} className="btn primary" style={{ fontSize: 12 }}>
            <i className="ti ti-refresh" style={{ fontSize: 12 }} /> 立即同步
          </button>
          <a href="/api/auth/logout" className="btn" style={{ fontSize: 12 }}>断开连接</a>
        </div>
      </div>
      <p style={{ fontSize: 12, color: "var(--text3)", lineHeight: 1.65 }}>
        Token 仅在服务端使用，不会进入浏览器。每个实例的 OAuth 应用注册分别缓存。
      </p>
    </>
  );
}

function AIPanel() {
  return (
    <>
      <PanelHeader title="AI 助手" hint="Phase 0 阶段使用 mock 回复，不连接 LLM。" />
      <Row k="状态" v="Mock · 1.1s 延迟" />
      <Row k="历史保留" v="本机会话" />
      <p style={{ fontSize: 12, color: "var(--text3)", marginTop: 22, lineHeight: 1.65 }}>
        Phase 1+ 会接入真实 LLM（可三选一：Anthropic / OpenAI / 本地 Ollama）。
      </p>
    </>
  );
}

function AppearancePanel() {
  return (
    <>
      <PanelHeader title="外观" />
      <Row k="主题" v="米白（暂时）" />
      <Row k="字号" v="14px" />
      <Row k="语言" v="简体中文" />
      <p style={{ fontSize: 12, color: "var(--text3)", marginTop: 18, lineHeight: 1.65 }}>
        深色主题 / 字号 / 信息密度的切换将在后续阶段开放。
      </p>
    </>
  );
}

function DataPanel() {
  return (
    <>
      <PanelHeader title="数据" />
      <div style={{ border: "0.5px solid var(--border)", borderRadius: "var(--r2)", padding: "12px 14px", marginBottom: 10 }}>
        <p style={{ fontSize: 13, fontWeight: 500 }}>集数 / 阅读进度</p>
        <p style={{ fontSize: 11, color: "var(--text3)", marginTop: 3, lineHeight: 1.6 }}>
          NeoDB 未提供这两个字段。Folio 把它们存在本机 localStorage，不会同步。
        </p>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button className="btn" disabled>导出 JSON（即将）</button>
        <button className="btn" disabled>从豆瓣导入（即将）</button>
      </div>
    </>
  );
}

function AboutPanel() {
  return (
    <>
      <PanelHeader title="关于" />
      <Row k="版本" v="Phase 0" />
      <Row k="项目" v={<Link href="https://github.com/" target="_blank" style={{ color: "var(--text)" }}>GitHub</Link>} />
      <Row k="数据来源" v="NeoDB" />
    </>
  );
}
