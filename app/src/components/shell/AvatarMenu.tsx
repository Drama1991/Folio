"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

interface AvatarMenuProps {
  display: string;
  handle: string;
  initial: string;
  avatar?: string;
}

export function AvatarMenu({ display, handle, initial, avatar }: AvatarMenuProps) {
  const [open, setOpen] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const showImg = !!avatar && !imgFailed;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        className="avatar"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={display}
        style={showImg ? { padding: 0, overflow: "hidden" } : undefined}
      >
        {showImg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatar}
            alt={display}
            width={28}
            height={28}
            onError={() => setImgFailed(true)}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          initial
        )}
      </button>
      {open && (
        <div
          className="fade-up"
          style={{
            position: "absolute", top: "calc(100% + 10px)", right: 0, width: 224,
            background: "var(--bg)", border: "0.5px solid var(--border)", borderRadius: "var(--r)",
            padding: 6, boxShadow: "0 6px 24px rgba(0,0,0,0.07)", zIndex: 50,
          }}
        >
          <div style={{ padding: "11px 12px 13px", borderBottom: "0.5px solid var(--border)", marginBottom: 6 }}>
            <p style={{ fontFamily: "var(--serif)", fontSize: 14, fontWeight: 500, letterSpacing: "-0.01em" }}>{display}</p>
            <p style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)", marginTop: 4, letterSpacing: ".02em" }}>{handle}</p>
          </div>
          <MenuItem href="/profile/me" icon="ti-user" label="个人主页" />
          <MenuItem href="/settings" icon="ti-settings" label="设置" />
          <div style={{ height: "0.5px", background: "var(--border)", margin: "5px 0" }} />
          <MenuItem href="/api/auth/logout" icon="ti-logout" label="登出" danger />
        </div>
      )}
    </div>
  );
}

function MenuItem({ href, icon, label, danger }: { href: string; icon: string; label: string; danger?: boolean }) {
  return (
    <Link
      href={href}
      style={{
        display: "flex", alignItems: "center", gap: 11, padding: "8px 12px", borderRadius: "var(--r2)",
        fontSize: 13, color: "var(--text2)", textDecoration: "none",
      }}
      onMouseOver={(e) => {
        (e.currentTarget as HTMLElement).style.background = danger ? "#F5E4E0" : "var(--bg2)";
        (e.currentTarget as HTMLElement).style.color = danger ? "#A03B3B" : "var(--text)";
      }}
      onMouseOut={(e) => {
        (e.currentTarget as HTMLElement).style.background = "transparent";
        (e.currentTarget as HTMLElement).style.color = "var(--text2)";
      }}
    >
      <i className={`ti ${icon}`} style={{ fontSize: 14, color: "var(--text3)", width: 16, textAlign: "center" }} />
      <span>{label}</span>
    </Link>
  );
}
