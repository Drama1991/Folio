"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRecordModal } from "@/lib/store/record-modal";

interface TabDef {
  href: string;
  label: string;
  iconOutline: string;
  iconFilled: string;
}

const LEFT_TABS: TabDef[] = [
  { href: "/home", label: "首页", iconOutline: "ti-home", iconFilled: "ti-home-filled" },
  { href: "/wishlist", label: "心愿单", iconOutline: "ti-heart", iconFilled: "ti-heart-filled" },
];
const RIGHT_TABS: TabDef[] = [
  { href: "/discover", label: "发现", iconOutline: "ti-compass", iconFilled: "ti-compass-filled" },
  { href: "/profile/me", label: "我", iconOutline: "ti-user", iconFilled: "ti-user-filled" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/profile/me") return pathname === "/profile/me" || pathname.startsWith("/profile/");
  return pathname === href || pathname.startsWith(href + "/");
}

function NavTab({ tab, pathname }: { tab: TabDef; pathname: string }) {
  const on = isActive(pathname, tab.href);
  return (
    <Link
      href={tab.href}
      className={`tab-item${on ? " on" : ""}`}
      aria-label={tab.label}
      aria-current={on ? "page" : undefined}
    >
      <i className={`ti ${on ? tab.iconFilled : tab.iconOutline}`} aria-hidden />
    </Link>
  );
}

export function BottomTabBar() {
  const pathname = usePathname();
  const showRecord = useRecordModal((s) => s.show);

  return (
    <nav className="bottom-tab-bar" aria-label="主导航">
      {LEFT_TABS.map((t) => (
        <NavTab key={t.href} tab={t} pathname={pathname} />
      ))}
      <button
        type="button"
        className="tab-record-cta"
        onClick={() => showRecord()}
        aria-label="记录"
      >
        <i className="ti ti-plus" aria-hidden />
      </button>
      {RIGHT_TABS.map((t) => (
        <NavTab key={t.href} tab={t} pathname={pathname} />
      ))}
    </nav>
  );
}
