import type { NeoDBNote, NeoDBProgressType } from "@/lib/neodb/types";
import type { UiMedium } from "@/lib/format/verbs";

/**
 * 把 NeoDB Note 的 progress_type + progress_value 渲染成短徽章文本。
 * 输入空/无效 → 返回 undefined，调用方应 fallback。
 */
export function formatProgress(note: NeoDBNote | undefined | null, medium: UiMedium): string | undefined {
  if (!note) return undefined;
  const t = note.progress_type;
  const v = note.progress_value?.trim();
  if (!t || !v) return undefined;

  switch (t) {
    case "page":
      return `p.${v}`;
    case "chapter":
      return `Ch.${v}`;
    case "part":
      return `Pt.${v}`;
    case "episode":
      return formatEpisode(v, medium);
    case "track":
      return `Track ${v}`;
    case "cycle":
      return `第 ${v} 周目`;
    case "timestamp":
      return v;
    case "percentage": {
      const num = v.replace(/[^\d.]/g, "");
      return num ? `${num}%` : undefined;
    }
    default: {
      const _exhaust: never = t;
      void _exhaust;
      return undefined;
    }
  }
}

/** episode：剧集尝试解析 "2.4" → "S2 E04"；播客直接 "EP <n>"；其他 fallback 到 "E<n>" */
function formatEpisode(value: string, medium: UiMedium): string {
  if (medium === "podcast") return `EP ${value}`;
  const m = value.match(/^(\d+)[.\s/-](\d+)$/);
  if (m) {
    const ep = m[2].padStart(2, "0");
    return `S${m[1]} E${ep}`;
  }
  const single = value.match(/^\d+$/);
  if (single) return `E${value.padStart(2, "0")}`;
  return value;
}

export type { NeoDBProgressType };
