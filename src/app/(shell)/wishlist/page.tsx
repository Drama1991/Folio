import { listShelfAll, shelfCount } from "@/lib/neodb/client";
import { markToArchiveRow } from "@/lib/neodb/mappers";
import { ALL_UI_MEDIUMS } from "@/lib/neodb/mediumMap";
import { type UiMedium } from "@/lib/format/verbs";
import { WishlistContent } from "@/components/wishlist/WishlistContent";

interface PageProps {
  searchParams: Promise<{ filter?: string }>;
}

export default async function WishlistPage({ searchParams }: PageProps) {
  const { filter } = await searchParams;
  const filterMedium = ALL_UI_MEDIUMS.includes(filter as UiMedium) ? (filter as UiMedium) : undefined;

  const res = await listShelfAll({ type: "wishlist", category: filterMedium }).catch(
    () => ({ data: [] as never[], count: 0 }),
  );
  const rows = (res.data ?? []).map(markToArchiveRow);

  // counts per category：用 shelfCount，它优先读 count 字段，比 data.length 兜底准
  const counts = await Promise.all(
    ALL_UI_MEDIUMS.map(async (m) => ({
      medium: m,
      count: await shelfCount({ type: "wishlist", category: m }),
    })),
  );
  const totalCount = counts.reduce((a, c) => a + c.count, 0);

  return (
    <div className="wishlist-page">
      <WishlistContent
        rows={rows}
        totalCount={res.count ?? rows.length}
        counts={counts}
        filterMedium={filterMedium}
      />
    </div>
  );
}
