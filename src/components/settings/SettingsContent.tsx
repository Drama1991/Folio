"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AIConfigForm } from "./AIConfigForm";
import { useAppearance, type FontScale, type Density, type MotionPref, type Grain } from "@/lib/appearance";
import {
  scanLocalCache,
  clearFolioLocal,
  downloadJson,
  formatBytes,
  type LocalCacheInventory,
} from "@/lib/data/local-cache";
import { useSyncPrefs, type SyncFrequency } from "@/lib/store/sync-prefs";
import { useTriggerSync } from "@/lib/store/use-sync";
import {
  useDefaultVisibility,
  type DefaultVisibility,
} from "@/lib/store/default-visibility";

type SectionKey = "account" | "neodb" | "ai" | "appearance" | "data" | "about";

const SECTIONS: { key: SectionKey; label: string; icon: string }[] = [
  { key: "appearance", label: "外观", icon: "ti-palette" },
  { key: "ai", label: "AI", icon: "ti-sparkles" },
  { key: "neodb", label: "NeoDB", icon: "ti-database" },
  { key: "data", label: "数据", icon: "ti-package" },
  { key: "account", label: "账号", icon: "ti-user" },
  { key: "about", label: "关于", icon: "ti-info-circle" },
];

interface Props {
  instance: string;
  handle: string;
  acct: string;
  display: string;
  version: string;
  buildDate: string;
  sessionIat: number | null;
  sessionExp: number | null;
  userAgent: string;
}

export function SettingsContent({
  instance, handle, acct, display, version, buildDate,
  sessionIat, sessionExp, userAgent,
}: Props) {
  const [section, setSection] = useState<SectionKey | null>("appearance");

  // 移动端进设置默认看到 section 列表，不直接进 appearance。
  // SSR/CSR 初始统一是 "appearance"（避免 hydration mismatch），mount 后再切。
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(max-width: 767px)").matches) {
      setSection(null);
    }
  }, []);

  const activeLabel = SECTIONS.find((s) => s.key === section)?.label ?? "";

  return (
    <div className="settings-shell" style={{ display: "grid", gridTemplateColumns: "180px 1fr", minHeight: "calc(100vh - 54px)" }}>
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
        {/* 移动端：section === null 时显示 list，桌面端永远不进这个分支 */}
        {section === null && (
          <div className="settings-mobile-list">
            {SECTIONS.map((s) => (
              <button
                key={s.key}
                type="button"
                className="settings-mobile-row"
                onClick={() => setSection(s.key)}
              >
                <i className={`ti ${s.icon}`} aria-hidden />
                <span>{s.label}</span>
                <i className="ti ti-chevron-right" aria-hidden />
              </button>
            ))}
          </div>
        )}
        {/* 移动端：选中 section 后顶部加返回按钮；桌面端 .settings-mobile-back 永远 display:none */}
        {section !== null && (
          <div className="settings-mobile-back">
            <button
              type="button"
              onClick={() => setSection(null)}
              aria-label="返回设置列表"
            >
              <i className="ti ti-chevron-left" aria-hidden />
              <span>设置</span>
            </button>
            <span className="settings-mobile-title">{activeLabel}</span>
          </div>
        )}
        {section === "account" && (
          <AccountPanel
            display={display}
            handle={handle}
            acct={acct}
            instance={instance}
            sessionIat={sessionIat}
            sessionExp={sessionExp}
            userAgent={userAgent}
          />
        )}
        {section === "neodb" && <NeoDBPanel instance={instance} />}
        {section === "ai" && <AIConfigForm />}
        {section === "appearance" && <AppearancePanel />}
        {section === "data" && <DataPanel />}
        {section === "about" && <AboutPanel version={version} buildDate={buildDate} />}
      </main>
    </div>
  );
}

