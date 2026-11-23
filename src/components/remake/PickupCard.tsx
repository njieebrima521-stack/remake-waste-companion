import { Link } from "@tanstack/react-router";
import { CalendarClock, ChevronRight } from "lucide-react";

import { COLLECTORS, MATERIALS, STATUS_FLOW } from "@/lib/remake/data";
import { dayLabel } from "@/lib/remake/format";
import type { Pickup } from "@/lib/remake/types";
import { cn } from "@/lib/utils";

import { StatusPill } from "./bits";
import { MATERIAL_ICON } from "./icons";

export function PickupCard({ pickup, progress = false }: { pickup: Pickup; progress?: boolean }) {
  const Icon = MATERIAL_ICON[pickup.material];
  const collector = COLLECTORS.find((c) => c.id === pickup.collectorId);
  const stepIdx = STATUS_FLOW.indexOf(pickup.status);
  return (
    <Link
      to="/pickups/$id"
      params={{ id: pickup.id }}
      className="block rounded-3xl bg-card p-4 shadow-card transition active:scale-[0.99]"
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "grid size-12 shrink-0 place-items-center rounded-2xl",
            pickup.kind === "general"
              ? "bg-ink text-ink-foreground"
              : "bg-primary-soft text-primary-deep",
          )}
        >
          <Icon className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-semibold">{MATERIALS[pickup.material].name}</p>
            <span className="text-xs text-muted-foreground">
              · {pickup.quantity} bag{pickup.quantity > 1 ? "s" : ""}
            </span>
          </div>
          <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
            <CalendarClock className="size-3.5" /> {dayLabel(pickup.date)} · {pickup.slot}
          </p>
        </div>
        <ChevronRight className="size-5 text-muted-foreground" />
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <StatusPill pickup={pickup} />
        <span className="truncate text-xs text-muted-foreground">
          {collector ? collector.name : "Finding a collector"}
        </span>
      </div>
      {progress && pickup.status !== "cancelled" && (
        <div className="mt-3 flex gap-1">
          {STATUS_FLOW.map((s, i) => (
            <span
              key={s}
              className={cn("h-1.5 flex-1 rounded-full", i <= stepIdx ? "bg-primary" : "bg-border")}
            />
          ))}
        </div>
      )}
    </Link>
  );
}
