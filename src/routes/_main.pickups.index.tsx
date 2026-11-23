import { createFileRoute, Link } from "@tanstack/react-router";
import { History, Plus, Truck } from "lucide-react";
import { useState } from "react";

import { BottomNav } from "@/components/remake/BottomNav";
import { PickupCard } from "@/components/remake/PickupCard";
import { Screen, ScreenBody, ScreenHeader } from "@/components/remake/Screen";
import { StateView } from "@/components/remake/StateView";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/remake/head";
import { isActive, isCancelled, isCompleted, isUpcoming, residentPickups } from "@/lib/remake/logic";
import { useApp } from "@/lib/remake/store";
import type { Pickup } from "@/lib/remake/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_main/pickups/")({
  head: () => pageHead("My pickups", "Track active, upcoming, completed and cancelled pickups."),
  component: Pickups,
});

const TABS: { id: string; label: string; test: (p: Pickup) => boolean; empty: string }[] = [
  { id: "active", label: "Active", test: isActive, empty: "No collector is on the way right now." },
  { id: "upcoming", label: "Upcoming", test: isUpcoming, empty: "You have no upcoming pickups." },
  {
    id: "completed",
    label: "Completed",
    test: isCompleted,
    empty: "Completed pickups will show here.",
  },
  { id: "cancelled", label: "Cancelled", test: isCancelled, empty: "No cancelled pickups." },
];

function Pickups() {
  const pickups = useApp((s) => residentPickups(s.pickups));
  const [tab, setTab] = useState(() => (pickups.some(isActive) ? "active" : "upcoming"));
  const current = TABS.find((t) => t.id === tab) ?? TABS[0]!;
  const list = pickups.filter(current.test);

  return (
    <Screen animate={false}>
      <ScreenHeader
        title="My pickups"
        back={false}
        right={
          <Link
            to="/pickups/history"
            aria-label="Collection history"
            className="grid size-11 place-items-center rounded-full border border-border bg-card"
          >
            <History className="size-5" />
          </Link>
        }
      />
      <div
        className="mx-5 mb-3 grid shrink-0 grid-cols-4 gap-1 rounded-full bg-card p-1 shadow-card"
        role="tablist"
      >
        {TABS.map((t) => {
          const n = pickups.filter(t.test).length;
          const on = t.id === tab;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={on}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "flex flex-col items-center rounded-full py-1.5 text-[13px] font-semibold leading-tight transition",
                on ? "bg-primary text-primary-foreground" : "text-muted-foreground",
              )}
            >
              {t.label}
              <span className="text-[11px] font-medium tabular-nums opacity-80">{n}</span>
            </button>
          );
        })}
      </div>
      <ScreenBody key={tab} className="animate-fade-up">
        {list.length === 0 ? (
          <StateView icon={Truck} tone="muted" title="Nothing here yet" body={current.empty}>
            <Button asChild size="lg">
              <Link to="/collect">
                <Plus /> Request collection
              </Link>
            </Button>
          </StateView>
        ) : (
          <div className="space-y-3 pt-1">
            {list.map((p) => (
              <PickupCard key={p.id} pickup={p} progress={tab === "active" || tab === "upcoming"} />
            ))}
            <Link
              to="/collect"
              className="flex items-center justify-center gap-2 rounded-3xl border border-dashed border-border py-4 text-sm font-semibold text-primary"
            >
              <Plus className="size-4" /> Request another collection
            </Link>
          </div>
        )}
      </ScreenBody>
      <BottomNav />
    </Screen>
  );
}
