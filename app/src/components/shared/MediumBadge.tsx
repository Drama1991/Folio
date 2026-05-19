import type { UiMedium } from "@/lib/format/verbs";

const COLORS: Record<UiMedium, { bg: string; fg: string }> = {
  movie:   { bg: "#E8EEF4", fg: "#3B5E8C" },
  series:  { bg: "#EEF6E8", fg: "#0F6E56" },
  book:    { bg: "#F4E8E8", fg: "#8C3B52" },
  music:   { bg: "#EFE5F6", fg: "#6B3B8C" },
  podcast: { bg: "#FAEEDA", fg: "#854F0B" },
  game:    { bg: "#E8F1F4", fg: "#2A88D4" },
};

const LABELS: Record<UiMedium, string> = {
  movie: "电影",
  series: "剧集",
  book: "书籍",
  music: "音乐",
  podcast: "播客",
  game: "游戏",
};

interface Props {
  medium: UiMedium;
  small?: boolean;
}

export function MediumBadge({ medium, small }: Props) {
  const c = COLORS[medium];
  return (
    <span
      className="badge"
      style={{
        background: c.bg,
        color: c.fg,
        fontFamily: "var(--mono)",
        fontSize: small ? 9 : 10,
        padding: small ? "1px 5px" : "2px 7px",
      }}
    >
      {LABELS[medium]}
    </span>
  );
}
