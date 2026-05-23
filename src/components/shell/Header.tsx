"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AvatarMenu } from "./AvatarMenu";
import { HeaderSearch } from "./HeaderSearch";
import { useDrawer } from "@/lib/store/drawer";

interface HeaderProps {
  display: string;
  handle: string;
  avatar?: string;
}

function topLevel(pathname: string): "home" | "wishlist" | "discover" | null {
  if (pathname.startsWith("/home")) return "home";
  if (pathname.startsWith("/wishlist")) return "wishlist";
  if (pathname.startsWith("/discover")) return "discover";
  return null;
}

export function Header({ display, handle, avatar }: HeaderProps) {
  const pathname = usePathname();
  const cur = topLevel(pathname);
  const initial = display.slice(0, 1) || handle.slice(0, 1).toUpperCase();
  const toggleDrawer = useDrawer((s) => s.toggle);

  return (
    <header className="header">
      <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
        {/* ☰ 移动端汉堡 —— CSS 控制 display: none 在桌面（参见 .drawer-toggle 规则） */}
        <button
          type="button"
          className="drawer-toggle nav-icon-btn"
          onClick={toggleDrawer}
          aria-label="打开菜单"
        >
          <i className="ti ti-menu-2" aria-hidden />
        </button>
        <Link href="/home" className="brand" aria-label="Folio 首页">
          <img
            src="/folio-logo.png"
            alt="Folio"
            className="brand-mark"
            draggable={false}
          />
        </Link>
        <nav className="nav-desktop" style={{ display: "flex", gap: 2 }}>
          <Link href="/home" className={`nav-link${cur === "home" ? " on" : ""}`}>首页</Link>
          <Link href="/wishlist" className={`nav-link${cur === "wishlist" ? " on" : ""}`}>心愿单</Link>
          <Link href="/discover" className={`nav-link${cur === "discover" ? " on" : ""}`}>发现</Link>
        </nav>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <HeaderSearch />
        <span className="avatar-desktop">
          <AvatarMenu display={display} handle={handle} initial={initial} avatar={avatar} />
        </span>
      </div>
    </header>
  );
}
