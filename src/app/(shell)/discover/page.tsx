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
  { medium: "podcast", label: "热门播客" },
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
    <div className="discover-page" style={{ padding: "20px 24px 28px", display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <span className="section-label">本周编辑推荐</span>
          <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)" }}>每周一更新</span>
        </div>
        {featured ? (
          <Link
            href={`/detail/${featured.medium}/${featured.uuid}`}
            className="discover-featured"
            style={{
              display: "block",
              position: "relative",
              background: "#1C1C1A",
              borderRadius: "var(--r)",
              minHeight: 240,
              overflow: "hidden",
              textDecoration: "none",
              color: "#F1EFE8",
            }}
          >
            {/* 1. 模糊海报作为氛围背景 */}
            {featured.cover && (
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  inset: -24,
                  background: `url(${featured.cover}) center/cover no-repeat`,
                  filter: "blur(28px) saturate(1.15)",
                  transform: "scale(1.08)",
                  opacity: 0.7,
                }}
              />
            )}
            {/* 2. 暗化渐变保文字可读 */}
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(100deg, rgba(15,12,8,0.92) 0%, rgba(15,12,8,0.78) 40%, rgba(15,12,8,0.55) 75%, rgba(15,12,8,0.45) 100%)",
              }}
            />
            {/* 3. 内容：左侧文字 + 右侧真比例海报 */}
            <div
              className="discover-featured__inner"
              style={{
                position: "relative",
                display: "flex",
                alignItems: "stretch",
                minHeight: 240,
              }}
            >
              <div
                className="discover-featured__body"
                style={{
                  flex: 1,
                  minWidth: 0,
                  maxWidth: 520,
                  padding: "22px 0 22px 22px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <span className="discover-featured__kicker" style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: ".12em", color: "var(--gold)" }}>EDITOR&apos;S PICK</span>
                <p className="discover-featured__title" style={{ fontFamily: "var(--serif)", fontSize: 24, fontWeight: 500, lineHeight: 1.1, marginTop: 16 }}>{featured.title}</p>
                <p className="discover-featured__meta" style={{ fontFamily: "var(--mono)", fontSize: 11, color: "#C9C7C0", marginTop: 6 }}>
                  {[featured.creator, featured.year, mediumLabel(featured.medium)].filter(Boolean).join(" · ")}
                </p>
                {featured.brief && (
                  <p className="discover-featured__brief" style={{ fontSize: 12, color: "#D6D4CD", marginTop: 14, lineHeight: 1.6 }}>
                    {featured.brief.slice(0, 110)}
                    {featured.brief.length > 110 ? "…" : ""}
                  </p>
                )}
              </div>
              {featured.cover && (
                <div
                  className="discover-featured__cover"
                  aria-hidden
                  style={{
                    flexShrink: 0,
                    width: 160,
                    marginLeft: "auto",
                    marginRight: 22,
                    marginTop: 4,
                    marginBottom: 4,
                    borderRadius: "var(--r2)",
                    background: `url(${featured.cover}) center/cover no-repeat`,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
                    border: "0.5px solid rgba(255,255,255,0.10)",
                  }}
                />
              )}
            </div>
          </Link>
        ) : (
          <div style={{ padding: "20px", border: "0.5px solid var(--border)", borderRadius: "var(--r)", color: "var(--text3)", fontSize: 12 }}>
            暂无编辑推荐。
          </div>
        )}
      </div>

      {trending.map((sec) => (
        <div key={sec.medium}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span className="section-label">{sec.label}</span>
            <Link href={`/discover/${sec.medium}`} style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", textDecoration: "none" }}>
              全部热门 →
            </Link>
          </div>
          {sec.items.length > 0 ? (
            <div className="discover-trending-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 10 }}>
              {sec.items.map((it) => (
                <Link key={it.uuid} href={`/detail/${it.medium}/${it.uuid}`} style={{
                  border: "0.5px solid var(--border)", borderRadius: "var(--r)", padding: 12,
                  display: "flex", gap: 10, alignItems: "center",
                  textDecoration: "none", color: "inherit", background: "var(--bg)",
                }}>
                  <Cover src={it.cover ?? undefined} seed={it.uuid} width={34} height={48} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: "var(--serif)", fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.title}</p>
                    <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", marginTop: 3 }}>
                      {[it.year, it.externalRating ? `★ ${it.externalRating.toFixed(1)}` : null].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div style={{
              padding: "16px 18px",
              border: "0.5px dashed var(--border)",
              borderRadius: "var(--r)",
              color: "var(--text3)",
              fontSize: 12,
              fontFamily: "var(--mono)",
              textAlign: "center",
            }}>
              暂无数据 · NeoDB 上游未返回
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
