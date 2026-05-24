"use client";

import { useAIPanel } from "@/lib/store/ai-panel";

export function AIFAB() {
  const openAI = useAIPanel((s) => s.setOpen);

  return (
    <button
      type="button"
      onClick={(e) => openAI(true, "home", { x: e.clientX, y: e.clientY })}
      aria-label="AI 助手"
      title="AI 助手"
      className="ai-fab"
    >
      <i className="ti ti-sparkles" aria-hidden />
    </button>
  );
}
