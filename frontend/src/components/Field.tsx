import { forwardRef, useId } from "react";

export type FieldProps = {
  label: string;
  hint?: string;
  required?: boolean;
  error?: string;
};

export function Field({ label, hint, required, error, children }: FieldProps & { children: React.ReactNode }) {
  const id = useId();
  return (
    <div className="rw-field">
      <label htmlFor={id} className="rw-field-label">
        {label}
        {required && <span className="ml-1 text-gray-500" aria-hidden="true">(required)</span>}
      </label>
      {children}
      {hint && <p className="rw-field-hint">{hint}</p>}
      {error && (
        <p role="alert" className="mt-1 text-xs text-gray-900 font-medium">
          {error}
        </p>
      )}
    </div>
  );
}

export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & FieldProps
>(({ label, hint, required, error, ...props }, ref) => (
  <Field label={label} hint={hint} required={required} error={error}>
    <input
      ref={ref}
      className="rw-input"
      aria-invalid={error ? "true" : "false"}
      aria-required={required}
      {...props}
    />
  </Field>
));
Input.displayName = "Input";

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & FieldProps
>(({ label, hint, required, error, children, ...props }, ref) => (
  <Field label={label} hint={hint} required={required} error={error}>
    <select ref={ref} className="rw-select" aria-invalid={error ? "true" : "false"} aria-required={required} {...props}>
      {children}
    </select>
  </Field>
));
Select.displayName = "Select";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & FieldProps
>(({ label, hint, required, error, rows = 4, ...props }, ref) => (
  <Field label={label} hint={hint} required={required} error={error}>
    <textarea
      ref={ref}
      className="rw-textarea"
      rows={rows}
      aria-invalid={error ? "true" : "false"}
      aria-required={required}
      {...props}
    />
  </Field>
));
Textarea.displayName = "Textarea";
