import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { LinkProps } from "react-router-dom";
import { cn } from "../../utils/format";

type Variant = "primary" | "secondary" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-brand-700 to-brand-600 text-white border border-brand-700 hover:from-brand-800 hover:to-brand-700 hover:border-brand-800 shadow-sm",
  secondary:
    "bg-gradient-to-r from-charcoal-900 to-charcoal-800 text-white border border-charcoal-900 hover:from-charcoal-800 hover:to-charcoal-700",
  outline:
    "bg-white text-ink border border-line hover:bg-surface hover:border-brand-300",
  ghost: "bg-transparent text-ink border border-transparent hover:bg-surface",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-md",
  md: "h-10 px-4 text-sm gap-2 rounded-lg",
  lg: "h-11 px-5 text-sm gap-2 rounded-lg",
};

export function LinkButton({
  to,
  children,
  icon,
  variant = "primary",
  size = "md",
  className,
  ...props
}: LinkProps & {
  children: ReactNode;
  icon?: ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "inline-flex items-center justify-center font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {icon}
      {children}
    </Link>
  );
}
