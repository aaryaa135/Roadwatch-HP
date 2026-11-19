import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  ChevronRight,
  LogOut,
  Menu,
  Plus,
  Settings,
  ShieldCheck,
  User,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getReports } from "../../services/api";
import { cn, initials } from "../../utils/format";
import { Button } from "../ui/Button";

const pageTitles: Record<string, string> = {
  "/app": "Overview",
  "/app/map": "Hazard Map",
  "/app/report": "Report a Hazard",
  "/app/reports": "All Reports",
  "/app/verification": "Verification",
  "/app/analytics": "Analytics",
  "/app/profile": "My Profile",
  "/app/settings": "Settings",
};

function getPageTitle(pathname: string) {
  if (pageTitles[pathname]) return pageTitles[pathname];
  if (/^\/app\/reports\/[^/]+$/.test(pathname)) return "Report Details";
  return "RoadWatch HP";
}

function useOutsideClick<T extends HTMLElement>(
  onOutside: () => void
) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onOutside();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onOutside]);
  return ref;
}

export function Topbar({ onOpenMobile }: { onOpenMobile: () => void }) {
  const { user, isAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const notificationsRef = useOutsideClick<HTMLDivElement>(() =>
    setNotificationsOpen(false)
  );
  const profileRef = useOutsideClick<HTMLDivElement>(() => setProfileOpen(false));

  useEffect(() => {
    let cancelled = false;
    getReports({ status: "pending", limit: 100 })
      .then((reports) => {
        if (!cancelled) setPendingCount(reports.length);
      })
      .catch(() => {
        if (!cancelled) setPendingCount(0);
      });
    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  useEffect(() => {
    setNotificationsOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  const title = getPageTitle(location.pathname);
  const isReportDetail = /^\/app\/reports\/[^/]+$/.test(location.pathname);
  const notificationTarget = isAdmin ? "/app/verification" : "/app/reports";

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onOpenMobile}
          className="rounded-md p-2 text-muted hover:bg-surface hover:text-ink lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[11px] text-muted">
            <Link to="/app" className="font-medium text-brand-700 hover:text-brand-800">
              RoadWatch
            </Link>
            <ChevronRight className="h-3 w-3" aria-hidden="true" />
            {isReportDetail ? (
              <>
                <Link to="/app/reports" className="hover:text-ink">
                  All Reports
                </Link>
                <ChevronRight className="h-3 w-3" aria-hidden="true" />
              </>
            ) : null}
            <span className="truncate text-ink/70">{title}</span>
          </div>
          <h1 className="truncate text-lg font-semibold tracking-tight text-ink">
            {title}
          </h1>
        </div>

        <Link to="/app/report" className="hidden sm:block">
          <Button size="sm" icon={<Plus className="h-4 w-4" />}>
            Quick report
          </Button>
        </Link>

        <div className="relative" ref={notificationsRef}>
          <button
            type="button"
            onClick={() => {
              setNotificationsOpen((open) => !open);
              setProfileOpen(false);
            }}
            className="relative rounded-full p-2 text-muted transition-colors hover:bg-surface hover:text-ink"
            aria-label={`Notifications${pendingCount ? `, ${pendingCount} pending reports` : ""}`}
            aria-expanded={notificationsOpen}
          >
            <Bell className="h-5 w-5" />
            {pendingCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-severity-high ring-2 ring-white" />
            )}
          </button>
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-72 animate-fade-in rounded-xl border border-line bg-white p-2 shadow-float">
              <div className="flex items-center justify-between px-2 py-1.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Notifications
                </p>
                {pendingCount > 0 && (
                  <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                    {pendingCount} pending
                  </span>
                )}
              </div>
              <Link
                to={notificationTarget}
                onClick={() => setNotificationsOpen(false)}
                className="block rounded-lg px-2 py-2.5 text-sm transition-colors hover:bg-surface"
              >
                {pendingCount > 0 ? (
                  <>
                    <p className="font-medium text-ink">
                      {pendingCount} report{pendingCount === 1 ? "" : "s"} awaiting review
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      Open the verification queue to review them.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-ink">You're all caught up</p>
                    <p className="mt-0.5 text-xs text-muted">
                      No reports are currently awaiting verification.
                    </p>
                  </>
                )}
              </Link>
            </div>
          )}
        </div>

        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => {
              setProfileOpen((open) => !open);
              setNotificationsOpen(false);
            }}
            className="flex items-center gap-2 rounded-full border border-line p-0.5 pr-2 transition-colors hover:bg-surface"
            aria-label="Open profile menu"
            aria-expanded={profileOpen}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-[11px] font-bold text-white">
              {user ? initials(user.full_name) : "RW"}
            </span>
            <span className="hidden max-w-[120px] truncate text-xs font-semibold text-ink md:block">
              {user?.full_name ?? "Account"}
            </span>
          </button>
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-60 animate-fade-in rounded-xl border border-line bg-white p-2 shadow-float">
              <div className="border-b border-line px-2 pb-2.5 pt-1">
                <p className="truncate text-sm font-semibold text-ink">
                  {user?.full_name}
                </p>
                <p className="truncate text-xs text-muted">{user?.email}</p>
                <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold capitalize text-brand-700">
                  {isAdmin ? (
                    <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                  ) : (
                    <User className="h-3 w-3" aria-hidden="true" />
                  )}
                  {user?.role}
                </span>
              </div>
              <div className="pt-1">
                <Link
                  to="/app/profile"
                  className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-ink hover:bg-surface"
                  onClick={() => setProfileOpen(false)}
                >
                  <User className="h-4 w-4 text-muted" />
                  My Profile
                </Link>
                <Link
                  to="/app/settings"
                  className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-ink hover:bg-surface"
                  onClick={() => setProfileOpen(false)}
                >
                  <Settings className="h-4 w-4 text-muted" />
                  Settings
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-severity-high hover:bg-red-50"
                  )}
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="rw-gradient-bar h-0.5 w-full" aria-hidden="true" />
    </header>
  );
}
