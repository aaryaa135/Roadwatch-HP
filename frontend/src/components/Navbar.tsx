import { useState, useEffect } from "react";

const LINKS = [
  { to: "/", label: "Home" },
  { to: "/report", label: "Report a Hazard" },
  { to: "/map", label: "Hazard Map" },
  { to: "/admin", label: "Admin" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(window.location.pathname);

  useEffect(() => {
    const onPopState = () => setActive(window.location.pathname);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const closeMenu = () => setOpen(false);

  return (
    <>
      <a href="#main" className="rw-sr-only">
        Skip to main content
      </a>
      <header className="rw-header">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 py-4">
            <div className="flex items-center gap-2">
              <a
                href="/"
                className="flex items-center gap-2"
                onClick={closeMenu}
              >
                <span className="text-gray-900 font-bold text-xs tracking-widest uppercase">RoadWatch</span>
                <span className="text-gray-900 font-semibold text-lg tracking-tight">HP</span>
              </a>
            </div>
            <nav className="hidden md:flex gap-1">
              {LINKS.map((link) => (
                <a
                  key={link.to}
                  href={link.to}
                  className={`rw-nav-link ${
                    active === link.to ? "rw-nav-link-active" : ""
                  }`}
                  aria-current={active === link.to ? "page" : undefined}
                  onClick={closeMenu}
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <button
              className="md:hidden rw-btn-outline"
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => setOpen((prev) => !prev)}
            >
              {open ? "Close menu" : "Menu"}
            </button>
          </div>
        </div>
        {open && (
          <div id="mobile-menu" className="border-t border-gray-300 bg-white">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <nav className="space-y-1 py-4">
                {LINKS.map((link) => (
                  <a
                    key={link.to}
                    href={link.to}
                    onClick={closeMenu}
                    className={`block px-4 py-3 text-gray-700 font-medium ${
                      active === link.to ? "bg-gray-50 text-gray-900" : "hover:bg-gray-50"
                    }`}
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
