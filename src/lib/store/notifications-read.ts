"use client";

// 通知未读游标 —— v1 单设备 localStorage 实现
//
// Mastodon API 本身没有 read/unread 状态。这里用"最后一次进通知页时看到的最大 id"
// 作为已读游标。Mastodon 通知 id 是字符串雪花（按字典序对比 = 按时间对比）。
//
// 跨设备同步靠 NeoDB 的 Mastodon markers API（GET/POST /api/v1/markers）才能做，
// 留给 v2。本 hook 内部不调网络，仅 localStorage。

import { useEffect, useState } from "react";

const KEY = "folio:notifications:last-read-id";

function read(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function write(id: string) {
  try {
    window.localStorage.setItem(KEY, id);
  } catch {
    /* ignore */
  }
}

export function useNotificationsReadCursor() {
  const [lastReadId, setLastReadId] = useState<string | null>(null);

  useEffect(() => {
    setLastReadId(read());
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setLastReadId(read());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  function markRead(id: string) {
    if (!id) return;
    setLastReadId((cur) => {
      if (cur && cur >= id) return cur;
      write(id);
      return id;
    });
  }

  return { lastReadId, markRead };
}

/** 字典序对比：Mastodon snowflake id 越大越新；服务端不可用。 */
export function isUnread(notifId: string, lastReadId: string | null): boolean {
  if (!lastReadId) return true;
  return notifId > lastReadId;
}
