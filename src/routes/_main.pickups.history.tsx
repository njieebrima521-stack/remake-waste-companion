import { createFileRoute } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { History } from "lucide-react";

import { CoinIcon } from "@/components/remake/CoinIcon";
import { PickupCard } from "@/components/remake/PickupCard";
import { Screen, ScreenBody, ScreenHeader } from "@/components/remake/Screen";
import { StateView } from "@/components/remake/StateView";
import { coins } from "@/lib/remake/format";
import { pageHead } from "@/lib/remake/head";
import { isCancelled, isCompleted, residentPickups } from "@/lib/remake/logic";
import { useApp } from "@/lib/remake/store";
import type { Pickup } from "@/lib/remake/types";

export const Route = createFileRoute("/_main/pickups/history")({
  head: () => pageHead("Collection history", "Every pickup you've completed or cancelled."),
  component: PickupHistory,
});

function PickupHistory() {
  const pickups = useApp((s) => residentPickups(s.pickups));
  const past = pickups
    .filter((p) => isCompleted(p) || isCancelled(p))
    .sort((a, b) => b.date.localeCompare(a.date));
  const done = past.filter(isCompleted);
  const bags = done.reduce((n, p) => n + p.quantity, 0);
  const earned = done.filter((p) => p.status === "verified").reduce((n, p) => n + p.coins, 0);

  const groups = past.reduce<Record<string, Pickup[]>>((acc, p) => {
    const k = format(parseISO(p.date), "MMMM yyyy");
    (acc[k] ??= []).push(p);
    return acc;
  }, {});

  return (
    <Screen>
      <ScreenHeader title="Collection history" fallback="/pickups" />
      <ScreenBody>
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { label: "Pickups", value: done.length },
            { label: "Bags", value: bags },
            { label: "Coins earned", value: coins(earned), coin: true },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-3.5 text-center shadow-card">
              <p className="flex items-center justify-center gap-1 font-display text-2xl font-bold tabular-nums">
                {s.value} {s.coin && <CoinIcon className="size-4 text-[8px]" />}
              </p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
        {past.length === 0 ? (
          <StateView
            icon={History}
            tone="muted"
            title="No history yet"
            body="Completed and cancelled pickups appear here."
          />
        ) : (
          Object.entries(groups).map(([month, list]) => (
            <section key={month}>
              <h2 className="mb-3 mt-7 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {month}
              </h2>
              <div className="space-y-3">
                {list.map((p) => (
                  <PickupCard key={p.id} pickup={p} />
                ))}
              </div>
            </section>
          ))
        )}
      </ScreenBody>
    </Screen>
  );
}
