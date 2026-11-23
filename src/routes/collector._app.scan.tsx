import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";

import { CollectorScanner } from "@/components/collector/Scanner";
import { CollectorNav, useMe, useWorkState } from "@/components/collector/ui";
import { DemoBadge } from "@/components/remake/bits";
import { Screen, ScreenBody, ScreenHeader } from "@/components/remake/Screen";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/remake/head";
import type { Pickup } from "@/lib/remake/types";

export const Route = createFileRoute("/collector/_app/scan")({
  validateSearch: (s: Record<string, unknown>): { code?: string } =>
    typeof s["code"] === "string" ? { code: s["code"] } : {},
  head: () => pageHead("Scan booking QR", "Scan a booking QR code or type its code to confirm collection."),
  component: Scan,
});

function Scan() {
  const { code } = Route.useSearch();
  const me = useMe();
  const state = useWorkState();
  const samples = useMemo(() => {
    const ps = state.pickups;
    const active = (p: Pickup) => p.status === "assigned" || p.status === "on_the_way";
    const picks: (Pickup | undefined)[] = [
      ...ps.filter((p) => p.collectorId === me.id && active(p)).slice(0, 3),
      ps.find((p) => p.collectorId && p.collectorId !== me.id && active(p)),
      ps.find((p) => !p.collectorId && p.status === "awaiting" && p.material !== "special"),
      ps.find((p) => p.collectedBy === me.id && p.status === "collected") ?? ps.find((p) => p.status === "collected"),
      ps.find((p) => p.status === "cancelled"),
    ];
    return picks.filter((p, i, a): p is Pickup => !!p && a.findIndex((x) => x?.id === p.id) === i);
  }, [state.pickups, me.id]);

  return (
    <Screen animate={false}>
      <ScreenHeader title="Scan booking QR" back={me.category !== "independent"} fallback="/collector/home" />
      <ScreenBody>
        <DemoBadge>Simulated scanner — no real camera</DemoBadge>
        <p className="mt-3 text-sm text-muted-foreground">
          Scan the customer's booking QR to confirm you collected the waste. Only the assigned collector can confirm,
          and only once. Confirming never releases Green Coins.
        </p>
        <CollectorScanner
          key={code ?? "none"}
          scannerId={me.id}
          samples={samples}
          initialCode={code}
          afterConfirm={(p) => (
            <>
              {me.category === "recycling" && p.kind === "recyclable" && (
                <Button asChild size="lg">
                  <Link to="/collector/verify/$id" params={{ id: p.id }}>
                    Record material verification
                  </Link>
                </Button>
              )}
              <Button asChild size="lg" variant={me.category === "recycling" && p.kind === "recyclable" ? "outline" : "default"}>
                <Link to="/collector/requests/$id" params={{ id: p.id }}>
                  View request
                </Link>
              </Button>
            </>
          )}
        />
      </ScreenBody>
      {me.category === "independent" && <CollectorNav />}
    </Screen>
  );
}
