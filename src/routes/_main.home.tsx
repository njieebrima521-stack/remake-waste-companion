import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDownLeft, ArrowUpRight, Bell, BookOpen, Gift, ScanLine, Truck } from "lucide-react";

import { CoinIcon } from "@/components/remake/CoinIcon";
import { PickupCard } from "@/components/remake/PickupCard";
import { BottomNav } from "@/components/remake/BottomNav";
import { Screen } from "@/components/remake/Screen";
import { SectionTitle } from "@/components/remake/bits";
import { WalletCard } from "@/components/remake/WalletCard";
import { ago, coins } from "@/lib/remake/format";
import { pageHead } from "@/lib/remake/head";
import { isActive, isUpcoming, residentPickups } from "@/lib/remake/logic";
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

  return (
    <Screen animate={false}>
      <main className="no-scrollbar min-h-0 flex-1 overflow-y-auto pb-6">
        <div className="rounded-b-[2.5rem] bg-primary px-5 pb-28 pt-safe text-primary-foreground">
          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="text-[15px] opacity-90">{greet} 👋</p>
              <p className="font-display text-2xl font-semibold">{user.name}</p>
            </div>
            <Link
              to="/notifications"
              aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
              className="relative grid size-12 place-items-center rounded-full bg-card text-foreground active:scale-95"
            >
              <Bell className="size-6" />
              {unread > 0 && (
                <span className="absolute right-2.5 top-2.5 grid size-4 place-items-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground ring-2 ring-card">
                  {unread}
                </span>
              )}
            </Link>
          </div>
        </div>

        <div className="-mt-24 px-5">
          <WalletCard />

          <div className="mt-6 grid grid-cols-4 gap-2">
            {quick.map((q) => (
              <Link key={q.to} to={q.to} className="flex flex-col items-center gap-2 text-center active:scale-95">
                <span className="grid size-16 place-items-center rounded-3xl bg-primary-soft text-primary-deep">
                  <q.icon className="size-7" />
                </span>
                <span className="text-xs font-medium leading-tight">{q.label}</span>
              </Link>
            ))}
          </div>

          <Link
            to="/collect"
            className="mt-6 flex items-center gap-4 overflow-hidden rounded-3xl bg-gradient-category p-5 text-primary-foreground active:scale-[0.99]"
          >
            <div className="flex-1">
              <p className="font-display text-lg font-semibold leading-snug">Have waste to hand over?</p>
              <p className="mt-1 text-sm opacity-85">Book a collector to your gate in under a minute.</p>
            </div>
            <span className="grid size-12 place-items-center rounded-full bg-card text-primary-deep">
              <ArrowUpRight className="size-6" />
            </span>
          </Link>

          <SectionTitle action={<Link to="/pickups" className="text-sm font-medium text-muted-foreground">See all</Link>}>
            Active pickup
          </SectionTitle>
          {active ? (
            <PickupCard pickup={active} progress />
          ) : (
            <div className="rounded-3xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
              No pickups scheduled. <Link to="/collect" className="font-semibold text-primary">Request one</Link>
            </div>
          )}

          <SectionTitle>Recycling progress</SectionTitle>
          <div className="flex items-center gap-5 rounded-3xl bg-card p-5 shadow-card">
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

          <SectionTitle action={<Link to="/wallet" className="text-sm font-medium text-muted-foreground">See all</Link>}>
            Recent activity
          </SectionTitle>
          <div className="space-y-2.5">
            {tx.slice(0, 4).map((t) => (
              <div key={t.id} className="flex items-center gap-3 rounded-3xl bg-card p-3.5 shadow-card">
                <span
                  className={cn(
                    "grid size-11 place-items-center rounded-2xl",
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
              </div>
            ))}
          </div>
        </div>
      </main>
      <BottomNav />
    </Screen>
  );
}
