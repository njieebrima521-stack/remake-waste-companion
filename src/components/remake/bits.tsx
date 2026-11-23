import { Link, type LinkProps } from "@tanstack/react-router";
import { ChevronRight, FlaskConical, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Switch } from "@/components/ui/switch";
import { STATUS_LABEL } from "@/lib/remake/data";
import type { Pickup, PickupStatus } from "@/lib/remake/types";
import { cn } from "@/lib/utils";

export function DemoBadge({
  children = "Demo data",
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-warning-soft px-2.5 py-1 text-[11px] font-semibold text-warning-foreground",
        className,
      )}
    >
      <FlaskConical className="size-3" />
      {children}
    </span>
  );
}

const statusTone: Record<PickupStatus, string> = {
  submitted: "bg-info-soft text-info",
  awaiting: "bg-warning-soft text-warning-foreground",
  assigned: "bg-info-soft text-info",
  on_the_way: "bg-primary-soft text-primary-deep",
  collected: "bg-primary-soft text-primary-deep",
  verified: "bg-primary text-primary-foreground",
  cancelled: "bg-destructive-soft text-destructive",
};

export function StatusPill({ pickup, className }: { pickup: Pickup; className?: string }) {
  if (pickup.flag === "delayed")
    return (
      <Pill className={cn("bg-warning-soft text-warning-foreground", className)}>Delayed</Pill>
    );
  if (pickup.flag === "declined")
    return (
      <Pill className={cn("bg-destructive-soft text-destructive", className)}>
        Collector declined
      </Pill>
    );
  if (pickup.status === "collected" && pickup.kind === "general")
    return <Pill className={cn(statusTone.verified, className)}>Collected</Pill>;
  if (pickup.status === "collected")
    return (
      <Pill className={cn("bg-warning-soft text-warning-foreground", className)}>
        Pending verification
      </Pill>
    );
  return (
    <Pill className={cn(statusTone[pickup.status], className)}>{STATUS_LABEL[pickup.status]}</Pill>
  );
}

export function Pill({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 mt-7 flex items-center justify-between">
      <h2 className="text-[17px] font-semibold">{children}</h2>
      {action}
    </div>
  );
}

export function IconBubble({
  icon: Icon,
  className,
  iconClassName,
}: {
  icon: LucideIcon;
  className?: string | undefined;
  iconClassName?: string | undefined;
}) {
  return (
    <span
      className={cn(
        "grid size-11 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary-deep",
        className,
      )}
    >
      <Icon className={cn("size-5", iconClassName)} />
    </span>
  );
}

/** Tappable list row used in menus and settings. */
export function MenuRow({
  icon,
  label,
  hint,
  to,
  onClick,
  right,
  danger,
}: {
  icon: LucideIcon;
  label: string;
  hint?: string | undefined;
  to?: LinkProps["to"];
  onClick?: () => void;
  right?: ReactNode;
  danger?: boolean;
}) {
  const inner = (
    <>
      <IconBubble
        icon={icon}
        className={danger ? "bg-destructive-soft text-destructive" : undefined}
      />
      <span className="min-w-0 flex-1 text-left">
        <span className={cn("block text-[15px] font-medium", danger && "text-destructive")}>
          {label}
        </span>
        {hint && <span className="block truncate text-xs text-muted-foreground">{hint}</span>}
      </span>
      {right ?? <ChevronRight className="size-5 text-muted-foreground" />}
    </>
  );
  const cls = "flex w-full items-center gap-3 px-4 py-3 active:bg-muted transition-colors";
  if (to)
    return (
      <Link to={to} className={cls}>
        {inner}
      </Link>
    );
  return (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

export function MenuGroup({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <div className="mt-6">
      {title && (
        <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
      )}
      <div className="divide-y divide-border overflow-hidden rounded-3xl bg-card shadow-card">
        {children}
      </div>
    </div>
  );
}

export function NumberStepper({
  value,
  onChange,
  min = 1,
  max = 10,
  unit,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  unit?: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-3xl bg-card p-3 shadow-card">
      <button
        type="button"
        aria-label="Decrease"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="grid size-14 place-items-center rounded-2xl bg-muted text-2xl font-semibold disabled:opacity-40 active:scale-95"
      >
        −
      </button>
      <div className="text-center">
        <div className="font-display text-4xl font-bold tabular-nums">{value}</div>
        {unit && <div className="text-sm text-muted-foreground">{unit}</div>}
      </div>
      <button
        type="button"
        aria-label="Increase"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="grid size-14 place-items-center rounded-2xl bg-primary text-2xl font-semibold text-primary-foreground disabled:opacity-40 active:scale-95"
      >
        +
      </button>
    </div>
  );
}

/** Settings row with an on/off switch. The whole row toggles. */
export function ToggleRow({
  icon,
  label,
  hint,
  checked,
  onChange,
}: {
  icon: LucideIcon;
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 transition-colors active:bg-muted">
      <IconBubble icon={icon} />
      <span className="min-w-0 flex-1 text-left">
        <span className="block text-[15px] font-medium">{label}</span>
        {hint && <span className="block truncate text-xs text-muted-foreground">{hint}</span>}
      </span>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </label>
  );
}
