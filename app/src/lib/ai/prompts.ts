import "server-only";
import { listShelf } from "@/lib/neodb/client";
import { markToTimelineEntry } from "@/lib/neodb/mappers";
import type { ChatMessage } from "./types";
import type { UiMedium } from "@/lib/format/verbs";

const FOLIO_INTRO = `你是 Folio 的 AI 助手。Folio 是一个基于 NeoDB 的个人影音书游记录工具。用户通过你聊正在看 / 想看 / 看过的内容，或就某一部具体作品和你深聊。
回复风格：克制、像朋友，不啰嗦、不堆砌套话；遇到不知道的事就说不知道；中文回复。`;

/** 首页"今晚看什么"上下文：抓 shelf 计数 + 在看/想看的标题片段。 */
export async function buildHomeSystemPrompt(): Promise<string> {
  const [progressShelf, wishlistShelf, completeShelf, droppedShelf] = await Promise.all([
    listShelf({ type: "progress", page: 1 }).catch(() => ({ data: [], count: 0 })),
    listShelf({ type: "wishlist", page: 1 }).catch(() => ({ data: [], count: 0 })),
    listShelf({ type: "complete", page: 1 }).catch(() => ({ data: [], count: 0 })),
    listShelf({ type: "dropped", page: 1 }).catch(() => ({ data: [], count: 0 })),
  ]);

  const counts = {
    progress: progressShelf.count ?? progressShelf.data.length,
    wishlist: wishlistShelf.count ?? wishlistShelf.data.length,
    complete: completeShelf.count ?? completeShelf.data.length,
    dropped: droppedShelf.count ?? droppedShelf.data.length,
  };

  const progressTitles = progressShelf.data.slice(0, 20).map(markToTimelineEntry).map(briefLine);
  const wishlistTitles = wishlistShelf.data.slice(0, 10).map(markToTimelineEntry).map(briefLine);

  const lines: string[] = [FOLIO_INTRO, ""];
  lines.push("# 用户当前的档案概况");
  lines.push(`累计已看 ${counts.complete} · 在看 ${counts.progress} · 想看 ${counts.wishlist} · 弃 ${counts.dropped}`);
  if (progressTitles.length > 0) {
    lines.push("");
    lines.push("## 当前在看");
    lines.push(progressTitles.map((t) => `- ${t}`).join("\n"));
  }
  if (wishlistTitles.length > 0) {
    lines.push("");
    lines.push("## 想看（前 10 条）");
    lines.push(wishlistTitles.map((t) => `- ${t}`).join("\n"));
  }
  lines.push("");
  lines.push("用户接下来很可能问「今晚看什么」「我应该接着看哪部」之类的问题。结合上面这些回答，必要时让用户做选择（不要一次推 10 部）。");
  return lines.join("\n");
}

function briefLine(e: { medium: UiMedium; title: string; year?: string | number; creator?: string }): string {
  const meta = [e.year, e.creator].filter(Boolean).join(" · ");
  return meta ? `${e.title} (${meta}) [${e.medium}]` : `${e.title} [${e.medium}]`;
}

/** 条目详情页"聊聊这个"上下文：只元信息，不带 mark / 不带社区评论。 */
export function buildItemSystemPrompt(item: {
  medium: UiMedium;
  title: string;
  year?: string | number;
  creator?: string;
  brief?: string;
}): string {
  const lines: string[] = [FOLIO_INTRO, ""];
  lines.push("# 当前讨论的条目");
  lines.push(`- 类型：${item.medium}`);
  lines.push(`- 标题：${item.title}`);
  if (item.year) lines.push(`- 年份：${item.year}`);
  if (item.creator) lines.push(`- 作者 / 创作者：${item.creator}`);
  if (item.brief && item.brief.trim()) {
    lines.push("");
    lines.push("## 简介");
    lines.push(item.brief.trim());
  }
  lines.push("");
  lines.push("围绕这部作品和用户聊。如果用户问主观判断（值得看吗 / 适合我吗），直接回答你的看法，不要回避；不知道的事如实承认。");
  return lines.join("\n");
}

export function makeSystemMessage(content: string): ChatMessage {
  return { role: "system", content };
}