function PanelHeader({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="settings-panel-header">
      <p style={{ fontFamily: "var(--serif)", fontSize: 22, fontWeight: 500, letterSpacing: "-0.01em" }}>{title}</p>
      {hint && <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", marginTop: 4 }}>{hint}</p>}
    </div>
  );
}

function AccountPanel({
  display, handle, acct, instance,
  sessionIat, sessionExp, userAgent,
}: {
  display: string;
  handle: string;
  acct: string;
  instance: string;
  sessionIat: number | null;
  sessionExp: number | null;
  userAgent: string;
}) {
  const { visibility, set: setVisibility } = useDefaultVisibility();
  const device = parseUA(userAgent);

  return (
    <>
      <PanelHeader title="账户" hint="身份验证与默认隐私设置。" />
      <div className="settings-panel">

      {/* 身份编辑跳转提示 */}
      <div
        style={{
          background: "var(--bg2)",
          border: "0.5px solid var(--border)",
          borderRadius: "var(--r)",
          padding: "12px 16px",
          display: "flex", alignItems: "flex-start", gap: 10,
        }}
      >
        <i className="ti ti-info-circle" style={{ fontSize: 14, color: "var(--text2)", marginTop: 2, flexShrink: 0 }} />
        <p style={{ fontFamily: "var(--serif)", fontSize: 12, color: "var(--text2)", lineHeight: 1.7 }}>
          显示名、简介、头像在{" "}
          <a
            href="/profile/me"
            style={{
              color: "var(--text)", textDecoration: "underline",
              textDecorationColor: "var(--border2)", textUnderlineOffset: 3, fontWeight: 500,
            }}
          >
            个人主页
          </a>{" "}
          编辑。此处仅管理账户与隐私。
        </p>
      </div>

      {/* 登录身份卡 */}
      <div className="setting-card" style={{ border: "0.5px solid var(--border)", borderRadius: "var(--r)", overflow: "hidden" }}>
        <SettingRow
          k="登录身份"
          sub={`@${acct} · 由 ${instance} 提供`}
        />
        <SettingRow
          k="授权方式"
          sub="OAuth 2.0 · token 仅在服务端使用，不进入浏览器"
        />
        {sessionIat != null && (
          <SettingRow
            k="本机会话签发"
            sub={`${fmtDateTime(sessionIat * 1000)} · ${relTime(sessionIat * 1000)}`}
          />
        )}
        {sessionExp != null && (
          <SettingRow
            k="会话过期"
            sub={`${fmtDateTime(sessionExp * 1000)} · ${daysUntil(sessionExp * 1000)} 天后`}
          />
        )}
      </div>

      {/* 安全分块 */}
      <div className="settings-subsection">
        <SubLabel>安全</SubLabel>

        {/* 默认可见性 */}
        <div className="settings-group">
          <p style={{ fontSize: 12, color: "var(--text2)" }}>
            新建标记的默认可见性
          </p>
          <Segmented<DefaultVisibility>
            value={visibility}
            onChange={setVisibility}
            options={[
              { value: 0, label: "公开", hint: "任何人可见" },
              { value: 1, label: "仅关注者", hint: "限你的 follower" },
              { value: 2, label: "仅提及", hint: "仅 @ 到的人" },
            ]}
          />
          <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)" }}>
            创建标记时仍可临时改写。NeoDB 上已有的标记不受影响。
          </p>
        </div>

        {/* 当前会话 */}
        <div
          style={{
            border: "0.5px solid var(--border)",
            borderRadius: "var(--r)",
            padding: "14px 18px",
            display: "flex", alignItems: "center", gap: 14,
          }}
        >
          <i className={`ti ${device.icon}`} style={{ fontSize: 18, color: "var(--text2)" }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 500 }}>
              当前设备 <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", marginLeft: 6, fontWeight: 400 }}>当前会话</span>
            </p>
            <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", marginTop: 3 }}>
              {device.label}
              {sessionIat != null && ` · 自 ${fmtDate(sessionIat * 1000)} 起活跃`}
            </p>
          </div>
          <span
            aria-hidden
            style={{
              width: 6, height: 6, borderRadius: 999, background: "#0F6E56", flexShrink: 0,
            }}
          />
        </div>
        <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", lineHeight: 1.65 }}>
          Folio 使用无状态 JWT，目前不维护服务端 session 列表，无法显示其它设备。要让所有设备失效，请到 NeoDB 撤销 OAuth 授权。
        </p>
      </div>

      {/* 危险登出 */}
      <div className="settings-subsection">
        <SubLabel style={{ color: "#A03B3B" }}>⚠ 登出</SubLabel>
        <div
          style={{
            border: "0.5px solid #E5C2BD",
            borderRadius: "var(--r)",
            padding: "14px 18px",
            display: "flex", alignItems: "center", gap: 14,
            background: "var(--bg)",
          }}
        >
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: "#A03B3B" }}>登出当前设备</p>
            <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", marginTop: 3 }}>
              仅清除本机 cookie · NeoDB 数据保留 · 可重新登录
            </p>
          </div>
          {/* P1-8：注销走 POST form，防止 <img src> 跨站触发 GET 注销。 */}
          <form action="/api/auth/logout" method="POST" style={{ margin: 0 }}>
            <button
              type="submit"
              className="btn"
              style={{ fontSize: 12, color: "#A03B3B", borderColor: "#E5C2BD" }}
            >
              <i className="ti ti-logout" style={{ fontSize: 11 }} /> 登出
            </button>
          </form>
        </div>
      </div>

      <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", lineHeight: 1.65, paddingLeft: 2 }}>
        显示名：{display} · 用户名：{handle}
      </p>
      </div>
    </>
  );
}

