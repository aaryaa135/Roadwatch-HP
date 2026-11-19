import { NavLink, useNavigate } from "react-router-dom";
import {
  BarChart3,
  ChevronsLeft,
  ChevronsRight,
  Files,
  LayoutDashboard,
  LogOut,
  Map,
  PlusCircle,
  Settings,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useAuth } from "../../context/AuthContext";
import { cn, initials } from "../../utils/format";
import { Logo, LogoMark } from "../brand/Logo";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  adminOnly?: boolean;
}

const mainItems: NavItem[] = [
  { to: "/app", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/app/map", label: "Hazard Map", icon: Map },
  { to: "/app/report", label: "Report a Hazard", icon: PlusCircle },
  { to: "/app/reports", label: "All Reports", icon: Files },
];

const managementItems: NavItem[] = [
  { to: "/app/verification", label: "Verification", icon: ShieldCheck, adminOnly: true },
  { to: "/app/analytics", label: "Analytics", icon: BarChart3 },
];

const accountItems: NavItem[] = [
  { to: "/app/profile", label: "My Profile", icon: User },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

function SidebarLink({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        cn(
          "group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
          isActive
            ? "bg-white/[0.08] text-white"
            : "text-white/55 hover:bg-white/[0.06] hover:text-white",
          collapsed && "justify-center px-0"
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-brand-400" />
          )}
          <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
          {!collapsed && <span className="truncate">{item.label}</span>}
        </>
      )}
    </NavLink>
  );
}

function SectionLabel({
  children,
  collapsed,
}: {
  children: ReactNode;
  collapsed: boolean;
}) {
  if (collapsed) {
    return <div className="mx-auto my-3 h-px w-6 bg-white/10" aria-hidden="true" />;
  }
  return (
    <p className="mb-2 mt-5 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">
      {children}
    </p>
  );
}

export function Sidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onMobileClose,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}) {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    onMobileClose();
    navigate("/");
  };

  const content = (
    <div className="flex h-full flex-col bg-charcoal-900 text-white">
      <div className="rw-gradient-bar h-1 w-full shrink-0" aria-hidden="true" />
      <div
        className={cn(
          "flex h-16 items-center border-b border-white/10 px-4",
          collapsed ? "justify-center" : "justify-between"
        )}
      >
        {collapsed ? <LogoMark className="h-8 w-8" /> : <Logo light />}
        <button
          type="button"
          onClick={onMobileClose}
          className="rounded-md p-1.5 text-white/60 hover:bg-white/10 hover:text-white lg:hidden"
          aria-label="Close navigation"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="rw-scrollbar flex-1 overflow-y-auto px-2.5 pb-4 pt-3" aria-label="Main navigation">
        <SectionLabel collapsed={collapsed}>Main</SectionLabel>
        <div className="space-y-1">
          {mainItems.map((item) => (
            <SidebarLink
              key={item.to}
              item={item}
              collapsed={collapsed}
              onNavigate={onMobileClose}
            />
          ))}
        </div>

        <SectionLabel collapsed={collapsed}>Management</SectionLabel>
        <div className="space-y-1">
          {managementItems
            .filter((item) => !item.adminOnly || isAdmin)
            .map((item) => (
              <SidebarLink
                key={item.to}
                item={item}
                collapsed={collapsed}
                onNavigate={onMobileClose}
              />
            ))}
        </div>

        <SectionLabel collapsed={collapsed}>Account</SectionLabel>
        <div className="space-y-1">
          {accountItems.map((item) => (
            <SidebarLink
              key={item.to}
              item={item}
              collapsed={collapsed}
              onNavigate={onMobileClose}
            />
          ))}
          <button
            type="button"
            onClick={handleLogout}
            title={collapsed ? "Logout" : undefined}
            className={cn(
              "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-white/55 transition-colors hover:bg-white/[0.06] hover:text-white",
              collapsed && "justify-center px-0"
            )}
          >
            <LogOut className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </nav>

      <div className="border-t border-white/10 p-3">
        <div
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-2 py-2",
            collapsed && "justify-center"
          )}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-700 text-[11px] font-semibold text-white">
            {user ? initials(user.full_name) : "RW"}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-white">
                {user?.full_name ?? "RoadWatch user"}
              </p>
              <p className="truncate text-[10px] capitalize text-white/45">
                {user?.role ?? "citizen"}
              </p>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="mt-2 hidden w-full items-center justify-center gap-2 rounded-md px-2 py-1.5 text-[11px] font-medium text-white/40 transition-colors hover:bg-white/5 hover:text-white/70 lg:flex"
        >
          {collapsed ? (
            <ChevronsRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronsLeft className="h-4 w-4" />
              Collapse sidebar
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden border-r border-white/10 transition-[width] duration-200 lg:block",
          collapsed ? "w-[76px]" : "w-[260px]"
        )}
      >
        {content}
      </aside>

      <div
        className={cn(
          "fixed inset-0 z-[900] lg:hidden",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
        aria-hidden={!mobileOpen}
      >
        <div
          className={cn(
            "absolute inset-0 bg-charcoal-950/50 transition-opacity",
            mobileOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={onMobileClose}
        />
        <aside
          className={cn(
            "absolute inset-y-0 left-0 w-[280px] max-w-[85vw] shadow-float transition-transform duration-200",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {content}
        </aside>
      </div>
    </>
  );
}
