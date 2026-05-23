"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDrawer } from "@/lib/store/drawer";

interface DrawerProps {
  display: string;
  handle: string;
  avatar?: string;
}

export function Drawer({ display, handle, avatar }: DrawerProps) {
  const open = useDrawer((s) => s.open);
  const hide = useDrawer((s) => s.hide);
  const pathname = usePathname();
  const initial = display.slice(0, 1) || handle.slice(0, 1).toUpperCase();

  // 路由切换自动关
  useEffect(() => {
    hide();
  }, [pathname, hide]);

  // ESC 关
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") hide();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, hide]);

  // body 锁滚 —— 抽屉打开时禁止背景滚动
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <div
        className={`drawer-mask${open ? " on" : ""}`}
        onClick={hide}
        aria-hidden
      />
      <aside
        className={`drawer${open ? " on" : ""}`}
        role="dialog"
        aria-modal={open}
        aria-label="导航菜单"
      >
        <div className="drawer-head">
          <button
            type="button"
            className="nav-icon-btn"
            onClick={hide}
            aria-label="关闭菜单"
          >
            <i className="ti ti-x" aria-hidden />
          </button>
        </div>
        <nav className="drawer-nav">
          <NavLink href="/home" icon="ti-home" label="首页" current={pathname} />
          <NavLink href="/wishlist" icon="ti-heart" label="心愿单" current={pathname} />
          <NavLink href="/discover" icon="ti-compass" label="发现" current={pathname} />
          <NavLink href="/notifications" icon="ti-bell" label="通知" current={pathname} />
          <div className="drawer-divider" />
          <NavLink href="/profile/me" icon="ti-user" label="个人主页" current={pathname} />
          <NavLink href="/settings" icon="ti-settings" label="设置" current={pathname} />
          <div className="drawer-divider" />
          {/* P1-8 一致：注销走 POST form 防 CSRF */}
          <form action="/api/auth/logout" method="POST" style={{ margin: 0 }}>
            <button type="submit">
              <i className="ti ti-logout" aria-hidden />
              <span>登出</span>
            </button>
          </form>
        </nav>
        <div className="drawer-foot">
          <div className="av">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt={display} />
            ) : (
              initial
            )}
          </div>
          <div className="who">
            <div className="name">{display}</div>
            <div className="handle">{handle}</div>
          </div>
        </div>
      </aside>
    </>
  );
}

function NavLink({
  href,
  icon,
  label,
  current,
}: {
  href: string;
  icon: string;
  label: string;
  current: string;
}) {
  const on = current === href || current.startsWith(href + "/");
  return (
    <Link href={href} className={on ? "on" : undefined}>
      <i className={`ti ${icon}`} aria-hidden />
      <span>{label}</span>
    </Link>
  );
}
