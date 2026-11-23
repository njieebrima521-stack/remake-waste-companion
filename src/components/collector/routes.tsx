import { Link } from "@tanstack/react-router";
import { Route as RouteIcon } from "lucide-react";

import { Pill } from "@/components/remake/bits";
import { routeLoad } from "@/lib/remake/collector";
import { dayLabel } from "@/lib/remake/format";
import type { AppState, CollectionRoute, StopState } from "@/lib/remake/types";
import { cn } from "@/lib/utils";

import { Meter, bags } from "./ui";

export const ROUTE_STATUS: Record<CollectionRoute["status"], { label: string; tone: string }> = {
  planned: { label: "Planned", tone: "bg-info-soft text-info" },
  in_progress: { label: "In progress", tone: "bg-primary-soft text-primary-deep" },
  completed: { label: "Completed", tone: "bg-muted text-muted-foreground" },
};

export const STOP_STATE: Record<StopState, { label: string; tone: string }> = {
  pending: { label: "To do", tone: "bg-muted text-muted-foreground" },
  arrived: { label: "Arrived", tone: "bg-info-soft text-info" },
  collected: { label: "Collected", tone: "bg-primary-soft text-primary-deep" },
  missed: { label: "Missed", tone: "bg-destructive-soft text-destructive" },
  not_ready: { label: "Not ready", tone: "bg-warning-soft text-warning-foreground" },
};

export function RouteCard({ route, state }: { route: CollectionRoute; state: AppState }) {
  const load = routeLoad(state, route);
  const done = route.stops.filter((s) => s.state !== "pending" && s.state !== "arrived").length;
  const st = ROUTE_STATUS[route.status];
  return (
    <Link
      to="/collector/routes/$id"
      params={{ id: route.id }}
      className="flex items-center gap-3 rounded-3xl bg-card p-4 shadow-card active:scale-[0.99]"
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-ink text-ink-foreground">
        <RouteIcon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">
          {route.ref} · {route.name}
        </p>
        <p className="text-xs text-muted-foreground">
          {dayLabel(route.date)} · {route.window} · {done}/{route.stops.length} stops · {bags(load.bags)}
        </p>
        <Meter value={done} max={route.stops.length} className="mt-2 h-1.5" />
      </div>
      <Pill className={cn("shrink-0", st.tone)}>{st.label}</Pill>
    </Link>
  );
}
