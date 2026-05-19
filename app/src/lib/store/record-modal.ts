"use client";

import { useEffect } from "react";
import { create } from "zustand";
import type { UiMedium } from "@/lib/format/verbs";

interface SelectedItem {
  uuid: string;
  medium: UiMedium;
  title: string;
  cover?: string;
  year?: number | string;
  creator?: string;
}

interface RecordModalState {
  open: boolean;
  step: "search" | "form";
  initial?: SelectedItem;
  prefill?: {
    status?: "wishlist" | "progress" | "complete" | "dropped";
    rating?: number;
    comment?: string;
    visibility?: 0 | 1 | 2;
  };
  show: (init?: { item?: SelectedItem; prefill?: RecordModalState["prefill"] }) => void;
  hide: () => void;
  setStep: (s: "search" | "form") => void;
  setItem: (it: SelectedItem) => void;
}

export const useRecordModal = create<RecordModalState>((set) => ({
  open: false,
  step: "search",
  show: (init) =>
    set({
      open: true,
      step: init?.item ? "form" : "search",
      initial: init?.item,
      prefill: init?.prefill,
    }),
  hide: () => set({ open: false, initial: undefined, prefill: undefined, step: "search" }),
  setStep: (s) => set({ step: s }),
  setItem: (it) => set({ initial: it, step: "form" }),
}));

// 全局快捷键："记录新内容"按钮等可直接调
if (typeof window !== "undefined") {
  (window as unknown as { __folioOpenRecord?: typeof useRecordModal }).__folioOpenRecord = useRecordModal;
}

export function useEscapeToClose() {
  const hide = useRecordModal((s) => s.hide);
  const open = useRecordModal((s) => s.open);
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") hide();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, hide]);
}
