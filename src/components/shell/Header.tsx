"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AvatarMenu } from "./AvatarMenu";
import { HeaderSearch } from "./HeaderSearch";
import { useHideOnScroll } from "@/lib/hooks/useHideOnScroll";
import { useRecordModal } from "@/lib/store/record-modal";

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
  const hidden = useHideOnScroll();
  const showRecord = useRecordModal((s) => s.show);

  return (
    <header className={`header${hidden ? " header-hidden" : ""}`}>
      <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
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
        <button
          type="button"
          className="header-record-btn"
          onClick={() => showRecord()}
          aria-label="新增记录"
        >
          <i className="ti ti-plus" aria-hidden />
          <span>记录</span>
        </button>
        <HeaderSearch />
        <Link href="/notifications" aria-label="通知" className="header-bell">
          <i className="ti ti-bell" aria-hidden />
        </Link>
        <span className="avatar-desktop">
          <AvatarMenu display={display} handle={handle} initial={initial} avatar={avatar} />
        </span>
      </div>
    </header>
  );
}
