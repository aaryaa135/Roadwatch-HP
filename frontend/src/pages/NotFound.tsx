import { Link } from "react-router-dom";
import { ArrowLeft, Compass, MapPinOff } from "lucide-react";
import { Logo } from "../components/brand/Logo";
import { LinkButton } from "../components/ui/LinkButton";

export function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" aria-label="RoadWatch HP home">
            <Logo />
          </Link>
          <Link
            to="/login"
            className="text-sm font-semibold text-brand-700 hover:text-brand-800"
          >
            Sign in
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-brand-700 shadow-card">
            <MapPinOff className="h-8 w-8" />
          </div>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            404 · Off the map
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">
            This road does not exist
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            The page you are looking for may have moved, been removed, or never
            existed. Head back to the dashboard or the public home page.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            <LinkButton to="/app" icon={<Compass className="h-4 w-4" />}>
              Go to dashboard
            </LinkButton>
            <LinkButton
              to="/"
              variant="outline"
              icon={<ArrowLeft className="h-4 w-4" />}
            >
              Public home
            </LinkButton>
          </div>
        </div>
      </main>
    </div>
  );
}
