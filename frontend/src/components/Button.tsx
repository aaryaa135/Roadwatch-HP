export function Button({
  children,
  type = "button",
  variant = "solid",
  disabled,
  ...props
}: {
  children: React.ReactNode;
  type?: "button" | "submit" | "reset";
  variant?: "solid" | "outline";
  disabled?: boolean;
  [key: string]: unknown;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`gov-btn ${variant === "outline" ? "gov-btn-outline" : ""}`}
      {...props}
    >
      {children}
    </button>
  );
}
