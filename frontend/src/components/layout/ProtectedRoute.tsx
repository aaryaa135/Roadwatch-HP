import { Navigate, Outlet, useLocation } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { LogoMark } from "../brand/Logo";
import { EmptyState } from "../ui/States";

function AuthLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface">
      <LogoMark className="h-12 w-12" />
      <div className="h-1 w-32 overflow-hidden rounded-full bg-line">
        <div className="h-full w-1/2 animate-pulse rounded-full bg-brand-600" />
      </div>
      <p className="text-sm text-muted">Preparing your workspace…</p>
    </div>
  );
}

export function RequireAuth() {
  const { loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) return <AuthLoading />;
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}

export function RequireAdmin() {
  const { loading, isAuthenticated, isAdmin } = useAuth();

  if (loading) return <AuthLoading />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) {
    return (
      <div className="rw-card">
        <EmptyState
          icon={<ShieldAlert className="h-6 w-6" />}
          title="Administrator access required"
          description="This area is limited to authorised reviewers. Contact a RoadWatch administrator if you believe you should have access."
        />
      </div>
    );
  }
  return <Outlet />;
}
