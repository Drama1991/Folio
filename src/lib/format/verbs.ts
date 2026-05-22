export type UiMedium = "movie" | "series" | "book" | "music" | "podcast" | "game";

const STATUS_VERBS: Record<UiMedium, { complete: string; progress: string; wishlist: string; dropped: string }> = {
  movie:   { complete: "看过", progress: "在看", wishlist: "想看", dropped: "弃" },
  series:  { complete: "看过", progress: "在追", wishlist: "想看", dropped: "弃" },
  book:    { complete: "读过", progress: "在读", wishlist: "想读", dropped: "弃" },
  music:   { complete: "听过", progress: "在听", wishlist: "想听", dropped: "弃" },
  podcast: { complete: "听过", progress: "在听", wishlist: "想听", dropped: "弃" },
  game:    { complete: "玩过", progress: "在玩", wishlist: "想玩", dropped: "弃" },
};

export type ShelfStatus = "complete" | "progress" | "wishlist" | "dropped";

export function statusVerb(medium: UiMedium, status: ShelfStatus): string {
  return STATUS_VERBS[medium]?.[status] ?? status;
}

const MEDIUM_LABELS: Record<UiMedium, string> = {
  movie: "电影",
  series: "剧集",
  book: "书籍",
  music: "音乐",
  podcast: "播客",
  game: "游戏",
};

export function mediumLabel(m: UiMedium): string {
  return MEDIUM_LABELS[m] ?? m;
}

export function archiveTitle(medium: UiMedium): string {
  switch (medium) {
    case "movie": return "看过的电影";
    case "series": return "追过的剧集";
    case "book": return "读过的书";
    case "music": return "听过的专辑";
    case "podcast": return "听过的播客";
    case "game": return "玩过的游戏";
  }
}
