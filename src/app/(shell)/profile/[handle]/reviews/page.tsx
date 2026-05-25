import Link from "next/link";
import { getSession } from "@/lib/auth/cookie";
import { listMyReviews } from "@/lib/neodb/client";
import { reviewToUi } from "@/lib/neodb/mappers";
import type { UiMedium } from "@/lib/format/verbs";
import { ALL_UI_MEDIUMS } from "@/lib/neodb/mediumMap";
import { mediumLabel } from "@/lib/format/verbs";
import { EmptyState } from "@/components/shared/EmptyState";

interface PageProps {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ page?: string; category?: string }>;
}

const VALID_CATEGORIES = new Set<UiMedium>(ALL_UI_MEDIUMS);

function parsePage(s?: string): number {
  const n = Number(s);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

function parseCategory(s?: string): UiMedium | undefined {
  if (s && VALID_CATEGORIES.has(s as UiMedium)) return s as UiMedium;
  return undefined;
}

function buildHref(handle: string, page: number, category?: UiMedium): string {
  const q = new URLSearchParams();
  if (page > 1) q.set("page", String(page));
  if (category) q.set("category", category);
  const qs = q.toString();
  return `/profile/${handle}/reviews${qs ? "?" + qs : ""}`;
}

export default async function ReviewsArchivePage({ params, searchParams }: PageProps) {
  const { handle } = await params;
  const sp = await searchParams;
  const page = parsePage(sp.page);
  const category = parseCategory(sp.category);

  const session = await getSession();
  const isMe = handle === "me" || handle === session?.handle;
  const displayHandle = isMe ? "我" : `@${handle}`;

  // P0 修复（2026-05-24, hardening pass）：用户反馈生产环境仍 500，但 localhost 正常。
  // 第一轮 fix（only listMyReviews + filter null item）可能不够 —— 把整条 fetch+map
  // 流水线全部包进 try/catch，任何 throw 都 fallback 到空状态而不是整页 500。
  // 真错误 console.error 出来，Vercel logs 能看到 stack。
  let items: ReturnType<typeof reviewToUi>[] = [];
  let total = 0;
  let pages = 1;
  try {
    const res = await listMyReviews({ page, category });
    const raw = res.data ?? [];
    items = raw.filter((r) => r && r.item).map(reviewToUi);
    if (raw.length !== items.length) {
      console.warn(`[/profile/handle/reviews] skipped ${raw.length - items.length} review(s) with missing item`);
    }
    total = res.count ?? items.length;
    pages = res.pages ?? 1;
  } catch (err) {
    console.error("[/profile/handle/reviews] main fetch/map threw:", err);
  }

  // 各 category 的篇数（page=1 只为拿 count；并发）
  let countMap: Partial<Record<UiMedium, number>> = {};
  let totalAll = 0;
  try {
    const perCategoryCounts = await Promise.all(
      ALL_UI_MEDIUMS.map(async (m) => {
        const r = await listMyReviews({ page: 1, category: m }).catch(() => ({ data: [], count: 0 }));
        return [m, r.count ?? r.data?.length ?? 0] as const;
      }),
    );
    countMap = Object.fromEntries(perCategoryCounts);
    totalAll = perCategoryCounts.reduce((a, [, n]) => a + n, 0);
  } catch (err) {
    console.error("[/profile/handle/reviews] perCategoryCounts threw:", err);
  }

  return (
    <div className="reviews-archive-page">
      {/* 顶部：面包屑 + 标题 + 计数 */}
      <Link
        href={`/profile/${handle}`}
        style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", textDecoration: "none", display: "inline-block", marginBottom: 14 }}
      >
        ← 个人主页
      </Link>
      <div className="reviews-archive-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
        <h1 style={{ fontFamily: "var(--serif)", fontSize: 28, fontWeight: 500, letterSpacing: "-0.02em" }}>
          {displayHandle} · 的长评
        </h1>
        <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)" }}>共 {total} 篇</span>
      </div>

      {/* category chips —— 与 Archive/Wishlist 的筛选器一致：.chip / .chip.on */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 14, marginBottom: 22 }}>
        <Link href={buildHref(handle, 1)} className={`chip${!category ? " on" : ""}`}>
          全部
          <span className="chip-count">{totalAll}</span>
        </Link>
        {ALL_UI_MEDIUMS.map((m) => (
          <Link
            key={m}
            href={buildHref(handle, 1, m)}
            className={`chip${category === m ? " on" : ""}`}
          >
            {mediumLabel(m)}
            <span className="chip-count">{countMap[m] ?? 0}</span>
          </Link>
        ))}
      </div>

      {/* 列表 */}
      {/* 列表 */}
      {items.length === 0 ? (
        <div style={{ marginTop: 18 }}>
          <EmptyState
            icon="ti-feather"
            title={category ? `还没写过${mediumLabel(category)}类的长评` : "还没写过长评"}
            description="长评通常是看完作品之后整理出的完整想法。先去标记一些作品，回头慢慢写。"
          />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {items.map((rv) => (
            <Link
              key={rv.uuid || rv.itemUuid + rv.createdAt}
              href={rv.uuid ? `/review/${rv.uuid}` : `/detail/${rv.itemMedium}/${rv.itemUuid}`}
              style={{
                display: "block",
                padding: "18px 4px",
                borderBottom: "0.5px solid var(--border)",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {new Date(rv.createdAt).toLocaleDateString("zh-CN")} · {rv.itemTitle} · {mediumLabel(rv.itemMedium)}
              </p>
              <p style={{ fontFamily: "var(--serif)", fontSize: 17, fontWeight: 500, letterSpacing: "-0.01em", marginTop: 6, lineHeight: 1.3 }}>
                {rv.title}
              </p>
              {rv.body && (
                <p style={{ fontFamily: "var(--serif)", fontSize: 13, color: "var(--text2)", marginTop: 6, lineHeight: 1.65 }}>
                  {rv.body.slice(0, 140)}{rv.body.length > 140 ? "…" : ""}
                </p>
              )}
              <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", marginTop: 8 }}>
                {rv.body.length} 字
              </p>
            </Link>
          ))}
        </div>
      )}

      {/* 分页 */}
      {pages > 1 && (
        <div style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 18,
          marginTop: 26,
          fontFamily: "var(--mono)",
          fontSize: 11,
          color: "var(--text3)",
        }}>
          {page > 1 ? (
            <Link href={buildHref(handle, page - 1, category)} style={{ color: "var(--text2)", textDecoration: "none" }}>
              ← 上一页
            </Link>
          ) : (
            <span style={{ opacity: 0.4 }}>← 上一页</span>
          )}
          <span>第 {page} / {pages} 页</span>
          {page < pages ? (
            <Link href={buildHref(handle, page + 1, category)} style={{ color: "var(--text2)", textDecoration: "none" }}>
              下一页 →
            </Link>
          ) : (
            <span style={{ opacity: 0.4 }}>下一页 →</span>
          )}
        </div>
      )}
    </div>
  );
}
