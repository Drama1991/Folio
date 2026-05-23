import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import DOMPurify from "isomorphic-dompurify";
import { getMyReviewOfItem, getReview, NeoDBError } from "@/lib/neodb/client";
import { itemToUi } from "@/lib/neodb/mappers";
import { getSession } from "@/lib/auth/cookie";
import { ReviewActions } from "@/components/review/ReviewActions";

interface PageProps {
  params: Promise<{ uuid: string }>;
}

const VIS_LABEL: Record<number, string> = {
  0: "公开",
  1: "仅关注者",
  2: "仅提及者",
};

/** 从 url（绝对或相对）取最后一个非空 path 段 = review uuid */
function lastPathSegment(url?: string): string {
  if (!url) return "";
  const path = url.split("?")[0].split("#")[0];
  const parts = path.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? "";
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { uuid } = await params;
  try {
    const review = await getReview(uuid);
    const ui = itemToUi(review.item);
    const title = `${review.title} · 长评`;
    const description = (review.body || "").replace(/\s+/g, " ").slice(0, 160) || `${ui.title} 的长评`;
    const images = ui.cover ? [{ url: ui.cover }] : undefined;
    // 仅当 review 公开时才让搜索引擎跟踪；followers/mentioned 可见性视作不可索引
    const robots = review.visibility === 0 ? undefined : { index: false, follow: false };
    return {
      title,
      description,
      openGraph: { title, description, type: "article", images },
      twitter: { card: "summary_large_image", title, description, images: images?.map((i) => i.url) },
      ...(robots ? { robots } : {}),
    };
  } catch {
    return { title: "长评 · Folio" };
  }
}

export default async function ReviewPage({ params }: PageProps) {
  const { uuid } = await params;
  const session = await getSession();
  const externalUrl = session?.instance ? `https://${session.instance}/review/${uuid}/` : null;

  let review;
  try {
    review = await getReview(uuid);
  } catch (err) {
    // 404 → 真的不存在
    if (err instanceof NeoDBError && err.status === 404) notFound();
    // 401/403 → 没权限读，渲染兜底页给外链出口
    const status = err instanceof NeoDBError ? err.status : 0;
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[review/${uuid}] getReview failed:`, status, msg);
    return (
      <div style={{ padding: "60px 24px", maxWidth: 520, margin: "0 auto", textAlign: "center" }}>
        <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", letterSpacing: "0.06em" }}>
          REVIEW · {status || "ERROR"}
        </p>
        <h1 style={{ fontFamily: "var(--serif)", fontSize: 22, fontWeight: 500, marginTop: 10, letterSpacing: "-0.01em" }}>
          {status === 401 ? "需要登录" : status === 403 ? "无权访问这篇长评" : "暂时无法读取这篇长评"}
        </h1>
        <p style={{ fontFamily: "var(--serif)", fontSize: 13, color: "var(--text2)", marginTop: 12, lineHeight: 1.7 }}>
          {status === 403
            ? "可能因为可见性受限或 NeoDB API 拒绝。可以试试到 NeoDB 上直接打开。"
            : status === 401
              ? "Folio 当前会话失效，请重新登录后再试。"
              : "调用 NeoDB 接口时出错。也可以到 NeoDB 上直接打开。"}
        </p>
        {externalUrl && (
          <a
            href={externalUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="btn"
            style={{ marginTop: 18, display: "inline-flex" }}
          >
            在 NeoDB 打开 ↗
          </a>
        )}
        <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", marginTop: 22, opacity: 0.6 }}>
          {msg.slice(0, 200)}
        </p>
      </div>
    );
  }

  const ui = itemToUi(review.item);
  const wordCount = (review.body || "").length;
  const created = new Date(review.created_time);
  const dateLabel = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, "0")}-${String(created.getDate()).padStart(2, "0")}`;
  // review.url 可能是相对路径 /review/{uuid}；拼上 instance host 才是真的外链
  const neodbExternalUrl =
    review.url && review.url.startsWith("http")
      ? review.url
      : session?.instance && review.url
        ? `https://${session.instance}${review.url.startsWith("/") ? "" : "/"}${review.url}`
        : null;

  // ownership 检测：取我对此 item 的 review，若 uuid 与当前页相同则是我自己写的
  let isMine = false;
  if (session) {
    const myReview = await getMyReviewOfItem(ui.uuid).catch(() => null);
    if (myReview) {
      const myUuid = lastPathSegment(myReview.url) || lastPathSegment(myReview.api_url);
      if (myUuid && myUuid === uuid) isMine = true;
    }
  }

  // P0-2 纵深防御：NeoDB 上游通常已 sanitize，但绝不在客户端假设上游永远完美。
  // 白名单只放正文需要的标签 + a/img 的最小属性集。
  const safeHtml = review.html_content
    ? DOMPurify.sanitize(review.html_content, {
        ALLOWED_TAGS: [
          "p", "br", "strong", "em", "u", "s", "a", "blockquote",
          "ul", "ol", "li", "h2", "h3", "h4", "img", "code", "pre",
          "hr", "span", "figure", "figcaption",
        ],
        ALLOWED_ATTR: ["href", "src", "alt", "title", "rel", "target"],
        ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|\/)/i,
      })
    : "";

  return (
    <div className="review-page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <Link
          href={`/detail/${ui.medium}/${ui.uuid}`}
          style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", textDecoration: "none" }}
        >
          ← {ui.title}
        </Link>
        {isMine && <ReviewActions reviewUuid={uuid} itemUuid={ui.uuid} />}
      </div>

      <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {dateLabel} · {ui.title} · 长评
      </p>

      <h1 style={{ fontFamily: "var(--serif)", fontSize: 30, fontWeight: 500, lineHeight: 1.2, letterSpacing: "-0.02em", marginTop: 10 }}>
        {review.title}
      </h1>

      {review.html_content ? (
        <div
          className="review-body"
          dangerouslySetInnerHTML={{ __html: safeHtml }}
        />
      ) : (
        <div
          className="review-body"
          style={{ whiteSpace: "pre-wrap" }}
        >
          {review.body}
        </div>
      )}

      <div style={{
        marginTop: 28,
        paddingTop: 16,
        borderTop: "0.5px solid var(--border)",
        display: "flex",
        gap: 14,
        fontFamily: "var(--mono)",
        fontSize: 11,
        color: "var(--text3)",
      }}>
        <span>{wordCount} 字</span>
        <span>·</span>
        <span>{VIS_LABEL[review.visibility] ?? "—"}</span>
        {neodbExternalUrl && (
          <>
            <span>·</span>
            <a href={neodbExternalUrl} target="_blank" rel="noreferrer noopener" style={{ color: "var(--text3)", textDecoration: "underline", textUnderlineOffset: 3 }}>
              在 NeoDB 打开 ↗
            </a>
          </>
        )}
      </div>
    </div>
  );
}
