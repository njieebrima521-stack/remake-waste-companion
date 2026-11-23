import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BellOff, CheckCheck, Coins, Gift, Lightbulb, Trash2, Truck } from "lucide-react";
import { useState } from "react";

import { Screen, ScreenBody, ScreenHeader } from "@/components/remake/Screen";
import { StateView } from "@/components/remake/StateView";
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
import { ago } from "@/lib/remake/format";
import { pageHead } from "@/lib/remake/head";
import { actions, useApp } from "@/lib/remake/store";
import type { AppNotification } from "@/lib/remake/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_main/notifications")({
  head: () => pageHead("Notifications", "Updates about your pickups, Green Coins and rewards."),
  component: Notifications,
});

const ICON = { pickup: Truck, coins: Coins, reward: Gift, tip: Lightbulb } as const;

function Notifications() {
  const navigate = useNavigate();
  const list = useApp((s) => s.notifications);
  const pickupIds = useApp((s) => s.pickups.map((p) => p.id).join(","));
  const unread = list.filter((n) => !n.read).length;
  const [clearOpen, setClearOpen] = useState(false);

  const open = (n: AppNotification) => {
    actions.markRead(n.id);
    if (n.kind === "pickup" && n.link && pickupIds.split(",").includes(n.link))
      return navigate({ to: "/pickups/$id", params: { id: n.link } });
    if (n.kind === "reward") return navigate({ to: "/redemptions" });
    if (n.kind === "coins") return navigate({ to: "/wallet" });
    return navigate({ to: "/guide" });
  };

  return (
    <Screen>
      <ScreenHeader
        title="Notifications"
        subtitle={unread ? `${unread} unread` : undefined}
        fallback="/home"
        right={
          list.length > 0 ? (
            <button
              type="button"
              aria-label="Clear all"
              onClick={() => setClearOpen(true)}
              className="grid size-11 place-items-center rounded-full border border-border bg-card"
            >
              <Trash2 className="size-5" />
            </button>
          ) : undefined
        }
      />
      <ScreenBody>
        {list.length === 0 ? (
          <StateView
            icon={BellOff}
            tone="muted"
            title="You're all caught up"
            body="We'll let you know when a collector is on the way or your coins are ready."
          />
        ) : (
          <>
            {unread > 0 && (
              <Button
                variant="soft"
                size="sm"
                className="mb-3"
                onClick={() => actions.markAllRead()}
              >
                <CheckCheck /> Mark all as read
              </Button>
            )}
            <div className="space-y-2.5">
              {list.map((n) => {
                const Icon = ICON[n.kind];
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => void open(n)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-3xl p-4 text-left shadow-card transition active:scale-[0.99]",
                      n.read ? "bg-card" : "bg-primary-soft",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-11 shrink-0 place-items-center rounded-2xl",
                        n.read ? "bg-muted text-muted-foreground" : "bg-card text-primary-deep",
                      )}
                    >
                      <Icon className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span
                          className={cn(
                            "flex-1 text-[15px]",
                            n.read ? "font-medium" : "font-semibold",
                          )}
                        >
                          {n.title}
                        </span>
                        {!n.read && (
                          <span
                            className="size-2.5 shrink-0 rounded-full bg-primary"
                            aria-label="Unread"
                          />
                        )}
                      </span>
                      <span className="mt-0.5 block text-sm text-muted-foreground">{n.body}</span>
                      <span className="mt-1 block text-xs text-muted-foreground">{ago(n.at)}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </ScreenBody>

      <AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all notifications?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes them from this phone. Your pickups and coins are not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Keep</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full"
              onClick={() => actions.clearNotifications()}
            >
              Clear all
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Screen>
  );
}
