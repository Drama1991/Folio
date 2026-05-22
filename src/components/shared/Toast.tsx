"use client";

import { create } from "zustand";
import { useEffect } from "react";

interface ToastState {
  message: string | null;
  show: (msg: string, ms?: number) => void;
}

export const useToast = create<ToastState>((set) => ({
  message: null,
  show: (msg, ms = 2400) => {
    set({ message: msg });
    setTimeout(() => set({ message: null }), ms);
  },
}));

export function ToastHost() {
  const msg = useToast((s) => s.message);
  useEffect(() => undefined, []); // mount marker

  if (!msg) return null;
  return (
    <div className="toast" role="status" aria-live="polite">
      {msg}
    </div>
  );
}
