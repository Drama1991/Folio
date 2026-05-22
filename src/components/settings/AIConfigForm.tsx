"use client";

import { useEffect, useRef, useState } from "react";
import type { AIConfig, ProviderKind } from "@/lib/ai/types";

interface ApiResponse {
  config: AIConfig;
  ready: boolean;
}

const PROVIDER_META: { key: ProviderKind; label: string; hint: string }[] = [
  { key: "aggregator", label: "聚合 API（推荐）", hint: "one-api / OpenRouter / OhMyGPT 等 OpenAI 兼容站。填 base URL + key + 模型名。" },
  { key: "openai", label: "OpenAI 直连", hint: "走 api.openai.com，仅需 key 和模型名。" },
  { key: "gemini", label: "Google Gemini", hint: "走 generativelanguage.googleapis.com。" },
];

export function AIConfigForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [cfg, setCfg] = useState<AIConfig | null>(null);
  const [ready, setReady] = useState(false);

  // 每个 provider 一个可编辑 key 字段；空字符串表示"不修改"，保留旧 key
  const [keyEdit, setKeyEdit] = useState<Record<ProviderKind, string>>({
    aggregator: "",
    openai: "",
    gemini: "",
  });
  const [searchKeyEdit, setSearchKeyEdit] = useState("");

  // 聚合站模型选择器状态
  const [agModels, setAgModels] = useState<string[] | null>(null);
  const [agLoadingModels, setAgLoadingModels] = useState(false);
  const [agModelsErr, setAgModelsErr] = useState<string | null>(null);
  const [agModelFilter, setAgModelFilter] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/ai/config");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const j = (await res.json()) as ApiResponse;
        if (!mounted) return;
        setCfg(j.config);
        setReady(j.ready);
      } catch (e) {
        if (mounted) setErr(e instanceof Error ? e.message : "load_failed");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading || !cfg) {
    return (
      <>
        <PanelHeader />
        <p style={{ fontSize: 12, color: "var(--text3)" }}>加载中…</p>
      </>
    );
  }

  function patch<K extends keyof AIConfig>(k: K, v: AIConfig[K]) {
    setCfg((c) => (c ? { ...c, [k]: v } : c));
    setOkMsg(null);
  }

  async function fetchAggregatorModels() {
    if (!cfg) return;
    setAgLoadingModels(true);
    setAgModelsErr(null);
    try {
      const res = await fetch("/api/ai/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "aggregator",
          baseUrl: cfg.aggregator.baseUrl,
          apiKey: keyEdit.aggregator, // 空 → 后端 fallback 用已存的
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error ?? `HTTP ${res.status}`);
      }
      const j = (await res.json()) as { models: string[] };
      setAgModels(j.models);
      setAgModelFilter("");
    } catch (e) {
      setAgModelsErr(e instanceof Error ? e.message : "load_failed");
    } finally {
      setAgLoadingModels(false);
    }
  }

  async function onSave() {
    if (!cfg) return;
    setSaving(true);
    setErr(null);
    setOkMsg(null);
    try {
      const body: AIConfig = {
        provider: cfg.provider,
        aggregator: { ...cfg.aggregator, apiKey: keyEdit.aggregator },
        openai: { ...cfg.openai, apiKey: keyEdit.openai },
        gemini: { ...cfg.gemini, apiKey: keyEdit.gemini },
        search: {
          provider: cfg.search.provider,
          brave: { apiKey: searchKeyEdit },
        },
      };
      const res = await fetch("/api/ai/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error ?? `HTTP ${res.status}`);
      }
      const j = (await res.json()) as ApiResponse;
      setCfg(j.config);
      setReady(j.ready);
      setKeyEdit({ aggregator: "", openai: "", gemini: "" });
      setSearchKeyEdit("");
      setOkMsg("已保存");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "save_failed");
    } finally {
      setSaving(false);
    }
  }

  const aggModelField = (
    <ModelCombobox
      value={cfg.aggregator.model}
      onChange={(v) => patch("aggregator", { ...cfg.aggregator, model: v })}
      onFetch={fetchAggregatorModels}
      loading={agLoadingModels}
      err={agModelsErr}
      options={agModels}
      filter={agModelFilter}
      onFilter={setAgModelFilter}
      placeholder="gpt-4o-mini / claude-3-5-sonnet-20241022 ..."
    />
  );

  return (
    <>
      <PanelHeader />

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <StatusDot ready={ready} />
        <span style={{ fontSize: 13, color: "var(--text2)" }}>
          {ready ? `当前 provider: ${cfg.provider}（已就绪）` : "尚未配置，AI 对话不可用"}
        </span>
      </div>

      <div style={{ marginBottom: 22 }}>
        <p className="section-label" style={{ marginBottom: 8 }}>启用</p>
        <div style={{ display: "flex", gap: 6 }}>
          {PROVIDER_META.map((p) => {
            const on = cfg.provider === p.key;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => patch("provider", p.key)}
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  borderRadius: "var(--r2)",
                  border: `0.5px solid ${on ? "transparent" : "var(--border)"}`,
                  background: on ? "linear-gradient(135deg, #E0B270 0%, #D38A30 50%, #A86515 100%)" : "var(--bg)",
                  color: on ? "#FFF6E6" : "var(--text2)",
                  cursor: "pointer",
                  fontSize: 12,
                  fontFamily: "inherit",
                  textAlign: "left",
                }}
              >
                <p style={{ fontWeight: 500, fontSize: 13 }}>{p.label}</p>
                <p style={{ fontSize: 10, marginTop: 3, opacity: 0.8, fontFamily: "var(--mono)" }}>
                  {on ? "已启用" : "切换到此"}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <ProviderBlock
        title={PROVIDER_META[0].label}
        hint={PROVIDER_META[0].hint}
        showBaseUrl
        creds={cfg.aggregator}
        currentKeyMasked={cfg.aggregator.apiKey}
        keyEdit={keyEdit.aggregator}
        onBaseUrl={(v) => patch("aggregator", { ...cfg.aggregator, baseUrl: v })}
        onModel={(v) => patch("aggregator", { ...cfg.aggregator, model: v })}
        onKey={(v) => setKeyEdit((k) => ({ ...k, aggregator: v }))}
        modelField={aggModelField}
      />
      <ProviderBlock
        title={PROVIDER_META[1].label}
        hint={PROVIDER_META[1].hint}
        showBaseUrl={false}
        creds={cfg.openai}
        currentKeyMasked={cfg.openai.apiKey}
        keyEdit={keyEdit.openai}
        onBaseUrl={() => undefined}
        onModel={(v) => patch("openai", { ...cfg.openai, model: v })}
        onKey={(v) => setKeyEdit((k) => ({ ...k, openai: v }))}
      />
      <ProviderBlock
        title={PROVIDER_META[2].label}
        hint={PROVIDER_META[2].hint}
        showBaseUrl={false}
        creds={cfg.gemini}
        currentKeyMasked={cfg.gemini.apiKey}
        keyEdit={keyEdit.gemini}
        onBaseUrl={() => undefined}
        onModel={(v) => patch("gemini", { ...cfg.gemini, model: v })}
        onKey={(v) => setKeyEdit((k) => ({ ...k, gemini: v }))}
      />

      <SearchBlock
        currentKeyMasked={cfg.search.brave.apiKey}
        keyEdit={searchKeyEdit}
        onKey={setSearchKeyEdit}
      />

      <div style={{ marginTop: 22, display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onSave} disabled={saving} className="btn primary" style={{ fontSize: 12 }}>
          {saving ? "保存中…" : "保存"}
        </button>
        {okMsg && <span style={{ fontSize: 12, color: "#0F6E56" }}>{okMsg}</span>}
        {err && <span style={{ fontSize: 12, color: "#A03B3B" }}>失败：{err}</span>}
      </div>

      <p style={{ fontSize: 11, color: "var(--text3)", marginTop: 18, lineHeight: 1.65 }}>
        Key 通过 HS256 签名后存在 httpOnly cookie 中，仅服务端使用，不进入浏览器 JS。
        留空 API key 字段不会清空已有值。
      </p>
    </>
  );
}

