import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * 把 Tab / Shift+Tab 锁在 ref 节点内，进入时把焦点设到第一个可聚焦元素，
 * 退出时把焦点还给进入前的元素。不处理 Escape —— 调用方自己监听。
 *
 * 用法：
 *   const trapRef = useFocusTrap<HTMLDivElement>(open);
 *   return open ? <div ref={trapRef}>...</div> : null;
 */
export function useFocusTrap<T extends HTMLElement>(active: boolean) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    if (!active) return;
    const root = ref.current;
    if (!root) return;

    const previousFocus = document.activeElement as HTMLElement | null;

    function focusables(): HTMLElement[] {
      return Array.from(root!.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
        .filter((el) => el.offsetParent !== null);
    }

    // 初始焦点：第一个可聚焦元素（除非容器内已有焦点）
    if (!root.contains(document.activeElement)) {
      focusables()[0]?.focus();
    }

    function onKey(e: KeyboardEvent) {
      if (e.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const head = items[0];
      const tail = items[items.length - 1];
      const cur = document.activeElement as HTMLElement | null;
      if (e.shiftKey && (cur === head || !root!.contains(cur))) {
        e.preventDefault();
        tail.focus();
      } else if (!e.shiftKey && (cur === tail || !root!.contains(cur))) {
        e.preventDefault();
        head.focus();
      }
    }

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      // best-effort 还原焦点；若原元素已 unmount 由浏览器降级到 body
      if (previousFocus && document.contains(previousFocus)) {
        previousFocus.focus();
      }
    };
  }, [active]);

  return ref;
}
