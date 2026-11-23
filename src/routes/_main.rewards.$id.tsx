import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { Info, Store, Truck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { CoinIcon } from "@/components/remake/CoinIcon";
import { REWARD_ICON } from "@/components/remake/icons";
import { Screen, ScreenBody, ScreenFooter, ScreenHeader } from "@/components/remake/Screen";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { REWARDS } from "@/lib/remake/data";
import { coins } from "@/lib/remake/format";
import { pageHead } from "@/lib/remake/head";
import { walletSummary } from "@/lib/remake/logic";
import { actions, useApp } from "@/lib/remake/store";

export const Route = createFileRoute("/_main/rewards/$id")({
  loader: ({ params }) => {
    const reward = REWARDS.find((r) => r.id === params.id);
    if (!reward) throw notFound();
    return { reward };
  },
  head: ({ loaderData }) =>
    loaderData
      ? pageHead(loaderData.reward.name, loaderData.reward.description)
      : pageHead("Reward", "Reward details."),
  component: RewardDetail,
});

function RewardDetail() {
  const { reward } = Route.useLoaderData();
  const navigate = useNavigate();
  const tx = useApp((s) => s.transactions);
  const { available, pending } = walletSummary(tx);
  const [open, setOpen] = useState(false);
  const Icon = REWARD_ICON[reward.icon];
  const ok = available >= reward.cost;

  return (
    <Screen>
      <ScreenHeader title="Reward details" fallback="/rewards" />
      <ScreenBody>
        <div className="flex flex-col items-center rounded-[2rem] bg-primary-soft px-5 py-8 text-center">
          <span className="grid size-24 place-items-center rounded-[1.75rem] bg-card text-primary-deep shadow-card">
            <Icon className="size-12" strokeWidth={1.6} />
          </span>
          <h1 className="mt-5 font-display text-2xl font-bold">{reward.name}</h1>
          <p className="text-[15px] text-muted-foreground">{reward.tagline}</p>
          <p className="mt-3 flex items-center gap-2 font-display text-2xl font-bold text-primary-deep">
            {coins(reward.cost)} <CoinIcon />
          </p>
        </div>

        <p className="mt-5 text-[15px] leading-relaxed">{reward.description}</p>

        <div className="mt-5 divide-y divide-border rounded-2xl border border-border bg-card shadow-card">
          <div className="flex items-center gap-3 p-4">
            <Truck className="size-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">How you get it</p>
              <p className="font-medium">{reward.delivery}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4">
            <Store className="size-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Provided by</p>
              <p className="font-medium">{reward.partner}</p>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-border bg-card p-4 shadow-card">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Your available coins</span>
            <span className="font-semibold tabular-nums">{coins(available)}</span>
          </div>
          <Progress value={Math.min(100, (available / reward.cost) * 100)} className="mt-3 h-2.5" />
          <p className="mt-2 text-xs text-muted-foreground">
            {ok
              ? `After redeeming you'll have ${coins(available - reward.cost)} coins left.`
              : `You need ${coins(reward.cost - available)} more coins.${pending ? ` ${coins(pending)} are still pending verification.` : ""}`}
          </p>
        </div>

        <p className="mt-5 flex gap-2 text-xs text-muted-foreground">
          <Info className="size-4 shrink-0" /> This is a sample reward for demonstration. It is not
          a confirmed partnership.
        </p>
      </ScreenBody>
      <ScreenFooter>
        {ok ? (
          <Button size="lg" onClick={() => setOpen(true)}>
            Redeem for {coins(reward.cost)} coins
          </Button>
        ) : (
          <>
            <Button size="lg" disabled>
              Not enough coins yet
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/collect">Recycle to earn more</Link>
            </Button>
          </>
        )}
      </ScreenFooter>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Redeem {reward.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              {coins(reward.cost)} Green Coins will be taken from your balance. You'll have{" "}
              {coins(available - reward.cost)} left.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Not now</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full"
              onClick={() => {
                const res = actions.redeem(reward);
                if (res.ok)
                  void navigate({
                    to: "/redemptions/$id",
                    params: { id: res.redemption.id },
                    replace: true,
                  });
                else toast.error(`You need ${coins(res.shortBy)} more coins`);
              }}
            >
              Yes, redeem
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Screen>
  );
}
