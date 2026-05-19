"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AvatarMenu } from "./AvatarMenu";
import { BellButton } from "./BellButton";

interface HeaderProps {
  display: string;
  handle: string;
}

function topLevel(pathname: string): "home" | "wishlist" | "discover" | null {
  if (pathname.startsWith("/home")) return "home";
  if (pathname.startsWith("/wishlist")) return "wishlist";
  if (pathname.startsWith("/discover")) return "discover";
  return null;
}

export function Header({ display, handle }: HeaderProps) {
  const pathname = usePathname();
  const cur = topLevel(pathname);
  const initial = display.slice(0, 1) || handle.slice(0, 1).toUpperCase();

  return (
    <header className="header">
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <Link href="/home" style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <svg width="24" height="26" viewBox="0 0 26 28" fill="none">
            <path d="M2 2 H18 L24 8 V26 H2 Z" fill="var(--bg2)" stroke="var(--border2)" strokeWidth="1" />
            <path d="M18 2 L24 8 H18 Z" fill="var(--bg)" stroke="var(--border2)" strokeWidth="1" />
            <line x1="7" y1="12" x2="17" y2="12" stroke="var(--text)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="7" y1="16" x2="14" y2="16" stroke="var(--text)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="7" y1="20" x2="11" y2="20" stroke="var(--text)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span style={{ fontSize: 15, fontWeight: 500, letterSpacing: "-0.01em", fontFamily: "var(--serif)" }}>Folio</span>
        </Link>
        <nav style={{ display: "flex", gap: 2 }}>
          <Link href="/home" className={`nav-link${cur === "home" ? " on" : ""}`}>首页</Link>
          <Link href="/wishlist" className={`nav-link${cur === "wishlist" ? " on" : ""}`}>想看</Link>
          <Link href="/discover" className={`nav-link${cur === "discover" ? " on" : ""}`}>发现</Link>
        </nav>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Link href="/search" className="search-box" style={{ textDecoration: "none" }}>
          <i className="ti ti-search" style={{ fontSize: 13, color: "var(--text3)" }} />
          <span style={{ fontSize: 12, color: "var(--text3)", flex: 1 }}>搜索...</span>
          <span style={{ fontSize: 10, color: "var(--text3)", background: "var(--bg)", border: "0.5px solid var(--border)", borderRadius: 4, padding: "1px 5px", fontFamily: "var(--mono)" }}>⌘K</span>
        </Link>
        <BellButton />
        <AvatarMenu display={display} handle={handle} initial={initial} />
      </div>
    </header>
  );
}
