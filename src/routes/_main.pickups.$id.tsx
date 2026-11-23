import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Check,
  Circle,
  FlaskConical,
  MapPin,
  Phone,
  ScanLine,
  SearchX,
  UserRoundSearch,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { StatusPill } from "@/components/remake/bits";
import { CollectionQr } from "@/components/remake/CollectionQr";
import { CollectorAvatar } from "@/components/remake/CollectorAvatar";
import { CollectorCard, SummaryRow } from "@/components/remake/flow";
import { COLLECTOR_TYPE_LABEL, MATERIAL_ICON } from "@/components/remake/icons";
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
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { COLLECTORS, MATERIALS, PARTNERS } from "@/lib/remake/data";
import { longDate, shortDateTime } from "@/lib/remake/format";
import { pageHead } from "@/lib/remake/head";
import { eligibleCollectors, nextDemoStep, qrPayload, trackingSteps } from "@/lib/remake/logic";
import { actions, useApp } from "@/lib/remake/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_main/pickups/$id")({
  head: () => pageHead("Pickup details", "Follow your pickup from request to Green Coins."),
  component: PickupDetail,
});

const REASONS = ["Plans changed", "Waste already collected", "Wrong date or time", "Other"];

function PickupDetail() {
  const { id } = Route.useParams();
  const pickup = useApp((s) => s.pickups.find((p) => p.id === id));
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]!);
  const [swapOpen, setSwapOpen] = useState(false);

  if (!pickup)
    return (
      <Screen>
        <ScreenHeader title="Pickup" fallback="/pickups" />
        <ScreenBody className="flex flex-col justify-center">
          <StateView
            icon={SearchX}
            tone="muted"
            title="Pickup not found"
            body="It may have been removed from this device."
          >
            <Button asChild size="lg">
              <Link to="/pickups">Back to pickups</Link>
            </Button>
          </StateView>
        </ScreenBody>
      </Screen>
    );

  const Icon = MATERIAL_ICON[pickup.material];
  const collector = COLLECTORS.find((c) => c.id === pickup.collectorId);
  const partner = PARTNERS.find((p) => p.id === pickup.partnerId);
  const steps = trackingSteps(pickup);
  const canCancel = !["collected", "verified", "cancelled"].includes(pickup.status);
  const demoStep = nextDemoStep(pickup);
  const awaitingCollection = !["collected", "verified", "cancelled"].includes(pickup.status);
  // Same matching rule as booking: only collectors that accept this waste category.
  const alternatives = eligibleCollectors(pickup.material, pickup.area).filter(
    (c) => c.id !== pickup.collectorId,
  );
  const materialName = MATERIALS[pickup.material].name.toLowerCase();

  return (
    <Screen>
      <ScreenHeader
        title={pickup.id}
        subtitle={MATERIALS[pickup.material].name}
        fallback="/pickups"
      />
      <ScreenBody>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "grid size-14 shrink-0 place-items-center rounded-2xl",
                pickup.kind === "general"
                  ? "bg-ink text-ink-foreground"
                  : "bg-primary-soft text-primary-deep",
              )}
            >
              <Icon className="size-7" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-lg font-semibold">
                {pickup.quantity} bag{pickup.quantity > 1 ? "s" : ""} ·{" "}
                {MATERIALS[pickup.material].short}
              </p>
              <p className="text-sm text-muted-foreground">
                {longDate(pickup.date)} · {pickup.slot}
              </p>
            </div>
          </div>
          <div className="mt-3">
            <StatusPill pickup={pickup} />
          </div>
        </div>

        {pickup.flag === "declined" && (
          <div className="mt-4 rounded-3xl bg-destructive-soft p-4 text-destructive">
            <p className="font-semibold">The collector declined this pickup</p>
            <p className="mt-1 text-sm">
              Choose another collector so your waste is still picked up.
            </p>
            <Button className="mt-3" variant="destructive" onClick={() => setSwapOpen(true)}>
              <UserRoundSearch /> Choose another collector
            </Button>
          </div>
        )}
        {pickup.flag === "delayed" && (
          <p className="mt-4 rounded-3xl bg-warning-soft p-4 text-sm text-warning-foreground">
            Your collector is running late. Keep your bags ready — you can also choose another
            collector.
            <button
              type="button"
              onClick={() => setSwapOpen(true)}
              className="mt-2 block font-semibold underline"
            >
              Choose another collector
            </button>
          </p>
        )}

        {awaitingCollection && <CollectionQr pickup={pickup} className="mt-4" />}

        <h2 className="mb-3 mt-7 text-[17px] font-semibold">Tracking</h2>
        <ol className="rounded-2xl border border-border bg-card p-4 shadow-card">
          {steps.map((s, i) => (
            <li key={s.key} className="relative flex gap-3 pb-5 last:pb-0">
              {i < steps.length - 1 && (
                <span
                  className={cn(
                    "absolute left-[13px] top-7 h-[calc(100%-1.25rem)] w-0.5",
                    s.state === "done" ? "bg-primary" : "bg-border",
                  )}
                />
              )}
              <span
                className={cn(
                  "relative z-10 grid size-7 shrink-0 place-items-center rounded-full border-2",
                  s.state === "done" && "border-primary bg-primary text-primary-foreground",
                  s.state === "current" && "border-primary bg-card text-primary",
                  s.state === "upcoming" && "border-border bg-card text-border",
                  s.state === "skipped" && "border-border bg-muted text-muted-foreground",
                )}
              >
                {s.state === "done" ? (
                  <Check className="size-4" strokeWidth={3} />
                ) : s.state === "skipped" ? (
                  <X className="size-3.5" />
                ) : (
                  <Circle
                    className={cn(
                      "size-2.5 fill-current",
                      s.state === "current" && "animate-pulse",
                    )}
                  />
                )}
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <p
                  className={cn(
                    "text-[15px] font-medium",
                    (s.state === "upcoming" || s.state === "skipped") && "text-muted-foreground",
                  )}
                >
                  {s.label}
                  {s.state === "current" && (
                    <span className="ml-2 text-xs font-semibold text-primary">Now</span>
                  )}
                </p>
                {s.at && <p className="text-xs text-muted-foreground">{shortDateTime(s.at)}</p>}
                {s.note && <p className="text-xs text-muted-foreground">{s.note}</p>}
              </div>
            </li>
          ))}
          {pickup.status === "cancelled" && (
            <li className="mt-4 rounded-2xl bg-destructive-soft p-3 text-sm text-destructive">
              Cancelled{pickup.cancelReason ? ` — ${pickup.cancelReason}` : ""}
            </li>
          )}
        </ol>

        <h2 className="mb-3 mt-7 text-[17px] font-semibold">Collector</h2>
        {collector ? (
          <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <div className="flex items-center gap-3">
              <CollectorAvatar collector={collector} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{collector.name}</p>
                <p className="text-xs text-muted-foreground">
                  {COLLECTOR_TYPE_LABEL[collector.type]}
                  {collector.vehicle !== COLLECTOR_TYPE_LABEL[collector.type]
                    ? ` · ${collector.vehicle}`
                    : ""}{" "}
                  · ★ {collector.rating}
                </p>
                <p className="text-xs text-muted-foreground">{collector.eta}</p>
              </div>
              <a
                href={`tel:${collector.phone.replace(/\s/g, "")}`}
                aria-label={`Call ${collector.name}`}
                className="grid size-12 place-items-center rounded-full bg-primary text-primary-foreground"
              >
                <Phone className="size-5" />
              </a>
            </div>
          </div>
        ) : (
          <p className="rounded-3xl border border-dashed border-border p-4 text-sm text-muted-foreground">
            We're finding a collector for you.
            {pickup.status !== "cancelled" && (
              <button
                type="button"
                onClick={() => setSwapOpen(true)}
                className="ml-1 font-semibold text-primary"
              >
                Choose one yourself
              </button>
            )}
          </p>
        )}

        <h2 className="mb-3 mt-7 text-[17px] font-semibold">Details</h2>
        {pickup.photo && (
          <img
            src={pickup.photo}
            alt="Waste photo"
            className="mb-3 h-40 w-full rounded-3xl object-cover"
          />
        )}
        <div className="divide-y divide-border rounded-2xl border border-border bg-card px-4 shadow-card">
          <SummaryRow
            label="Address"
            value={
              <span className="flex items-start gap-1">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>
                  {pickup.address}
                  <span className="block text-xs font-normal text-muted-foreground">
                    {pickup.area}
                    {pickup.landmark ? ` · ${pickup.landmark}` : ""}
                  </span>
                </span>
              </span>
            }
          />
          {pickup.items.length > 0 && (
            <SummaryRow
              label="Items"
              value={pickup.items.map((i) => `${i.count} ${i.label.toLowerCase()}`).join(", ")}
            />
          )}
          {pickup.description && <SummaryRow label="Note" value={pickup.description} />}
          {partner && <SummaryRow label="Recycling partner" value={`${partner.name} (sample)`} />}
          {pickup.kind === "recyclable" && (
            <SummaryRow
              label="Green Coins"
              value={
                pickup.status === "verified"
                  ? `+${pickup.coins} released`
                  : pickup.status === "collected"
                    ? `Up to ${pickup.coins} · verification pending`
                    : `Up to ${pickup.coins} after verification`
              }
            />
          )}
          <SummaryRow label="Requested" value={shortDateTime(pickup.createdAt)} />
        </div>

        {!awaitingCollection && (
          <>
            <h2 className="mb-3 mt-7 text-[17px] font-semibold">Collection QR code</h2>
            <CollectionQr pickup={pickup} />
          </>
        )}

        {canCancel && (
          <Button
            variant="outline"
            size="lg"
            className="mt-6 text-destructive"
            onClick={() => setCancelOpen(true)}
          >
            Cancel pickup
          </Button>
        )}

        {demoStep && (
          <div className="mt-6 rounded-3xl border border-dashed border-warning bg-warning-soft/60 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-warning-foreground">
              <FlaskConical className="size-4" /> Demo controls
            </p>
            <p className="mt-1 text-xs text-warning-foreground">
              {demoStep === "verify"
                ? "Collection is confirmed. Simulate the recycling partner checking your material — only then are Green Coins released."
                : demoStep === "scan"
                  ? "The collector is at your gate. Only their QR scan can confirm the collection."
                  : "There are no real collectors in this demo. Move the pickup forward, then scan its QR as the collector."}
            </p>
            {demoStep === "advance" && (
              <Button
                variant="ink"
                className="mt-3 w-full"
                onClick={() => {
                  actions.advancePickup(pickup.id);
                  toast.success("Pickup moved to the next stage");
                }}
              >
                Simulate next stage
              </Button>
            )}
            {demoStep === "verify" && (
              <Button
                variant="ink"
                className="mt-3 w-full"
                onClick={() => {
                  actions.advancePickup(pickup.id);
                  toast.success(
                    pickup.coins > 0
                      ? `Material verified · ${pickup.coins} Green Coins released`
                      : "Material verified",
                  );
                }}
              >
                Simulate material verification
              </Button>
            )}
            {awaitingCollection && (
              <Button
                asChild
                variant={demoStep === "scan" ? "ink" : "outline"}
                className="mt-3 w-full"
              >
                <Link to="/collector-demo" search={{ code: qrPayload(pickup) }}>
                  <ScanLine /> Scan as collector
                </Link>
              </Button>
            )}
          </div>
        )}
      </ScreenBody>

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this pickup?</AlertDialogTitle>
            <AlertDialogDescription>
              Tell us why. The collector will be told not to come.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-wrap gap-2">
            {REASONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReason(r)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-semibold",
                  reason === r
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card",
                )}
              >
                {r}
              </button>
            ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Keep pickup</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive"
              onClick={() => {
                actions.cancelPickup(pickup.id, reason);
                toast("Pickup cancelled");
              }}
            >
              Yes, cancel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Drawer open={swapOpen} onOpenChange={setSwapOpen}>
        <DrawerContent className="max-h-[85dvh]">
          <DrawerHeader className="text-left">
            <DrawerTitle className="font-display text-xl">Choose another collector</DrawerTitle>
            <DrawerDescription>
              Collectors that accept {materialName} in {pickup.area}.
            </DrawerDescription>
          </DrawerHeader>
          <div className="no-scrollbar space-y-3 overflow-y-auto px-4 pb-6">
            {alternatives.length === 0 && (
              <p className="rounded-3xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                No other collector that accepts {materialName} is available right now. Please try
                again later.
              </p>
            )}
            {alternatives.map((c, i) => (
              <CollectorCard
                key={c.id}
                c={c}
                material={pickup.material}
                recommended={i === 0}
                selected={false}
                onSelect={() => {
                  actions.reassignPickup(pickup.id, c.id);
                  setSwapOpen(false);
                  toast.success(`${c.name} is now assigned`);
                }}
              />
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </Screen>
  );
}
