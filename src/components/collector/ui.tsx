import { Link, useLocation } from "@tanstack/react-router";
import {
  ChevronRight,
  ClipboardList,
  History,
  Home,
  Inbox,
  LayoutDashboard,
  PackageCheck,
  Route as RouteIcon,
  ScanLine,
  Send,
  User,
  type LucideIcon,
} from "lucide-react";
import { useMemo, type ReactNode } from "react";

import { Pill } from "@/components/remake/bits";
import { MATERIAL_ICON } from "@/components/remake/icons";
import { MATERIALS } from "@/lib/remake/data";
import { dayLabel } from "@/lib/remake/format";
import {
  estKg,
  getCollector,
  isDirectRequest,
  materialClass,
  minimumFor,
  readiness,
  requestBoard,
  requesterName,
  type MaterialClass,
  type Readiness,
  type VerificationState,
} from "@/lib/remake/collector";
import { useApp } from "@/lib/remake/store";
import type { AppState, Collector, CollectorCategory, MaterialId, Pickup } from "@/lib/remake/types";
import { cn } from "@/lib/utils";

/** The signed-in collector, only when Remake has approved the account. */
export function useCollector(): Collector | undefined {
  const acc = useApp((s) => s.collectorAccount);
  const reg = useApp((s) => s.registeredCollectors);
  const edits = useApp((s) => s.collectorEdits);
  return useMemo(
    () =>
      acc?.status === "approved"
        ? getCollector({ registeredCollectors: reg, collectorEdits: edits }, acc.collectorId)
        : undefined,
    [acc, reg, edits],
  );
}

/** Use inside the approved collector area, where the layout guarantees a collector. */
export function useMe(): Collector {
  return useCollector()!;
}

export function useWorkState(): AppState {
  return useApp((s) => s);
}

export function useBoard(me: Collector) {
  const state = useWorkState();
  return useMemo(() => requestBoard(state, me), [state, me]);
}

export const bags = (n: number) => `${n} bag${n === 1 ? "" : "s"}`;

export const REQUESTS_LABEL: Record<CollectorCategory, string> = {
  recycling: "Requests",
  general: "Assignments",
  independent: "Assignments",
};

// ---------------------------------------------------------------------------------------------

const READINESS: Record<Readiness, { label: string; tone: string }> = {
  below_minimum: { label: "Below minimum", tone: "bg-warning-soft text-warning-foreground" },
  awaiting_more: { label: "Awaiting more waste", tone: "bg-warning-soft text-warning-foreground" },
  not_ready: { label: "Not ready yet", tone: "bg-destructive-soft text-destructive" },
  ready: { label: "Ready for collection", tone: "bg-primary-soft text-primary-deep" },
  scheduled: { label: "Scheduled", tone: "bg-info-soft text-info" },
  collected: { label: "Collected", tone: "bg-primary-soft text-primary-deep" },
  verified: { label: "Verified", tone: "bg-primary text-primary-foreground" },
  cancelled: { label: "Cancelled", tone: "bg-destructive-soft text-destructive" },
};

export function readinessLabel(r: Readiness) {
  return READINESS[r].label;
}

export function ReadinessPill({ pickup, className }: { pickup: Pickup; className?: string }) {
  const thresholds = useApp((s) => s.thresholds);
  const r = readiness(pickup, thresholds);
  const info = READINESS[r];
  return <Pill className={cn(info.tone, className)}>{info.label}</Pill>;
}

const CLASS_INFO: Record<MaterialClass, { label: string; tone: string }> = {
  confirmed: { label: "Accepted by a confirmed partner", tone: "bg-primary-soft text-primary-deep" },
  potential: { label: "Potentially recyclable · no confirmed partner yet", tone: "bg-info-soft text-info" },
  residual: { label: "Residual / general waste", tone: "bg-muted text-muted-foreground" },
  special: { label: "Special waste · licensed handler only", tone: "bg-destructive-soft text-destructive" },
};

export function MaterialClassTag({ material, className }: { material: MaterialId; className?: string }) {
  const info = CLASS_INFO[materialClass(material)];
  return <Pill className={cn(info.tone, className)}>{info.label}</Pill>;
}

