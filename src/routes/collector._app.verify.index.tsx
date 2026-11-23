import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Scale, ShieldBan } from "lucide-react";
import { useMemo } from "react";

import { VerificationPill, bags, useMe, useWorkState } from "@/components/collector/ui";
import { StateView } from "@/components/remake/StateView";
import { Screen, ScreenBody, ScreenHeader } from "@/components/remake/Screen";
import { requesterName, verificationState } from "@/lib/remake/collector";
import { MATERIALS } from "@/lib/remake/data";
import { shortDateTime } from "@/lib/remake/format";
import { pageHead } from "@/lib/remake/head";
import type { Pickup } from "@/lib/remake/types";

export const Route = createFileRoute("/collector/_app/verify/")({
  head: () => pageHead("Material received", "Record the weight and quality of collected recyclables."),
  component: VerifyList,
});

function VerifyList() {
  const me = useMe();
  const state = useWorkState();
  const { pending, done } = useMemo(() => {
    const mine = state.pickups.filter((p) => p.collectedBy === me.id && p.kind === "recyclable");
    return {
      pending: mine.filter((p) => p.status === "collected"),
      done: mine.filter((p) => p.status === "verified").slice(0, 8),
    };
  }, [state.pickups, me.id]);

  if (me.category !== "recycling") {
    return (
      <Screen>
        <ScreenHeader title="Material received" fallback="/collector/home" />
        <ScreenBody>
          <StateView icon={ShieldBan} tone="muted" title="For recycling companies" body="Material verification is recorded by the recycling company that received the material." />
        </ScreenBody>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader title="Material received" fallback="/collector/home" />
      <ScreenBody>
        <p className="rounded-2xl bg-muted p-3 text-xs text-muted-foreground">
          Step 2 of 2. Collection is confirmed by QR scan first; here you record what actually arrived.
        </p>
        <h2 className="mb-2 mt-5 text-[17px] font-semibold">Waiting for verification</h2>
        {pending.length ? (
          <div className="space-y-2.5">{pending.map((p) => <Item key={p.id} p={p} />)}</div>
        ) : (
          <StateView icon={Scale} tone="muted" title="All caught up" body="Collected material that needs checking shows here." className="py-6" />
        )}
        <h2 className="mb-2 mt-7 text-[17px] font-semibold">Recently verified</h2>
        <div className="space-y-2.5">{done.map((p) => <Item key={p.id} p={p} />)}</div>
      </ScreenBody>
    </Screen>
  );
}

function Item({ p }: { p: Pickup }) {
  const pending = p.status === "collected";
  return (
    <Link
      to={pending ? "/collector/verify/$id" : "/collector/requests/$id"}
      params={{ id: p.id }}
      className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-card active:scale-[0.99]"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{requesterName(p)}</p>
        <p className="text-xs text-muted-foreground">
          {MATERIALS[p.material].short} · {bags(p.quantity)} · collected {p.collectedAt ? shortDateTime(p.collectedAt) : ""}
        </p>
        <VerificationPill state={verificationState(p)} className="mt-1.5 px-2 py-0.5 text-[10px]" />
      </div>
      <ChevronRight className="size-4 text-muted-foreground" />
    </Link>
  );
}
