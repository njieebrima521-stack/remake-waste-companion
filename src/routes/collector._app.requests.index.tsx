import { createFileRoute } from "@tanstack/react-router";
import { FlaskConical, Inbox, Info } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { CollectorNav, RequestCard, REQUESTS_LABEL, useBoard, useMe, useWorkState } from "@/components/collector/ui";
import { StateView } from "@/components/remake/StateView";
import { Screen, ScreenBody, ScreenHeader } from "@/components/remake/Screen";
import { Button } from "@/components/ui/button";
import { isAvailable } from "@/lib/remake/collector";
import { MATERIALS } from "@/lib/remake/data";
import { pageHead } from "@/lib/remake/head";
import { actions } from "@/lib/remake/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/collector/_app/requests/")({
  head: () => pageHead("Requests & assignments", "Compatible collection requests, accepted jobs and accumulation requests."),
  component: Requests,
});

type Tab = "incoming" | "accepted" | "building";

function Requests() {
  const me = useMe();
  const state = useWorkState();
  const board = useBoard(me);
  const [tab, setTab] = useState<Tab>("incoming");
  const available = isAvailable(state, me.id);
  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "incoming", label: me.category === "independent" ? "Offers" : "New", count: board.incoming.length },
    { id: "accepted", label: "Accepted", count: board.accepted.length },
    { id: "building", label: "Building up", count: board.building.length },
  ];
  const list = board[tab];

  return (
    <Screen animate={false}>
      <ScreenHeader title={REQUESTS_LABEL[me.category]} back={false} />
      <ScreenBody>
        <div className="flex gap-1 rounded-full bg-muted p-1" role="tablist">
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full text-sm font-semibold transition",
                tab === t.id ? "bg-card shadow-card" : "text-muted-foreground",
              )}
            >
              {t.label}
              <span className="rounded-full bg-muted px-1.5 text-[11px] tabular-nums">{t.count}</span>
            </button>
          ))}
        </div>

        <p className="mt-3 flex gap-2 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          Only {me.accepts.map((m) => MATERIALS[m].short.toLowerCase()).join(", ")} in {me.areas.join(", ")}.
          {tab === "building" && " These are below the minimum or not ready yet — they stay here until they are."}
        </p>
        {!available && (
          <p className="mt-3 rounded-2xl bg-warning-soft p-3 text-sm text-warning-foreground">
            You're off duty, so open requests are hidden. Requests sent to you by name still show.
          </p>
        )}

        <div className="mt-4 space-y-2.5">
          {list.map((p) => (
            <RequestCard key={p.id} pickup={p} me={me} />
          ))}
        </div>
        {!list.length && (
          <StateView
            icon={Inbox}
            tone="muted"
            title={tab === "accepted" ? "No accepted jobs" : "Nothing here right now"}
            body={tab === "incoming" ? "New compatible requests will appear here." : undefined}
          />
        )}

        <Button
          variant="outline"
          className="mt-6 w-full border-dashed"
          onClick={() => {
            const r = actions.simulateIncomingRequest(me.id);
            if (r.ok) {
              setTab("incoming");
              toast.success("New sample request received");
            } else toast.error(r.error);
          }}
        >
          <FlaskConical /> Demo: simulate a new request
        </Button>
      </ScreenBody>
      <CollectorNav />
    </Screen>
  );
}
