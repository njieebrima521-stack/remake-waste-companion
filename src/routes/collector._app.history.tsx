import { createFileRoute, Link } from "@tanstack/react-router";
import { History as HistoryIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { Chip } from "@/components/collector/PhotoPicker";
import { CollectorNav, MaterialBubble, SectionHead, StatTile, VerificationPill, bags, useMe, useWorkState } from "@/components/collector/ui";
import { DemoBadge, Pill } from "@/components/remake/bits";
import { StateView } from "@/components/remake/StateView";
import { Screen, ScreenBody, ScreenHeader } from "@/components/remake/Screen";
import { collectorHistory, historyStats, requesterName, type HistoryItem } from "@/lib/remake/collector";
import { MATERIALS } from "@/lib/remake/data";
import { shortDateTime } from "@/lib/remake/format";
import { pageHead } from "@/lib/remake/head";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/collector/_app/history")({
  head: () => pageHead("Collection history", "Past collections, quantities, verification and performance."),
  component: History,
});

type Filter = "all" | HistoryItem["outcome"];

const OUTCOME: Record<HistoryItem["outcome"], { label: string; tone: string }> = {
  completed: { label: "Completed", tone: "bg-primary-soft text-primary-deep" },
  missed: { label: "Missed", tone: "bg-destructive-soft text-destructive" },
  rejected: { label: "Rejected by you", tone: "bg-muted text-muted-foreground" },
};

function History() {
  const me = useMe();
  const state = useWorkState();
  const [filter, setFilter] = useState<Filter>("all");
  const items = useMemo(() => collectorHistory(state, me.id), [state, me.id]);
  const stats = useMemo(() => historyStats(items, Date.now()), [items]);
  const list = filter === "all" ? items : items.filter((i) => i.outcome === filter);
  const maxWeek = Math.max(1, ...stats.weekly.map((w) => w.bags));
  const maxMat = Math.max(1, ...stats.byMaterial.map(([, n]) => n));
  const recyclable = stats.completed - stats.verification.not_required;

  return (
    <Screen animate={false}>
      <ScreenHeader title="History" back={false} />
      <ScreenBody>
        <div className="flex justify-center">
          <DemoBadge>Sample performance data</DemoBadge>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <StatTile label="Bags" value={stats.bags} tone="primary" />
          <StatTile label="Kg" value={stats.kg} />
          <StatTile label="Verified" value={stats.verification.verified} />
          <StatTile label="Completed" value={stats.completed} />
          <StatTile label="Missed" value={stats.missed} tone={stats.missed ? "warning" : "default"} />
          <StatTile label="Rejected" value={stats.rejected} />
        </div>

        <SectionHead title="Bags collected per week" />
        <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
          <div className="flex h-36 items-end gap-2">
            {stats.weekly.map((w) => (
              <div key={w.label} className="flex flex-1 flex-col items-center gap-1.5">
                <span className="text-[11px] font-semibold tabular-nums">{w.bags}</span>
                <div
                  className={cn("w-full rounded-t-xl", w.label === "This wk" ? "bg-primary" : "bg-primary/35")}
                  style={{ height: `${Math.max(4, (w.bags / maxWeek) * 100)}px` }}
                />
                <span className="text-[10px] text-muted-foreground">{w.label}</span>
              </div>
            ))}
          </div>
        </div>

        <SectionHead title="Material categories" />
        <div className="space-y-2.5 rounded-2xl border border-border bg-card p-4 shadow-card">
          {stats.byMaterial.length === 0 && <p className="text-sm text-muted-foreground">No collections yet.</p>}
          {stats.byMaterial.map(([m, n]) => (
            <div key={m} className="flex items-center gap-3">
              <MaterialBubble material={m} className="size-8 rounded-xl [&_svg]:size-4" />
              <div className="min-w-0 flex-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{MATERIALS[m].short}</span>
                  <span className="tabular-nums text-muted-foreground">{bags(n)}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-chart-2" style={{ width: `${(n / maxMat) * 100}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {recyclable > 0 && (
          <>
            <SectionHead title="Verification status" />
            <div className="grid grid-cols-2 gap-2">
              {(["verified", "pending", "needs_sorting", "rejected"] as const).map((v) => (
                <div key={v} className="flex items-center justify-between rounded-2xl bg-card p-3 shadow-card">
                  <VerificationPill state={v} className="px-2 py-0.5 text-[10px]" />
                  <span className="font-display text-lg font-bold tabular-nums">{stats.verification[v]}</span>
                </div>
              ))}
            </div>
          </>
        )}

        <SectionHead title="All jobs" />
        <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
          {(["all", "completed", "missed", "rejected"] as const).map((f) => (
            <Chip key={f} selected={filter === f} onClick={() => setFilter(f)}>
              {f === "all" ? "All" : OUTCOME[f].label}
            </Chip>
          ))}
        </div>
        <div className="mt-3 space-y-2.5">
          {list.map((i) => (
            <Link
              key={i.pickup.id + i.outcome}
              to="/collector/requests/$id"
              params={{ id: i.pickup.id }}
              className="flex gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-card active:scale-[0.99]"
            >
              <MaterialBubble material={i.pickup.material} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{requesterName(i.pickup)}</p>
                <p className="text-xs text-muted-foreground">
                  {shortDateTime(i.at)} · {MATERIALS[i.pickup.material].short} · {bags(i.pickup.quantity)}
                  {i.outcome === "completed" ? ` · ${Math.round(i.kg)} kg` : ""}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <Pill className={cn("px-2 py-0.5 text-[10px]", OUTCOME[i.outcome].tone)}>{OUTCOME[i.outcome].label}</Pill>
                  {i.outcome === "completed" && i.verification !== "not_required" && (
                    <VerificationPill state={i.verification} className="px-2 py-0.5 text-[10px]" />
                  )}
                </div>
              </div>
            </Link>
          ))}
          {!list.length && <StateView icon={HistoryIcon} tone="muted" title="Nothing yet" className="py-6" />}
        </div>
      </ScreenBody>
      <CollectorNav />
    </Screen>
  );
}
