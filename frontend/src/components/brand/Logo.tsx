import { cn } from "../../utils/format";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("h-9 w-9", className)}
      role="img"
      aria-label="RoadWatch HP"
    >
      <rect width="64" height="64" rx="14" fill="#1b211f" />
      <path
        d="M32 10c-8.3 0-15 6.6-15 14.8C17 35.6 32 54 32 54s15-18.4 15-29.2C47 16.6 40.3 10 32 10Z"
        fill="#356a4d"
      />
      <path
        d="M32 17c-4.4 0-8 3.5-8 7.8 0 5.8 8 15.2 8 15.2s8-9.4 8-15.2C40 20.5 36.4 17 32 17Z"
        fill="#f6f7f6"
      />
      <path
        d="M30 21h4l-1 5h-2l-1-5Zm-.6 8h5.2l-1.2 6h-2.8l-1.2-6Z"
        fill="#d97706"
      />
    </svg>
  );
}

export function Logo({
  compact = false,
  light = false,
  className,
}: {
  compact?: boolean;
  light?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      {!compact && (
        <div className="leading-tight">
          <p
            className={cn(
              "text-sm font-bold tracking-tight",
              light ? "text-white" : "text-ink"
            )}
          >
            RoadWatch <span className="text-brand-500">HP</span>
          </p>
          <p
            className={cn(
              "text-[10px] font-medium uppercase tracking-[0.14em]",
              light ? "text-white/50" : "text-muted"
            )}
          >
            Himachal Pradesh
          </p>
        </div>
      )}
    </div>
  );
}
