import type { UiMedium } from "@/lib/format/verbs";
import type { NeoDBShelfType } from "@/lib/neodb/types";
import type { UiArchiveRow } from "@/lib/neodb/ui-types";

const TITLES: Record<UiMedium, string> = {
  movie: "电影", series: "剧集", book: "书籍", music: "音乐", podcast: "播客", game: "游戏",
};

const STATUS_VERB: Record<NeoDBShelfType, Record<UiMedium, string>> = {
  complete: { movie: "看过的", series: "追过的", book: "读过的", music: "听过的", podcast: "听过的", game: "玩过的" },
  progress: { movie: "在看的", series: "在追的", book: "在读的", music: "在听的", podcast: "在听的", game: "在玩的" },
  wishlist: { movie: "想看的", series: "想追的", book: "想读的", music: "想听的", podcast: "想听的", game: "想玩的" },
  dropped:  { movie: "弃的",   series: "弃的",   book: "弃的",   music: "弃的",   podcast: "弃的",   game: "弃的" },
};

const DAY = 86_400_000;

function deriveStats(rows: UiArchiveRow[], status: NeoDBShelfType) {
  const now = new Date();
  const thisYear = now.getFullYear();
  const thisMonth = now.getMonth();
  const t = now.getTime();

  let monthNew = 0;
  let yearNew = 0;
  let oldestDays = 0;
  let ratedSum = 0;
  let ratedCount = 0;

  rows.forEach((r) => {
    const d = new Date(r.updatedAt);
    const ageDays = Math.floor((t - d.getTime()) / DAY);
    if (d.getFullYear() === thisYear) {
      yearNew++;
      if (d.getMonth() === thisMonth) monthNew++;
    }
    if (ageDays > oldestDays) oldestDays = ageDays;
    if (typeof r.rating === "number" && r.rating > 0) {
      ratedSum += r.rating;
      ratedCount++;
    }
  });

  if (status === "complete") {
    const parts: string[] = [];
    if (monthNew > 0) parts.push(`本月新增 ${monthNew}`);
    if (yearNew > 0) parts.push(`今年累计 ${yearNew}`);
    if (ratedCount > 0) parts.push(`平均 ${(ratedSum / ratedCount).toFixed(1)} ★`);
    return parts;
  }
  if (status === "progress") {
    const parts: string[] = [];
    if (oldestDays > 0) parts.push(`最早 ${oldestDays} 天前开始`);
    return parts;
  }
  if (status === "wishlist") {
    const parts: string[] = [];
    if (monthNew > 0) parts.push(`本月新增 ${monthNew}`);
    return parts;
  }
  if (status === "dropped") {
    const parts: string[] = [];
    if (yearNew > 0) parts.push(`今年弃 ${yearNew}`);
    return parts;
  }
  return [];
}

export function ArchiveHeader({
  medium,
  status,
  total,
  rows,
}: {
  medium: UiMedium;
  status: NeoDBShelfType;
  total: number;
  rows: UiArchiveRow[];
}) {
  const stats = deriveStats(rows, status);
  return (
    <div style={{ marginBottom: 8 }}>
      <p style={{ fontFamily: "var(--serif)", fontSize: 26, fontWeight: 500, letterSpacing: "-0.01em", lineHeight: 1 }}>
        {STATUS_VERB[status][medium]}
        {TITLES[medium]}
      </p>
      <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", marginTop: 5 }}>
        共 <span style={{ color: "var(--text2)" }}>{total}</span> 项
        {stats.map((s, i) => (
          <span key={i}>
            {" · "}
            <span style={{ color: "var(--text2)" }}>{s}</span>
          </span>
        ))}
      </p>
    </div>
  );
}
