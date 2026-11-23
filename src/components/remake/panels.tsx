import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Dashboard page heading: small eyebrow, title, short description and the main action(s). */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-end md:justify-between", className)}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-primary-deep">{eyebrow}</p>
        )}
        <h1 className="text-2xl font-semibold leading-tight md:text-[28px]">{title}</h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground md:text-[15px]">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** White content panel with an optional title row. */
export function Panel({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("min-w-0 rounded-2xl border border-border bg-card shadow-card", className)}>
      {(title || action) && (
        <header className="flex items-start justify-between gap-3 px-4 pt-4 sm:px-5 sm:pt-5">
          <div className="min-w-0">
            {title && <h2 className="text-base font-semibold">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className={cn("p-4 sm:p-5", (title || action) && "pt-3 sm:pt-4", bodyClassName)}>{children}</div>
    </section>
  );
}

/** Compact statistic card. */
export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = "default",
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  sub?: ReactNode;
  icon?: LucideIcon;
  tone?: "default" | "brand" | "ink" | "warning";
  className?: string;
}) {
  const filled = tone === "brand" || tone === "ink";
  return (
    <div
      className={cn(
        "min-w-0 rounded-2xl border p-4 shadow-card sm:p-5",
        tone === "default" && "border-border bg-card",
        tone === "brand" && "border-transparent bg-gradient-brand text-primary-foreground",
        tone === "ink" && "border-transparent bg-gradient-ink text-ink-foreground",
        tone === "warning" && "border-transparent bg-warning-soft text-warning-foreground",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className={cn("truncate text-sm font-medium", tone === "default" ? "text-muted-foreground" : "opacity-85")}>
          {label}
        </p>
        {Icon && (
          <span
            className={cn(
              "grid size-9 shrink-0 place-items-center rounded-xl",
              filled ? "bg-ink-foreground/15" : tone === "warning" ? "bg-card/70" : "bg-primary-soft text-primary-deep",
            )}
          >
            <Icon className="size-[18px]" />
          </span>
        )}
      </div>
      <p className="mt-3 truncate font-display text-[24px] font-semibold leading-none tabular-nums sm:text-[26px]">
        {value}
      </p>
      {sub && (
        <p className={cn("mt-2 truncate text-xs", tone === "default" ? "text-muted-foreground" : "opacity-80")}>{sub}</p>
      )}
    </div>
  );
}
