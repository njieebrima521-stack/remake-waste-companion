import { createFileRoute, Link } from "@tanstack/react-router";
import { Receipt } from "lucide-react";

import { CoinIcon } from "@/components/remake/CoinIcon";
import { REWARD_ICON } from "@/components/remake/icons";
import { Screen, ScreenBody, ScreenHeader } from "@/components/remake/Screen";
import { REWARDS } from "@/lib/remake/data";
import { coins } from "@/lib/remake/format";
import { pageHead } from "@/lib/remake/head";
import { walletSummary } from "@/lib/remake/logic";
import { useApp } from "@/lib/remake/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_main/rewards/")({
  head: () => pageHead("All rewards", "Choose a reward to redeem with your Green Coins."),
  component: Rewards,
});

function Rewards() {
  const tx = useApp((s) => s.transactions);
  const { available } = walletSummary(tx);
  return (
    <Screen>
      <ScreenHeader
        title="All rewards"
        subtitle="Choose your reward"
        fallback="/home"
        right={
          <Link
            to="/redemptions"
            aria-label="My redemptions"
            className="grid size-11 place-items-center rounded-full border border-border bg-card"
          >
            <Receipt className="size-5" />
          </Link>
        }
      />
      <ScreenBody>
        <Link
          to="/wallet"
          className="flex items-center justify-between rounded-3xl bg-ink p-4 text-ink-foreground"
        >
          <span className="text-sm text-ink-muted">Your balance</span>
          <span className="flex items-center gap-2 font-display text-xl font-bold tabular-nums">
            {coins(available)} <CoinIcon />
          </span>
        </Link>
        <div className="mt-5 space-y-4">
          {REWARDS.map((r) => {
            const Icon = REWARD_ICON[r.icon];
            const ok = available >= r.cost;
            return (
              <Link
                key={r.id}
                to="/rewards/$id"
                params={{ id: r.id }}
                className="relative flex items-center gap-3 rounded-3xl bg-primary-soft p-5 shadow-card active:scale-[0.99]"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-display text-xl font-bold">{r.name}</p>
                  <p className="text-sm text-muted-foreground">{r.tagline}</p>
                  <p className="mt-1 font-display font-semibold text-primary-deep">
                    {coins(r.cost)} coins
                  </p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <span className="grid size-12 place-items-center rounded-2xl bg-card text-primary-deep">
                    <Icon className="size-6" />
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-4 py-2 text-xs font-semibold",
                      ok ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {ok ? "Claim now" : `Need ${coins(r.cost - available)}`}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Rewards shown are illustrative examples. They do not represent confirmed partnerships.
        </p>
      </ScreenBody>
    </Screen>
  );
}
