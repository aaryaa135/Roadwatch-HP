import { useId } from "react";
import { Search, X } from "lucide-react";
import { cn } from "../../utils/format";

export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  className,
  label = "Search",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  label?: string;
}) {
  const id = useId();
  return (
    <div className={cn("relative", className)}>
      <label htmlFor={id} className="rw-sr-only">
        {label}
      </label>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
        aria-hidden="true"
      />
      <input
        id={id}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="rw-input pl-9 pr-9"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted hover:bg-surface hover:text-ink"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
