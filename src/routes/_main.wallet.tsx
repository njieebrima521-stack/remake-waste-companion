import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Gift,
  Hourglass,
  Receipt,
  Sparkles,
  Wallet,
} from "lucide-react";
import { useState } from "react";

import { CoinIcon } from "@/components/remake/CoinIcon";
import { Screen, ScreenBody, ScreenHeader } from "@/components/remake/Screen";
import { StateView } from "@/components/remake/StateView";
import { Button } from "@/components/ui/button";
import { coins, shortDateTime } from "@/lib/remake/format";
import { pageHead } from "@/lib/remake/head";
import { walletSummary } from "@/lib/remake/logic";
import { useApp } from "@/lib/remake/store";
import type { Transaction } from "@/lib/remake/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_main/wallet")({
  head: () => pageHead("Green Coins wallet", "Your available, pending and redeemed Green Coins."),
  component: WalletScreen,
});

const FILTERS: { id: string; label: string; test: (t: Transaction) => boolean }[] = [
  { id: "all", label: "All", test: () => true },
  { id: "earned", label: "Earned", test: (t) => t.type !== "redeem" && t.status === "completed" },
  { id: "pending", label: "Pending", test: (t) => t.status === "pending" },
  { id: "redeemed", label: "Redeemed", test: (t) => t.type === "redeem" },
];

function WalletScreen() {
  const tx = useApp((s) => s.transactions);
  const w = walletSummary(tx);
  const [filter, setFilter] = useState("all");
  const list = tx.filter((FILTERS.find((f) => f.id === filter) ?? FILTERS[0]!).test);

  return (
    <Screen>
      <ScreenHeader title="Green Coins" fallback="/home" />
      <ScreenBody>
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-ink p-5 text-ink-foreground shadow-float">
          <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-primary/15" />
          <p className="flex items-center gap-2 text-sm text-ink-muted">
            <CoinIcon className="size-4 text-[8px]" /> Available to spend
          </p>
          <p className="mt-1 font-display text-5xl font-bold tabular-nums">{coins(w.available)}</p>
          <Button asChild className="mt-5 w-full">
            <Link to="/rewards">
              <Gift /> Redeem coins
            </Link>
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2.5">
          <Stat icon={Hourglass} label="Pending" value={w.pending} tone="warning" />
          <Stat icon={Sparkles} label="Total earned" value={w.totalEarned} tone="primary" />
          <Stat icon={Receipt} label="Redeemed" value={w.redeemed} tone="muted" />
        </div>

        <p className="mt-4 rounded-2xl bg-info-soft p-4 text-sm text-info">
          Coins become available only after a collector picks up your sorted recyclables and the
          recycling partner verifies them. Booking or uploading a photo does not add coins.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Link
            to="/rewards"
            className="flex items-center gap-2 rounded-2xl bg-card p-4 text-sm font-semibold shadow-card"
          >
            <Gift className="size-5 text-primary" /> Rewards catalogue
          </Link>
          <Link
            to="/redemptions"
            className="flex items-center gap-2 rounded-2xl bg-card p-4 text-sm font-semibold shadow-card"
          >
            <Receipt className="size-5 text-primary" /> My redemptions
          </Link>
        </div>

        <h2 className="mb-3 mt-7 text-[17px] font-semibold">Transaction history</h2>
        <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-3">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-sm font-semibold",
                f.id === filter ? "bg-primary text-primary-foreground" : "bg-card shadow-card",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        {list.length === 0 ? (
          <StateView
            icon={Wallet}
            tone="muted"
            title="No transactions"
            body="Nothing matches this filter yet."
            className="py-6"
          />
        ) : (
          <div className="space-y-2.5">
            {list.map((t) => (
              <TxRow key={t.id} t={t} />
            ))}
          </div>
        )}
      </ScreenBody>
    </Screen>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Gift;
  label: string;
  value: number;
  tone: "warning" | "primary" | "muted";
}) {
  return (
    <div className="rounded-3xl bg-card p-3.5 shadow-card">
      <span
        className={cn(
          "grid size-9 place-items-center rounded-xl",
          tone === "warning" && "bg-warning-soft text-warning-foreground",
          tone === "primary" && "bg-primary-soft text-primary-deep",
          tone === "muted" && "bg-muted text-muted-foreground",
        )}
      >
        <Icon className="size-4" />
      </span>
      <p className="mt-2 font-display text-xl font-bold tabular-nums">{coins(value)}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function TxRow({ t }: { t: Transaction }) {
  const out = t.type === "redeem";
  const inner = (
    <>
      <span
        className={cn(
          "grid size-11 place-items-center rounded-2xl",
          out ? "bg-coin-soft text-warning-foreground" : "bg-primary-soft text-primary-deep",
        )}
      >
        {out ? <ArrowUpRight className="size-5" /> : <ArrowDownLeft className="size-5" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-medium">{t.label}</p>
        <p className="text-xs text-muted-foreground">
          {shortDateTime(t.at)}
          {t.status === "pending" && (
            <span className="ml-1 font-semibold text-warning-foreground">
              · Pending verification
            </span>
          )}
          {t.type === "bonus" && " · Bonus"}
        </p>
      </div>
      <span
        className={cn(
          "flex items-center gap-1 font-semibold tabular-nums",
          out
            ? "text-foreground"
            : t.status === "pending"
              ? "text-muted-foreground"
              : "text-primary-deep",
        )}
      >
        {out ? "−" : "+"}
        {coins(t.amount)} <CoinIcon className="size-4 text-[8px]" />
      </span>
    </>
  );
  const cls = "flex items-center gap-3 rounded-3xl bg-card p-3.5 shadow-card";
  return t.pickupId ? (
    <Link to="/pickups/$id" params={{ id: t.pickupId }} className={cls}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}
