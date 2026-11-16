import { useState, useEffect } from "react";

export function Navbar({ active }: { active: string }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { to: "/", label: "Home" },
    { to: "/report", label: "Report a Hazard" },
    { to: "/map", label: "Hazard Map" },
    { to: "/admin", label: "Monitoring" },
  ];

  return (
    <>
      <a href="#main" className="gov-sr-only">
        Skip to main content
      </a>
      <header className={`gov-header ${scrolled ? "shadow-sm" : ""}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 py-4">
            <div className="flex items-center gap-2">
              <span className="text-gray-900 font-bold text-xs tracking-widest uppercase">gov.in</span>
              <span className="text-gray-900 font-semibold text-lg tracking-tight">
                RoadWatch HP
              </span>
            </div>
            <nav className="hidden md:flex gap-1">
              {links.map((link) => (
                <a
                  key={link.to}
                  href={link.to}
                  className={`gov-nav-link ${
                    active === link.to ? "gov-nav-link-active" : ""
                  }`}
                  aria-current={active === link.to ? "page" : undefined}
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <button
              className="md:hidden gov-btn-outline"
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => setOpen(!open)}
            >
              {open ? "Close menu" : "Menu"}
            </button>
          </div>
        </div>
        {open && (
          <div id="mobile-menu" className="border-t border-gray-300 bg-white">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <nav className="space-y-1 py-4">
                {links.map((link) => (
                  <a
                    key={link.to}
                    href={link.to}
                    onClick={() => setOpen(false)}
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