function SettingRow({ k, sub }: { k: string; sub: string }) {
  return (
    <div
      style={{
        padding: "12px 18px",
        borderBottom: "0.5px solid var(--border)",
        background: "var(--bg)",
      }}
    >
      <p style={{ fontSize: 13, fontWeight: 500 }}>{k}</p>
      <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", marginTop: 3 }}>
        {sub}
      </p>
    </div>
  );
}

function parseUA(ua: string): { icon: string; label: string } {
  const isMobile = /Mobi|Android|iPhone|iPad/i.test(ua);
  let browser = "未知浏览器";
  if (/Edg\//.test(ua)) browser = "Edge";
  else if (/Chrome\//.test(ua)) browser = "Chrome";
  else if (/Firefox\//.test(ua)) browser = "Firefox";
  else if (/Safari\//.test(ua)) browser = "Safari";

  let os = "未知系统";
  if (/Windows/i.test(ua)) os = "Windows";
  else if (/Mac OS X/i.test(ua)) os = "macOS";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/iPhone|iPad|iOS/i.test(ua)) os = "iOS";
  else if (/Linux/i.test(ua)) os = "Linux";

  return {
    icon: isMobile ? "ti-device-mobile" : "ti-device-desktop",
    label: `${browser} · ${os}`,
  };
}

function fmtDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fmtDateTime(ts: number): string {
  const d = new Date(ts);
  return `${fmtDate(ts)} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function daysUntil(ts: number): number {
  return Math.max(0, Math.ceil((ts - Date.now()) / 86400_000));
}

function NeoDBPanel({ instance }: { instance: string }) {
  const { prefs, patch, clearLogs } = useSyncPrefs();
  const triggerSync = useTriggerSync();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  async function onSyncNow() {
    setBusy(true);
    try {
      const r = await triggerSync("manual");
      if (r.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PanelHeader title="NeoDB 连接" hint="所有读写经由这个实例。Token 仅在服务端使用。" />
      <div className="settings-panel">

      {/* 连接卡 */}
      <div
        style={{
          background: "linear-gradient(135deg,#F5EFDD 0%,#EFE8D1 100%)",
          border: "0.5px solid #E5DCC2",
          borderRadius: "var(--r)",
          padding: "16px 18px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div>
            <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "#854F0B", letterSpacing: ".06em" }}>已连接到</p>
            <p style={{ fontFamily: "var(--serif)", fontSize: 20, fontWeight: 500, color: "#412402", marginTop: 4 }}>{instance}</p>
          </div>
          <span
            style={{
              fontFamily: "var(--mono)", fontSize: 11, padding: "3px 9px",
              borderRadius: 999, background: "#EEF6E8", color: "#0F6E56",
              letterSpacing: ".04em", whiteSpace: "nowrap",
            }}
          >
            ● 已连接
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={onSyncNow} disabled={busy} className="btn primary" style={{ fontSize: 12 }}>
            <i className="ti ti-refresh" style={{ fontSize: 12 }} /> {busy ? "同步中…" : "立即同步"}
          </button>
          {/* P1-8：注销走 POST，避免被跨站构造的 GET 触发。 */}
          <form action="/api/auth/logout" method="POST" style={{ margin: 0 }}>
            <button type="submit" className="btn" style={{ fontSize: 12 }}>
              <i className="ti ti-plug-off" style={{ fontSize: 11 }} /> 断开连接
            </button>
          </form>
        </div>
      </div>

      {/* 同步频率 */}
      <div className="settings-group">
        <SubLabel>同步频率</SubLabel>
        <Segmented<SyncFrequency>
          value={prefs.frequency}
          onChange={(v) => patch("frequency", v)}
          options={[
            { value: "manual", label: "手动", hint: "仅在点击时同步" },
            { value: "5m", label: "每 5 分钟", hint: "在线时自动" },
            { value: "1h", label: "每小时", hint: "节能模式" },
          ]}
        />
      </div>

      {/* 广播 toggle */}
      <div
        style={{
          border: "0.5px solid var(--border)",
          borderRadius: "var(--r)",
          padding: "14px 18px",
          display: "flex", alignItems: "center", gap: 14,
        }}
      >
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 500 }}>联邦广播</p>
          <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", marginTop: 3 }}>
            新标记自动推送到 NeoDB / Mastodon 时间线
          </p>
        </div>
        <Toggle checked={prefs.broadcast} onChange={(v) => patch("broadcast", v)} />
      </div>

      {/* 同步状态行 + 日志为一组（紧密关系） */}
      <div className="settings-group">
        <div
          style={{
            padding: "10px 14px",
            background: "var(--bg2)",
            borderRadius: "var(--r2)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)",
          }}
        >
          <span>
            {prefs.lastSyncTs
              ? `最近同步 ${relTime(prefs.lastSyncTs)} · ${prefs.lastSyncOk ? "成功" : "失败"}${
                  prefs.lastSyncOk && prefs.lastSyncItems != null ? ` · ${prefs.lastSyncItems} 条` : ""
                }`
              : "尚未同步"}
          </span>
          <button
            onClick={() => setShowLogs((v) => !v)}
            className="btn"
            style={{ fontSize: 11, padding: "3px 9px" }}
          >
            {showLogs ? "收起日志" : `查看日志（${prefs.logs.length}）`}
          </button>
        </div>

        {/* 日志列表 */}
        {showLogs && (
          <div
            style={{
              border: "0.5px solid var(--border)",
              borderRadius: "var(--r2)",
              overflow: "hidden",
              maxHeight: 240,
              overflowY: "auto",
            }}
          >
            {prefs.logs.length === 0 ? (
              <p style={{ padding: "14px 16px", fontSize: 11, color: "var(--text3)" }}>
                暂无日志
              </p>
            ) : (
              prefs.logs.map((l) => (
                <div
                  key={l.ts}
                  style={{
                    padding: "8px 14px",
                    borderBottom: "0.5px solid var(--border)",
                    display: "flex", alignItems: "center", gap: 10,
                    fontFamily: "var(--mono)", fontSize: 11,
                  }}
                >
                  <span
                    aria-hidden
                    style={{
                      width: 6, height: 6, borderRadius: 999, flexShrink: 0,
                      background: l.ok ? "#0F6E56" : "#A03B3B",
                    }}
                  />
                  <span style={{ color: "var(--text3)", width: 90, flexShrink: 0 }}>
                    {fmtTime(l.ts)}
                  </span>
                  <span style={{ color: "var(--text3)", width: 44, flexShrink: 0 }}>
                    {l.trigger}
                  </span>
                  <span style={{ flex: 1, color: "var(--text2)" }}>
                    {l.ok
                      ? `${l.totalItems ?? "?"} 条 · ${l.durationMs}ms`
                      : l.err ?? "失败"}
                  </span>
                </div>
              ))
            )}
            {prefs.logs.length > 0 && (
              <div style={{ padding: "8px 14px", textAlign: "right", background: "var(--bg2)" }}>
                <button
                  onClick={clearLogs}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)",
                  }}
                >
                  清空日志
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      </div>
    </>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label
      style={{
        position: "relative", width: 36, height: 20,
        display: "inline-block", cursor: "pointer", flexShrink: 0,
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ opacity: 0, width: 0, height: 0 }}
      />
      <span
        style={{
          position: "absolute", inset: 0,
          background: checked ? "linear-gradient(135deg, #E0B270 0%, #D38A30 50%, #A86515 100%)" : "var(--border2)",
          borderRadius: 999, transition: "background 0.18s",
        }}
      />
      <span
        style={{
          position: "absolute", width: 14, height: 14,
          left: checked ? 19 : 3, top: 3,
          background: "white", borderRadius: "50%",
          transition: "left 0.18s",
        }}
      />
    </label>
  );
}

function fmtTime(ts: number): string {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

function relTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "刚刚";
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)} 小时前`;
  return `${Math.floor(diff / 86400_000)} 天前`;
}

function AppearancePanel() {
  const { appearance, set, reset } = useAppearance();

  return (
    <>
      <PanelHeader title="外观" hint="即时生效，写入本机 localStorage。" />
      <div className="settings-panel">

      {/* 主题 */}
      <div className="settings-group">
        <SubLabel>主题</SubLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
          <ThemeCard
            on={appearance.theme === "light"}
            label="米白"
            sub="默认 · 适合白天"
            previewBg="#F5F2EA"
            barColor="#1C1C1A"
            onClick={() => set("theme", "light")}
          />
          <ThemeCard
            on={appearance.theme === "dark"}
            label="纸墨"
            sub="夜晚 · 暖墨深色"
            previewBg="#1A1816"
            barColor="#E8E4DA"
            onClick={() => set("theme", "dark")}
          />
          <ThemeCard
            on={appearance.theme === "auto"}
            label="跟随系统"
            sub="自动切换"
            previewBg="linear-gradient(90deg,#F5F2EA 50%,#1A1816 50%)"
            barColor="transparent"
            onClick={() => set("theme", "auto")}
            split
          />
        </div>
      </div>

      {/* 字号 */}
      <div className="settings-group">
        <SubLabel>字号</SubLabel>
        <Segmented<FontScale>
          value={appearance.fontScale}
          onChange={(v) => set("fontScale", v)}
          options={[
            { value: "compact", label: "紧凑", hint: "13 px" },
            { value: "normal", label: "标准", hint: "14 px" },
            { value: "relaxed", label: "宽松", hint: "15 px" },
          ]}
        />
      </div>

      {/* 信息密度 */}
      <div className="settings-group">
        <SubLabel>信息密度</SubLabel>
        <Segmented<Density>
          value={appearance.density}
          onChange={(v) => set("density", v)}
          options={[
            { value: "cozy", label: "舒适", hint: "适合长时间阅读" },
            { value: "compact", label: "紧凑", hint: "一屏更多内容" },
          ]}
        />
      </div>

      {/* 动效 */}
      <div className="settings-group">
        <SubLabel>动效</SubLabel>
        <Segmented<MotionPref>
          value={appearance.motion}
          onChange={(v) => set("motion", v)}
          options={[
            { value: "auto", label: "自动", hint: "尊重系统无障碍偏好" },
            { value: "on", label: "开启", hint: "0.18s 渐入" },
            { value: "off", label: "关闭", hint: "无过渡动画" },
          ]}
        />
      </div>

      {/* 纸纹 */}
      <div className="settings-group">
        <SubLabel>纸纹</SubLabel>
        <Segmented<Grain>
          value={appearance.grain}
          onChange={(v) => set("grain", v)}
          options={[
            { value: "off", label: "关闭", hint: "纯色背景" },
            { value: "on", label: "开启", hint: "极轻噪点 · 模拟纸感" },
          ]}
        />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={reset}
          className="btn"
          style={{ fontSize: 11 }}
          type="button"
        >
          恢复默认
        </button>
        <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)" }}>
          仅本机 · 不会同步到 NeoDB
        </span>
      </div>
      </div>
    </>
  );
}

function SubLabel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <p
      className="section-label"
      style={{ textTransform: "uppercase", margin: 0, ...style }}
    >
      {children}
    </p>
  );
}

