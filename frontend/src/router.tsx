import { useCallback, useEffect, useState } from "react";

type Route = {
  path: string;
  element: React.ComponentType<{ navigate: (to: string) => void }>;
};

export function Router({ routes }: { routes: Route[] }) {
  const [path, setPath] = useState(window.location.pathname);

  const navigate = useCallback((to: string) => {
    history.pushState(null, "", to);
    setPath(to);
  }, []);

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const RouteComponent =
    routes.find((r) => r.path === path)?.element ?? routes[0].element;
  return <RouteComponent navigate={navigate} />;
}

export function Link({
  to,
  children,
  className,
}: {
  to: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a href={to} className={`text-gray-900 hover:underline ${className ?? ""}`}>
      {children}
    </a>
  );
}
