import Link from "next/link";
import { getSession } from "@/lib/auth/cookie";
import { listNotifications } from "@/lib/neodb/client";
import { mastodonNotificationToUi } from "@/lib/neodb/mappers";
import { NotificationsListClient } from "@/components/notifications/NotificationsListClient";

export default async function NotificationsPage() {
  const session = await getSession();
  const externalUrl = session?.instance ? `https://${session.instance}/notifications/` : null;

  const raw = await listNotifications({ limit: 40 });
  const items = raw.map(mastodonNotificationToUi);

  return (
    <div className="notifications-page">
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <Link href="/home" className="crumb">首页</Link>
        <span style={{ color: "var(--text3)", fontFamily: "var(--mono)", fontSize: 11 }}>/</span>
        <span className="crumb cur">通知</span>
      </div>
      <p style={{ fontFamily: "var(--serif)", fontSize: 26, fontWeight: 500, lineHeight: 1 }}>通知</p>
      <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", marginTop: 5 }}>
        {items.length > 0 ? `共 ${items.length} 条` : "暂无通知"}
        {externalUrl && (
          <>
            {" · "}
            <a
              href={externalUrl}
              target="_blank"
              rel="noreferrer noopener"
              style={{ color: "var(--text3)", textDecoration: "underline" }}
            >
              在 NeoDB 查看 ↗
            </a>
          </>
        )}
      </p>

      {items.length === 0 ? (
        <div
          className="notifications-empty"
          style={{
            marginTop: 36,
            padding: "48px 28px",
            border: "0.5px dashed var(--border)",
            borderRadius: "var(--r)",
            textAlign: "center",
          }}
        >
          <i className="ti ti-bell-off" style={{ fontSize: 28, color: "var(--text3)" }} />
          <p
            style={{
              fontFamily: "var(--serif)",
              fontSize: 16,
              fontWeight: 500,
              marginTop: 14,
              letterSpacing: "-0.01em",
            }}
          >
            还没有通知
          </p>
          <p
            style={{
              fontSize: 13,
              color: "var(--text2)",
              marginTop: 8,
              lineHeight: 1.7,
              maxWidth: 380,
              marginInline: "auto",
            }}
          >
            被人 @ 提到、点赞、转发或关注时会出现在这里。
          </p>
        </div>
      ) : (
        <NotificationsListClient items={items} />
      )}
    </div>
  );
}
