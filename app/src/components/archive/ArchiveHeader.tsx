import type { UiMedium } from "@/lib/format/verbs";
import type { NeoDBShelfType } from "@/lib/neodb/types";

const TITLES: Record<UiMedium, string> = {
  movie: "电影", series: "剧集", book: "书籍", music: "音乐", podcast: "播客", game: "游戏",
};

const STATUS_VERB: Record<NeoDBShelfType, Record<UiMedium, string>> = {
  complete: { movie: "看过的", series: "追过的", book: "读过的", music: "听过的", podcast: "听过的", game: "玩过的" },
  progress: { movie: "在看的", series: "在追的", book: "在读的", music: "在听的", podcast: "在听的", game: "在玩的" },
  wishlist: { movie: "想看的", series: "想追的", book: "想读的", music: "想听的", podcast: "想听的", game: "想玩的" },
  dropped:  { movie: "弃的",   series: "弃的",   book: "弃的",   music: "弃的",   podcast: "弃的",   game: "弃的" },
};

export function ArchiveHeader({ medium, status, total }: { medium: UiMedium; status: NeoDBShelfType; total: number }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <p style={{ fontFamily: "var(--serif)", fontSize: 26, fontWeight: 500, letterSpacing: "-0.01em", lineHeight: 1 }}>
        {STATUS_VERB[status][medium]}
        {TITLES[medium]}
      </p>
      <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", marginTop: 5 }}>
        共 {total} 项 · 按时间倒序
      </p>
    </div>
  );
}
