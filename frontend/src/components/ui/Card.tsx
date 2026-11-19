import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/format";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rw-card", className)} {...props} />;
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="h-4 w-1 shrink-0 rounded-full bg-gradient-to-b from-brand-500 to-amber-400"
            aria-hidden="true"
          />
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
        </div>
        {description && (
          <p className="mt-0.5 pl-3 text-xs text-muted">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...props} />;
}
