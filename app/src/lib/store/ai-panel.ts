"use client";

import { useEffect } from "react";
import { create } from "zustand";
import type { UiMedium } from "@/lib/format/verbs";
import {
  loadSessions,
  upsertSession,
  type AISession,
  buildItemKey,
} from "./ai-sessions";

export type AIContextKey = "home" | UiMedium;

/**
 * 当 key === UiMedium 时（即从条目详情进入），应附带 item 元信息——
 * 服务端的 system prompt 直接消费它，不再二次 fetch。
 */
export interface AIContextInfo {
  key: AIContextKey;
  title: string;
  subtitle: string;
  item?: {
    uuid: string;
    medium: UiMedium;
    title: string;
    year?: string | number;
    creator?: string;
    brief?: string;
  };
}

export interface ChatMsg {
  role: "ai" | "user";
  text: string;
}

interface AIPanelState {
  open: boolean;
  context: AIContextInfo;
  history: ChatMsg[];
  typing: boolean;
  sessionId: string | null;
  setOpen: (open: boolean, ctx?: AIContextInfo | "home" | UiMedium) => void;
  send: (text: string) => Promise<void>;
  newChat: () => void;
  loadSession: (s: AISession) => void;
  reset: () => void;
}

function defaultCtx(): AIContextInfo {
  return { key: "home", title: "今晚看什么？", subtitle: "上下文：你的档案 + 想看列表" };
}

function welcomeFor(ctx: AIContextInfo): string {
  if (ctx.key === "home") return "嗨。根据你的记录和想看清单，我来帮你选今晚看什么。";
  if (ctx.item) return `关于《${ctx.item.title}》，你想聊什么？`;
  return "你想聊什么？";
}

function snapshotSession(
  id: string,
  ctx: AIContextInfo,
  history: ChatMsg[],
  createdAt: number,
): AISession {
  return {
    id,
    contextKey: ctx.key,
    contextItemKey: buildItemKey(ctx),
    contextTitle: ctx.title,
    contextSubtitle: ctx.subtitle,
    item: ctx.item,
    messages: history,
    createdAt,
    updatedAt: Date.now(),
  };
}

/** 第一条 user 消息后才有意义；只有欢迎语的空对话不写入历史。 */
function hasUserMessage(history: ChatMsg[]): boolean {
  return history.some((m) => m.role === "user");
}

// 用于 send() 跨 await 后判断 sessionId 是否被 newChat 抢占
const sessionMeta = new Map<string, number>(); // id -> createdAt

