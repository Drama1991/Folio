import Link from "next/link";
import { ALL_UI_MEDIUMS } from "@/lib/neodb/mediumMap";
import type { UiMedium } from "@/lib/format/verbs";

const LABELS: Record<UiMedium, string> = {
  movie: "电影", series: "剧集", book: "书籍", music: "音乐", podcast: "播客", game: "游戏",
};

export function ArchiveTabs({ current }: { current: UiMedium }) {
  return (
    <div style={{ display: "flex", gap: 6, marginTop: 12, borderBottom: "0.5px solid var(--border)" }}>
      {ALL_UI_MEDIUMS.map((m) => (
        <Link key={m} href={`/archive/${m}`} className={`tab${m === current ? " on" : ""}`} style={{ textDecoration: "none" }}>
          {LABELS[m]}
        </Link>
      ))}
    </div>
  );
}
