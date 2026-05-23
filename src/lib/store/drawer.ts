"use client";

import { create } from "zustand";

interface DrawerState {
  open: boolean;
  show: () => void;
  hide: () => void;
  toggle: () => void;
}

// 移动端左侧导航抽屉。桌面端永不开（CSS 控制 .drawer-toggle 显隐）。
export const useDrawer = create<DrawerState>((set) => ({
  open: false,
  show: () => set({ open: true }),
  hide: () => set({ open: false }),
  toggle: () => set((s) => ({ open: !s.open })),
}));
