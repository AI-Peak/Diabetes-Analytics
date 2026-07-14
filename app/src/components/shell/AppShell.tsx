"use client";

import { useState } from "react";
import { DisclaimerBanner } from "./DisclaimerBanner";
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
          <DisclaimerBanner />
          <main className="main-scroll" id="main-content">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
