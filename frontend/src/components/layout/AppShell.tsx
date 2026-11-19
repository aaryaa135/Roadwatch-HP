import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { cn } from "../../utils/format";

const COLLAPSE_KEY = "roadwatch.sidebar.collapsed";

export function AppShell() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
    } catch {
      // ignore storage failures
    }
  }, [collapsed]);

  useEffect(() => {
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-surface">
      <a href="#main-content" className="rw-sr-only">
        Skip to main content
      </a>
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((value) => !value)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div
        className={cn(
          "flex min-h-screen flex-col transition-[padding] duration-200",
          collapsed ? "lg:pl-[76px]" : "lg:pl-[260px]"
        )}
      >
        <Topbar onOpenMobile={() => setMobileOpen(true)} />
        <main id="main-content" className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1400px]">
            <Outlet />
          </div>
        </main>
        <footer className="border-t border-line px-4 py-4 text-xs text-muted sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1400px] flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <p>RoadWatch HP — Smarter Roads. Safer Journeys.</p>
            <p>Geospatial road intelligence for Himachal Pradesh.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
