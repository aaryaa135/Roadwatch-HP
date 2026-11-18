import { Link } from "../router";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/report", label: "Report a Hazard" },
  { to: "/map", label: "Hazard Map" },
  { to: "/admin", label: "Admin" },
];

export function Footer() {
  return (
    <footer className="border-t border-gray-300 bg-gray-900 text-white mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <p className="text-sm font-semibold text-white">
              RoadWatch HP
            </p>
            <p className="mt-1 text-sm text-gray-400">
              Community-driven road hazard reporting and monitoring for
              Himachal Pradesh.
            </p>
          </div>
          <nav className="space-y-2 md:space-y-0 md:flex md:gap-8 text-sm">
            {NAV_LINKS.map((link) => (
              <Link key={link.to} to={link.to} className="text-gray-400 hover:text-white">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
