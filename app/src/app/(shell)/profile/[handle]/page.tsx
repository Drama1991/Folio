import Link from "next/link";
import { getSession } from "@/lib/auth/cookie";
import { getMe, listMyReviews, listShelf, shelfCount } from "@/lib/neodb/client";
import { ALL_UI_MEDIUMS } from "@/lib/neodb/mediumMap";
import { mediumLabel } from "@/lib/format/verbs";
import { markToArchiveRow, reviewToUi } from "@/lib/neodb/mappers";
import { Cover } from "@/components/shared/Cover";

interface PageProps {
  params: Promise<{ handle: string }>;
}

export default async function ProfilePage({ params }: PageProps) {
  const { handle } = await params;
  const session = await getSession();
  const isMe = handle === "me" || handle === session?.handle;

  const me = isMe ? await getMe().catch(() => null) : null;
  const display = me?.display_name || me?.username || session?.handle || handle;
  const acct = me?.acct || `${handle}@${session?.instance ?? "neodb.social"}`;

  // counts per medium (complete)
  const counts = await Promise.all(
    ALL_UI_MEDIUMS.map(async (m) => ({
      medium: m,
      count: await shelfCount({ type: "complete", category: m }).catch(() => 0),
    })),
  );

  const reviews = await listMyReviews({ page: 1 }).catch(() => ({ data: [] as never[] }));
  const reviewUi = (reviews.data ?? []).slice(0, 3).map(reviewToUi);

  // recent complete
  const recent = await listShelf({ type: "complete", page: 1 }).catch(() => ({ data: [] as never[] }));
  const recentRows = (recent.data ?? []).slice(0, 4).map(markToArchiveRow);

  return (
    <div style={{ padding: "20px 24px 28px" }}>
      <div style={{ display: "flex", gap: 18, alignItems: "flex-start", marginBottom: 22 }}>
        <div style={{
          width: 80, height: 80, borderRadius: "50%",
          background: me?.avatar ? `center/cover url(${me.avatar})` : "#2C2C2A",
          color: "#D3D1C7", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 28, fontFamily: "var(--serif)", fontWeight: 500,
        }}>
          {!me?.avatar && display.slice(0, 1)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: "var(--serif)", fontSize: 26, fontWeight: 500, letterSpacing: "-0.01em" }}>{display}</p>
          <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", marginTop: 4 }}>@{acct}</p>
          {me?.note && (
            <p style={{ fontFamily: "var(--serif)", fontSize: 13, color: "var(--text2)", marginTop: 10, lineHeight: 1.6 }}>{me.note}</p>
          )}
        </div>
        {isMe && (
          <Link href="/settings" className="btn">编辑资料</Link>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: `repeat(${counts.length},1fr)`, gap: 8, marginBottom: 22 }}>
        {counts.map((c) => (
          <Link key={c.medium} href={`/archive/${c.medium}`} style={{
            border: "0.5px solid var(--border)", borderRadius: "var(--r2)",
            padding: "12px 8px", textAlign: "center", textDecoration: "none", color: "inherit",
          }}>
            <p style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)" }}>{mediumLabel(c.medium)}</p>
            <p style={{ fontSize: 20, fontWeight: 500, marginTop: 3 }}>{c.count}</p>
          </Link>
        ))}
      </div>

      {recentRows.length > 0 && (
        <div style={{ marginBottom: 22 }}>
          <p className="section-label" style={{ marginBottom: 10 }}>最近完成</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
            {recentRows.map((r) => (
              <Link key={r.uuid} href={`/detail/${r.medium}/${r.uuid}`} style={{ textDecoration: "none", color: "inherit" }}>
                <Cover src={r.cover ?? undefined} seed={r.uuid} width={"100%" as unknown as number} height={140} style={{ borderRadius: "var(--r2)" }} />
                <p style={{ fontFamily: "var(--serif)", fontSize: 12, fontWeight: 500, marginTop: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.title}</p>
                <p style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)" }}>{r.year ?? ""}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {reviewUi.length > 0 && (
        <div>
          <p className="section-label" style={{ marginBottom: 10 }}>最近长评</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {reviewUi.map((rv) => (
              <Link
                key={rv.uuid}
                href={`/detail/${rv.itemMedium}/${rv.itemUuid}`}
                style={{ border: "0.5px solid var(--border)", borderRadius: "var(--r)", padding: "14px 16px", textDecoration: "none", color: "inherit" }}
              >
                <p style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)" }}>
                  {rv.itemTitle} · {new Date(rv.createdAt).toLocaleDateString("zh-CN")}
                </p>
                <p style={{ fontFamily: "var(--serif)", fontSize: 15, fontWeight: 500, marginTop: 6 }}>{rv.title}</p>
                <p style={{ fontSize: 12, color: "var(--text2)", marginTop: 6, lineHeight: 1.65, fontFamily: "var(--serif)" }}>
                  {(rv.body || "").slice(0, 120)}{(rv.body || "").length > 120 ? "…" : ""}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
