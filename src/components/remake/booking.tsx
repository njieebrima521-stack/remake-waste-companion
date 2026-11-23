import { Link } from "@tanstack/react-router";
import { CalendarDays, Clock, Info, MapPin, Plus, Users } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { AreaSheet } from "@/components/remake/AreaSheet";
import { NumberStepper } from "@/components/remake/bits";
import { CollectorAvatar } from "@/components/remake/CollectorAvatar";
import { Field, TextArea } from "@/components/remake/Field";
import { CollectorCard, DateChips, SummaryRow } from "@/components/remake/flow";
import { StateView } from "@/components/remake/StateView";
import { MATERIALS, TIME_SLOTS } from "@/lib/remake/data";
import { Button } from "@/components/ui/button";
import { longDate } from "@/lib/remake/format";
import {
  collectorAccepts,
  draftMaterial,
  eligibleCollectors,
  estimateCoins,
  findCollector,
  isAcceptedRecyclable,
  slotAvailable,
} from "@/lib/remake/logic";
import { actions, useApp } from "@/lib/remake/store";
import type { Draft } from "@/lib/remake/types";
import { cn } from "@/lib/utils";

import { CoinIcon } from "./CoinIcon";

export function StepHeading({ title, body }: { title: string; body?: string }) {
  return (
    <>
      <h2 className="mt-2 font-display text-2xl font-bold leading-tight">{title}</h2>
      {body && <p className="mt-1 text-[15px] text-muted-foreground">{body}</p>}
    </>
  );
}