export const useAIPanel = create<AIPanelState>((set, get) => ({
  open: false,
  context: defaultCtx(),
  history: [],
  typing: false,
  sessionId: null,

  setOpen: (open, ctx) => {
    if (!open) {
      set({ open: false });
      return;
    }
    let nextCtx: AIContextInfo;
    if (!ctx) {
      nextCtx = defaultCtx();
    } else if (typeof ctx === "string") {
      if (ctx === "home") nextCtx = defaultCtx();
      else nextCtx = { key: ctx, title: "AI 聊聊", subtitle: `上下文：${ctx}` };
    } else {
      nextCtx = ctx;
    }
    set({
      open: true,
      context: nextCtx,
      history: [{ role: "ai", text: welcomeFor(nextCtx) }],
      sessionId: null,
      typing: false,
    });
  },

  send: async (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const ctx = get().context;

    // 先把用户消息塞进 history，typing=true 让面板出现"打字中"三点动画。
    // 不预插空 AI 槽位——首个 chunk 到达时再创建 AI 消息，避免出现空气泡。
    set((s) => ({
      history: [...s.history, { role: "user", text: trimmed }],
      typing: true,
    }));

    // 确保有 sessionId 并立即写一次（避免发完就关导致用户消息丢失）
    let sid = get().sessionId;
    let createdAt: number;
    if (!sid) {
      sid = (typeof crypto !== "undefined" && "randomUUID" in crypto)
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      createdAt = Date.now();
      sessionMeta.set(sid, createdAt);
      set({ sessionId: sid });
    } else {
      createdAt = sessionMeta.get(sid) ?? Date.now();
    }
    upsertSession(snapshotSession(sid, ctx, get().history, createdAt));
    const capturedSid = sid;

    const historyForRequest = get()
      .history.slice(0, -1) // 去掉刚才追加的 user
      .filter((m) => m.text.length > 0);

    const body =
      ctx.key === "home"
        ? { history: historyForRequest, user: trimmed, context: { kind: "home" as const } }
        : ctx.item
          ? {
              history: historyForRequest,
              user: trimmed,
              context: { kind: "item" as const, item: ctx.item },
            }
          : { history: historyForRequest, user: trimmed, context: { kind: "home" as const } };

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => null);
        const msg =
          j?.error === "not_configured"
            ? "尚未配置 AI。去 设置 → AI 填一份 API key 再来。"
            : `请求失败：${j?.error ?? `HTTP ${res.status}`}`;
        if (get().sessionId === capturedSid) {
          pushOrAppendAi(set, msg);
          set({ typing: false });
        }
        return;
      }

      const decoder = new TextDecoder();
      const reader = res.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (get().sessionId !== capturedSid) {
          // 用户已经点了「新建对话」或加载了别的 session，丢弃剩余流
          await reader.cancel().catch(() => undefined);
          break;
        }
        const chunk = decoder.decode(value, { stream: true });
        if (chunk) pushOrAppendAi(set, chunk);
      }
    } catch (e) {
      if (get().sessionId === capturedSid) {
        pushOrAppendAi(set, `\n\n[网络错误] ${e instanceof Error ? e.message : ""}`);
      }
    } finally {
      // 持久化最终结果——若 sessionId 已被 newChat/loadSession 抢占则跳过
      if (get().sessionId === capturedSid) {
        set({ typing: false });
        upsertSession(snapshotSession(capturedSid, get().context, get().history, createdAt));
      }
    }
  },

  newChat: () => {
    // 当前对话若有用户消息则归档（snapshot 已经在 send() 时持续写入，这里再补一次终态）
    const { sessionId, context, history } = get();
    if (sessionId && hasUserMessage(history)) {
      const createdAt = sessionMeta.get(sessionId) ?? Date.now();
      upsertSession(snapshotSession(sessionId, context, history, createdAt));
    }
    set({
      history: [{ role: "ai", text: welcomeFor(context) }],
      sessionId: null,
      typing: false,
    });
  },

  loadSession: (s) => {
    // 先把当前对话归档（如果有内容）
    const cur = get();
    if (cur.sessionId && hasUserMessage(cur.history)) {
      const createdAt = sessionMeta.get(cur.sessionId) ?? Date.now();
      upsertSession(snapshotSession(cur.sessionId, cur.context, cur.history, createdAt));
    }
    sessionMeta.set(s.id, s.createdAt);
    set({
      context: {
        key: s.contextKey,
        title: s.contextTitle,
        subtitle: s.contextSubtitle,
        item: s.item,
      },
      history: s.messages,
      sessionId: s.id,
      typing: false,
    });
  },

  reset: () => set({ history: [], typing: false, sessionId: null }),
}));

/** 末尾若已是 AI 消息则追加；否则新插一条。供流式累加和单条错误提示共用。 */
function pushOrAppendAi(
  set: (partial: Partial<AIPanelState> | ((s: AIPanelState) => Partial<AIPanelState>)) => void,
  text: string,
) {
  set((s) => {
    const last = s.history[s.history.length - 1];
    if (last && last.role === "ai") {
      return { history: [...s.history.slice(0, -1), { role: "ai" as const, text: last.text + text }] };
    }
    return { history: [...s.history, { role: "ai" as const, text }] };
  });
}

/** detail 页用：从 UiItem 构造一个带 item 元信息的上下文。 */
export function detailContext(
  medium: UiMedium,
  uuid: string,
  title: string,
  year?: string | number,
  creator?: string,
  brief?: string,
): AIContextInfo {
  return {
    key: medium,
    title: aiBtnLabel(medium),
    subtitle: `上下文：${title}${year ? ` (${year})` : ""}`,
    item: { uuid, medium, title, year, creator, brief },
  };
}

function aiBtnLabel(medium: UiMedium): string {
  if (medium === "book") return "AI 解读";
  return "AI 聊聊";
}

/** 当前上下文下已存的对话（供 AIHistoryDrawer 读取）。 */
export function listSessionsForCurrentContext(ctx: AIContextInfo): AISession[] {
  const all = loadSessions();
  if (ctx.key === "home") {
    return all.filter((s) => s.contextKey === "home");
  }
  const itemKey = buildItemKey(ctx);
  if (itemKey) {
    return all.filter((s) => s.contextItemKey === itemKey);
  }
  return all.filter((s) => s.contextKey === ctx.key && !s.contextItemKey);
}

export function useEscapeToCloseAIPanel() {
  const setOpen = useAIPanel((s) => s.setOpen);
  const open = useAIPanel((s) => s.open);
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, setOpen]);
}
