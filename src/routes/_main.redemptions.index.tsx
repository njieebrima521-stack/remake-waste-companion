import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Gift } from "lucide-react";

import { Pill } from "@/components/remake/bits";
import { REWARD_ICON } from "@/components/remake/icons";
import { Screen, ScreenBody, ScreenHeader } from "@/components/remake/Screen";
import { StateView } from "@/components/remake/StateView";
import { Button } from "@/components/ui/button";
import { REWARDS } from "@/lib/remake/data";
import { coins, shortDateTime } from "@/lib/remake/format";
import { pageHead } from "@/lib/remake/head";
import { useApp } from "@/lib/remake/store";

export const Route = createFileRoute("/_main/redemptions/")({
  head: () => pageHead("My redemptions", "Rewards you've redeemed with Green Coins."),
  component: Redemptions,
});

function Redemptions() {
  const list = useApp((s) => s.redemptions);
  return (
    <Screen>
      <ScreenHeader title="My redemptions" fallback="/rewards" />
      <ScreenBody>
        {list.length === 0 ? (
          <StateView
            icon={Gift}
            tone="muted"
            title="No redemptions yet"
            body="Rewards you redeem will appear here with their voucher codes."
          >
            <Button asChild size="lg">
              <Link to="/rewards">Browse rewards</Link>
            </Button>
          </StateView>
        ) : (
          <div className="space-y-3">
            {list.map((x) => {
              const reward = REWARDS.find((r) => r.id === x.rewardId);
              const Icon = REWARD_ICON[reward?.icon ?? "gift"];
              return (
                <Link
                  key={x.id}
                  to="/redemptions/$id"
                  params={{ id: x.id }}
                  className="flex items-center gap-3 rounded-3xl bg-card p-4 shadow-card active:scale-[0.99]"
                >
                  <span className="grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary-deep">
                    <Icon className="size-6" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{x.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {shortDateTime(x.at)} · {coins(x.cost)} coins
                    </p>
                    <p className="mt-1 font-mono text-xs tracking-wider">{x.code}</p>
                  </div>
                  <Pill
                    className={
                      x.status === "issued"
                        ? "bg-primary-soft text-primary-deep"
                        : "bg-warning-soft text-warning-foreground"
                    }
                  >
                    {x.status === "issued" ? "Issued" : "Processing"}
                  </Pill>
                  <ChevronRight className="size-5 text-muted-foreground" />
                </Link>
              );
            })}
          </div>
        )}
      </ScreenBody>
    </Screen>
  );
}
