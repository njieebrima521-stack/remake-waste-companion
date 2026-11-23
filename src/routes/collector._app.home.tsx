import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Gauge, Inbox, PackageCheck, Route as RouteIcon, ScanLine, Scale, TriangleAlert, Truck } from "lucide-react";
import { useMemo } from "react";

import { CollectorNav, Meter, RequestCard, SectionHead, SeeAll, StatTile, bags, useBoard, useMe, useWorkState } from "@/components/collector/ui";
import { HeroStat, WorkHero } from "@/components/collector/WorkHeader";
import { DemoBadge, Pill } from "@/components/remake/bits";
import { Screen, ScreenBody } from "@/components/remake/Screen";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { collectorHistory, historyStats, isAvailable, isoDay, requesterName, routeLoad, verificationState } from "@/lib/remake/collector";
import { MATERIALS } from "@/lib/remake/data";
import { dayLabel } from "@/lib/remake/format";
import { pageHead } from "@/lib/remake/head";
import { actions } from "@/lib/remake/store";
import type { AppState, CollectionRoute, Collector, Pickup } from "@/lib/remake/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/collector/_app/home")({
  head: () => pageHead("Collector dashboard", "Today's requests, routes, collections and performance."),
  component: Dashboard,
});

function useDashboard(me: Collector) {
  const state = useWorkState();
  const board = useBoard(me);
  return useMemo(() => {
    const today = isoDay(Date.now());
    const routes = state.routes.filter((r) => r.collectorId === me.id && r.status !== "completed");
    const todayRoutes = routes.filter((r) => r.date <= today);
    const toVerify = state.pickups.filter(
      (p) => p.collectedBy === me.id && p.status === "collected" && p.kind === "recyclable",
    );
    const items = collectorHistory(state, me.id);
    const month = items.filter((i) => Date.now() - Date.parse(i.at) < 30 * 24 * 60 * 60 * 1000);
    const stats = historyStats(month, Date.now());
    const todayStops = todayRoutes.reduce((s, r) => s + r.stops.filter((x) => x.state === "pending" || x.state === "arrived").length, 0);
    const todayJobs = board.accepted.filter((p) => p.date <= today);
    const todayLoad = todayJobs.reduce((s, p) => s + p.quantity, 0);
    return { today, routes, todayRoutes, toVerify, stats, todayStops, todayJobs, todayLoad, state };
  }, [state, me, board]);
}

function Dashboard() {
  const me = useMe();
  return (
    <Screen animate={false}>
      <ScreenBody className="pt-safe">
        {me.category === "recycling" && <RecyclingDashboard me={me} />}
        {me.category === "general" && <GeneralDashboard me={me} />}
        {me.category === "independent" && <IndependentDashboard me={me} />}
        <p className="mt-8 text-center text-xs text-muted-foreground">Sample data · simulated collector workflow</p>
      </ScreenBody>
      <CollectorNav />
    </Screen>
  );
}

function RecyclingDashboard({ me }: { me: Collector }) {
  const board = useBoard(me);
  const d = useDashboard(me);
  return (
    <>
      <WorkHero me={me}>
        <div className="mt-4 flex gap-2">
          <HeroStat label="New requests" value={board.incoming.length} />
          <HeroStat label="Stops today" value={d.todayStops} />
          <HeroStat label="To verify" value={d.toVerify.length} />
        </div>
      </WorkHero>
      <div className="mt-3 flex justify-center">
        <DemoBadge>Sample data</DemoBadge>
      </div>

      <SectionHead title="Today's route" action={<SeeAll to="/collector/routes" label="All routes" />} />
      <RoutesToday routes={d.todayRoutes} state={d.state} />

      <SectionHead title="Material received" action={<SeeAll to="/collector/verify" />} />
      {d.toVerify.length === 0 ? (
        <EmptyLine text="Nothing waiting for verification." />
      ) : (
        <div className="space-y-2">
          {d.toVerify.slice(0, 3).map((p) => (
            <VerifyRow key={p.id} p={p} />
          ))}
        </div>
      )}

      <SectionHead title="Compatible requests" action={<SeeAll to="/collector/requests" />} />
      <IncomingPreview me={me} list={board.incoming} />

      <SectionHead title="Performance · last 30 days" action={<SeeAll to="/collector/history" label="History" />} />
      <div className="grid grid-cols-2 gap-3">
        <StatTile icon={Scale} label="Kg collected" value={d.stats.kg} tone="primary" />
        <StatTile icon={PackageCheck} label="Collections" value={d.stats.completed} />
        <StatTile
          icon={Gauge}
          label="Verified"
          value={`${d.stats.completed ? Math.round((d.stats.verification.verified / d.stats.completed) * 100) : 0}%`}
        />
        <StatTile icon={TriangleAlert} label="Missed" value={d.stats.missed} tone={d.stats.missed ? "warning" : "default"} />
      </div>
    </>
  );
}

