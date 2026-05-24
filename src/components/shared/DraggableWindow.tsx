"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Box { x: number; y: number; w: number; h: number; }

interface Props {
  /** 触发点视口坐标，用作进入动画的 transform-origin 与首次定位锚点 */
  origin?: { x: number; y: number } | null;
  defaultSize?: { w: number; h: number };
  minSize?: { w: number; h: number };
  /** localStorage 持久化 key；同一 key 下次打开会恢复位置/尺寸 */
  storageKey?: string;
  onClose: () => void;
  header: React.ReactNode;
  children: React.ReactNode;
}

const STORAGE_PREFIX = "folio.window.";
const DEFAULT_SIZE = { w: 380, h: 520 };
const MIN_SIZE = { w: 300, h: 340 };
const MOBILE_BP = 768;

function readStored(key: string): Partial<Box> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + key);
    return raw ? (JSON.parse(raw) as Partial<Box>) : null;
  } catch { return null; }
}

function writeStored(key: string, box: Box) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(box)); } catch {}
}

function clampToViewport(box: Box): Box {
  if (typeof window === "undefined") return box;
  const vw = window.innerWidth, vh = window.innerHeight;
  const w = Math.min(box.w, vw - 16);
  const h = Math.min(box.h, vh - 16);
  const x = Math.max(8, Math.min(box.x, vw - w - 8));
  const y = Math.max(8, Math.min(box.y, vh - h - 8));
  return { x, y, w, h };
}

export function DraggableWindow({
  origin,
  defaultSize = DEFAULT_SIZE,
  minSize = MIN_SIZE,
  storageKey,
  onClose,
  header,
  children,
}: Props) {
  const [isMobile, setIsMobile] = useState(false);
  const [box, setBox] = useState<Box | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mobile = window.innerWidth < MOBILE_BP;
    setIsMobile(mobile);
    if (mobile) {
      setBox({ x: 0, y: 0, w: window.innerWidth, h: window.innerHeight });
    } else {
      const stored = storageKey ? readStored(storageKey) : null;
      const w = stored?.w ?? defaultSize.w;
      const h = stored?.h ?? defaultSize.h;
      let x: number, y: number;
      if (stored?.x != null && stored?.y != null) {
        x = stored.x; y = stored.y;
      } else if (origin) {
        // 让窗口在 origin 下方略偏左展开，header 贴近触发点
        x = origin.x - w / 2;
        y = origin.y - 28;
      } else {
        x = (window.innerWidth - w) / 2;
        y = (window.innerHeight - h) / 2;
      }
      setBox(clampToViewport({ x, y, w, h }));
    }
    requestAnimationFrame(() => setMounted(true));
    const onResize = () => {
      const m = window.innerWidth < MOBILE_BP;
      setIsMobile(m);
      if (m) {
        setBox({ x: 0, y: 0, w: window.innerWidth, h: window.innerHeight });
      } else {
        setBox((b) => (b ? clampToViewport(b) : b));
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!box || isMobile || !storageKey || !mounted) return;
    writeStored(storageKey, box);
  }, [box, isMobile, storageKey, mounted]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const dragOffset = useRef<{ x: number; y: number } | null>(null);
  const onHeaderPointerDown = useCallback((e: React.PointerEvent) => {
    if (isMobile || !box) return;
    // 按钮内点击不进入拖动
    if ((e.target as HTMLElement).closest("button")) return;
    e.preventDefault();
    dragOffset.current = { x: e.clientX - box.x, y: e.clientY - box.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [isMobile, box]);

  const onHeaderPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragOffset.current || isMobile) return;
    const off = dragOffset.current;
    setBox((b) => (b ? clampToViewport({ ...b, x: e.clientX - off.x, y: e.clientY - off.y }) : b));
  }, [isMobile]);

  const onHeaderPointerUp = useCallback((e: React.PointerEvent) => {
    dragOffset.current = null;
    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
  }, []);

  const resizeStart = useRef<{ x: number; y: number; w: number; h: number } | null>(null);
  const onResizePointerDown = useCallback((e: React.PointerEvent) => {
    if (isMobile || !box) return;
    e.preventDefault();
    e.stopPropagation();
    resizeStart.current = { x: e.clientX, y: e.clientY, w: box.w, h: box.h };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [isMobile, box]);

  const onResizePointerMove = useCallback((e: React.PointerEvent) => {
    if (!resizeStart.current || isMobile) return;
    const s = resizeStart.current;
    setBox((b) => {
      if (!b) return b;
      const w = Math.max(minSize.w, s.w + (e.clientX - s.x));
      const h = Math.max(minSize.h, s.h + (e.clientY - s.y));
      return clampToViewport({ ...b, w, h });
    });
  }, [isMobile, minSize.w, minSize.h]);

  const onResizePointerUp = useCallback((e: React.PointerEvent) => {
    resizeStart.current = null;
    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
  }, []);

  if (!box) return null;

  let transformOriginCss = "center";
  if (origin && !isMobile) {
    const ox = Math.max(0, Math.min(box.w, origin.x - box.x));
    const oy = Math.max(0, Math.min(box.h, origin.y - box.y));
    transformOriginCss = `${ox}px ${oy}px`;
  }

  return (
    <div
      style={{
        position: "fixed",
        left: box.x,
        top: box.y,
        width: box.w,
        height: box.h,
        background: "var(--bg)",
        border: isMobile ? "none" : "0.5px solid var(--border)",
        borderRadius: isMobile ? 0 : "var(--r)",
        boxShadow: isMobile
          ? "0 -8px 30px rgba(0,0,0,0.2)"
          : "0 24px 60px rgba(0,0,0,0.18), 0 4px 14px rgba(0,0,0,0.08)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        zIndex: 60,
        transformOrigin: transformOriginCss,
        transform: isMobile
          ? (mounted ? "translateY(0)" : "translateY(100%)")
          : (mounted ? "scale(1)" : "scale(0.55)"),
        opacity: isMobile ? 1 : (mounted ? 1 : 0),
        transition: isMobile
          ? "transform .26s cubic-bezier(.2,.8,.2,1)"
          : "transform .18s cubic-bezier(.16,.84,.44,1), opacity .15s ease",
      }}
    >
      {isMobile && (
        <div
          aria-hidden
          style={{
            flexShrink: 0,
            width: 38,
            height: 4,
            background: "var(--border2)",
            borderRadius: 2,
            margin: "8px auto 0",
          }}
        />
      )}
      <div
        onPointerDown={onHeaderPointerDown}
        onPointerMove={onHeaderPointerMove}
        onPointerUp={onHeaderPointerUp}
        onPointerCancel={onHeaderPointerUp}
        style={{ cursor: isMobile ? "default" : "grab", userSelect: "none", touchAction: "none" }}
      >
        {header}
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {children}
      </div>

      {!isMobile && (
        <div
          onPointerDown={onResizePointerDown}
          onPointerMove={onResizePointerMove}
          onPointerUp={onResizePointerUp}
          onPointerCancel={onResizePointerUp}
          style={{
            position: "absolute", right: 0, bottom: 0, width: 16, height: 16,
            cursor: "nwse-resize", touchAction: "none",
          }}
          aria-hidden
        >
          <svg viewBox="0 0 16 16" width="16" height="16" style={{ display: "block" }}>
            <path d="M11 15 L15 11 M7 15 L15 7" stroke="var(--text3)" strokeWidth="1" fill="none" />
          </svg>
        </div>
      )}
    </div>
  );
}