const VERIFY_INFO: Record<VerificationState, { label: string; tone: string }> = {
  verified: { label: "Verified", tone: "bg-primary text-primary-foreground" },
  pending: { label: "Verification pending", tone: "bg-warning-soft text-warning-foreground" },
  needs_sorting: { label: "Needs sorting", tone: "bg-info-soft text-info" },
  rejected: { label: "Material rejected", tone: "bg-destructive-soft text-destructive" },
  not_required: { label: "No verification needed", tone: "bg-muted text-muted-foreground" },
};

export function VerificationPill({ state, className }: { state: VerificationState; className?: string }) {
  const info = VERIFY_INFO[state];
  return <Pill className={cn(info.tone, className)}>{info.label}</Pill>;
}

export function MaterialBubble({ material, className }: { material: MaterialId; className?: string }) {
  const Icon = MATERIAL_ICON[material];
  return (
    <span
      className={cn(
        "grid size-11 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary-deep",
        material === "special" && "bg-destructive-soft text-destructive",
        (material === "general" || material === "mixed_plastic") && "bg-muted text-foreground",
        className,
      )}
    >
      <Icon className="size-5" />
    </span>
  );
}

/** One request row: who, where, what, how much, readiness. */
export function RequestCard({ pickup, me, compact }: { pickup: Pickup; me: Collector; compact?: boolean }) {
  const thresholds = useApp((s) => s.thresholds);
  const direct = isDirectRequest(pickup, me.id);
  const min = minimumFor(thresholds, pickup.material);
  return (
    <Link
      to="/collector/requests/$id"
      params={{ id: pickup.id }}
      className="flex gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-card transition active:scale-[0.99]"
    >
      <MaterialBubble material={pickup.material} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-[15px] font-semibold">{requesterName(pickup)}</p>
          <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {pickup.area} · {dayLabel(pickup.date)} · {pickup.slot}
        </p>
        <p className="mt-1 text-sm">
          <span className="font-medium">{MATERIALS[pickup.material].short}</span>
          <span className="text-muted-foreground">
            {" "}
            · {bags(pickup.quantity)}
            {!compact && ` (min ${min})`} · ~{estKg(pickup)} kg
          </span>
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <ReadinessPill pickup={pickup} className="px-2 py-0.5 text-[10px]" />
          {direct && (
            <Pill className="gap-1 bg-ink px-2 py-0.5 text-[10px] text-ink-foreground">
              <Send className="size-3" /> Sent to you
            </Pill>
          )}
          {pickup.proposal?.status === "pending" && pickup.proposal.collectorId === me.id && (
            <Pill className="bg-info-soft px-2 py-0.5 text-[10px] text-info">Window proposed</Pill>
          )}
          {!pickup.institution && (
            <Pill className="bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">Resident</Pill>
          )}
        </div>
      </div>
    </Link>
  );
}

export function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: LucideIcon;
  tone?: "default" | "primary" | "warning";
}) {
  return (
    <div
      className={cn(
        "rounded-3xl p-4 shadow-card",
        tone === "default" && "bg-card",
        tone === "primary" && "bg-primary-soft text-primary-deep",
        tone === "warning" && "bg-warning-soft text-warning-foreground",
      )}
    >
      {Icon && <Icon className="mb-2 size-5 opacity-80" />}
      <p className="font-display text-2xl font-bold tabular-nums leading-none">{value}</p>
      <p className="mt-1.5 text-xs font-medium opacity-80">{label}</p>
      {hint && <p className="mt-0.5 text-[11px] opacity-70">{hint}</p>}
    </div>
  );
}

