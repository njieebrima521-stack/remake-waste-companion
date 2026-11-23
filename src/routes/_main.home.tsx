import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { ArrowDownLeft, ArrowUpRight, Bell, BookOpen, CalendarClock, Gift, Leaf, Recycle, ScanLine, Truck } from "lucide-react";

import { CoinIcon } from "@/components/remake/CoinIcon";
import { PickupCard } from "@/components/remake/PickupCard";
import { BottomNav } from "@/components/remake/BottomNav";
import { PageHeader, Panel, StatCard } from "@/components/remake/panels";
import { Screen, ScreenBody } from "@/components/remake/Screen";
import { WalletCard } from "@/components/remake/WalletCard";
import { MATERIALS, STATUS_LABEL } from "@/lib/remake/data";
import { ago, coins, dayLabel } from "@/lib/remake/format";
import { pageHead } from "@/lib/remake/head";
import { isActive, isUpcoming, residentPickups, walletSummary } from "@/lib/remake/logic";
import { useApp } from "@/lib/remake/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_main/home")({
  head: () => pageHead("Home", "Your Green Coins, active pickups and quick actions."),
  component: Home,
});

const MONTH_GOAL = 20;

const quick = [
  { to: "/collect", label: "Request collection", icon: Truck },
  { to: "/scan", label: "Scan waste", icon: ScanLine },
  { to: "/guide", label: "Recycling guide", icon: BookOpen },
  { to: "/rewards", label: "Rewards", icon: Gift },
] as const;

