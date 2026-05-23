import Link from "next/link";
import { getSession } from "@/lib/auth/cookie";

export default async function NotificationsPage() {
  const session = await getSession();
  const externalUrl = session?.instance ? `https://${session.instance}/notifications/` : null;

  return (
    <div className="notifications-page">
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <Link href="/home" className="crumb">首页</Link>
        <span style={{ color: "var(--text3)", fontFamily: "var(--mono)", fontSize: 11 }}>/</span>
        <span className="crumb cur">通知</span>
      </div>
      <p style={{ fontFamily: "var(--serif)", fontSize: 26, fontWeight: 500, lineHeight: 1 }}>通知</p>

      <div className="notifications-empty" style={{
        marginTop: 36,
        padding: "48px 28px",
        border: "0.5px dashed var(--border)",
        borderRadius: "var(--r)",
        textAlign: "center",
      }}>
        <i className="ti ti-bell-off" style={{ fontSize: 28, color: "var(--text3)" }} />
        <p style={{ fontFamily: "var(--serif)", fontSize: 16, fontWeight: 500, marginTop: 14, letterSpacing: "-0.01em" }}>
          通知功能即将到来
        </p>
        <p style={{ fontSize: 13, color: "var(--text2)", marginTop: 8, lineHeight: 1.7, maxWidth: 380, marginInline: "auto" }}>
          NeoDB 暂未开放通知 API。上游接口上线后，关注、提及、回复、收藏会出现在这里。
        </p>
        {externalUrl && (
          <a
            href={externalUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="btn"
            style={{ marginTop: 22, display: "inline-flex" }}
          >
            在 NeoDB 查看通知 ↗
          </a>
        )}
      </div>
    </div>
  );
}
