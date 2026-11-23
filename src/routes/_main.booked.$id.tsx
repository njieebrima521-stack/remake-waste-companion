import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Copy, SearchX } from "lucide-react";
import { toast } from "sonner";

import { Pill } from "@/components/remake/bits";
import { CollectionQr } from "@/components/remake/CollectionQr";
import { SummaryRow } from "@/components/remake/flow";
import { Screen, ScreenBody, ScreenFooter } from "@/components/remake/Screen";
import { StateView } from "@/components/remake/StateView";
import { Button } from "@/components/ui/button";
import { COLLECTORS } from "@/lib/remake/data";
import { pageHead } from "@/lib/remake/head";
import { useApp } from "@/lib/remake/store";

export const Route = createFileRoute("/_main/booked/$id")({
  head: () => pageHead("Pickup booked", "Your collection request has been sent."),
  component: Booked,
});

function Booked() {
  const { id } = Route.useParams();
  const pickup = useApp((s) => s.pickups.find((p) => p.id === id));

  if (!pickup)
    return (
      <Screen>
        <ScreenBody className="flex flex-col justify-center">
          <StateView
            icon={SearchX}
            tone="muted"
            title="Booking not found"
            body="It may have been removed from this device."
          >
            <Button asChild size="lg">
              <Link to="/pickups">See my pickups</Link>
            </Button>
          </StateView>
        </ScreenBody>
      </Screen>
    );

  const collector = COLLECTORS.find((c) => c.id === pickup.collectorId);
  return (
    <Screen>
      <ScreenBody className="pt-safe">
        <div className="mt-10 flex flex-col items-center text-center">
          <span className="grid size-24 animate-pop place-items-center rounded-full bg-primary text-primary-foreground shadow-float">
            <Check className="size-12" strokeWidth={3} />
          </span>
          <h1 className="mt-6 font-display text-2xl font-bold">Pickup booked!</h1>
          <p className="mt-1 max-w-xs text-[15px] text-muted-foreground">
            {collector
              ? `We've sent your request to ${collector.name}.`
              : "We'll match a collector and let you know."}
          </p>
          {pickup.kind === "recyclable" && pickup.coins > 0 && (
            <p className="mt-3 font-display text-xl font-semibold text-primary">
              Up to +{pickup.coins} Green Coins
            </p>
          )}
        </div>
        <CollectionQr pickup={pickup} className="mt-6" />
        <div className="mt-4 divide-y divide-border rounded-3xl border border-border bg-card px-4">
          <SummaryRow
            label="Status"
            value={<Pill className="bg-info-soft text-info">Booking confirmed</Pill>}
          />
          <div className="flex items-center justify-between gap-3 py-3">
            <span className="text-sm text-muted-foreground">Pickup ID</span>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard?.writeText(pickup.id).catch(() => undefined);
                toast.success("Pickup ID copied");
              }}
              className="flex items-center gap-2 font-semibold tabular-nums"
            >
              {pickup.id} <Copy className="size-4 text-muted-foreground" />
            </button>
          </div>
          <SummaryRow
            label="Quantity"
            value={`${pickup.quantity} bag${pickup.quantity > 1 ? "s" : ""}`}
          />
          <SummaryRow label="Address" value={`${pickup.address}, ${pickup.area}`} />
        </div>
        {pickup.kind === "recyclable" && (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Scanning the QR confirms collection only. Green Coins are released after the recycling
            partner verifies your material.
          </p>
        )}
      </ScreenBody>
      <ScreenFooter>
        <Button asChild size="lg">
          <Link to="/pickups/$id" params={{ id: pickup.id }}>
            Track pickup & view QR
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link to="/home">Back to home</Link>
        </Button>
      </ScreenFooter>
    </Screen>
  );
}
