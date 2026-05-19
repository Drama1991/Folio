import Link from "next/link";
import { listShelf } from "@/lib/neodb/client";
import { markToArchiveRow } from "@/lib/neodb/mappers";
import { ALL_UI_MEDIUMS } from "@/lib/neodb/mediumMap";
import { mediumLabel, type UiMedium } from "@/lib/format/verbs";
import { WishlistContent } from "@/components/wishlist/WishlistContent";

export const dynamic = "force-dynamic";

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

  return (
    <div style={{ padding: "20px 24px 24px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <p style={{ fontFamily: "var(--serif)", fontSize: 26, fontWeight: 500, letterSpacing: "-0.01em", lineHeight: 1 }}>想看清单</p>
          <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", marginTop: 5 }}>
            共 {res.count ?? rows.length} 项 · 按添加时间
          </p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto" }}>
        <Link href="/wishlist" className={`btn${!filterMedium ? " primary" : ""}`} style={{ borderRadius: 999, fontSize: 11, textDecoration: "none" }}>
          全部 {counts.reduce((a, c) => a + c.count, 0)}
        </Link>
        {counts.map((c) => (
          <Link
            key={c.medium}
            href={`/wishlist?filter=${c.medium}`}
            className={`btn${filterMedium === c.medium ? " primary" : ""}`}
            style={{ borderRadius: 999, fontSize: 11, textDecoration: "none" }}
          >
            {mediumLabel(c.medium)} {c.count}
          </Link>
        ))}
      </div>

      <WishlistContent rows={rows} />
    </div>
  );
}