function Home() {
  const user = useApp((s) => s.user);
  const pickups = useApp((s) => residentPickups(s.pickups));
  const tx = useApp((s) => s.transactions);
  const unread = useApp((s) => s.notifications.filter((n) => !n.read).length);

  const active = pickups.find(isActive) ?? pickups.find(isUpcoming);
  const monthAgo = Date.now() - 30 * 24 * 3600 * 1000;
  const bags = pickups
    .filter((p) => p.kind === "recyclable" && (p.status === "collected" || p.status === "verified") && Date.parse(p.date) > monthAgo)
    .reduce((n, p) => n + p.quantity, 0);
  const pct = Math.min(1, bags / MONTH_GOAL);
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const next = pickups.find(isUpcoming) ?? active;
  const w = walletSummary(tx);
  const first = user.name.split(" ")[0] ?? user.name;

  return (
    <Screen animate={false} wide>
      <ScreenBody className="pt-safe md:pt-8">
        <div className="flex items-start justify-between gap-4">
          <PageHeader
            className="mb-5 md:mb-7"
            eyebrow={format(new Date(), "EEEE d MMMM")}
            title={
              <>
                {greet}, {first} 👋
              </>
            }
            description="Request a collection, follow your pickup and spend your Green Coins."
          />
          <Link
            to="/notifications"
            aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
            className="relative mt-1 grid size-11 shrink-0 place-items-center rounded-full border border-border bg-card active:scale-95 md:hidden"
          >
            <Bell className="size-5" />
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                {unread}
              </span>
            )}
          </Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.55fr_1fr]">
          <section className="relative overflow-hidden rounded-2xl bg-gradient-category p-5 text-primary-foreground shadow-card md:p-6">
            <Leaf className="pointer-events-none absolute -right-8 -top-8 size-44 opacity-10" />
            <Link to="/collect" className="relative flex items-center gap-4 active:scale-[0.99]">
              <div className="flex-1">
                <p className="font-display text-xl font-semibold leading-snug">Have waste to hand over?</p>
                <p className="mt-1 text-sm opacity-85">Book a collector to your gate in under a minute.</p>
              </div>
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-card text-primary-deep">
                <ArrowUpRight className="size-6" />
              </span>
            </Link>
            <div className="relative mt-5 grid grid-cols-4 gap-2 sm:gap-3">
              {quick.map((q) => (
                <Link
                  key={q.to}
                  to={q.to}
                  className="group flex flex-col items-center gap-2 rounded-2xl bg-card px-1.5 py-3 text-center text-foreground transition hover:-translate-y-0.5 hover:shadow-card active:scale-95 sm:p-4"
                >
                  <span className="grid size-11 place-items-center rounded-full bg-primary-soft text-primary-deep transition-colors group-hover:bg-primary group-hover:text-primary-foreground sm:size-12">
                    <q.icon className="size-5" />
                  </span>
                  <span className="text-[11px] font-semibold leading-tight sm:text-sm">{q.label}</span>
                </Link>
              ))}
            </div>
          </section>
          <WalletCard />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
          <StatCard
            label="Next collection"
            value={next ? dayLabel(next.date) : "Not booked"}
            sub={next ? next.slot : "Request one when you're ready"}
            icon={CalendarClock}
            tone="brand"
          />
          <StatCard
            label="Pickup status"
            value={<span className="text-lg sm:text-xl">{next ? STATUS_LABEL[next.status] : "—"}</span>}
            sub={next ? MATERIALS[next.material].name : "No active pickup"}
            icon={Truck}
          />
          <StatCard label="Green Coins" value={coins(w.available)} sub={`${coins(w.pending)} pending verification`} icon={Gift} />
          <StatCard label="Bags recycled" value={`${bags} / ${MONTH_GOAL}`} sub="Last 30 days" icon={Recycle} />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.55fr_1fr]">
          <Panel
            title="Active pickup"
            action={<Link to="/pickups" className="text-sm font-semibold text-primary-deep hover:underline">See all</Link>}
          >
            {active ? (
              <PickupCard pickup={active} progress />
            ) : (
              <div className="rounded-2xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
                No pickups scheduled. <Link to="/collect" className="font-semibold text-primary-deep">Request one</Link>
              </div>
            )}
          </Panel>

          <Panel title="Recycling progress">
            <div className="flex items-center gap-5">
              <svg viewBox="0 0 80 80" className="size-24 shrink-0 -rotate-90">
                <circle cx="40" cy="40" r="34" fill="none" strokeWidth="9" className="stroke-primary-soft" />
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  fill="none"
                  strokeWidth="9"
                  strokeLinecap="round"
                  className="stroke-primary transition-all duration-700"
                  strokeDasharray={`${pct * 213.6} 213.6`}
                />
                <text x="40" y="46" textAnchor="middle" className="rotate-90 fill-foreground font-display text-lg font-bold" transform="rotate(90 40 40)">
                  {Math.round(pct * 100)}%
                </text>
              </svg>
              <div>
                <p className="font-display text-2xl font-bold">
                  {bags} <span className="text-base font-medium text-muted-foreground">/ {MONTH_GOAL} bags</span>
                </p>
                <p className="mt-1 text-sm text-muted-foreground">Recycled in the last 30 days. Keep going to reach your monthly goal!</p>
              </div>
            </div>
          </Panel>
        </div>

        <Panel
          className="mt-4"
          title="Recent activity"
          action={<Link to="/wallet" className="text-sm font-semibold text-primary-deep hover:underline">See all</Link>}
          bodyClassName="pt-1 sm:pt-1"
        >
          <ul className="divide-y divide-border">
            {tx.slice(0, 4).map((t) => (
              <li key={t.id} className="flex items-center gap-3 py-3">
                <span
                  className={cn(
                    "grid size-10 shrink-0 place-items-center rounded-xl",
                    t.type === "redeem" ? "bg-coin-soft text-warning-foreground" : "bg-primary-soft text-primary-deep",
                  )}
                >
                  {t.type === "redeem" ? <ArrowUpRight className="size-5" /> : <ArrowDownLeft className="size-5" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium">{t.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {ago(t.at)}
                    {t.status === "pending" && " · Pending"}
                  </p>
                </div>
                <span className={cn("flex items-center gap-1 font-semibold tabular-nums", t.type === "redeem" ? "text-foreground" : "text-primary-deep")}>
                  {t.type === "redeem" ? "−" : "+"}
                  {coins(t.amount)} <CoinIcon className="size-4 text-[8px]" />
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </ScreenBody>
      <BottomNav />
    </Screen>
  );
}
