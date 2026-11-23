import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Copy, SearchX } from "lucide-react";
import { toast } from "sonner";

import { Pill } from "@/components/remake/bits";
import { SummaryRow } from "@/components/remake/flow";
import { Screen, ScreenBody, ScreenFooter, ScreenHeader } from "@/components/remake/Screen";
import { StateView } from "@/components/remake/StateView";
import { Button } from "@/components/ui/button";
import { REWARDS } from "@/lib/remake/data";
import { coins, longDate } from "@/lib/remake/format";
import { pageHead } from "@/lib/remake/head";
import { useApp } from "@/lib/remake/store";

export const Route = createFileRoute("/_main/redemptions/$id")({
  head: () => pageHead("Reward redeemed", "Your reward voucher and how to use it."),
  component: RedemptionDetail,
});

function RedemptionDetail() {
  const { id } = Route.useParams();
  const x = useApp((s) => s.redemptions.find((r) => r.id === id));
  if (!x)
    return (
      <Screen>
        <ScreenHeader title="Redemption" fallback="/redemptions" />
        <ScreenBody className="flex flex-col justify-center">
          <StateView icon={SearchX} tone="muted" title="Redemption not found">
            <Button asChild size="lg">
              <Link to="/redemptions">My redemptions</Link>
            </Button>
          </StateView>
        </ScreenBody>
      </Screen>
    );
  const reward = REWARDS.find((r) => r.id === x.rewardId);
  return (
    <Screen>
      <ScreenHeader fallback="/redemptions" />
      <ScreenBody>
        <div className="flex flex-col items-center text-center">
          <span className="grid size-24 animate-pop place-items-center rounded-full bg-primary text-primary-foreground shadow-float">
            <Check className="size-12" strokeWidth={3} />
          </span>
          <h1 className="mt-6 font-display text-2xl font-bold">Reward redeemed</h1>
          <p className="mt-1 font-display text-xl font-semibold text-primary">
            −{coins(x.cost)} Green Coins
          </p>
        </div>
        <div className="mt-6 divide-y divide-border rounded-3xl border border-border bg-card px-4">
          <SummaryRow
            label="Status"
            value={
              <Pill className="bg-primary-soft text-primary-deep">
                {x.status === "issued" ? "Success" : "Processing"}
              </Pill>
            }
          />
          <div className="flex items-center justify-between gap-3 py-3">
            <span className="text-sm text-muted-foreground">Voucher code</span>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard?.writeText(x.code).catch(() => undefined);
                toast.success("Voucher code copied");
              }}
              className="flex items-center gap-2 font-mono font-semibold tracking-wider"
            >
              {x.code} <Copy className="size-4 text-muted-foreground" />
            </button>
          </div>
          <SummaryRow label="Reward" value={reward ? `${x.name} · ${reward.tagline}` : x.name} />
          <SummaryRow label="Date" value={longDate(x.at)} />
          {reward && <SummaryRow label="How to use" value={reward.delivery} />}
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Sample voucher for demonstration only.
        </p>
      </ScreenBody>
      <ScreenFooter>
        <Button asChild size="lg">
          <Link to="/redemptions">See redemption history</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link to="/home">Back to home</Link>
        </Button>
      </ScreenFooter>
    </Screen>
  );
}
