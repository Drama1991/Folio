"use client";

import { useEffect } from "react";
import { create } from "zustand";
import type { UiMedium } from "@/lib/format/verbs";

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
    medium: UiMedium;
    title: string;
    year?: string | number;
    creator?: string;
    brief?: string;
  };
}

interface ChatMsg {
  role: "ai" | "user";
  text: string;
}

interface AIPanelState {
  open: boolean;
  context: AIContextInfo;
  history: ChatMsg[];
  typing: boolean;
  setOpen: (open: boolean, ctx?: AIContextInfo | "home" | UiMedium) => void;
  send: (text: string) => Promise<void>;
  reset: () => void;
}

function defaultCtx(): AIContextInfo {
  return { key: "home", title: "今晚看什么？", subtitle: "上下文：你的档案 + 想看列表" };
}

export const useAIPanel = create<AIPanelState>((set, get) => ({
  open: false,
  context: defaultCtx(),
  history: [],
  typing: false,
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
    const welcome =
      nextCtx.key === "home"
        ? "嗨。根据你的记录和想看清单，我来帮你选今晚看什么。"
        : nextCtx.item
          ? `关于《${nextCtx.item.title}》，你想聊什么？`
          : "你想聊什么？";
    set({ open: true, context: nextCtx, history: [{ role: "ai", text: welcome }] });
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
        pushOrAppendAi(set, msg);
        set({ typing: false });
        return;
      }

      const decoder = new TextDecoder();
      const reader = res.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (chunk) pushOrAppendAi(set, chunk);
      }
    } catch (e) {
      pushOrAppendAi(set, `\n\n[网络错误] ${e instanceof Error ? e.message : ""}`);
    } finally {
      set({ typing: false });
    }
  },

  reset: () => set({ history: [], typing: false }),
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
  title: string,
  year?: string | number,
  creator?: string,
  brief?: string,
): AIContextInfo {
  return {
    key: medium,
    title: aiBtnLabel(medium),
    subtitle: `上下文：${title}${year ? ` (${year})` : ""}`,
    item: { medium, title, year, creator, brief },
  };
}

function aiBtnLabel(medium: UiMedium): string {
  if (medium === "book") return "AI 解读";
  return "AI 聊聊";
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