function ThemeCard({
  on, label, sub, previewBg, barColor, onClick, split,
}: {
  on: boolean;
  label: string;
  sub: string;
  previewBg: string;
  barColor: string;
  onClick: () => void;
  split?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: on ? "1.5px solid var(--gold)" : "0.5px solid var(--border)",
        padding: on ? 11 : 12,
        borderRadius: "var(--r)",
        background: "var(--bg)",
        cursor: "pointer",
        fontFamily: "inherit",
        textAlign: "left",
        transition: "border-color 0.12s",
        boxShadow: on ? "0 0 0 3px rgba(239, 159, 39, 0.12)" : "none",
      }}
    >
      <div
        style={{
          width: "100%",
          height: 54,
          borderRadius: 4,
          border: "0.5px solid var(--border)",
          background: previewBg,
          display: "flex",
          alignItems: "flex-end",
          padding: 6,
          gap: 4,
        }}
      >
        {split ? (
          <>
            <div style={{ width: "30%", height: 4, background: "#1C1C1A", borderRadius: 2 }} />
            <div style={{ flex: 1 }} />
            <div style={{ width: "30%", height: 4, background: "#E8E4DA", borderRadius: 2 }} />
          </>
        ) : (
          <>
            <div style={{ width: "60%", height: 4, background: barColor, borderRadius: 2 }} />
            <div style={{ flex: 1 }} />
            <div style={{ width: 6, height: 6, background: "var(--gold)", borderRadius: "50%" }} />
          </>
        )}
      </div>
      <p style={{ fontFamily: "var(--serif)", fontSize: 13, fontWeight: 500, marginTop: 8, color: "var(--text)" }}>
        {label}
      </p>
      <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", marginTop: 1 }}>
        {sub}
      </p>
    </button>
  );
}

