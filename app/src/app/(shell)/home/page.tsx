import { getSession } from "@/lib/auth/cookie";
import { listMyNotes, listShelf, shelfCount } from "@/lib/neodb/client";
import { markToTimelineEntry } from "@/lib/neodb/mappers";
import { formatProgress } from "@/lib/format/progress";
import { HomeHero } from "@/components/home/HomeHero";
import { ActionBar } from "@/components/home/ActionBar";
import { BentoTop } from "@/components/home/BentoTop";
import { ActivityStrip } from "@/components/home/ActivityStrip";
import { CategoryCells } from "@/components/home/CategoryCells";
import { ALL_UI_MEDIUMS } from "@/lib/neodb/mediumMap";

export default async function HomePage() {
  const session = await getSession();
  const display = session?.display || session?.handle || "你";

  const [progressList, complete, wishlistCount, droppedCount] = await Promise.all([
    listShelf({ type: "progress", page: 1 }).catch(() => ({ data: [] as never[] })),
    shelfCount({ type: "complete" }).catch(() => 0),
    shelfCount({ type: "wishlist" }).catch(() => 0),
    shelfCount({ type: "dropped" }).catch(() => 0),
  ]);

  // 最近 5 条 mark：合并 progress + complete，取前 5
  const recentMarks = (progressList.data ?? [])
    .map(markToTimelineEntry)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 5);

  // 5 类计数（complete 维度）—— per category 并发
  const categoryCounts = await Promise.all(
    ALL_UI_MEDIUMS.map(async (m) => ({
      medium: m,
      count: await shelfCount({ type: "complete", category: m }).catch(() => 0),
    })),
  );

  // featured 在看项（progress 中第一条）
  const featured = (progressList.data ?? [])[0];
  const featuredUi = featured ? markToTimelineEntry(featured) : null;

  // featured 的最新一条带 progress 的 note → 派生右上角徽章文本
  if (featuredUi) {
    const notes = await listMyNotes(featuredUi.uuid).catch(() => ({ data: [] }));
    const latest = notes.data
      .filter((n) => n.progress_type && n.progress_value)
      .sort((a, b) => +new Date(b.created_time) - +new Date(a.created_time))[0];
    featuredUi.progressLabel = formatProgress(latest, featuredUi.medium);
  }

  const stats = {
    progress: progressList.data?.length ?? 0,
    wishlist: wishlistCount,
    complete,
    dropped: droppedCount,
  };

  return (
    <div style={{ padding: "28px 24px 24px" }}>
      <HomeHero display={display} />
      <ActionBar />
      <BentoTop featured={featuredUi} stats={stats} />
      <ActivityStrip recent={recentMarks} />
      <CategoryCells counts={categoryCounts} />
    </div>
  );
}
