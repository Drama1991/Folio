import Link from "next/link";
import { mockNotifications } from "@/lib/notifications/mock";
import { relativeTime } from "@/lib/format/dates";

const ICON: Record<string, string> = {
  follow: "ti-user-plus",
  mention: "ti-at",
  reply: "ti-message-circle",
  favorite: "ti-heart",
  system: "ti-info-circle",
};

export default function NotificationsPage() {
  return (
    <div style={{ padding: "20px 24px 28px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <Link href="/home" className="crumb">首页</Link>
        <span style={{ color: "var(--text3)", fontFamily: "var(--mono)", fontSize: 11 }}>/</span>
        <span className="crumb cur">通知</span>
      </div>
      <p style={{ fontFamily: "var(--serif)", fontSize: 26, fontWeight: 500, lineHeight: 1 }}>通知</p>

      <div style={{
        marginTop: 14, marginBottom: 14, padding: "11px 14px",
        background: "#FAEEDA", border: "0.5px solid #EFC97A", borderRadius: "var(--r)",
      }}>
        <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "#854F0B", letterSpacing: ".04em" }}>TODO</p>
        <p style={{ fontSize: 12, color: "#412402", marginTop: 4, lineHeight: 1.6 }}>
          NeoDB 当前未暴露 <code style={{ fontFamily: "var(--mono)" }}>/api/v1/notifications</code>。下方为 mock 占位，
          等 API 上线后无缝替换。
        </p>
      </div>

      <div style={{ border: "0.5px solid var(--border)", borderRadius: "var(--r)", overflow: "hidden" }}>
        {mockNotifications.map((n) => (
          <div key={n.id} className="row" style={{ alignItems: "flex-start", background: n.read ? "transparent" : "rgba(239,159,39,0.04)" }}>
            <div style={{
              width: 30, height: 30, borderRadius: "50%", background: "var(--bg2)",
              display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text2)",
            }}>
              <i className={`ti ${ICON[n.type] ?? "ti-bell"}`} style={{ fontSize: 14 }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13 }}>
                <span style={{ fontWeight: 500 }}>{n.actor.display}</span>{" "}
                <span style={{ color: "var(--text2)" }}>{n.text}</span>
              </p>
              {n.itemRef && (
                <Link href={`/detail/${n.itemRef.medium}/${n.itemRef.uuid}`} style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)", marginTop: 3, display: "inline-block" }}>
                  → {n.itemRef.title}
                </Link>
              )}
            </div>
            <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)" }}>
              {relativeTime(n.createdAt)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