/** Simple horizontal bar, e.g. load vs capacity or progress towards a minimum. */
export function Meter({
  value,
  max,
  className,
  overIsBad = true,
}: {
  value: number;
  max: number;
  className?: string;
  /** Capacity-style meters turn red when exceeded; progress-to-minimum meters don't. */
  overIsBad?: boolean;
}) {
  const pct = Math.min(100, Math.round((value / Math.max(1, max)) * 100));
  return (
    <div className={cn("h-2.5 overflow-hidden rounded-full bg-muted", className)}>
      <div
        className={cn("h-full rounded-full", overIsBad && value > max ? "bg-destructive" : value >= max || overIsBad ? "bg-primary" : "bg-warning")}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function SectionHead({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-2.5 mt-7 flex items-center justify-between">
      <h2 className="text-[17px] font-semibold">{title}</h2>
      {action}
    </div>
  );
}

export function SeeAll({ to, label = "See all" }: { to: "/collector/requests" | "/collector/routes" | "/collector/history" | "/collector/verify"; label?: string }) {
  return (
    <Link to={to} className="text-sm font-semibold text-primary">
      {label}
    </Link>
  );
}

// ---------------------------------------------------------------------------------------------
// Role-specific bottom navigation
// ---------------------------------------------------------------------------------------------

type Tab = { to: "/collector/home" | "/collector/requests" | "/collector/routes" | "/collector/scan" | "/collector/history" | "/collector/profile"; label: string; icon: LucideIcon };

const NAV: Record<CollectorCategory, Tab[]> = {
  recycling: [
    { to: "/collector/home", label: "Dashboard", icon: LayoutDashboard },
    { to: "/collector/requests", label: "Requests", icon: Inbox },
    { to: "/collector/routes", label: "Routes", icon: RouteIcon },
    { to: "/collector/history", label: "History", icon: History },
    { to: "/collector/profile", label: "Profile", icon: User },
  ],
  general: [
    { to: "/collector/home", label: "Dashboard", icon: LayoutDashboard },
    { to: "/collector/requests", label: "Assignments", icon: ClipboardList },
    { to: "/collector/routes", label: "Routes", icon: RouteIcon },
    { to: "/collector/history", label: "History", icon: History },
    { to: "/collector/profile", label: "Profile", icon: User },
  ],
  independent: [
    { to: "/collector/home", label: "Home", icon: Home },
    { to: "/collector/requests", label: "Assignments", icon: ClipboardList },
    { to: "/collector/scan", label: "Scan", icon: ScanLine },
    { to: "/collector/history", label: "History", icon: History },
    { to: "/collector/profile", label: "Profile", icon: User },
  ],
};

/** Desktop sidebar: the bottom-nav sections plus the role's other existing screens. */
export const SIDEBAR_NAV: Record<CollectorCategory, { to: Tab["to"] | "/collector/verify"; label: string; icon: LucideIcon }[]> = {
  recycling: [
    NAV.recycling[0]!,
    NAV.recycling[1]!,
    NAV.recycling[2]!,
    { to: "/collector/verify", label: "Material received", icon: PackageCheck },
    { to: "/collector/scan", label: "Scan booking QR", icon: ScanLine },
    NAV.recycling[3]!,
    NAV.recycling[4]!,
  ],
  general: [
    NAV.general[0]!,
    NAV.general[1]!,
    NAV.general[2]!,
    { to: "/collector/scan", label: "Scan booking QR", icon: ScanLine },
    NAV.general[3]!,
    NAV.general[4]!,
  ],
  independent: NAV.independent,
};

export function CollectorNav() {
  const me = useMe();
  const { pathname } = useLocation();
  const board = useBoard(me);
  const badge = board.incoming.length;
  return (
    <nav className="relative z-20 shrink-0 rounded-t-3xl bg-card px-1 pb-safe pt-1 shadow-nav md:hidden" aria-label="Collector">
      <div className="flex items-end">
        {NAV[me.category].map((t) => {
          const active = pathname === t.to || pathname.startsWith(`${t.to}/`);
          const Icon = t.icon;
          if (t.to === "/collector/scan") {
            return (
              <div key={t.to} className="flex flex-1 justify-center">
                <Link
                  to={t.to}
                  aria-label="Scan booking QR"
                  className="-mt-9 grid size-[64px] place-items-center rounded-full bg-primary text-primary-foreground shadow-float ring-[6px] ring-background transition active:scale-95"
                >
                  <ScanLine className="size-7" />
                </Link>
              </div>
            );
          }
          return (
            <Link
              key={t.to}
              to={t.to}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex h-14 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className={cn("size-6", active && "stroke-[2.4]")} />
              {t.label}
              {t.to === "/collector/requests" && badge > 0 && (
                <span className="absolute right-[18%] top-1.5 grid min-w-5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
