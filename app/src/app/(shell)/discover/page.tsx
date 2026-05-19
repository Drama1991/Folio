import Link from "next/link";
import { listTrending } from "@/lib/neodb/client";
import { itemToUi } from "@/lib/neodb/mappers";
import { Cover } from "@/components/shared/Cover";
import { mediumLabel, type UiMedium } from "@/lib/format/verbs";

const TRENDING_SECTIONS: { medium: UiMedium; label: string }[] = [
  { medium: "movie", label: "热门电影" },
  { medium: "series", label: "热门剧集" },
  { medium: "book", label: "热门书籍" },
  { medium: "music", label: "热门音乐" },
];

export default async function DiscoverPage() {
  const trending = await Promise.all(
    TRENDING_SECTIONS.map(async (sec) => ({
      ...sec,
      items: (await listTrending({ medium: sec.medium })).slice(0, 6).map(itemToUi),
    })),
  );

  const featured = trending[0]?.items?.[0];

  return (
    <div style={{ padding: "20px 24px 28px", display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <span className="section-label">本周编辑推荐</span>
          <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)" }}>每周一更新</span>
        </div>
        {featured ? (
          <Link
            href={`/detail/${featured.medium}/${featured.uuid}`}
            style={{
              display: "block", background: "#1C1C1A", borderRadius: "var(--r)", padding: 22,
              minHeight: 170, textDecoration: "none", color: "#F1EFE8",
            }}
          >
            <span style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: ".12em", color: "var(--gold)" }}>EDITOR&apos;S PICK</span>
            <p style={{ fontFamily: "var(--serif)", fontSize: 24, fontWeight: 500, lineHeight: 1.1, marginTop: 16 }}>{featured.title}</p>
            <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "#888780", marginTop: 6 }}>
              {[featured.creator, featured.year, mediumLabel(featured.medium)].filter(Boolean).join(" · ")}
            </p>
            {featured.brief && (
              <p style={{ fontSize: 12, color: "#A9A7A0", marginTop: 14, lineHeight: 1.6, maxWidth: 480 }}>
                {featured.brief.slice(0, 110)}
                {featured.brief.length > 110 ? "…" : ""}
              </p>
            )}
          </Link>
        ) : (
          <div style={{ padding: "20px", border: "0.5px solid var(--border)", borderRadius: "var(--r)", color: "var(--text3)", fontSize: 12 }}>
            暂无编辑推荐。
          </div>
        )}
      </div>

      {trending.map((sec) =>
        sec.items.length > 0 ? (
          <div key={sec.medium}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span className="section-label">{sec.label}</span>
              <Link href={`/archive/${sec.medium}`} style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)", textDecoration: "none" }}>
                我的档案 →
              </Link>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 10 }}>
              {sec.items.map((it) => (
                <Link key={it.uuid} href={`/detail/${it.medium}/${it.uuid}`} style={{
                  border: "0.5px solid var(--border)", borderRadius: "var(--r)", padding: 12,
                  display: "flex", gap: 10, alignItems: "center",
                  textDecoration: "none", color: "inherit", background: "var(--bg)",
                }}>
                  <Cover src={it.cover ?? undefined} seed={it.uuid} width={34} height={48} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: "var(--serif)", fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.title}</p>
                    <p style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)", marginTop: 3 }}>
                      {[it.year, it.externalRating ? `★ ${it.externalRating.toFixed(1)}` : null].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : null,
      )}
    </div>
  );
}
