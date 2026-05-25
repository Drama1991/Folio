"use client";

import Link from "next/link";
import type { UiNotification, UiNotificationKind } from "@/lib/neodb/ui-types";
import { isUnread } from "@/lib/store/notifications-read";

const KIND_ICON: Record<UiNotificationKind, string> = {
  mention: "ti-at",
  favourite: "ti-heart-filled",
  reblog: "ti-repeat",
  follow: "ti-user-plus",
  follow_request: "ti-user-question",
  status: "ti-news",
  update: "ti-pencil",
  other: "ti-bell",
};

const KIND_LABEL: Record<UiNotificationKind, string> = {
  mention: "提到了你",
  favourite: "赞了你的内容",
  reblog: "转发了你",
  follow: "关注了你",
  follow_request: "请求关注",
  status: "发布了新内容",
  update: "更新了帖子",
  other: "提醒",
};

function rel(iso: string): string {
  const t = +new Date(iso);
  if (Number.isNaN(t)) return "";
  const diff = Date.now() - t;
  if (diff < 0) return "刚刚";
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo`;
  return `${Math.floor(d / 365)}y`;
}

export function NotificationRow({
  item,
  lastReadId,
}: {
  item: UiNotification;
  lastReadId: string | null;
}) {
  const unread = isUnread(item.id, lastReadId);
  const className = `notif-row${unread ? " unread" : ""}`;
  const initial = item.author.displayName.slice(0, 1).toUpperCase();

  const inner = (
    <>
      <span className="notif-row__avatar">
        {item.author.avatar ? (
          <img src={item.author.avatar} alt="" />
        ) : (
          <span aria-hidden>{initial}</span>
        )}
        <i className={`ti ${KIND_ICON[item.kind]} notif-row__kind-icon`} aria-hidden />
      </span>
      <div className="notif-row__body">
        <p className="notif-row__head">
          <span className="notif-row__name">{item.author.displayName}</span>
          <span className="notif-row__verb">{KIND_LABEL[item.kind]}</span>
          <span className="notif-row__time">{rel(item.createdAt)}</span>
        </p>
        {item.preview && <p className="notif-row__preview">{item.preview}</p>}
      </div>
      {unread && <span className="notif-row__dot" aria-label="未读" />}
    </>
  );

  if (item.target.type === "internal") {
    return (
      <Link href={item.target.href} className={className}>
        {inner}
      </Link>
    );
  }
  return (
    <a
      href={item.target.href}
      target="_blank"
      rel="noreferrer noopener"
      className={className}
    >
      {inner}
    </a>
  );
}
