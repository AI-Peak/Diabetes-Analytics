"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, BarChart3, Brain, Github, MessageSquare, X } from "@/lib/icons";
import { PAGES } from "@/lib/data/constants";

const iconById = {
  overview: Activity,
  rq1: BarChart3,
  rq2: Activity,
  rq3: Brain,
  assistant: MessageSquare,
};

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();

  return (
    <aside className={`sidebar${open ? " open" : ""}`} aria-label="Primary navigation">
      <button className="sidebar-close" type="button" aria-label="Close menu" onClick={onClose}>
        <X size={17} aria-hidden="true" />
      </button>
      <Link className="sidebar-brand" href="/overview" onClick={onClose}>
        <span className="brand-mark" aria-hidden="true"><Activity size={20} /></span>
        <span>
          <span className="brand-name">Diabetes Analytics</span>
          <span className="brand-sub">CDC BRFSS 2015 · CRISP-DM</span>
        </span>
      </Link>

      <nav className="sidebar-nav">
        <span className="nav-label">Research workspace</span>
        {PAGES.map((page) => {
          const Icon = iconById[page.id];
          const active = pathname === page.href || pathname.startsWith(`${page.href}/`);
          return (
            <Link
              className={`nav-item${active ? " active" : ""}`}
              href={page.href}
              key={page.id}
              aria-current={active ? "page" : undefined}
              onClick={onClose}
            >
              <span className="nav-index" aria-hidden="true">{"idx" in page ? page.idx : <Icon size={15} />}</span>
              <span className="nav-copy">
                <span className="nav-title">{page.label}<span className="nav-tag">{page.tag}</span></span>
                <span className="nav-desc">{page.description}</span>
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="data-status" aria-label="Data status: ready">
          <div className="status-heading"><span>Data status</span><span className="status-dot" aria-hidden="true" /></div>
          <div className="status-row"><span>records</span><span>229,474</span></div>
          <div className="status-row"><span>build</span><span>precomputed</span></div>
        </div>
        <a className="github-link" href="https://github.com/AI-Peak/Diabetes-Analytics" target="_blank" rel="noreferrer">
          <Github size={13} aria-hidden="true" /> Source repository
        </a>
      </div>
    </aside>
  );
}
