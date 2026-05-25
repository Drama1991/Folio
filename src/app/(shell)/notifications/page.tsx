import Link from "next/link";
import { getSession } from "@/lib/auth/cookie";
import { listNotifications } from "@/lib/neodb/client";
import { mastodonNotificationToUi } from "@/lib/neodb/mappers";
import { NotificationsListClient } from "@/components/notifications/NotificationsListClient";
import { EmptyState } from "@/components/shared/EmptyState";

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
        <div style={{ marginTop: 36 }}>
          <EmptyState
            icon="ti-bell-off"
            title="还没有通知"
            description="被人 @ 提到、点赞、转发或关注时会出现在这里。"
          />
        </div>
      ) : (
        <NotificationsListClient items={items} />
      )}
    </div>
  );
}
