import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { CollectorScanner } from "@/components/collector/Scanner";
import { DemoBadge } from "@/components/remake/bits";
import { Screen, ScreenBody, ScreenHeader } from "@/components/remake/Screen";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/remake/head";
import { allCollectors, residentPickups, resolveScan } from "@/lib/remake/logic";
import { useApp } from "@/lib/remake/store";

export const Route = createFileRoute("/_main/collector-demo")({
  validateSearch: (s: Record<string, unknown>): { code?: string } =>
    typeof s["code"] === "string" ? { code: s["code"] } : {},
  head: () =>
    pageHead("Collector scanner (demo)", "Simulate a collector scanning your booking QR code to confirm collection."),
  component: CollectorScannerDemo,
});

/** Resident-side demo: pretend to be any collector and scan one of your booking QR codes. */
function CollectorScannerDemo() {
  const { code } = Route.useSearch();
  const pickups = useApp((s) => s.pickups);
  const mine = useMemo(() => residentPickups(pickups), [pickups]);
  const initial = useMemo(() => (code ? resolveScan(pickups, code) : null), [code, pickups]);
  const [scannerId, setScannerId] = useState(initial?.collectorId ?? allCollectors()[0]!.id);
  const samples = [...mine].sort((a, b) => rank(a.status) - rank(b.status));

  return (
    <Screen>
      <ScreenHeader title="Collector scanner" subtitle="Demo · the collector's phone" fallback="/profile" />
      <ScreenBody>
        <DemoBadge>Simulation — no real camera</DemoBadge>
        <p className="mt-3 text-sm text-muted-foreground">
          Collectors scan your booking QR to confirm they collected the waste. The scan never releases Green Coins.
        </p>
        <CollectorScanner
          scannerId={scannerId}
          samples={samples}
          initialCode={code}
          picker={{ collectors: allCollectors(), onChange: setScannerId }}
          afterConfirm={(p) => (
            <Button asChild size="lg">
              <Link to="/pickups/$id" params={{ id: p.id }}>
                View your pickup
              </Link>
            </Button>
          )}
        />
        <Button asChild variant="soft" className="mt-6 w-full">
          <Link to="/collector">Open the full collector app</Link>
        </Button>
      </ScreenBody>
    </Screen>
  );
}

function rank(s: string) {
  return ["on_the_way", "assigned", "awaiting", "submitted", "collected", "verified", "cancelled"].indexOf(s);
}
