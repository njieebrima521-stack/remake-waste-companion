import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CalendarClock,
  Check,
  CheckCircle2,
  FlaskConical,
  Lock,
  MapPin,
  Phone,
  Route as RouteIcon,
  ScanLine,
  Scale,
  ShieldBan,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ProposeSheet, RejectSheet } from "@/components/collector/sheets";
import {
  MaterialBubble,
  MaterialClassTag,
  Meter,
  ReadinessPill,
  VerificationPill,
  bags,
  useMe,
  useWorkState,
} from "@/components/collector/ui";
import { Pill } from "@/components/remake/bits";
import { StateView } from "@/components/remake/StateView";
import { Screen, ScreenBody, ScreenFooter, ScreenHeader } from "@/components/remake/Screen";
import { Button } from "@/components/ui/button";
import {
  canSeeOpenRequest,
  canVerify,
  canViewRequest,
  estKg,
  isDirectRequest,
  isMyJob,
  minimumFor,
  partnerName,
  readiness,
  requesterName,
  verificationState,
} from "@/lib/remake/collector";
import { MATERIALS, STATUS_LABEL } from "@/lib/remake/data";
import { dayLabel, longDate, shortDateTime } from "@/lib/remake/format";
import { pageHead } from "@/lib/remake/head";
import { findCollector, qrPayload } from "@/lib/remake/logic";
import { actions } from "@/lib/remake/store";

export const Route = createFileRoute("/collector/_app/requests/$id")({
  head: ({ params }) => pageHead(`Request ${params.id}`, "Collection request details for collectors."),
  component: RequestDetail,
});

