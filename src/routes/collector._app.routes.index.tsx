import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Info, Layers, Route as RouteIcon, TriangleAlert } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";

import { RouteCard } from "@/components/collector/routes";
import { CollectorNav, Meter, RequestCard, SectionHead, bags, useMe, useWorkState } from "@/components/collector/ui";
import { Pill } from "@/components/remake/bits";
import { StateView } from "@/components/remake/StateView";
import { Screen, ScreenBody, ScreenHeader } from "@/components/remake/Screen";
import { Button } from "@/components/ui/button";
import { requesterName, suggestRoutes } from "@/lib/remake/collector";
import { MATERIALS } from "@/lib/remake/data";
import { dayLabel } from "@/lib/remake/format";
import { pageHead } from "@/lib/remake/head";
import { actions } from "@/lib/remake/store";

export const Route = createFileRoute("/collector/_app/routes/")({
  head: () => pageHead("Collection routes", "Group compatible collections into simulated routes."),
  component: Routes,
});

function Routes() {
  const me = useMe();
  const state = useWorkState();
  const navigate = useNavigate();
  const { active, completed, suggestions, waiting } = useMemo(() => {
    const mine = state.routes.filter((r) => r.collectorId === me.id);
    return {
      active: mine.filter((r) => r.status !== "completed").sort((a, b) => a.date.localeCompare(b.date)),
      completed: mine.filter((r) => r.status === "completed"),
      suggestions: suggestRoutes(state, me),
      waiting: state.pickups.filter((p) => p.collectorId === me.id && p.status === "assigned" && p.notReady),
    };
  }, [state, me]);

  return (
    <Screen animate={false}>
      <ScreenHeader title="Collection routes" back={false} />
      <ScreenBody>
        <p className="flex gap-2 rounded-2xl bg-muted p-3 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          Simulated routing with sample data. Stops are grouped by zone, day, receiving partner, readiness and
          your vehicle capacity — no live GPS or automatic optimisation.
        </p>

        <SectionHead title="Active & planned" />
        {active.length ? (
          <div className="space-y-2.5">
            {active.map((r) => (
              <RouteCard key={r.id} route={r} state={state} />
            ))}
          </div>
        ) : (
          <p className="rounded-3xl border border-dashed border-border px-4 py-5 text-center text-sm text-muted-foreground">
            No active routes.
          </p>
        )}

        <SectionHead title="Suggested groupings" />
        {suggestions.length === 0 && (
          <StateView
            icon={Layers}
            tone="muted"
            title="Nothing to group"
            body="Accept ready requests first. Accepted jobs that aren't on a route show up here."
            className="py-6"
          />
        )}
        <div className="space-y-3">
          {suggestions.map((g) => {
            const stops = g.pickupIds.map((id) => state.pickups.find((p) => p.id === id)!);
            const materials = Array.from(new Set(stops.map((p) => MATERIALS[p.material].short)));
            return (
              <section key={g.key} className="rounded-2xl border border-border bg-card p-4 shadow-card">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {g.zoneName} · {g.partner}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {dayLabel(g.date)} · {g.window} · {stops.length} stop{stops.length > 1 ? "s" : ""}
                    </p>
                  </div>
                  <RouteIcon className="size-5 shrink-0 text-muted-foreground" />
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Pill className="bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">Same zone</Pill>
                  <Pill className="bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">Same day</Pill>
                  <Pill className="bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{g.partner}</Pill>
                  <Pill className="bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{materials.join(", ")}</Pill>
                </div>
                <ol className="mt-3 space-y-1.5">
                  {stops.map((p, i) => (
                    <li key={p.id} className="flex items-center gap-2 text-sm">
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-ink text-[11px] font-bold text-ink-foreground">
                        {i + 1}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{requesterName(p)}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {p.area} · {bags(p.quantity)}
                      </span>
                    </li>
                  ))}
                </ol>
                <div className="mt-3 flex items-baseline justify-between text-xs">
                  <span className="font-medium">Load</span>
                  <span className="tabular-nums text-muted-foreground">
                    {g.totalBags} / {g.capacity} bags · ~{g.totalKg} kg
                  </span>
                </div>
                <Meter value={g.totalBags} max={g.capacity} className="mt-1.5" />
                {g.overCapacity && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-destructive">
                    <TriangleAlert className="size-3.5" /> One job is larger than your vehicle capacity.
                  </p>
                )}
                <Button
                  className="mt-3 w-full"
                  disabled={g.overCapacity}
                  onClick={() => {
                    const r = actions.createRoute(me.id, g.pickupIds);
                    if (r.ok && r.routeId) {
                      toast.success("Route created");
                      void navigate({ to: "/collector/routes/$id", params: { id: r.routeId } });
                    } else if (!r.ok) toast.error(r.error);
                  }}
                >
                  Create route
                </Button>
              </section>
            );
          })}
        </div>

        {waiting.length > 0 && (
          <>
            <SectionHead title="Waiting until ready" />
            <div className="space-y-2.5">
              {waiting.map((p) => (
                <RequestCard key={p.id} pickup={p} me={me} compact />
              ))}
            </div>
          </>
        )}

        {completed.length > 0 && (
          <>
            <SectionHead title="Completed" />
            <div className="space-y-2.5">
              {completed.map((r) => (
                <RouteCard key={r.id} route={r} state={state} />
              ))}
            </div>
          </>
        )}
      </ScreenBody>
      <CollectorNav />
    </Screen>
  );
}