function Segmented<T extends string | number>({
  value, onChange, options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; hint: string }[];
}) {
  return (
    <div style={{ display: "flex", border: "0.5px solid var(--border)", borderRadius: "var(--r2)", overflow: "hidden" }}>
      {options.map((opt) => {
        const on = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            style={{
              flex: 1,
              padding: "10px 12px",
              background: on ? "linear-gradient(135deg, #E0B270 0%, #D38A30 50%, #A86515 100%)" : "var(--bg)",
              color: on ? "#FFF6E6" : "var(--text2)",
              border: "none",
              borderRight: "0.5px solid var(--border)",
              cursor: "pointer",
              fontFamily: "inherit",
              textAlign: "left",
              transition: "background 0.12s, color 0.12s",
            }}
          >
            <p style={{ fontSize: 13, fontWeight: on ? 500 : 400 }}>{opt.label}</p>
            <p
              style={{
                fontFamily: "var(--mono)",
                fontSize: 11,
                marginTop: 2,
                opacity: 0.75,
              }}
            >
              {opt.hint}
            </p>
          </button>
        );
      })}
    </div>
  );
}

function DataPanel() {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [inv, setInv] = useState<LocalCacheInventory | null>(null);
  const [includeLocal, setIncludeLocal] = useState(true);

  useEffect(() => {
    setInv(scanLocalCache());
  }, []);

  async function onExport() {
    setBusy(true);
    setErr(null);
    setStatus("正在从 NeoDB 拉取全部记录…");
    try {
      const res = await fetch("/api/data/export");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const archive = (await res.json()) as Record<string, unknown>;
      if (includeLocal) {
        const local = scanLocalCache();
        archive.local = {
          episodes: local.episodes,
          reading: local.reading,
          appearance: local.appearance,
        };
        const stats = archive.stats as Record<string, unknown> | undefined;
        if (stats) {
          stats.local = {
            episodes: Object.keys(local.episodes).length,
            reading: Object.keys(local.reading).length,
          };
        }
      }
      const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      downloadJson(`folio-archive-${ts}.json`, archive);
      setStatus("导出完成");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "export_failed");
      setStatus(null);
    } finally {
      setBusy(false);
    }
  }

  function onClearLocal() {
    if (!window.confirm("确定清空 Folio 本地缓存？\n这会删除集数 / 阅读进度 / 外观偏好 / AI 会话。\nNeoDB 上的记录不受影响。"))
      return;
    const n = clearFolioLocal();
    setInv(scanLocalCache());
    setStatus(`已清理 ${n} 个本地条目`);
    setErr(null);
  }

  const localCount =
    (inv ? Object.keys(inv.episodes).length + Object.keys(inv.reading).length : 0);

  return (
    <>
      <PanelHeader title="数据" hint="所有记录归你所有，可随时导出，永不锁仓。" />
      <div className="settings-panel">

      {/* 导出 + 状态行紧密一组 */}
      <div className="settings-group">
        <div style={{ border: "0.5px solid var(--border)", borderRadius: "var(--r)", overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, borderBottom: "0.5px solid var(--border)" }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 500 }}>导出全部记录</p>
              <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", marginTop: 3, lineHeight: 1.55 }}>
                JSON · Folio Archive v1 · 含书架 / 长评 / 合集 / 标签
              </p>
            </div>
            <button onClick={onExport} disabled={busy} className="btn primary" style={{ fontSize: 12 }}>
              <i className="ti ti-download" style={{ fontSize: 12 }} />
              {busy ? "导出中…" : "导出"}
            </button>
          </div>
          <label style={{
            padding: "12px 18px",
            display: "flex", alignItems: "center", gap: 10,
            fontSize: 12, color: "var(--text2)", cursor: "pointer",
          }}>
            <input
              type="checkbox"
              checked={includeLocal}
              onChange={(e) => setIncludeLocal(e.target.checked)}
              style={{ accentColor: "#D38A30" }}
            />
            一并打包本机数据（集数 {Object.keys(inv?.episodes ?? {}).length} · 阅读进度 {Object.keys(inv?.reading ?? {}).length} · 外观偏好）
          </label>
        </div>

        {/* 状态行 */}
        {(status || err) && (
          <div style={{ fontSize: 12, fontFamily: "var(--mono)" }}>
            {status && <span style={{ color: "#0F6E56" }}>{status}</span>}
            {err && <span style={{ color: "#A03B3B" }}>失败：{err}</span>}
          </div>
        )}
      </div>

      {/* 占位：豆瓣导入 / NeoDB 重建 */}
      <div className="setting-card" style={{ border: "0.5px solid var(--border)", borderRadius: "var(--r)", overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, borderBottom: "0.5px solid var(--border)" }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 500 }}>从豆瓣导入</p>
            <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", marginTop: 3 }}>
              支持 douban-takeout 导出包 · 自动匹配 NeoDB 条目
            </p>
          </div>
          <button className="btn" disabled style={{ fontSize: 12 }}>即将</button>
        </div>
        <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 500 }}>从 NeoDB 重建</p>
            <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", marginTop: 3 }}>
              从联邦账户完整重新拉取，覆盖本地档案
            </p>
          </div>
          <button className="btn" disabled style={{ fontSize: 12 }}>即将</button>
        </div>
      </div>

      {/* 本地缓存 */}
      <div style={{ border: "0.5px solid var(--border)", borderRadius: "var(--r)", overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 500 }}>本地缓存</p>
            <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", marginTop: 3 }}>
              {inv
                ? `${formatBytes(inv.totalBytes)} · ${localCount} 条进度 · ${inv.other.length} 个其它键`
                : "扫描中…"}
            </p>
          </div>
          <button onClick={onClearLocal} className="btn" style={{ fontSize: 12 }}>
            清理
          </button>
        </div>
      </div>

      {/* 危险区 */}
      <div className="settings-subsection">
        <SubLabel style={{ color: "#A03B3B" }}>⚠ 危险区</SubLabel>
        <div style={{ border: "0.5px solid #E5C2BD", borderRadius: "var(--r)", overflow: "hidden", background: "var(--bg)" }}>
          <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: "#A03B3B" }}>清空本地缓存与设置</p>
              <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", marginTop: 3 }}>
                NeoDB 上的记录不会被删除，可重新登录恢复
              </p>
            </div>
            <button
              onClick={onClearLocal}
              className="btn"
              style={{ fontSize: 12, color: "#A03B3B", borderColor: "#E5C2BD" }}
            >
              清空
            </button>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}