function GeneralDashboard({ me }: { me: Collector }) {
  const board = useBoard(me);
  const d = useDashboard(me);
  return (
    <>
      <WorkHero me={me}>
        <div className="mt-4 flex gap-2">
          <HeroStat label="New assignments" value={board.incoming.length} />
          <HeroStat label="Stops today" value={d.todayStops} />
          <HeroStat label="Accepted" value={board.accepted.length} />
        </div>
      </WorkHero>
      <div className="mt-3 flex justify-center">
        <DemoBadge>Sample data</DemoBadge>
      </div>

      <SectionHead title="Vehicle & availability" />
      <Availability me={me}>
        <div className="mt-4">
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-medium">Today's load</span>
            <span className="tabular-nums text-muted-foreground">
              {d.todayLoad} / {me.capacityBags} bags
            </span>
          </div>
          <Meter value={d.todayLoad} max={me.capacityBags} className="mt-2" />
        </div>
      </Availability>

      <SectionHead title="Today's route" action={<SeeAll to="/collector/routes" label="All routes" />} />
      <RoutesToday routes={d.todayRoutes} state={d.state} />

      <SectionHead title="Eligible assignments" action={<SeeAll to="/collector/requests" />} />
      <IncomingPreview me={me} list={board.incoming} />

      <SectionHead title="Last 30 days" action={<SeeAll to="/collector/history" label="History" />} />
      <div className="grid grid-cols-3 gap-2">
        <StatTile label="Collections" value={d.stats.completed} tone="primary" />
        <StatTile label="Bags" value={d.stats.bags} />
        <StatTile label="Missed" value={d.stats.missed} tone={d.stats.missed ? "warning" : "default"} />
      </div>
    </>
  );
}

function IndependentDashboard({ me }: { me: Collector }) {
  const board = useBoard(me);
  const d = useDashboard(me);
  return (
    <>
      <WorkHero me={me} />
      <Button asChild size="lg" className="mt-4 h-16 text-base">
        <Link to="/collector/scan">
          <ScanLine className="size-6" /> Scan booking QR
        </Link>
      </Button>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Link to="/collector/requests" className="rounded-2xl border border-border bg-card p-4 shadow-card active:scale-[0.99]">
          <Inbox className="mb-2 size-5 text-primary-deep" />
          <p className="font-display text-2xl font-bold">{board.incoming.length}</p>
          <p className="text-xs font-medium text-muted-foreground">New job offers</p>
        </Link>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
          <PackageCheck className="mb-2 size-5 text-primary-deep" />
          <p className="font-display text-2xl font-bold">{d.stats.completed}</p>
          <p className="text-xs font-medium text-muted-foreground">Done in 30 days</p>
        </div>
      </div>

      <SectionHead title="My jobs" action={<SeeAll to="/collector/requests" label="All" />} />
      {board.accepted.length === 0 ? (
        <EmptyLine text="No accepted jobs. Check new job offers." />
      ) : (
        <div className="space-y-2.5">
          {board.accepted.map((p) => (
            <RequestCard key={p.id} pickup={p} me={me} compact />
          ))}
        </div>
      )}

      <SectionHead title="Availability" />
      <Availability me={me} />
    </>
  );
}

function Availability({ me, children }: { me: Collector; children?: React.ReactNode }) {
  const state = useWorkState();
  const available = isAvailable(state, me.id);
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-2xl bg-primary-soft text-primary-deep">
          <Truck className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{me.vehicle}</p>
          <p className="text-xs text-muted-foreground">Capacity {bags(me.capacityBags)} per trip</p>
        </div>
        <label className="flex items-center gap-2 text-sm font-medium">
          {available ? "Available" : "Off duty"}
          <Switch
            checked={available}
            onCheckedChange={(v) => actions.updateCollectorProfile(me.id, { available: v })}
            aria-label="Available for new requests"
          />
        </label>
      </div>
      {!available && (
        <p className="mt-3 rounded-2xl bg-warning-soft p-3 text-xs text-warning-foreground">
          You won't receive new open requests while off duty. Requests go to the next suitable collector.
        </p>
      )}
      {children}
    </div>
  );
}

function RoutesToday({ routes, state }: { routes: CollectionRoute[]; state: AppState }) {
  if (!routes.length) return <EmptyLine text="No route planned for today. Create one from your accepted jobs." />;
  return (
    <div className="space-y-2.5">
      {routes.map((r) => {
        const load = routeLoad(state, r);
        const done = r.stops.filter((s) => s.state !== "pending" && s.state !== "arrived").length;
        return (
          <Link
            key={r.id}
            to="/collector/routes/$id"
            params={{ id: r.id }}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card active:scale-[0.99]"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-ink text-ink-foreground">
              <RouteIcon className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">
                {r.ref} · {r.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {dayLabel(r.date)} · {r.window} · {done}/{r.stops.length} stops · {bags(load.bags)}
              </p>
              <Meter value={done} max={r.stops.length} className="mt-2 h-1.5" />
            </div>
            <Pill className={cn(r.status === "in_progress" ? "bg-primary-soft text-primary-deep" : "bg-info-soft text-info")}>
              {r.status === "in_progress" ? "In progress" : "Planned"}
            </Pill>
          </Link>
        );
      })}
    </div>
  );
}

function VerifyRow({ p }: { p: Pickup }) {
  const v = verificationState(p);
  return (
    <Link
      to="/collector/verify/$id"
      params={{ id: p.id }}
      className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-card active:scale-[0.99]"
    >
      <span className="grid size-11 place-items-center rounded-2xl bg-warning-soft text-warning-foreground">
        <Scale className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{requesterName(p)}</p>
        <p className="text-xs text-muted-foreground">
          {MATERIALS[p.material].short} · {bags(p.quantity)} · {v === "needs_sorting" ? "needs sorting" : "verify now"}
        </p>
      </div>
      <ChevronRight className="size-4 text-muted-foreground" />
    </Link>
  );
}

function IncomingPreview({ me, list }: { me: Collector; list: Pickup[] }) {
  if (!list.length) return <EmptyLine text="No new requests right now." />;
  return (
    <div className="space-y-2.5">
      {list.slice(0, 3).map((p) => (
        <RequestCard key={p.id} pickup={p} me={me} compact />
      ))}
    </div>
  );
}

function EmptyLine({ text }: { text: string }) {
  return <p className="rounded-3xl border border-dashed border-border px-4 py-5 text-center text-sm text-muted-foreground">{text}</p>;
}