export function Note({
  children,
  tone = "info",
}: {
  children: ReactNode;
  tone?: "info" | "warning" | "primary";
}) {
  return (
    <p
      className={cn(
        "mt-5 flex gap-2 rounded-2xl p-4 text-sm",
        tone === "info" && "bg-info-soft text-info",
        tone === "warning" && "bg-warning-soft text-warning-foreground",
        tone === "primary" && "bg-primary-soft text-primary-deep",
      )}
    >
      <Info className="size-5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

/** Number of bags plus an optional note for the collector. */
export function DetailsStep({ draft, children }: { draft: Draft; children?: ReactNode }) {
  return (
    <>
      <StepHeading title="How many bags?" body="Count the bags or sacks you will hand over." />
      <div className="mt-5">
        <NumberStepper
          value={draft.quantity}
          onChange={(n) => actions.updateDraft({ quantity: n })}
          min={1}
          max={20}
          unit={draft.quantity === 1 ? "bag" : "bags"}
        />
      </div>
      {children}
      <div className="mt-6">
        <TextArea
          label="Description (optional)"
          value={draft.description}
          onChange={(v) => actions.updateDraft({ description: v.slice(0, 200) })}
          placeholder="e.g. Two bags by the blue gate"
        />
        <p className="mt-1.5 px-2 text-right text-xs text-muted-foreground">
          {draft.description.length}/200
        </p>
      </div>
    </>
  );
}

export function CoinEstimate({ draft }: { draft: Draft }) {
  if (!draft.material) return null;
  if (!isAcceptedRecyclable(draft.material))
    return (
      <Note tone="warning">
        {MATERIALS[draft.material].name} can't be recycled, so it doesn't earn Green Coins. A
        general waste operator will collect it.
      </Note>
    );
  const est = estimateCoins(draft.material, draft.quantity);
  if (est <= 0) return null;
  return (
    <div className="mt-4 flex items-center gap-3 rounded-2xl bg-coin-soft p-4">
      <CoinIcon className="size-8 text-sm" />
      <p className="text-sm">
        <span className="font-semibold">Up to {est} Green Coins</span>
        <span className="block text-muted-foreground">
          Released only after your material is collected and verified.
        </span>
      </p>
    </div>
  );
}

/** Illustrative map: tap or drag to move the pin. No real map or GPS is used. */
export function MapPicker({
  pin,
  onPin,
  area,
}: {
  pin: { x: number; y: number };
  onPin: (p: { x: number; y: number }) => void;
  area: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const place = (clientX: number, clientY: number) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const clamp = (v: number) => Math.round(Math.min(92, Math.max(8, v)));
    onPin({
      x: clamp(((clientX - r.left) / r.width) * 100),
      y: clamp(((clientY - r.top) / r.height) * 100),
    });
  };
  return (
    <div
      ref={ref}
      role="application"
      aria-label="Map placeholder. Tap to move the pin."
      onPointerDown={(e) => {
        dragging.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        place(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => dragging.current && place(e.clientX, e.clientY)}
      onPointerUp={() => (dragging.current = false)}
      className="map-grid relative h-52 cursor-crosshair touch-none select-none overflow-hidden rounded-3xl shadow-card"
    >
      <div className="absolute -bottom-6 -left-10 h-20 w-[140%] -rotate-6 bg-map-water" />
      <div className="absolute right-8 top-8 size-16 rounded-full bg-map-park" />
      <div className="absolute left-10 top-24 h-10 w-20 rounded-2xl bg-map-park" />
      <span className="absolute left-3 top-3 rounded-full bg-card px-3 py-1 text-xs font-semibold shadow-card">
        {area || "Choose your area"}
      </span>
      <span
        className="absolute -translate-x-1/2 -translate-y-full transition-[left,top] duration-75"
        style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
      >
        <MapPin
          className="size-11 fill-primary text-primary-deep drop-shadow-md"
          strokeWidth={1.6}
        />
      </span>
      <span className="absolute inset-x-3 bottom-3 rounded-full bg-card/95 px-3 py-1.5 text-center text-xs font-medium shadow-card">
        Tap or drag the pin to your gate · illustrative map
      </span>
    </div>
  );
}

export function LocationStep({ draft }: { draft: Draft }) {
  const addresses = useApp((s) => s.addresses);
  const [areaOpen, setAreaOpen] = useState(false);
  const saved = addresses.find((a) => a.line === draft.address && a.area === draft.area);
  return (
    <>
      <StepHeading
        title="Where should we collect?"
        body="Pick a saved place or type the address."
      />
      <div className="no-scrollbar -mx-5 mt-5 flex gap-2 overflow-x-auto px-5">
        {addresses.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() =>
              actions.updateDraft({ address: a.line, area: a.area, landmark: a.landmark })
            }
            className={cn(
              "shrink-0 rounded-full border px-4 py-2.5 text-sm font-semibold",
              saved?.id === a.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card",
            )}
          >
            {a.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => actions.updateDraft({ address: "", landmark: "" })}
          className={cn(
            "flex shrink-0 items-center gap-1 rounded-full border px-4 py-2.5 text-sm font-semibold",
            !saved
              ? "border-primary bg-primary-soft text-primary-deep"
              : "border-dashed border-border bg-card",
          )}
        >
          <Plus className="size-4" /> Other place
        </button>
      </div>
      <div className="mt-4">
        <MapPicker
          pin={draft.pin}
          onPin={(pin) => actions.updateDraft({ pin })}
          area={draft.area}
        />
      </div>
      <div className="mt-5 space-y-4">
        <Field
          label="Street or compound"
          icon={MapPin}
          value={draft.address}
          onChange={(e) => actions.updateDraft({ address: e.target.value })}
          placeholder="e.g. Compound 14, Kombo Coastal Road"
        />
        <div>
          <span className="mb-2 block text-sm font-medium">Area</span>
          <button
            type="button"
            onClick={() => setAreaOpen(true)}
            className="flex h-14 w-full items-center gap-3 rounded-full border border-input bg-card px-5 text-left text-base"
          >
            <MapPin className="size-5 text-muted-foreground" />
            <span className={cn("flex-1", !draft.area && "text-muted-foreground/70")}>
              {draft.area || "Choose your area"}
            </span>
            <span className="text-sm font-semibold text-primary">Change</span>
          </button>
        </div>
        <Field
          label="Landmark (optional)"
          value={draft.landmark}
          onChange={(e) => actions.updateDraft({ landmark: e.target.value })}
          placeholder="e.g. Opposite the mosque"
        />
      </div>
      <AreaSheet
        open={areaOpen}
        onOpenChange={setAreaOpen}
        value={draft.area}
        onSelect={(area, precise) => {
          actions.updateDraft(precise ? { area, pin: { x: 50, y: 50 } } : { area });
          setAreaOpen(false);
        }}
      />
    </>
  );
}

export function ScheduleStep({ draft }: { draft: Draft }) {
  return (
    <>
      <StepHeading title="When should we come?" body="Choose a day, then a time window." />
      <p className="mb-2 mt-6 flex items-center gap-2 text-sm font-medium">
        <CalendarDays className="size-4 text-primary" /> Collection date
      </p>
      <DateChips
        value={draft.date}
        onChange={(date) => {
          const keep = draft.slot && slotAvailable(date, draft.slot);
          actions.updateDraft(keep ? { date } : { date, slot: "" });
        }}
      />
      <p className="mb-2 mt-6 flex items-center gap-2 text-sm font-medium">
        <Clock className="size-4 text-primary" /> Time window
      </p>
      {!draft.date ? (
        <p className="rounded-2xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
          Choose a date first
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {TIME_SLOTS.map((slot) => {
            const ok = slotAvailable(draft.date!, slot);
            const on = draft.slot === slot;
            return (
              <button
                key={slot}
                type="button"
                disabled={!ok}
                onClick={() => actions.updateDraft({ slot })}
                className={cn(
                  "rounded-2xl border px-3 py-4 text-center transition disabled:opacity-45",
                  on
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card",
                )}
              >
                <span className="block font-semibold tabular-nums">{slot}</span>
                <span className="mt-0.5 block text-xs opacity-80">
                  {ok ? "Available" : "Not available"}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}

export function useCollectorOptions(draft: Draft) {
  const noCollectors = useApp((s) => s.demo.noCollectors);
  const material = draftMaterial(draft);
  return useMemo(
    () => (noCollectors ? [] : eligibleCollectors(material, draft.area)),
    [noCollectors, material, draft.area],
  );
}

/** Only collectors that accept the selected waste category are offered. */
export function CollectorStep({
  draft,
  onChangeWaste,
}: {
  draft: Draft;
  onChangeWaste: () => void;
}) {
  const list = useCollectorOptions(draft);
  const material = draftMaterial(draft);
  useEffect(() => {
    const first = list[0];
    if (!first) {
      if (draft.collectorId) actions.clearDraftCollector();
    } else if (!list.some((c) => c.id === draft.collectorId)) {
      actions.updateDraft({ collectorId: first.id });
    }
  }, [list, draft.collectorId]);

  const name = material ? MATERIALS[material].name.toLowerCase() : "this waste";
  const [rec, ...others] = list;
  if (!rec)
    return (
      <StateView
        icon={Users}
        tone="warning"
        title="No suitable collector available"
        body={`No collector that accepts ${name} is available for ${draft.area || "your area"} right now. Change the waste category or try again later.`}
      >
        <Button size="lg" onClick={onChangeWaste}>
          Change waste category
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link to="/home">Try again later</Link>
        </Button>
      </StateView>
    );
  const nonRecyclable = material ? !isAcceptedRecyclable(material) : false;
  return (
    <>
      <StepHeading
        title="Choose a collector"
        body={`Only collectors that accept ${name}. Our pick for ${draft.area || "your area"} is first.`}
      />
      {nonRecyclable && material !== "general" && (
        <Note tone="warning">
          Recycling companies don't take {name}, so only general and private waste operators are
          shown.
        </Note>
      )}
      <p className="mb-2 mt-5 text-sm font-medium">Recommended</p>
      <CollectorCard
        c={rec}
        recommended
        material={material}
        selected={draft.collectorId === rec.id}
        onSelect={() => actions.updateDraft({ collectorId: rec.id })}
      />
      {others.length > 0 && (
        <>
          <p className="mb-2 mt-6 text-sm font-medium">Other collectors that accept {name}</p>
          <div className="space-y-3">
            {others.map((c) => (
              <CollectorCard
                key={c.id}
                c={c}
                material={material}
                selected={draft.collectorId === c.id}
                onSelect={() => actions.updateDraft({ collectorId: c.id })}
              />
            ))}
          </div>
        </>
      )}
      <p className="mt-5 text-xs text-muted-foreground">
        Collector profiles, logos, ratings and fees are illustrative examples for this demo.
      </p>
    </>
  );
}

export function SummaryStep<S extends string>({
  draft,
  onEdit,
  steps,
}: {
  draft: Draft;
  onEdit: (step: S) => void;
  steps: { waste: S; details: S; location: S; schedule: S; collector: S };
}) {
  const material = draftMaterial(draft);
  const found = findCollector(draft.collectorId);
  const collector = found && material && collectorAccepts(found, material) ? found : undefined;
  return (
    <>
      <StepHeading title="Check your booking" body="Tap Edit to change anything." />
      {draft.photo && (
        <img
          src={draft.photo}
          alt="Your waste"
          className="mt-5 h-40 w-full rounded-3xl object-cover"
        />
      )}
      <div className="mt-5 divide-y divide-border rounded-2xl border border-border bg-card px-4 shadow-card">
        <SummaryRow
          label="Waste"
          value={material ? MATERIALS[material].name : "—"}
          onEdit={() => onEdit(steps.waste)}
        />
        {draft.kind === "recyclable" && draft.items.length > 0 && (
          <SummaryRow
            label="Items"
            value={
              draft.items
                .filter((i) => i.material === draft.material)
                .map((i) => `${i.count} ${i.label.toLowerCase()}`)
                .join(", ") || "—"
            }
          />
        )}
        <SummaryRow
          label="Quantity"
          value={`${draft.quantity} bag${draft.quantity > 1 ? "s" : ""}`}
          onEdit={() => onEdit(steps.details)}
        />
        {draft.description && (
          <SummaryRow label="Note" value={draft.description} onEdit={() => onEdit(steps.details)} />
        )}
        <SummaryRow
          label="Address"
          value={
            <>
              {draft.address}
              <span className="block text-xs font-normal text-muted-foreground">
                {draft.area}
                {draft.landmark ? ` · ${draft.landmark}` : ""}
              </span>
            </>
          }
          onEdit={() => onEdit(steps.location)}
        />
        <SummaryRow
          label="When"
          value={
            <>
              {draft.date ? longDate(draft.date) : "—"}
              <span className="block text-xs font-normal text-muted-foreground">{draft.slot}</span>
            </>
          }
          onEdit={() => onEdit(steps.schedule)}
        />
        <SummaryRow
          label="Collector"
          value={
            collector ? (
              <span className="flex items-center gap-2">
                <CollectorAvatar collector={collector} size="sm" />
                {collector.name}
              </span>
            ) : (
              <span className="text-destructive">Choose a collector</span>
            )
          }
          onEdit={() => onEdit(steps.collector)}
        />
      </div>
      {material && isAcceptedRecyclable(material) ? (
        <>
          <CoinEstimate draft={draft} />
          <Note>
            The collector and recycling partner check your waste on pickup. The scan is a guide, not
            a guarantee of acceptance.
          </Note>
        </>
      ) : (
        <Note>
          {collector ? `${collector.name} sets the fee (sample: ${collector.sampleRate}). ` : ""}You
          pay the collector directly. General waste does not earn Green Coins.
        </Note>
      )}
    </>
  );
}

/** Whether the resident can continue from a shared booking step. */
export function stepReady(
  step: "details" | "location" | "schedule" | "collector" | "summary",
  draft: Draft,
) {
  if (step === "details") return draft.quantity >= 1;
  if (step === "location") return draft.address.trim().length > 2 && !!draft.area;
  if (step === "schedule") return !!draft.date && !!draft.slot;
  // A booking always needs a collector who accepts its waste category.
  const material = draftMaterial(draft);
  const c = findCollector(draft.collectorId);
  return !!c && !!material && collectorAccepts(c, material);
}

export const STEP_HINT: Partial<Record<string, string>> = {
  location: "Enter your street or compound and area to continue.",
  schedule: "Choose a date and time window to continue.",
  collector: "Choose a collector that accepts your waste to continue.",
  summary: "Choose a collector that accepts your waste to continue.",
};
