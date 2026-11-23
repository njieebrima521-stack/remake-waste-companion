import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  CalendarClock,
  CheckCircle2,
  Clock,
  Inbox,
  Route as RouteIcon,
  Scale,
  TriangleAlert,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { useMemo } from "react";

import { useMe, useWorkState } from "@/components/collector/ui";
import { DemoBadge } from "@/components/remake/bits";
import { StateView } from "@/components/remake/StateView";
import { Screen, ScreenBody, ScreenHeader } from "@/components/remake/Screen";
import { ago } from "@/lib/remake/format";
import { pageHead } from "@/lib/remake/head";
import { actions } from "@/lib/remake/store";
import type { WorkNotification } from "@/lib/remake/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/collector/_app/notifications")({
  head: () => pageHead("Collector notifications", "Requests, schedules, routes, confirmations and verification updates."),
  component: Notifications,
});

const ICON: Record<WorkNotification["kind"], LucideIcon> = {
  request: Inbox,
  accepted: CheckCircle2,
  rejected: XCircle,
  schedule: CalendarClock,
  route: RouteIcon,
  upcoming: Clock,
  reminder: TriangleAlert,
  confirmation: CheckCircle2,
  verification: Scale,
};

function Notifications() {
  const me = useMe();
  const state = useWorkState();
  const navigate = useNavigate();
  const list = useMemo(
    () => state.workNotifications.filter((n) => n.collectorId === me.id).sort((a, b) => b.at.localeCompare(a.at)),
    [state.workNotifications, me.id],
  );
  const unread = list.some((n) => !n.read);

  const open = (n: WorkNotification) => {
    actions.markWorkRead(n.id);
    if (n.link?.to === "request") void navigate({ to: "/collector/requests/$id", params: { id: n.link.id } });
    if (n.link?.to === "route") void navigate({ to: "/collector/routes/$id", params: { id: n.link.id } });
  };

  return (
    <Screen>
      <ScreenHeader
        title="Notifications"
        fallback="/collector/home"
        right={
          unread ? (
            <button type="button" onClick={() => actions.markAllWorkRead(me.id)} className="text-sm font-semibold text-primary">
              Read all
            </button>
          ) : undefined
        }
      />
      <ScreenBody>
        <DemoBadge>Simulated — no SMS or push messages are sent</DemoBadge>
        <div className="mt-4 space-y-2">
          {list.map((n) => {
            const Icon = ICON[n.kind];
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => open(n)}
                className={cn(
                  "flex w-full gap-3 rounded-3xl p-3.5 text-left transition active:scale-[0.99]",
                  n.read ? "bg-card" : "bg-primary-soft",
                )}
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-card text-primary-deep shadow-card">
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-start justify-between gap-2">
                    <span className="font-semibold">{n.title}</span>
                    {!n.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />}
                  </span>
                  <span className="block text-sm text-muted-foreground">{n.body}</span>
                  <span className="mt-1 block text-[11px] text-muted-foreground">{ago(n.at)}</span>
                </span>
              </button>
            );
          })}
        </div>
        {!list.length && <StateView icon={Bell} tone="muted" title="No notifications" />}
      </ScreenBody>
    </Screen>
  );
}