function RequestDetail() {
  const { id } = Route.useParams();
  const me = useMe();
  const state = useWorkState();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [proposeOpen, setProposeOpen] = useState(false);
  const p = state.pickups.find((x) => x.id === id);

  if (!p || !canViewRequest(state, me, p)) {
    return (
      <Screen>
        <ScreenHeader title="Request" fallback="/collector/requests" />
        <ScreenBody>
          <StateView
            icon={ShieldBan}
            tone="muted"
            title="Not available to you"
            body="This request is outside your approved waste categories or service areas, or it went to another collector."
          >
            <Button asChild size="lg" variant="outline">
              <Link to="/collector/requests">Back to requests</Link>
            </Button>
          </StateView>
        </ScreenBody>
      </Screen>
    );
  }

  const r = readiness(p, state.thresholds);
  const min = minimumFor(state.thresholds, p.material);
  const direct = isDirectRequest(p, me.id);
  const open = canSeeOpenRequest(state, me, p);
  const canAct = direct || open;
  const mine = isMyJob(p, me.id);
  const verifiable = canVerify(state, me.id, p);
  const route = p.routeId ? state.routes.find((x) => x.id === p.routeId) : undefined;
  const myProposal = p.proposal?.collectorId === me.id ? p.proposal : undefined;
  const declinedByMe = p.declined?.find((d) => d.collectorId === me.id);
  const blocked =
    r === "below_minimum"
      ? `Needs at least ${bags(min)} — has ${p.quantity}.`
      : r === "awaiting_more"
        ? `The requester is still filling bags (${p.quantity} of ${min}).`
        : r === "not_ready"
          ? p.readyFrom && p.readyFrom > p.date
            ? `Ready from ${dayLabel(p.readyFrom)} — propose a later window.`
            : "Waste isn't separated and ready yet."
          : null;

  const run = (res: { ok: boolean; error?: string }, success: string) => {
    if (res.ok) toast.success(success);
    else toast.error(res.error ?? "Something went wrong");
  };

  return (
    <Screen>
      <ScreenHeader title={requesterName(p)} subtitle={p.id} fallback="/collector/requests" />
      <ScreenBody>
        {p.photo && (
          <div className="relative mb-4 h-40 overflow-hidden rounded-3xl">
            <img src={p.photo} alt={`Waste photo for ${p.id}`} className="size-full object-cover" />
            <span className="absolute left-3 top-3 rounded-full bg-ink/70 px-2.5 py-1 text-[11px] font-semibold text-ink-foreground">
              Sample photo
            </span>
          </div>
        )}

        <div className="flex items-center gap-3">
          <MaterialBubble material={p.material} className="size-14 rounded-3xl" />
          <div className="min-w-0">
            <p className="font-display text-lg font-semibold">{MATERIALS[p.material].name}</p>
            <p className="text-sm text-muted-foreground">
              {bags(p.quantity)} · ~{estKg(p)} kg {p.estimatedKg ? "(estimated)" : "(typical)"}
            </p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <ReadinessPill pickup={p} />
          <MaterialClassTag material={p.material} />
          {direct && <Pill className="bg-ink text-ink-foreground">Sent to you</Pill>}
        </div>

        <section className="mt-5 rounded-3xl bg-card p-4 shadow-card">
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-medium">Minimum quantity</span>
            <span className="tabular-nums text-muted-foreground">
              {p.quantity} of {min} bags
            </span>
          </div>
          <Meter value={p.quantity} max={min} overIsBad={false} className="mt-2" />
          <p className="mt-2 text-xs text-muted-foreground">
            Remake's sample minimum for {MATERIALS[p.material].short.toLowerCase()} is {bags(min)} per collection.
          </p>
        </section>

        <dl className="mt-3 divide-y divide-border rounded-3xl bg-card px-4 text-sm shadow-card">
          {p.institution ? (
            <>
              <Row label="Customer" value={`${p.institution.name} · ${p.institution.kind}`} />
              <Row
                label="Contact"
                value={
                  <a href={`tel:${p.institution.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-1.5 text-primary">
                    <Phone className="size-3.5" /> {p.institution.contact} · {p.institution.contactRole}
                  </a>
                }
              />
            </>
          ) : (
            <Row label="Customer" value="Resident booking" />
          )}
          <Row
            label="Location"
            value={
              <span className="inline-flex items-start gap-1.5">
                <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                {p.address}, {p.area}
                {p.landmark ? ` · ${p.landmark}` : ""}
              </span>
            }
          />
          <Row label="Preferred time" value={`${longDate(p.date)} · ${p.slot || "Any time"}`} />
          <Row label="Separated" value={p.separated === false ? "No — needs sorting first" : "Yes"} />
          <Row
            label="Ready"
            value={p.notReady ? "Reported not ready" : p.readyFrom && p.readyFrom > p.date ? `From ${dayLabel(p.readyFrom)}` : "Yes"}
          />
          <Row label="Goes to" value={partnerName(p)} />
          <Row label="Status" value={p.status === "collected" && p.kind === "general" ? "Collected" : STATUS_LABEL[p.status]} />
          {p.description && <Row label="Notes" value={p.description} />}
        </dl>

        {myProposal && (
          <section className="mt-3 rounded-3xl bg-info-soft p-4 text-sm text-info">
            <p className="flex items-center gap-2 font-semibold">
              <CalendarClock className="size-4" /> You proposed {dayLabel(myProposal.date)} · {myProposal.slot}
            </p>
            <p className="mt-1">
              {myProposal.status === "pending"
                ? "Waiting for the requester's reply."
                : myProposal.status === "agreed"
                  ? "The requester agreed."
                  : "The requester kept their original window."}
            </p>
          </section>
        )}

        {declinedByMe && (
          <p className="mt-3 rounded-2xl bg-muted p-3 text-sm text-muted-foreground">
            You rejected this request: {declinedByMe.reason}
          </p>
        )}

        {!!p.issues?.length && (
          <section className="mt-3 space-y-2">
            {p.issues.map((i, n) => (
              <p key={n} className="rounded-2xl bg-warning-soft p-3 text-sm text-warning-foreground">
                <span className="font-semibold">{i.kind === "missed" ? "Missed pickup" : "Waste not ready"}</span> ·{" "}
                {shortDateTime(i.at)}
                {i.note ? ` — ${i.note}` : ""}
              </p>
            ))}
          </section>
        )}

        {(p.status === "collected" || p.status === "verified") && (
          <section className="mt-3 rounded-3xl bg-card p-4 shadow-card">
            <div className="flex items-center justify-between">
              <p className="font-semibold">Collection</p>
              <Pill className="bg-primary-soft text-primary-deep">Confirmed</Pill>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {p.collectedAt ? shortDateTime(p.collectedAt) : ""} · by {findCollector(p.collectedBy)?.name ?? "collector"}
            </p>
            {p.kind === "recyclable" && (
              <>
                <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                  <p className="font-semibold">Material verification</p>
                  <VerificationPill state={verificationState(p)} />
                </div>
                {p.verification && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {p.verification.actualKg} kg · {p.verification.meetsRequirements ? "meets requirements" : "doesn't meet requirements"}
                    {p.verification.note ? ` · ${p.verification.note}` : ""}
                  </p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  Collection and material verification are separate steps. Confirming collection never releases Green Coins.
                </p>
              </>
            )}
          </section>
        )}

        {/* Simulated requester actions, so every state can be shown in the demo. */}
        {(canAct && (r === "below_minimum" || r === "awaiting_more" || r === "not_ready")) ||
        (mine && p.notReady) ||
        myProposal?.status === "pending" ? (
          <section className="mt-4 rounded-3xl border border-dashed border-warning/60 bg-warning-soft/50 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <FlaskConical className="size-4" /> Demo: requester actions
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(r === "below_minimum" || r === "awaiting_more") && (
                <Button size="sm" variant="outline" onClick={() => actions.addRequesterBags(p.id, 1)}>
                  Requester adds a bag
                </Button>
              )}
              {(r === "not_ready" || p.notReady) && (
                <Button size="sm" variant="outline" onClick={() => actions.markWasteReady(p.id)}>
                  Requester says it's ready
                </Button>
              )}
              {myProposal?.status === "pending" && (
                <>
                  <Button size="sm" onClick={() => run(actions.answerProposal(p.id, true), "Requester agreed to the new window")}>
                    Requester agrees
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => run(actions.answerProposal(p.id, false), "Requester declined")}>
                    Requester declines
                  </Button>
                </>
              )}
            </div>
          </section>
        ) : null}
      </ScreenBody>

      {(canAct || mine || verifiable) && (
        <ScreenFooter>
          {canAct && (
            <>
              {blocked && <p className="text-center text-xs font-medium text-warning-foreground">{blocked}</p>}
              <Button size="lg" disabled={r !== "ready"} onClick={() => run(actions.acceptRequest(p.id, me.id), "Request accepted")}>
                <Check /> Accept
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  disabled={myProposal?.status === "pending"}
                  onClick={() => setProposeOpen(true)}
                >
                  <CalendarClock /> New window
                </Button>
                <Button variant="outline" className="text-destructive" onClick={() => setRejectOpen(true)}>
                  <X /> Reject
                </Button>
              </div>
            </>
          )}
          {mine && (
            <div className="grid grid-cols-2 gap-3">
              {route ? (
                <Button asChild variant="outline">
                  <Link to="/collector/routes/$id" params={{ id: route.id }}>
                    <RouteIcon /> {route.ref}
                  </Link>
                </Button>
              ) : me.category === "independent" ? (
                <Button asChild variant="outline">
                  <a href={`tel:${(p.institution?.phone ?? "").replace(/\s/g, "")}`}>
                    <Phone /> Call
                  </a>
                </Button>
              ) : (
                <Button asChild variant="outline">
                  <Link to="/collector/routes">
                    <RouteIcon /> Plan route
                  </Link>
                </Button>
              )}
              <Button asChild>
                <Link to="/collector/scan" search={{ code: qrPayload(p) }}>
                  <ScanLine /> Scan to confirm
                </Link>
              </Button>
            </div>
          )}
          {verifiable && (
            <Button asChild size="lg">
              <Link to="/collector/verify/$id" params={{ id: p.id }}>
                <Scale /> Record material verification
              </Link>
            </Button>
          )}
        </ScreenFooter>
      )}

      {!canAct && !mine && p.status === "verified" && (
        <ScreenFooter>
          <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="size-4 text-primary" /> Collected and verified
            <Lock className="size-3.5" />
          </p>
        </ScreenFooter>
      )}

      <RejectSheet
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        onConfirm={(reason) => {
          setRejectOpen(false);
          run(actions.rejectRequest(p.id, me.id, reason), "Request rejected");
        }}
      />
      <ProposeSheet
        open={proposeOpen}
        onOpenChange={setProposeOpen}
        onConfirm={(date, slot) => {
          setProposeOpen(false);
          run(actions.proposeWindow(p.id, me.id, date, slot), "Proposal sent");
        }}
      />
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
