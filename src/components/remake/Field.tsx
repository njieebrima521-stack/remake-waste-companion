import type { LucideIcon } from "lucide-react";
import { Eye, EyeOff } from "lucide-react";
import { forwardRef, useId, useState, type InputHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  label: string;
  icon?: LucideIcon | undefined;
  error?: string | undefined;
  prefix?: ReactNode;
  hint?: string | undefined;
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, icon: Icon, error, prefix, hint, type, className, ...props },
  ref,
) {
  const id = useId();
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-2 block text-sm font-medium">
        {label}
      </label>
      <div
        className={cn(
          "flex h-14 items-center gap-3 rounded-full border bg-card px-5 transition focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/15",
          error ? "border-destructive" : "border-input",
        )}
      >
        {Icon && <Icon className="size-5 shrink-0 text-muted-foreground" />}
        {prefix && <span className="shrink-0 font-medium text-muted-foreground">{prefix}</span>}
        <input
          id={id}
          ref={ref}
          type={isPassword && show ? "text" : type}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : undefined}
          className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground/70"
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"}
            className="text-muted-foreground"
          >
            {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
          </button>
        )}
      </div>
      {error ? (
        <p id={`${id}-err`} className="mt-1.5 px-2 text-xs font-medium text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 px-2 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
});

export function TextArea({
  label,
  value,
  onChange,
  placeholder,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string | undefined;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium">
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className={cn(
          "w-full resize-none rounded-3xl border bg-card px-5 py-4 text-base outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-4 focus:ring-primary/15",
          error ? "border-destructive" : "border-input",
        )}
      />
      {error && <p className="mt-1.5 px-2 text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}
