import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { MaterialBubble, bags } from "@/components/collector/ui";
import { DemoBadge } from "@/components/remake/bits";
import { Screen, ScreenBody, ScreenFooter, ScreenHeader } from "@/components/remake/Screen";
import { Button } from "@/components/ui/button";
import { GUIDE_ORDER, MATERIALS } from "@/lib/remake/data";
import { pageHead } from "@/lib/remake/head";
import { actions, useApp } from "@/lib/remake/store";

export const Route = createFileRoute("/collector/_app/thresholds")({
  head: () => pageHead("Minimum quantities", "Sample minimum bags per waste category before a request becomes an assignment."),
  component: Thresholds,
});

function Thresholds() {
  const thresholds = useApp((s) => s.thresholds);
  return (
    <Screen>
      <ScreenHeader title="Minimum quantities" subtitle="Remake admin · demo" fallback="/collector/profile" />
      <ScreenBody>
        <DemoBadge>Sample thresholds</DemoBadge>
        <p className="mt-3 text-sm text-muted-foreground">
          Requests below their material's minimum stay visible as accumulation requests until enough waste is ready.
        </p>
        <div className="mt-4 divide-y divide-border rounded-3xl bg-card shadow-card">
          {GUIDE_ORDER.filter((m) => m !== "special").map((m) => (
            <div key={m} className="flex items-center gap-3 px-4 py-3">
              <MaterialBubble material={m} className="size-10 rounded-xl" />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{MATERIALS[m].short}</p>
                <p className="text-xs text-muted-foreground">Minimum {bags(thresholds[m])}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label={`Lower ${MATERIALS[m].short} minimum`}
                  disabled={thresholds[m] <= 1}
                  onClick={() => actions.setThreshold(m, thresholds[m] - 1)}
                  className="grid size-10 place-items-center rounded-xl bg-muted text-lg font-semibold disabled:opacity-40"
                >
                  −
                </button>
                <span className="w-6 text-center font-display text-lg font-bold tabular-nums">{thresholds[m]}</span>
                <button
                  type="button"
                  aria-label={`Raise ${MATERIALS[m].short} minimum`}
                  onClick={() => actions.setThreshold(m, thresholds[m] + 1)}
                  className="grid size-10 place-items-center rounded-xl bg-primary text-lg font-semibold text-primary-foreground"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      </ScreenBody>
      <ScreenFooter>
        <Button
          variant="outline"
          size="lg"
          onClick={() => {
            actions.resetThresholds();
            toast.success("Sample thresholds restored");
          }}
        >
          Restore sample thresholds
        </Button>
      </ScreenFooter>
    </Screen>
  );
}
