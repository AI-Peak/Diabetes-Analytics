"use client";

import { usePathname } from "next/navigation";
import { Database, Menu } from "@/lib/icons";
import { PAGES } from "@/lib/data/constants";
import { ThemeToggle } from "./ThemeToggle";

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const pathname = usePathname();
  const current = PAGES.find((page) => pathname === page.href || pathname.startsWith(`${page.href}/`)) ?? PAGES[0];

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="menu-button" type="button" aria-label="Open navigation" onClick={onMenu}>
          <Menu size={17} aria-hidden="true" />
        </button>
        <div className="breadcrumb">Research / <strong>{current.label}</strong></div>
      </div>
      <div className="topbar-actions">
        <div className="dataset-chip"><Database size={13} aria-hidden="true" /> BRFSS 2015 · cleaned</div>
        <ThemeToggle />
      </div>
    </header>
  );
}