function AboutPanel({ version, buildDate }: { version: string; buildDate: string }) {
  const isAlpha = version.startsWith("0.");
  return (
    <>
      <PanelHeader title="Folio" hint="基于 NeoDB 联邦的个人文化档案。" />
      <div className="settings-panel">

      {/* 版本 + GitHub 双列 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div
          style={{
            border: "0.5px solid var(--border)",
            borderRadius: "var(--r)",
            padding: "16px 18px",
            background: "var(--bg)",
          }}
        >
          <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".06em" }}>
            版本
          </p>
          <p style={{ fontFamily: "var(--serif)", fontSize: 18, marginTop: 6, fontWeight: 500 }}>
            {version}
            {isAlpha && (
              <span
                style={{
                  fontFamily: "var(--mono)", fontSize: 11, marginLeft: 8,
                  padding: "1px 7px", borderRadius: 999,
                  background: "var(--bg2)", color: "var(--text3)",
                  letterSpacing: ".04em", verticalAlign: "middle",
                }}
              >
                alpha
              </span>
            )}
          </p>
          <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", marginTop: 4 }}>
            build {buildDate}
          </p>
        </div>
        <a
          href="https://github.com/"
          target="_blank"
          rel="noreferrer noopener"
          style={{
            border: "0.5px solid var(--border)",
            borderRadius: "var(--r)",
            padding: "16px 18px",
            background: "var(--bg)",
            textDecoration: "none",
            color: "inherit",
            transition: "background 0.12s",
            display: "block",
          }}
        >
          <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".06em" }}>
            开源
          </p>
          <p style={{ fontFamily: "var(--serif)", fontSize: 18, marginTop: 6, fontWeight: 500 }}>
            GitHub <span style={{ color: "var(--text3)" }}>→</span>
          </p>
          <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", marginTop: 4 }}>
            AGPL-3.0
          </p>
        </a>
      </div>

      {/* 简介 */}
      <div
        style={{
          border: "0.5px solid var(--border)",
          borderRadius: "var(--r)",
          padding: "14px 18px",
          background: "var(--bg2)",
        }}
      >
        <p style={{ fontFamily: "var(--serif)", fontSize: 13, color: "var(--text2)", lineHeight: 1.75 }}>
          Folio 是基于 NeoDB 联邦协议的个人媒体档案应用 · 数据归属于你 · 可随时导出 · 永不锁仓。
        </p>
      </div>

      {/* 技术信息行（替代原型里的「数据来源」） */}
      <div className="setting-card" style={{ border: "0.5px solid var(--border)", borderRadius: "var(--r)", overflow: "hidden" }}>
        <AboutRow k="数据来源" v="NeoDB 联邦 · OAuth 2.0" />
        <AboutRow k="许可证" v="AGPL-3.0" />
        <AboutRow k="渲染" v="Next.js 16 (App Router)" />
      </div>

      {/* 法务 / 反馈链接 */}
      <div
        style={{
          display: "flex", gap: 16, flexWrap: "wrap",
          fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)",
          paddingLeft: 2,
        }}
      >
        <AboutLink href="https://github.com/" label="问题反馈" />
        <AboutLink href="https://github.com/" label="更新日志" />
        <AboutLink href="https://neodb.social/help/api/" label="NeoDB API" />
        <span aria-hidden style={{ color: "var(--border2)" }}>·</span>
        <span style={{ color: "var(--text3)" }}>© {new Date().getFullYear()} Folio</span>
      </div>
      </div>
    </>
  );
}

function AboutRow({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "12px 18px", borderBottom: "0.5px solid var(--border)",
      }}
    >
      <span style={{ fontSize: 13, color: "var(--text2)" }}>{k}</span>
      <span style={{ fontSize: 12, color: "var(--text)", fontFamily: "var(--mono)" }}>{v}</span>
    </div>
  );
}

function AboutLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      style={{ color: "var(--text2)", textDecoration: "underline", textUnderlineOffset: 3 }}
    >
      {label}
    </a>
  );
}
