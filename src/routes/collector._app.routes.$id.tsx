import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Flag, MapPin, Navigation, ScanLine, ShieldBan } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ROUTE_STATUS, STOP_STATE } from "@/components/collector/routes";
import { NoteSheet } from "@/components/collector/sheets";
import { MaterialBubble, Meter, bags, useMe, useWorkState } from "@/components/collector/ui";
import { Pill } from "@/components/remake/bits";
import { StateView } from "@/components/remake/StateView";
import { Screen, ScreenBody, ScreenFooter, ScreenHeader } from "@/components/remake/Screen";
import { Button } from "@/components/ui/button";
import { requesterName, routeLoad } from "@/lib/remake/collector";
import { MATERIALS, ZONES } from "@/lib/remake/data";
import { longDate, shortDateTime } from "@/lib/remake/format";
import { pageHead } from "@/lib/remake/head";
import { qrPayload } from "@/lib/remake/logic";
import { actions } from "@/lib/remake/store";
import type { Pickup, RouteStop } from "@/lib/remake/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/collector/_app/routes/$id")({
  head: () => pageHead("Route", "Collection route stops, load and progress."),
  component: RouteDetail,
});

type Report = { pickupId: string; kind: "missed" | "not_ready" } | null;

function RouteDetail() {
  const { id } = Route.useParams();
  const me = useMe();
  const state = useWorkState();
  const [report, setReport] = useState<Report>(null);
  const route = state.routes.find((r) => r.id === id && r.collectorId === me.id);

  if (!route) {
    return (
      <Screen>
        <ScreenHeader title="Route" fallback="/collector/routes" />
        <ScreenBody>
          <StateView icon={ShieldBan} tone="muted" title="Route not found" body="This route doesn't belong to your account.">
            <Button asChild variant="outline" size="lg">
              <Link to="/collector/routes">Back to routes</Link>
            </Button>
          </StateView>
        </ScreenBody>
      </Screen>
    );
  }

  const load = routeLoad(state, route);
  const zone = ZONES.find((z) => z.id === route.zone);
  const openStops = route.stops.filter((s) => s.state === "pending" || s.state === "arrived").length;
  const nextIdx = route.stops.findIndex((s) => s.state === "pending" || s.state === "arrived");
  const st = ROUTE_STATUS[route.status];
  const done = route.status === "completed";

  const run = (res: { ok: boolean; error?: string }, msg: string) =>
    res.ok ? toast.success(msg) : toast.error(res.error ?? "Something went wrong");

  return (
    <Screen>
      <ScreenHeader title={route.ref} subtitle={route.name} fallback="/collector/routes" />
      <ScreenBody>
        <section className="rounded-3xl bg-card p-4 shadow-card">
          <div className="flex items-center justify-between">
            <p className="font-semibold">{zone?.name ?? route.zone}</p>
            <Pill className={st.tone}>{st.label}</Pill>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {longDate(route.date)} · {route.window}
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <Mini label="Stops" value={route.stops.length} />
            <Mini label="Bags" value={load.bags} />
            <Mini label="Est. kg" value={load.kg} />
          </div>
          <div className="mt-4 flex items-baseline justify-between text-xs">
            <span className="font-medium">Total load vs {me.vehicle.toLowerCase()}</span>
            <span className="tabular-nums text-muted-foreground">
              {load.bags} / {me.capacityBags} bags
            </span>
          </div>
          <Meter value={load.bags} max={me.capacityBags} className="mt-1.5" />
          <p className="mt-3 text-xs text-muted-foreground">
            Categories: {load.materials.map((m) => MATERIALS[m].short).join(", ")}
          </p>
        </section>

        <RouteStrip stops={route.stops} pickups={load.pickups} next={nextIdx} />

        <h2 className="mb-2 mt-6 text-[17px] font-semibold">Stops in order</h2>
        <ol className="space-y-3">
          {route.stops.map((s, i) => {
            const p = load.pickups.find((x) => x.id === s.pickupId);
            if (!p) return null;
            const info = STOP_STATE[s.state];
            const isOpen = !done && (s.state === "pending" || s.state === "arrived");
            return (
              <li
                key={s.pickupId}
                className={cn("rounded-3xl bg-card p-4 shadow-card", i === nextIdx && !done && "ring-2 ring-primary")}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold",
                      s.state === "collected" ? "bg-primary text-primary-foreground" : "bg-ink text-ink-foreground",
                    )}
                  >
                    {s.state === "collected" ? <CheckCircle2 className="size-4" /> : i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link to="/collector/requests/$id" params={{ id: p.id }} className="block truncate font-semibold">
                      {requesterName(p)}
                    </Link>
                    <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                      <MapPin className="size-3" /> {p.address}, {p.area} · {p.slot}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <MaterialBubble material={p.material} className="size-7 rounded-lg [&_svg]:size-3.5" />
                      <span className="text-sm">
                        {MATERIALS[p.material].short} · {bags(p.quantity)}
                      </span>
                      <Pill className={cn("ml-auto px-2 py-0.5 text-[10px]", info.tone)}>{info.label}</Pill>
                    </div>
                    {s.note && <p className="mt-2 text-xs text-muted-foreground">Note: {s.note}</p>}
                    {s.at && s.state !== "pending" && (
                      <p className="mt-1 text-[11px] text-muted-foreground">{shortDateTime(s.at)}</p>
                    )}
                  </div>
                </div>
                {isOpen && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {s.state === "pending" ? (
                      <Button
                        size="sm"
                        className="col-span-2"
                        onClick={() => run(actions.arriveAtStop(route.id, p.id, me.id), "Marked as arrived")}
                      >
                        <Flag /> Mark arrived
                      </Button>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          onClick={() => {
                            const r = actions.confirmPickup(p.id, me.id);
                            if (r.ok) toast.success("Pickup confirmed");
                            else toast.error("This pickup can't be confirmed");
                          }}
                        >
                          <CheckCircle2 /> Confirm pickup
                        </Button>
                        <Button asChild size="sm" variant="outline">
                          <Link to="/collector/scan" search={{ code: qrPayload(p) }}>
                            <ScanLine /> Scan QR
                          </Link>
                        </Button>
                      </>
                    )}
                    <Button size="sm" variant="outline" onClick={() => setReport({ pickupId: p.id, kind: "missed" })}>
                      Missed pickup
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setReport({ pickupId: p.id, kind: "not_ready" })}>
                      Not ready
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </ScreenBody>

      {!done && (
        <ScreenFooter>
          {route.status === "planned" ? (
            <Button size="lg" onClick={() => run(actions.startRoute(route.id, me.id), "Route started")}>
              <Navigation /> Start route
            </Button>
          ) : (
            <>
              {openStops > 0 && (
                <p className="text-center text-xs text-muted-foreground">
                  {openStops} stop{openStops > 1 ? "s" : ""} still open
                </p>
              )}
              <Button
                size="lg"
                disabled={openStops > 0}
                onClick={() => run(actions.completeRoute(route.id, me.id), "Route completed")}
              >
                <CheckCircle2 /> Complete route
              </Button>
            </>
          )}
        </ScreenFooter>
      )}

      <NoteSheet
        open={!!report}
        onOpenChange={(o) => !o && setReport(null)}
        title={report?.kind === "missed" ? "Report a missed pickup" : "Report waste not ready"}
        description={
          report?.kind === "missed"
            ? "The stop is taken off this route so it can be rescheduled."
            : "The request waits until the requester confirms it's ready."
        }
        suggestions={
          report?.kind === "missed"
            ? ["Gate locked", "Nobody at the location", "Road blocked", "Vehicle broke down"]
            : ["Bags not separated", "Fewer bags than booked", "Waste still being collected"]
        }
        confirmLabel={report?.kind === "missed" ? "Report missed" : "Report not ready"}
        onConfirm={(note) => {
          if (!report) return;
          const r =
            report.kind === "missed"
              ? actions.reportMissed(route.id, report.pickupId, me.id, note)
              : actions.reportNotReady(route.id, report.pickupId, me.id, note);
          setReport(null);
          run(r, report.kind === "missed" ? "Missed pickup reported" : "Reported as not ready");
        }}
      />
    </Screen>
  );
}

function Mini({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-muted py-2.5">
      <p className="font-display text-lg font-bold tabular-nums">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

/** Illustrative stop sequence on a mock street grid — not a live map. */
function RouteStrip({ stops, pickups, next }: { stops: RouteStop[]; pickups: Pickup[]; next: number }) {
  return (
    <section className="relative mt-3 overflow-hidden rounded-3xl map-grid p-4" aria-label="Stop sequence">
      <div className="relative flex items-center justify-between gap-1">
        <span className="absolute inset-x-4 top-1/2 h-1 -translate-y-1/2 rounded-full bg-primary/40" />
        {stops.map((s, i) => {
          const p = pickups.find((x) => x.id === s.pickupId);
          return (
            <div key={s.pickupId} className="relative flex flex-col items-center gap-1">
              <span
                className={cn(
                  "grid size-9 place-items-center rounded-full border-4 border-card text-xs font-bold shadow-card",
                  s.state === "collected"
                    ? "bg-primary text-primary-foreground"
                    : s.state === "missed" || s.state === "not_ready"
                      ? "bg-destructive text-destructive-foreground"
                      : i === next
                        ? "bg-ink text-ink-foreground"
                        : "bg-card text-foreground",
                )}
              >
                {i + 1}
              </span>
              <span className="max-w-16 truncate rounded-full bg-card/90 px-1.5 text-[10px] font-medium">
                {p?.area ?? ""}
              </span>
            </div>
          );
        })}
      </div>
      <p className="relative mt-3 text-center text-[10px] font-medium text-muted-foreground">
        Illustrative sequence · not live GPS
      </p>
    </section>
  );
}
