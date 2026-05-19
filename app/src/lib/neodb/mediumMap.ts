import type { NeoDBCategory } from "./types";
import type { UiMedium } from "./ui-types";

/** UI → NeoDB（写入 query 时使用） */
export function toNeoDBCategory(medium: UiMedium): NeoDBCategory {
  switch (medium) {
    case "series": return "tv";
    case "movie": return "movie";
    case "book": return "book";
    case "music": return "music";
    case "podcast": return "podcast";
    case "game": return "game";
  }
}

/** NeoDB → UI（读到任何 ItemBase 时通过此函数翻译） */
export function fromNeoDBCategory(cat: NeoDBCategory): UiMedium {
  switch (cat) {
    case "tv": return "series";
    case "movie": return "movie";
    case "book": return "book";
    case "music": return "music";
    case "podcast": return "podcast";
    case "game": return "game";
    case "performance": return "movie"; // 兜底
    case "people":
    case "collection":
      return "movie"; // 不会真正出现在媒介列表
  }
}

/** detail/edit URL 中使用的 medium 段 */
export function urlMedium(m: UiMedium): string {
  return m;
}

/** NeoDB item endpoint path segment for a given category */
export function endpointSegment(cat: NeoDBCategory): string {
  // /api/movie/{uuid}, /api/book/{uuid}, /api/tv/{uuid}, /api/album/{uuid}, /api/podcast/{uuid}, /api/game/{uuid}
  switch (cat) {
    case "music": return "album";
    default: return cat;
  }
}

export const ALL_UI_MEDIUMS: UiMedium[] = ["movie", "series", "book", "music", "podcast"];
