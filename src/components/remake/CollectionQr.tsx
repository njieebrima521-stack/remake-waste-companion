import { CheckCircle2, ScanLine, XCircle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

import { MATERIALS } from "@/lib/remake/data";
import { longDate, shortDateTime } from "@/lib/remake/format";
import { collectionCode, findCollector, qrPayload } from "@/lib/remake/logic";
import type { Pickup } from "@/lib/remake/types";
import { cn } from "@/lib/utils";

import { CollectorAvatar } from "./CollectorAvatar";

export const QR_INSTRUCTION =
  "Show this QR code to your collector when they collect your waste. They will scan it to confirm the collection.";

/** The booking's own collection-verification QR code with its key details. */
export function CollectionQr({ pickup, className }: { pickup: Pickup; className?: string }) {
  const collector = findCollector(pickup.collectorId);
  const used = pickup.status === "collected" || pickup.status === "verified";
  const void_ = pickup.status === "cancelled";
  return (
    <section
      aria-label="Collection QR code"
      className={cn("rounded-3xl bg-card p-5 shadow-card", className)}
    >
      <p className="flex items-center gap-2 text-sm font-semibold text-primary-deep">
        <ScanLine className="size-4" /> Collection QR code
      </p>
      <div className="mt-4 flex flex-col items-center">
        <div className="relative rounded-3xl border border-border bg-paper p-4">
          <QRCodeSVG
            value={qrPayload(pickup)}
            size={196}
            level="M"
            bgColor="var(--paper)"
            fgColor="var(--paper-ink)"
            title={`Collection QR for ${pickup.id}`}
            className={cn((used || void_) && "opacity-20")}
          />
          {(used || void_) && (
            <span className="absolute inset-0 grid place-items-center">
              <span
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold shadow-card",
                  used
                    ? "bg-primary text-primary-foreground"
                    : "bg-destructive text-destructive-foreground",
                )}
              >
                {used ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
                {used ? "Scanned" : "No longer valid"}
              </span>
            </span>
          )}
        </div>
        <p className="mt-3 font-mono text-lg font-semibold tracking-widest tabular-nums">
          {collectionCode(pickup)}
        </p>
        <p className="text-xs text-muted-foreground">Code if the scan doesn't work</p>
      </div>

      <p
        className={cn(
          "mt-4 rounded-2xl p-3 text-center text-sm",
          used || void_ ? "bg-muted text-muted-foreground" : "bg-primary-soft text-primary-deep",
        )}
      >
        {used
          ? `Collection confirmed${pickup.collectedAt ? ` · ${shortDateTime(pickup.collectedAt)}` : ""}. This code can't be used again.`
          : void_
            ? "This booking was cancelled, so its QR code no longer works."
            : QR_INSTRUCTION}
      </p>

      <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-2xl bg-muted p-3">
          <dt className="text-xs text-muted-foreground">Booking reference</dt>
          <dd className="font-semibold tabular-nums">{pickup.id}</dd>
        </div>
        <div className="rounded-2xl bg-muted p-3">
          <dt className="text-xs text-muted-foreground">Waste category</dt>
          <dd className="font-semibold">{MATERIALS[pickup.material].short}</dd>
        </div>
        <div className="col-span-2 rounded-2xl bg-muted p-3">
          <dt className="text-xs text-muted-foreground">Pickup date & time</dt>
          <dd className="font-semibold">
            {longDate(pickup.date)} · {pickup.slot}
          </dd>
        </div>
        <div className="col-span-2 flex items-center gap-3 rounded-2xl bg-muted p-3">
          {collector && <CollectorAvatar collector={collector} size="sm" />}
          <dt className="sr-only">Assigned collector</dt>
          <dd className="min-w-0">
            <span className="block text-xs text-muted-foreground">Assigned collector</span>
            <span className="block truncate font-semibold">
              {collector ? collector.name : "Not assigned yet"}
            </span>
          </dd>
        </div>
      </dl>
    </section>
  );
}
