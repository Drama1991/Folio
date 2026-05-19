"use client";

import { create } from "zustand";
import { pickReply } from "@/lib/ai/replies";
import type { UiMedium } from "@/lib/format/verbs";

export type AIContextKey = "home" | UiMedium;

export interface AIContextInfo {
  key: AIContextKey;
  title: string;
  subtitle: string;
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
        : "你想聊什么？";
    set({ open: true, context: nextCtx, history: [{ role: "ai", text: welcome }] });
  },
  send: async (text) => {
    if (!text.trim()) return;
    set((s) => ({ history: [...s.history, { role: "user", text }], typing: true }));
    await new Promise((r) => setTimeout(r, 1100));
    const ctx = get().context;
    const reply = pickReply(ctx.key, text);
    set((s) => ({ history: [...s.history, { role: "ai", text: reply }], typing: false }));
  },
  reset: () => set({ history: [], typing: false }),
}));

// 对外暴露 medium → context 辅助
export function detailContext(medium: UiMedium, title: string, year?: string | number): AIContextInfo {
  return {
    key: medium,
    title: aiBtnLabel(medium),
    subtitle: `上下文：${title}${year ? ` (${year})` : ""}`,
  };
}

function aiBtnLabel(medium: UiMedium): string {
  if (medium === "book") return "AI 解读";
  return "AI 聊聊";
}
