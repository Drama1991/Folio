"use client";

import { useEffect } from "react";
import type { UiNotification } from "@/lib/neodb/ui-types";
import { useNotificationsReadCursor } from "@/lib/store/notifications-read";
import { NotificationRow } from "./NotificationRow";

export function NotificationsListClient({ items }: { items: UiNotification[] }) {
  const { lastReadId, markRead } = useNotificationsReadCursor();
  const topId = items[0]?.id ?? null;

  // 进页面后把当前最大 id 写入游标。后续刷新前到来的更新通知会被标为未读。
  useEffect(() => {
    if (topId) markRead(topId);
  }, [topId, markRead]);

  return (
    <div className="notif-list">
      {items.map((it) => (
        <NotificationRow key={it.id} item={it} lastReadId={lastReadId} />
      ))}
    </div>
  );
}
