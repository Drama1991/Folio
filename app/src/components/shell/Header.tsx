"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AvatarMenu } from "./AvatarMenu";
import { BellButton } from "./BellButton";
import { HeaderSearch } from "./HeaderSearch";

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

  return (
    <header className="header">
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <Link href="/home" style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
          <svg width="28" height="30" viewBox="0 0 26 28" fill="none">
            <path d="M2 2 H18 L24 8 V26 H2 Z" fill="var(--bg2)" stroke="var(--border2)" strokeWidth="1" />
            <path d="M18 2 L24 8 H18 Z" fill="var(--bg)" stroke="var(--border2)" strokeWidth="1" />
            <line x1="7" y1="12" x2="17" y2="12" stroke="var(--text)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="7" y1="16" x2="14" y2="16" stroke="var(--text)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="7" y1="20" x2="11" y2="20" stroke="var(--text)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span style={{ fontSize: 20, fontWeight: 500, letterSpacing: "-0.01em", fontFamily: "var(--serif)" }}>Folio</span>
        </Link>
        <nav style={{ display: "flex", gap: 2 }}>
          <Link href="/home" className={`nav-link${cur === "home" ? " on" : ""}`}>首页</Link>
          <Link href="/wishlist" className={`nav-link${cur === "wishlist" ? " on" : ""}`}>想看</Link>
          <Link href="/discover" className={`nav-link${cur === "discover" ? " on" : ""}`}>发现</Link>
        </nav>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <HeaderSearch />
        <BellButton />
        <AvatarMenu display={display} handle={handle} initial={initial} avatar={avatar} />
      </div>
    </header>
  );
}
