import { useState } from "react";
import type { MouseEvent } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { ArrowRight, Menu, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Logo } from "../brand/Logo";
import { Button } from "../ui/Button";
import { cn } from "../../utils/format";

const links = [
  { to: "/", label: "Home", end: true },
  { to: "/#how-it-works", label: "How it works" },
  { to: "/#features", label: "Features" },
  { to: "/#hazards", label: "Hazard types" },
  { to: "/#about", label: "About" },
];

export function PublicLayout() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  const handleSectionClick = (
    event: MouseEvent<HTMLAnchorElement>,
    to: string
  ) => {
    setOpen(false);
    if (window.location.pathname !== "/") return;
    event.preventDefault();
    const id = to.split("#")[1];
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.replaceState(null, "", to);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <a href="#main-content" className="rw-sr-only">
        Skip to main content
      </a>
      <header className="sticky top-0 z-40 border-b border-line/80 bg-white/95 backdrop-blur">
        <div className="rw-gradient-bar h-1 w-full" aria-hidden="true" />
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/" aria-label="RoadWatch HP home">
            <Logo />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Public navigation">
            {links.map((link) =>
              link.to.startsWith("/#") ? (
                <a
                  key={link.to}
                  href={link.to}
                  onClick={(event) => handleSectionClick(event, link.to)}
                  className="rounded-md px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-brand-50 hover:text-brand-700"
                >
                  {link.label}
                </a>
              ) : (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    cn(
                      "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-brand-50 text-brand-700"
                        : "text-muted hover:bg-brand-50 hover:text-brand-700"
                    )
                  }
                >
                  {link.label}
                </NavLink>
              )
            )}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            {isAuthenticated ? (
              <Link to="/app">
                <Button size="sm" icon={<ArrowRight className="h-4 w-4" />}>
                  Open dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Sign in
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">Create account</Button>
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="rounded-md p-2 text-muted hover:bg-surface hover:text-ink lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {open && (
          <div className="border-t border-line bg-white lg:hidden">
            <nav className="mx-auto max-w-7xl space-y-1 px-4 py-4" aria-label="Mobile public navigation">
              {links.map((link) =>
                link.to.startsWith("/#") ? (
                  <a
                    key={link.to}
                    href={link.to}
                    onClick={(event) => handleSectionClick(event, link.to)}
                    className="block rounded-lg px-3 py-2.5 text-sm font-medium text-muted hover:bg-brand-50 hover:text-brand-700"
                  >
                    {link.label}
                  </a>
                ) : (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.end}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "block rounded-lg px-3 py-2.5 text-sm font-medium",
                        isActive
                          ? "bg-brand-50 text-brand-700"
                          : "text-muted hover:bg-brand-50 hover:text-brand-700"
                      )
                    }
                  >
                    {link.label}
                  </NavLink>
                )
              )}
              <div className="flex gap-2 border-t border-line pt-3">
                {isAuthenticated ? (
                  <Link to="/app" className="flex-1" onClick={() => setOpen(false)}>
                    <Button className="w-full">Open dashboard</Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/login" className="flex-1" onClick={() => setOpen(false)}>
                      <Button variant="outline" className="w-full">
                        Sign in
                      </Button>
                    </Link>
                    <Link to="/register" className="flex-1" onClick={() => setOpen(false)}>
                      <Button className="w-full">Create account</Button>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      <main id="main-content" className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-line bg-charcoal-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-[1.4fr_1fr_1fr]">
            <div>
              <Logo light />
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/55">
                An AI-powered geospatial platform for real-time road hazard
                detection and smart road monitoring across Himachal Pradesh.
              </p>
              <p className="mt-4 text-xs font-medium uppercase tracking-[0.18em] text-white/35">
                Smarter Roads. Safer Journeys.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/40">
                Platform
              </p>
              <ul className="mt-3 space-y-2 text-sm text-white/60">
                <li>
                  <Link to="/app/map" className="hover:text-white">
                    Hazard map
                  </Link>
                </li>
                <li>
                  <Link to="/app/report" className="hover:text-white">
                    Report a hazard
                  </Link>
                </li>
                <li>
                  <Link to="/app/reports" className="hover:text-white">
                    All reports
                  </Link>
                </li>
                <li>
                  <Link to="/app/analytics" className="hover:text-white">
                    Analytics
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/40">
                Project
              </p>
              <ul className="mt-3 space-y-2 text-sm text-white/60">
                <li>
                  <a href="/#about" className="hover:text-white">
                    About the project
                  </a>
                </li>
                <li>
                  <a href="/#technology" className="hover:text-white">
                    Technology
                  </a>
                </li>
                <li>
                  <a href="/#hazards" className="hover:text-white">
                    Hazard categories
                  </a>
                </li>
                <li>
                  <span className="text-white/35">B.Tech CSE major project</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 flex flex-col gap-2 border-t border-white/10 pt-5 text-xs text-white/35 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} RoadWatch HP. All rights reserved.</p>
            <p>OpenStreetMap · PostGIS · FastAPI · React</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
