"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconHome,
  IconHomeFilled,
  IconHeart,
  IconHeartFilled,
  IconCompass,
  IconCompassFilled,
  IconUser,
  IconUserFilled,
} from "@tabler/icons-react";
import type { Icon as TablerIcon } from "@tabler/icons-react";
import { useRecordModal } from "@/lib/store/record-modal";
import { useHideOnScroll } from "@/lib/hooks/useHideOnScroll";

interface TabDef {
  href: string;
  label: string;
  Outline: TablerIcon;
  Filled: TablerIcon;
}

const LEFT_TABS: TabDef[] = [
  { href: "/home", label: "首页", Outline: IconHome, Filled: IconHomeFilled },
  { href: "/wishlist", label: "心愿单", Outline: IconHeart, Filled: IconHeartFilled },
];
const RIGHT_TABS: TabDef[] = [
  { href: "/discover", label: "发现", Outline: IconCompass, Filled: IconCompassFilled },
  { href: "/profile/me", label: "我", Outline: IconUser, Filled: IconUserFilled },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/profile/me") return pathname === "/profile/me" || pathname.startsWith("/profile/");
  return pathname === href || pathname.startsWith(href + "/");
}

function NavTab({ tab, pathname }: { tab: TabDef; pathname: string }) {
  const on = isActive(pathname, tab.href);
  const Icon = on ? tab.Filled : tab.Outline;
  return (
    <Link
      href={tab.href}
      className={`tab-item${on ? " on" : ""}`}
      aria-label={tab.label}
      aria-current={on ? "page" : undefined}
    >
      <Icon size={28} stroke={1.6} aria-hidden />
    </Link>
  );
}

export function BottomTabBar() {
  const pathname = usePathname();
  const showRecord = useRecordModal((s) => s.show);
  const hidden = useHideOnScroll();

  return (
    <nav
      className={`bottom-tab-bar${hidden ? " bottom-tab-bar-hidden" : ""}`}
      aria-label="主导航"
    >
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
