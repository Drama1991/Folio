import { notFound } from "next/navigation";
import Link from "next/link";
import { listTrending } from "@/lib/neodb/client";
import { itemToUi } from "@/lib/neodb/mappers";
import { Cover } from "@/components/shared/Cover";
import { ALL_UI_MEDIUMS } from "@/lib/neodb/mediumMap";
import { mediumLabel, type UiMedium } from "@/lib/format/verbs";

interface PageProps {
  params: Promise<{ medium: string }>;
}

export default async function DiscoverMediumPage({ params }: PageProps) {
  const { medium: raw } = await params;
  if (!ALL_UI_MEDIUMS.includes(raw as UiMedium)) notFound();
  const medium = raw as UiMedium;
  const items = (await listTrending({ medium })).map(itemToUi);
  const title = `热门${mediumLabel(medium)}`;

  return (
    <div style={{ padding: "20px 24px 28px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <Link href="/home" className="crumb">首页</Link>
        <span style={{ color: "var(--text3)", fontFamily: "var(--mono)", fontSize: 11 }}>/</span>
        <Link href="/discover" className="crumb">发现</Link>
        <span style={{ color: "var(--text3)", fontFamily: "var(--mono)", fontSize: 11 }}>/</span>
        <span className="crumb cur">{title}</span>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
        <h1 style={{ fontFamily: "var(--serif)", fontSize: 24, fontWeight: 500, letterSpacing: "-0.01em" }}>
          {title}
        </h1>
        <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)" }}>
          {items.length} 条 · NeoDB 热门
        </span>
      </div>

      {items.length === 0 ? (
        <div style={{
          padding: "26px 20px", textAlign: "center", color: "var(--text3)", fontSize: 12,
          border: "0.5px dashed var(--border)", borderRadius: "var(--r)",
          fontFamily: "var(--mono)",
        }}>
          暂无数据 · NeoDB 上游未返回
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 10 }}>
          {items.map((it) => (
            <Link
              key={it.uuid}
              href={`/detail/${it.medium}/${it.uuid}`}
              style={{
                border: "0.5px solid var(--border)", borderRadius: "var(--r)", padding: 12,
                display: "flex", gap: 10, alignItems: "center",
                textDecoration: "none", color: "inherit", background: "var(--bg)",
              }}
            >
              <Cover src={it.cover ?? undefined} seed={it.uuid} width={34} height={48} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: "var(--serif)", fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {it.title}
                </p>
                <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", marginTop: 3 }}>
                  {[it.year, it.externalRating ? `★ ${it.externalRating.toFixed(1)}` : null].filter(Boolean).join(" · ")}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
