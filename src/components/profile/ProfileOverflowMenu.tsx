"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  profileUrl: string;
}

export function ProfileOverflowMenu({ profileUrl }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button
        type="button"
        className="profile-me-icon"
        onClick={() => setOpen((v) => !v)}
        aria-label="更多"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <i className="ti ti-dots" aria-hidden />
      </button>
      {open && (
        <div className="profile-overflow-menu" role="menu">
          <a
            href={profileUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="profile-overflow-item"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            <span>在 NeoDB 编辑</span>
            <i className="ti ti-external-link" aria-hidden />
          </a>
          <form action="/api/auth/logout" method="POST" style={{ margin: 0 }}>
            <button
              type="submit"
              className="profile-overflow-item"
              role="menuitem"
            >
              <span>登出</span>
              <i className="ti ti-logout" aria-hidden />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