function PanelHeader() {
  return (
    <div style={{ marginBottom: 18 }}>
      <p style={{ fontFamily: "var(--serif)", fontSize: 22, fontWeight: 500, letterSpacing: "-0.01em" }}>
        AI 助手
      </p>
      <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", marginTop: 4 }}>
        三选一 provider。聚合站走 OpenAI 兼容协议；OpenAI / Gemini 直连接口已预留可用。
      </p>
    </div>
  );
}

function StatusDot({ ready }: { ready: boolean }) {
  return (
    <span
      aria-hidden
      style={{
        width: 8,
        height: 8,
        borderRadius: 999,
        background: ready ? "#0F6E56" : "var(--text3)",
        flexShrink: 0,
      }}
    />
  );
}

function ProviderBlock({
  title,
  hint,
  showBaseUrl,
  creds,
  currentKeyMasked,
  keyEdit,
  onBaseUrl,
  onModel,
  onKey,
  modelField,
}: {
  title: string;
  hint: string;
  showBaseUrl: boolean;
  creds: AIConfig["aggregator"];
  currentKeyMasked: string;
  keyEdit: string;
  onBaseUrl: (v: string) => void;
  onModel: (v: string) => void;
  onKey: (v: string) => void;
  modelField?: React.ReactNode;
}) {
  return (
    <div
      style={{
        border: "0.5px solid var(--border)",
        borderRadius: "var(--r2)",
        padding: "14px 16px",
        marginBottom: 12,
      }}
    >
      <p style={{ fontSize: 13, fontWeight: 500 }}>{title}</p>
      <p style={{ fontSize: 11, color: "var(--text3)", marginTop: 3, lineHeight: 1.55, marginBottom: 10 }}>
        {hint}
      </p>
      {showBaseUrl && (
        <Field label="Base URL">
          <input
            type="text"
            value={creds.baseUrl ?? ""}
            placeholder="https://api.your-aggregator.com/v1"
            onChange={(e) => onBaseUrl(e.target.value)}
            style={inputStyle}
          />
        </Field>
      )}
      {modelField ?? (
        <Field label="模型">
          <input
            type="text"
            value={creds.model}
            placeholder={showBaseUrl ? "gpt-4o-mini / claude-3-5-sonnet-20241022 ..." : "gpt-4o-mini"}
            onChange={(e) => onModel(e.target.value)}
            style={inputStyle}
          />
        </Field>
      )}
      <Field label="API Key">
        <input
          type="password"
          value={keyEdit}
          placeholder={currentKeyMasked ? `当前: ${currentKeyMasked} (留空保留)` : "sk-..."}
          onChange={(e) => onKey(e.target.value)}
          style={inputStyle}
          autoComplete="off"
        />
      </Field>
    </div>
  );
}

