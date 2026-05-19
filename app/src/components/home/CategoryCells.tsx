import Link from "next/link";
import type { UiMedium } from "@/lib/format/verbs";

const ICONS: Record<UiMedium, string> = {
  movie: "ti-movie",
  series: "ti-device-tv",
  book: "ti-book",
  music: "ti-vinyl",
  podcast: "ti-microphone",
  game: "ti-device-gamepad-2",
};
const LABELS: Record<UiMedium, string> = {
  movie: "电影", series: "剧集", book: "书籍", music: "音乐", podcast: "播客", game: "游戏",
};

export function CategoryCells({ counts }: { counts: { medium: UiMedium; count: number }[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${counts.length},1fr)`, gap: 8 }}>
      {counts.map(({ medium, count }, i) => (
        <Link
          key={medium}
          href={`/archive/${medium}`}
          className={`cell-link${i === 0 ? " cur" : ""}`}
          style={{
            border: `0.5px solid var(--${i === 0 ? "border2" : "border"})`,
            borderRadius: "var(--r2)",
            padding: "14px 8px",
            textAlign: "center",
            textDecoration: "none",
            color: i === 0 ? "var(--text)" : "var(--text2)",
            cursor: "pointer",
          }}
        >
          <i className={`ti ${ICONS[medium]}`} style={{ fontSize: 19, display: "block", marginBottom: 5 }} />
          <p style={{ fontSize: 11, fontWeight: i === 0 ? 500 : 400, marginBottom: 3 }}>{LABELS[medium]}</p>
          <p style={{ fontFamily: "var(--mono)", fontSize: 12, fontWeight: 600 }}>{count}</p>
        </Link>
      ))}
    </div>
  );
}
