import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, FlaskConical, Hourglass, Lock, LogOut, ShieldAlert, XCircle } from "lucide-react";

import { VerificationStatusPill } from "@/components/collector/account";
import { StateView } from "@/components/remake/StateView";
import { Screen, ScreenBody, ScreenHeader } from "@/components/remake/Screen";
import { Button } from "@/components/ui/button";
import { COLLECTOR_CATEGORY_LABEL, MATERIALS } from "@/lib/remake/data";
import { phoneDisplay } from "@/lib/remake/format";
import { pageHead } from "@/lib/remake/head";
import { actions, useApp } from "@/lib/remake/store";

export const Route = createFileRoute("/collector/status")({
  head: () => pageHead("Verification status", "Check where your Remake collector application stands."),
  component: Status,
});

function Status() {
  const acc = useApp((s) => s.collectorAccount);
  const navigate = useNavigate();
  if (!acc) return <Navigate to="/collector" replace />;
  const a = acc.application;
  const signOut = () => {
    actions.collectorSignOut();
    void navigate({ to: "/collector", replace: true });
  };

  const view = {
    awaiting: { icon: Hourglass, tone: "warning" as const, title: "Awaiting verification", body: acc.reviewNote ?? "Remake is checking your details." },
    approved: { icon: CheckCircle2, tone: "primary" as const, title: "You're approved", body: acc.reviewNote ?? "Your account is active." },
    rejected: { icon: XCircle, tone: "destructive" as const, title: "Application rejected", body: acc.reviewNote ?? "Remake couldn't verify your details." },
    suspended: { icon: ShieldAlert, tone: "destructive" as const, title: "Account suspended", body: acc.reviewNote ?? "Contact Remake to resolve this." },
  }[acc.status];

  return (
    <Screen>
      <ScreenHeader title="Verification" back={false} right={
        <button type="button" onClick={signOut} aria-label="Sign out" className="grid size-11 place-items-center rounded-full border border-border bg-card">
          <LogOut className="size-5" />
        </button>
      } />
      <ScreenBody>
        <StateView icon={view.icon} tone={view.tone} title={view.title} body={view.body} className="py-6">
          {acc.status === "approved" && (
            <Button asChild size="lg">
              <Link to="/collector/home">Open my dashboard</Link>
            </Button>
          )}
          {acc.status !== "approved" && (
            <p className="text-sm text-muted-foreground">
              Assignments, routes and scanning unlock only after Remake approves the account.
            </p>
          )}
        </StateView>

        {acc.status === "awaiting" && (
          <div className="rounded-3xl border border-dashed border-warning/60 bg-warning-soft/60 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <FlaskConical className="size-4" /> Demo: simulate Remake's review
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button onClick={() => actions.reviewCollectorApplication("approved")}>Approve</Button>
              <Button variant="outline" onClick={() => actions.reviewCollectorApplication("rejected")}>
                Reject
              </Button>
            </div>
          </div>
        )}

        {acc.status === "rejected" && (
          <Button asChild size="lg" variant="outline" className="w-full">
            <Link to="/collector/register" onClick={() => actions.collectorSignOut()}>
              Start a new application
            </Link>
          </Button>
        )}

        <h2 className="mb-2 mt-6 text-sm font-medium">Application</h2>
        <div className="divide-y divide-border rounded-3xl bg-card px-4 text-sm shadow-card">
          <Row label="Status" value={<VerificationStatusPill status={acc.status} />} />
          <Row label="Type" value={COLLECTOR_CATEGORY_LABEL[a.category]} />
          <Row label="Name" value={a.organisation || a.fullName} />
          <Row label="Phone" value={phoneDisplay(a.phone)} />
          <Row label="Registration no." value={a.registrationNo || "—"} />
          <Row
            label="Remake Collector ID"
            value={
              <span className="inline-flex items-center gap-1.5">
                <Lock className="size-3.5 text-muted-foreground" />
                {a.remakeId || "Issued after approval"}
              </span>
            }
          />
          <Row label="Areas" value={a.areas.join(", ")} />
          <Row label="Categories" value={a.materials.map((m) => MATERIALS[m].short).join(", ")} />
          <Row label="Vehicle" value={`${a.vehicle} · ${a.capacityBags} bags`} />
        </div>
      </ScreenBody>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
