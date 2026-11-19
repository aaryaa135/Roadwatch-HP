import { AlertCircle, Inbox, Loader2, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../../utils/format";
import { Button } from "./Button";

export function Spinner({ className }: { className?: string }) {
  return (
    <Loader2
      className={cn("h-5 w-5 animate-spin text-brand-600", className)}
      aria-hidden="true"
    />
  );
}

export function LoadingBlock({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted">
      <Spinner />
      <span>{label}</span>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("rw-skeleton", className)} aria-hidden="true" />;
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2 p-4" aria-label="Loading table">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="hidden h-4 w-24 sm:block" />
          <Skeleton className="hidden h-4 w-20 md:block" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface text-muted">
        {icon ?? <Inbox className="h-6 w-6" aria-hidden="true" />}
      </div>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description,
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  const retry = onRetry;
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-severity-high">
        <AlertCircle className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-muted">
        {description || "The data could not be loaded right now."}
      </p>
      {retry && (
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={retry}
          icon={<RefreshCw className="h-3.5 w-3.5" />}
        >
          Try again
        </Button>
      )}
    </div>
  );
}

export function InlineError({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}
