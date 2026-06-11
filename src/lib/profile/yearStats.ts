import type { NeoDBItemBase, NeoDBMark } from "@/lib/neodb/types";
import { fromNeoDBCategory } from "@/lib/neodb/mediumMap";
import { mediumLabel } from "@/lib/format/verbs";
import { listShelf } from "@/lib/neodb/client";

const DEFAULT_MAX_PAGES = 20; // 上限 ~400 items (NeoDB 默认 20/页)

/**
 * 拉 complete shelf 多页，截止到 created_time < windowStart。
 * 可选 windowEnd（exclusive 上界）：用于切到过去某一年，自动跳过比 end 还新的记录。
 * 遇到第一个超出窗口下界的 mark 就 break，节省调用。
 */
export async function pullYearMarks(
  windowStart: Date,
  windowEnd?: Date,
  maxPages: number = DEFAULT_MAX_PAGES,
): Promise<NeoDBMark[]> {
  const acc: NeoDBMark[] = [];
  const endTs = windowEnd ? +windowEnd : Number.POSITIVE_INFINITY;
  const startTs = +windowStart;
  for (let page = 1; page <= maxPages; page++) {
    const p = await listShelf({ type: "complete", page }).catch(() => null);
    const data = p?.data ?? [];
    if (data.length === 0) break;
    let outOfRange = false;
    for (const m of data) {
      const t = +new Date(m.created_time);
      if (t < startTs) {
        outOfRange = true;
        continue;
      }
      if (t >= endTs) continue; // 比窗口还新，跳过但不 break（还可能往后翻到窗口内）
      acc.push(m);
    }
    if (outOfRange) break;
  }
  return acc;
}

function pickName(x: unknown): string | null {
  if (typeof x === "string") return x.trim() || null;
  if (x && typeof x === "object" && "name" in x) {
    const n = (x as { name: unknown }).name;
    return typeof n === "string" ? n.trim() || null : null;
  }
  return null;
}

/**
 * 从 item.[extra] 取主创：电影/剧集 → director；书 → author；音乐 → artist；播客 → host；游戏 → developer。
 * NeoDB shelf list 已带上这些字段，无需 N+1。
 */
export function extractCreator(item: NeoDBItemBase): string | null {
  const cat = item.category;
  let raw: unknown = null;
  if (cat === "movie" || cat === "tv" || cat === "performance") raw = item.director;
  else if (cat === "book") raw = item.author ?? item.translator;
  else if (cat === "music") raw = item.artist;
  else if (cat === "podcast") raw = item.host ?? item.hosts;
  else if (cat === "game") raw = item.developer ?? item.publisher;

  if (!raw) return null;
  if (Array.isArray(raw)) return raw.length > 0 ? pickName(raw[0]) : null;
  return pickName(raw);
}

export interface YearSummary {
  total: number;                        // 窗口内 complete mark 总数
  byMediumLabel: { label: string; count: number }[]; // UI 中文 medium 分布（倒序）
  topMediumLabel: string;               // 占比最高的 medium 中文标签
  topMediumPct: number;                 // 0..100
  avgRating5: number | null;            // 平均评分（折算到 /5），无评分返回 null
  ratedCount: number;
  topCreator: { name: string; count: number } | null;
  // 用于"今年完成 X 件"的子标签，按 UI medium 输出 e.g. "电影 28 · 书 12"
  briefMix: string;
}

export function summarizeYear(marks: NeoDBMark[]): YearSummary {
  const byUiMedium = new Map<string, number>(); // label → count
  const ratings: number[] = [];
  const creators = new Map<string, number>();

  for (const m of marks) {
    const label = mediumLabel(fromNeoDBCategory(m.item.category));
    byUiMedium.set(label, (byUiMedium.get(label) ?? 0) + 1);
    if (typeof m.rating_grade === "number" && m.rating_grade > 0) ratings.push(m.rating_grade);
    const creator = extractCreator(m.item);
    if (creator) creators.set(creator, (creators.get(creator) ?? 0) + 1);
  }

  const total = marks.length;
  const ordered = [...byUiMedium.entries()].sort((a, b) => b[1] - a[1]);
  const topMedium = ordered[0];
  const avg = ratings.length
    ? ratings.reduce((a, b) => a + b, 0) / ratings.length
    : null;
  const topCreatorEntry = [...creators.entries()].sort((a, b) => b[1] - a[1])[0];

  return {
    total,
    byMediumLabel: ordered.map(([label, count]) => ({ label, count })),
    topMediumLabel: topMedium?.[0] ?? "—",
    topMediumPct: topMedium && total > 0 ? Math.round((topMedium[1] / total) * 100) : 0,
    avgRating5: avg !== null ? Math.round((avg / 2) * 10) / 10 : null,
    ratedCount: ratings.length,
    topCreator: topCreatorEntry ? { name: topCreatorEntry[0], count: topCreatorEntry[1] } : null,
    briefMix: ordered.slice(0, 3).map(([l, c]) => `${l} ${c}`).join(" · "),
  };
}
