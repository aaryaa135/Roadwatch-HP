import { forwardRef, useId } from "react";
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "../../utils/format";

export interface FieldProps {
  label?: string;
  hint?: string;
  required?: boolean;
  error?: string;
}

function Field({
  label,
  hint,
  required,
  error,
  htmlFor,
  children,
  className,
}: FieldProps & {
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label htmlFor={htmlFor} className="rw-label">
          {label}
          {required && <span className="ml-0.5 text-severity-high">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      {error && (
        <p role="alert" className="text-xs font-medium text-severity-high">
          {error}
        </p>
      )}
    </div>
  );
}

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & FieldProps
>(({ label, hint, required, error, className, id, ...props }, ref) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  return (
    <Field
      label={label}
      hint={hint}
      required={required}
      error={error}
      htmlFor={inputId}
    >
      <input
        ref={ref}
        id={inputId}
        className={cn("rw-input", error && "border-severity-high", className)}
        aria-invalid={error ? "true" : "false"}
        aria-required={required}
        {...props}
      />
    </Field>
  );
});
Input.displayName = "Input";

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & FieldProps
>(({ label, hint, required, error, className, id, children, ...props }, ref) => {
  const generatedId = useId();
  const selectId = id || generatedId;
  return (
    <Field
      label={label}
      hint={hint}
      required={required}
      error={error}
      htmlFor={selectId}
    >
      <select
        ref={ref}
        id={selectId}
        className={cn("rw-select", error && "border-severity-high", className)}
        aria-invalid={error ? "true" : "false"}
        aria-required={required}
        {...props}
      >
        {children}
      </select>
    </Field>
  );
});
Select.displayName = "Select";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & FieldProps
>(
  (
    { label, hint, required, error, className, id, rows = 4, ...props },
    ref
  ) => {
    const generatedId = useId();
    const textareaId = id || generatedId;
    return (
      <Field
        label={label}
        hint={hint}
        required={required}
        error={error}
        htmlFor={textareaId}
      >
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          className={cn("rw-textarea", error && "border-severity-high", className)}
          aria-invalid={error ? "true" : "false"}
          aria-required={required}
          {...props}
        />
      </Field>
    );
  }
);
Textarea.displayName = "Textarea";
