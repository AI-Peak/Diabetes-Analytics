"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="site-stage">
      <div className="app-frame">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        {sidebarOpen ? (
          <button className="mobile-backdrop" type="button" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />
        ) : null}
        <div className="content-shell">
          <Topbar onMenu={() => setSidebarOpen(true)} />
          {/* The sidebar footer carries this notice on desktop, but the sidebar
              collapses into a dismissible drawer below 920px. This keeps the
              non-diagnostic disclaimer present on every page at every width. */}
          <p className="shell-disclaimer">Research and education tool, not a diagnostic device. Association is not causation.</p>
          <main className="main-scroll" id="main-content">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
