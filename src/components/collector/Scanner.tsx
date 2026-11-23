import {
  AlertTriangle,
  CheckCircle2,
  Hourglass,
  KeyRound,
  ScanLine,
  ShieldX,
  UserX,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { StatusPill } from "@/components/remake/bits";
import { CollectorAvatar } from "@/components/remake/CollectorAvatar";
import { Field } from "@/components/remake/Field";
import { Button } from "@/components/ui/button";
import { requesterName } from "@/lib/remake/collector";
import { MATERIALS } from "@/lib/remake/data";
import { longDate } from "@/lib/remake/format";
import { collectionCode, findCollector, qrPayload, resolveScan, scanStatus, type ScanStatus } from "@/lib/remake/logic";
import { actions, useApp } from "@/lib/remake/store";
import type { Collector, Pickup } from "@/lib/remake/types";
import { cn } from "@/lib/utils";

/** A sample code that matches no booking, to show the invalid state. */
export const UNKNOWN_SAMPLE = "REMAKE-COLLECT:UNKNOWN0SAMPLE000";

const RESULT: Record<ScanStatus, { title: string; tone: string; icon: LucideIcon; body: (assigned?: string) => string }> = {
  ready: {
    title: "Ready to collect",
    tone: "bg-primary-soft text-primary-deep",
    icon: CheckCircle2,
    body: () => "You're the assigned collector. Check the bags, then confirm the collection.",
  },
  wrong_collector: {
    title: "Assigned to another collector",
    tone: "bg-destructive-soft text-destructive",
    icon: UserX,
    body: (a) => `This booking is assigned to ${a ?? "another collector"}. Only the assigned collector can confirm it.`,
  },
  unassigned: {
    title: "No collector assigned yet",
    tone: "bg-warning-soft text-warning-foreground",
    icon: Hourglass,
    body: () => "This booking is still waiting for a collector, so it can't be confirmed yet.",
  },
  collected: {
    title: "Already collected",
    tone: "bg-info-soft text-info",
    icon: AlertTriangle,
    body: () => "Collection was already confirmed for this booking. It can't be confirmed twice.",
  },
  verified: {
    title: "Already collected and verified",
    tone: "bg-info-soft text-info",
    icon: AlertTriangle,
    body: () => "This booking is complete. Nothing more to confirm.",
  },
  cancelled: {
    title: "Booking cancelled",
    tone: "bg-destructive-soft text-destructive",
    icon: XCircle,
    body: () => "This booking was cancelled. Don't collect against this code.",
  },
  invalid: {
    title: "Invalid QR code",
    tone: "bg-destructive-soft text-destructive",
    icon: ShieldX,
    body: () => "This code doesn't match any Remake booking. Ask the customer to open the booking again.",
  },
};

/**
 * Simulated booking-QR scanner. Scanning only confirms collection for the assigned collector;
 * it never releases Green Coins (that happens after material verification).
 */
export function CollectorScanner({
  scannerId,
  samples,
  initialCode,
  picker,
  afterConfirm,
}: {
  scannerId: string;
  samples: Pickup[];
  initialCode?: string | undefined;
  picker?: { collectors: Collector[]; onChange: (id: string) => void };
  afterConfirm?: (p: Pickup) => ReactNode;
}) {
  const pickups = useApp((s) => s.pickups);
  const [scanned, setScanned] = useState<string | null>(initialCode ?? null);
  const [scanning, setScanning] = useState(false);
  const [typed, setTyped] = useState("");
  const [confirmedId, setConfirmedId] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const pickup = scanned ? resolveScan(pickups, scanned) : null;
  const status = scanned ? scanStatus(pickup, scannerId) : null;
  const assigned = findCollector(pickup?.collectorId);

  const scan = (value: string) => {
    setConfirmedId(null);
    setScanned(null);
    setScanning(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setScanning(false);
      setScanned(value);
      requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }));
    }, 900);
  };

  const confirm = () => {
    if (!pickup) return;
    const res = actions.confirmPickup(pickup.id, scannerId);
    if (res.ok) {
      setConfirmedId(pickup.id);
      toast.success(`Collection confirmed for ${pickup.id}`);
    } else {
      toast.error(RESULT[res.reason].title);
    }
  };

  const info = status ? RESULT[status] : null;
  const justConfirmed = !!pickup && confirmedId === pickup.id;

  return (
    <div>
      <div ref={topRef} />
      {picker && (
        <>
          <h2 className="mb-2 mt-4 text-sm font-medium">Scanning as</h2>
          <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
            {picker.collectors.map((c) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={c.id === scannerId}
                onClick={() => {
                  picker.onChange(c.id);
                  setConfirmedId(null);
                }}
                className={cn(
                  "flex w-24 shrink-0 flex-col items-center gap-1.5 rounded-2xl border-2 bg-card p-2 text-center",
                  c.id === scannerId ? "border-primary" : "border-transparent",
                )}
              >
                <CollectorAvatar collector={c} size="sm" />
                <span className="line-clamp-2 text-[11px] font-semibold leading-tight">{c.name}</span>
              </button>
            ))}
          </div>
        </>
      )}

      <div className="relative mt-5 grid h-44 place-items-center overflow-hidden rounded-3xl bg-camera text-camera-foreground">
        <div className="pointer-events-none absolute inset-6 rounded-2xl border-2 border-camera-foreground/60" />
        {scanning && <span className="absolute inset-x-8 top-8 h-0.5 animate-scan-line bg-primary shadow-float" />}
        <p className="relative flex items-center gap-2 px-8 text-center text-sm font-medium">
          <ScanLine className="size-5 shrink-0" />
          {scanning ? "Scanning…" : "Simulated camera · choose a sample QR below"}
        </p>
      </div>

      <h2 className="mb-2 mt-6 text-sm font-medium">Sample booking QR codes</h2>
      <div className="grid grid-cols-2 gap-3">
        {samples.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => scan(qrPayload(p))}
            className="flex items-center gap-2 rounded-2xl bg-card p-2.5 text-left shadow-card active:scale-[0.98]"
          >
            <span className="rounded-lg bg-paper p-1">
              <QRCodeSVG value={qrPayload(p)} size={44} bgColor="var(--paper)" fgColor="var(--paper-ink)" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold tabular-nums">{p.id}</span>
              <span className="block truncate text-[11px] text-muted-foreground">
                {p.institution ? p.institution.name : MATERIALS[p.material].short}
              </span>
              <StatusPill pickup={p} className="mt-1 px-2 py-0.5 text-[10px]" />
            </span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => scan(UNKNOWN_SAMPLE)}
          className="flex items-center gap-2 rounded-2xl border border-dashed border-border bg-card p-2.5 text-left active:scale-[0.98]"
        >
          <span className="rounded-lg bg-paper p-1">
            <QRCodeSVG value={UNKNOWN_SAMPLE} size={44} bgColor="var(--paper)" fgColor="var(--paper-ink)" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold">Unknown code</span>
            <span className="block text-[11px] text-muted-foreground">Not a Remake booking</span>
          </span>
        </button>
      </div>

      <form
        className="mt-5 flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (typed.trim()) scan(typed);
        }}
      >
        <Field
          label="Or type the booking code"
          icon={KeyRound}
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder="e.g. K7F3-9QX2"
          autoCapitalize="characters"
          className="min-w-0 flex-1"
        />
        <Button type="submit" size="lg" variant="outline" className="w-auto shrink-0 px-5" disabled={!typed.trim()}>
          Check
        </Button>
      </form>

      <div ref={resultRef} className="scroll-mt-4">
        {info && status && !justConfirmed && (
          <section aria-label="Scan result" className="mt-6 animate-fade-up rounded-2xl border border-border bg-card p-4 shadow-card">
            <div className={cn("flex gap-3 rounded-2xl p-3", info.tone)}>
              <info.icon className="size-6 shrink-0" />
              <div>
                <p className="font-semibold">{info.title}</p>
                <p className="text-sm">{info.body(assigned?.name)}</p>
              </div>
            </div>
            {pickup && (
              <dl className="mt-4 divide-y divide-border text-sm">
                <Row label="Booking" value={`${pickup.id} · ${collectionCode(pickup)}`} />
                {pickup.institution && <Row label="Customer" value={requesterName(pickup)} />}
                <Row label="Waste category" value={MATERIALS[pickup.material].name} />
                <Row label="Bags" value={String(pickup.quantity)} />
                <Row label="Pickup" value={`${longDate(pickup.date)} · ${pickup.slot}`} />
                <Row label="Address" value={`${pickup.address}, ${pickup.area}`} />
                <div className="flex items-center justify-between gap-3 py-2.5">
                  <dt className="text-muted-foreground">Assigned collector</dt>
                  <dd className="flex items-center gap-2 text-right font-medium">
                    {assigned ? (
                      <>
                        <CollectorAvatar collector={assigned} size="sm" />
                        {assigned.name}
                      </>
                    ) : (
                      "None yet"
                    )}
                  </dd>
                </div>
              </dl>
            )}
            <Button size="lg" className="mt-4 w-full" disabled={status !== "ready"} onClick={confirm}>
              <CheckCircle2 /> Confirm collection
            </Button>
          </section>
        )}

        {justConfirmed && pickup && (
          <section aria-label="Collection confirmed" className="mt-6 animate-fade-up rounded-2xl border border-border bg-card p-5 text-center shadow-card">
            <span className="mx-auto grid size-16 animate-pop place-items-center rounded-full bg-primary text-primary-foreground">
              <CheckCircle2 className="size-8" />
            </span>
            <p className="mt-3 font-display text-xl font-semibold">Collection confirmed</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {pickup.id} · {pickup.quantity} bag{pickup.quantity > 1 ? "s" : ""} of{" "}
              {MATERIALS[pickup.material].short.toLowerCase()}
            </p>
            <p className="mt-4 rounded-2xl bg-warning-soft p-3 text-sm text-warning-foreground">
              {pickup.kind === "recyclable"
                ? "Material verification is a separate step. This scan does not release Green Coins."
                : "General waste collected. General waste doesn't earn Green Coins."}
            </p>
            <div className="mt-4 flex flex-col gap-3">
              {afterConfirm?.(pickup)}
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  setConfirmedId(null);
                  setScanned(null);
                  topRef.current?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Scan another
              </Button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
