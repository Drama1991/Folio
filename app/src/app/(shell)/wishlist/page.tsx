import Link from "next/link";
import { listShelf } from "@/lib/neodb/client";
import { markToArchiveRow } from "@/lib/neodb/mappers";
import { ALL_UI_MEDIUMS } from "@/lib/neodb/mediumMap";
import { mediumLabel, type UiMedium } from "@/lib/format/verbs";
import { WishlistContent } from "@/components/wishlist/WishlistContent";

interface PageProps {
  searchParams: Promise<{ filter?: string }>;
}

export default async function WishlistPage({ searchParams }: PageProps) {
  const { filter } = await searchParams;
  const filterMedium = ALL_UI_MEDIUMS.includes(filter as UiMedium) ? (filter as UiMedium) : undefined;

  const res = await listShelf({ type: "wishlist", category: filterMedium, page: 1 }).catch(
    () => ({ data: [] as never[], count: 0 }),
  );
  const rows = (res.data ?? []).map(markToArchiveRow);

  // counts per category
  const counts = await Promise.all(
    ALL_UI_MEDIUMS.map(async (m) => ({
      medium: m,
      count: (await listShelf({ type: "wishlist", category: m, page: 1 }).catch(() => ({ data: [] }))).data.length,
    })),
  );
  const totalCount = counts.reduce((a, c) => a + c.count, 0);

  return (
    <div style={{ padding: "20px 24px 24px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 16, gap: 16 }}>
        <div>
          <p style={{ fontFamily: "var(--serif)", fontSize: 26, fontWeight: 500, letterSpacing: "-0.01em", lineHeight: 1 }}>心愿单</p>
          <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", marginTop: 5 }}>
            想看 · 想读 · 想听 · 想玩 — 我准备走入的世界
          </p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto", paddingBottom: 2 }}>
        <Link href="/wishlist" className={`chip${!filterMedium ? " on" : ""}`}>
          全部 <span className="chip-count">{totalCount}</span>
        </Link>
        {counts.map((c) => (
          <Link
            key={c.medium}
            href={`/wishlist?filter=${c.medium}`}
            className={`chip${filterMedium === c.medium ? " on" : ""}`}
          >
            {mediumLabel(c.medium)} <span className="chip-count">{c.count}</span>
          </Link>
        ))}
      </div>

      <WishlistContent rows={rows} totalCount={res.count ?? rows.length} />
    </div>
  );
}