function ModelCombobox({
  value,
  onChange,
  onFetch,
  loading,
  err,
  options,
  filter,
  onFilter,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  onFetch: () => void;
  loading: boolean;
  err: string | null;
  options: string[] | null;
  filter: string;
  onFilter: (s: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevOptionsRef = useRef<string[] | null>(options);

  // 拉取成功后自动展开
  useEffect(() => {
    const prev = prevOptionsRef.current;
    if (prev === null && options !== null && options.length > 0) {
      setOpen(true);
    }
    prevOptionsRef.current = options;
  }, [options]);

  // 点击外部 / ESC 关闭
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
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

  const filtered =
    options === null
      ? []
      : filter.trim()
        ? options.filter((o) => o.toLowerCase().includes(filter.trim().toLowerCase()))
        : options;

  const hasOptions = options !== null && options.length > 0;

  return (
    <Field label="模型">
      <div ref={containerRef} style={{ position: "relative" }}>
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            if (hasOptions) setOpen(true);
          }}
          style={{ ...inputStyle, paddingRight: 32 }}
        />
        <button
          type="button"
          onClick={onFetch}
          disabled={loading}
          title={loading ? "拉取中…" : "请求模型列表"}
          aria-label="请求模型列表"
          style={{
            position: "absolute",
            right: 4,
            top: "50%",
            transform: "translateY(-50%)",
            border: "none",
            background: "transparent",
            cursor: loading ? "default" : "pointer",
            padding: 6,
            color: "var(--text2)",
            display: "flex",
            alignItems: "center",
            opacity: loading ? 0.5 : 1,
          }}
        >
          <i className="ti ti-refresh" style={{ fontSize: 13 }} />
        </button>

        {open && hasOptions && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              left: 0,
              right: 0,
              border: "0.5px solid var(--border)",
              borderRadius: "var(--r2)",
              background: "var(--bg)",
              boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
              zIndex: 20,
              overflow: "hidden",
            }}
          >
            <input
              type="text"
              value={filter}
              onChange={(e) => onFilter(e.target.value)}
              placeholder={`搜索 / 过滤（共 ${options!.length} 个）`}
              style={{
                width: "100%",
                padding: "7px 10px",
                border: "none",
                borderBottom: "0.5px solid var(--border)",
                background: "var(--bg2)",
                fontSize: 11,
                fontFamily: "var(--mono)",
                outline: "none",
                color: "var(--text)",
              }}
            />
            <div style={{ maxHeight: 220, overflowY: "auto", padding: 4 }}>
              {filtered.length === 0 ? (
                <p style={{ fontSize: 11, color: "var(--text3)", padding: "8px 10px" }}>
                  没有匹配的模型
                </p>
              ) : (
                filtered.map((id) => {
                  const on = id === value;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        onChange(id);
                        setOpen(false);
                      }}
                      title={id}
                      style={{
                        display: "block",
                        width: "100%",
                        textAlign: "left",
                        padding: "6px 10px",
                        fontSize: 11,
                        fontFamily: "var(--mono)",
                        border: "none",
                        borderRadius: 4,
                        background: on ? "var(--text)" : "transparent",
                        color: on ? "var(--bg)" : "var(--text2)",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {id}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
      {err && (
        <p style={{ fontSize: 11, color: "#A03B3B", marginTop: 4 }}>
          拉取失败：{err}
        </p>
      )}
      {options !== null && options.length === 0 && !err && (
        <p style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>
          上游返回了空列表。
        </p>
      )}
    </Field>
  );
}

function SearchBlock({
  currentKeyMasked,
  keyEdit,
  onKey,
}: {
  currentKeyMasked: string;
  keyEdit: string;
  onKey: (v: string) => void;
}) {
  return (
    <div
      style={{
        border: "0.5px solid var(--border)",
        borderRadius: "var(--r2)",
        padding: "14px 16px",
        marginTop: 18,
        marginBottom: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <i className="ti ti-world" style={{ fontSize: 14, color: "var(--gold)" }} />
        <p style={{ fontSize: 13, fontWeight: 500 }}>联网搜索（Brave Search）</p>
      </div>
      <p style={{ fontSize: 11, color: "var(--text3)", marginTop: 4, lineHeight: 1.55, marginBottom: 10 }}>
        填好之后，AI 对话框输入栏左侧的 🌐 按钮才会生效。开启时每条消息会先去 Brave 抓 5 条网页结果，注入到 LLM 上下文，并在回答下方展示来源链接。
        免费额度 2000 次/月，
        <a
          href="https://api-dashboard.search.brave.com/app/keys"
          target="_blank"
          rel="noreferrer noopener"
          style={{ color: "var(--text2)", textDecoration: "underline" }}
        >
          在这里申请 key
        </a>
        。
      </p>
      <Field label="Brave API Key">
        <input
          type="password"
          value={keyEdit}
          placeholder={currentKeyMasked ? `当前: ${currentKeyMasked} (留空保留)` : "BSA..."}
          onChange={(e) => onKey(e.target.value)}
          style={inputStyle}
          autoComplete="off"
        />
      </Field>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block", marginBottom: 8 }}>
      <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)", display: "block", marginBottom: 4 }}>
        {label}
      </span>
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 11px",
  border: "0.5px solid var(--border)",
  borderRadius: "var(--r2)",
  background: "var(--bg2)",
  fontSize: 12,
  fontFamily: "var(--mono)",
  color: "var(--text)",
  outline: "none",
};
