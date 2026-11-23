import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bell, FlaskConical, Home, Lock, LogOut, RotateCcw, Scale, ScanLine, SlidersHorizontal, UserPen } from "lucide-react";
import { toast } from "sonner";

import { VerificationStatusPill } from "@/components/collector/account";
import { CollectorNav, bags, useMe, useWorkState } from "@/components/collector/ui";
import { MenuGroup, MenuRow, Pill } from "@/components/remake/bits";
import { CollectorAvatar } from "@/components/remake/CollectorAvatar";
import { MATERIAL_ICON } from "@/components/remake/icons";
import { Screen, ScreenBody, ScreenHeader } from "@/components/remake/Screen";
import { isAvailable } from "@/lib/remake/collector";
import { COLLECTOR_CATEGORY_LABEL, MATERIALS } from "@/lib/remake/data";
import { pageHead } from "@/lib/remake/head";
import { actions } from "@/lib/remake/store";

export const Route = createFileRoute("/collector/_app/profile/")({
  head: () => pageHead("Collector profile", "Your collector details, Remake Collector ID and verification status."),
  component: Profile,
});

function Profile() {
  const me = useMe();
  const state = useWorkState();
  const navigate = useNavigate();
  const unread = state.workNotifications.filter((n) => n.collectorId === me.id && !n.read).length;
  const status = state.collectorAccount?.status ?? "approved";

  return (
    <Screen animate={false}>
      <ScreenHeader title="Profile" back={false} />
      <ScreenBody>
        <section className="flex flex-col items-center rounded-[2rem] bg-card p-6 text-center shadow-card">
          <CollectorAvatar collector={me} size="lg" />
          <p className="mt-3 font-display text-xl font-semibold">{me.name}</p>
          <p className="text-sm text-muted-foreground">{COLLECTOR_CATEGORY_LABEL[me.category]}</p>
          <VerificationStatusPill status={status} className="mt-2" />
        </section>

        <section className="mt-4 rounded-3xl bg-ink p-4 text-ink-foreground">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-muted">
            <Lock className="size-3.5" /> Issued by Remake
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <p className="text-[11px] text-ink-muted">Remake Collector ID</p>
              <p className="font-mono text-base font-semibold tracking-wider">{me.remakeId}</p>
            </div>
            <div>
              <p className="text-[11px] text-ink-muted">Verification</p>
              <p className="font-semibold">Approved</p>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-ink-muted">Approved waste categories</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {me.accepts.map((m) => {
              const Icon = MATERIAL_ICON[m];
              return (
                <Pill key={m} className="gap-1 bg-ink-foreground/10 text-ink-foreground">
                  <Icon className="size-3" /> {MATERIALS[m].short}
                </Pill>
              );
            })}
          </div>
          <p className="mt-3 text-[11px] text-ink-muted">Only Remake can change these.</p>
        </section>

        <dl className="mt-4 divide-y divide-border rounded-3xl bg-card px-4 text-sm shadow-card">
          <Row label="Business registration no." value={me.registrationNo ?? "Not registered"} />
          <Row label="Contact" value={me.contactName} />
          <Row label="Phone" value={me.phone} />
          <Row label="Email" value={me.email || "—"} />
          <Row label="Service areas" value={me.areas.join(", ")} />
          <Row label="Vehicle / equipment" value={me.vehicle} />
          <Row label="Capacity" value={`${bags(me.capacityBags)} per trip`} />
          <Row label="Availability" value={isAvailable(state, me.id) ? "Available" : "Off duty"} />
        </dl>

        <MenuGroup title="Account">
          <MenuRow icon={UserPen} label="Edit profile" hint="Contact, vehicle, capacity, areas, photo" to="/collector/profile/edit" />
          <MenuRow icon={Bell} label="Notifications" hint={unread ? `${unread} unread` : "All read"} to="/collector/notifications" />
          {me.category === "recycling" && <MenuRow icon={Scale} label="Material received" to="/collector/verify" />}
          {me.category !== "independent" && <MenuRow icon={ScanLine} label="Scan booking QR" to="/collector/scan" />}
        </MenuGroup>

        <MenuGroup title="Demo settings">
          <MenuRow icon={SlidersHorizontal} label="Minimum quantities" hint="Remake admin · per material" to="/collector/thresholds" />
          <MenuRow
            icon={RotateCcw}
            label="Reset sample data"
            onClick={() => {
              actions.resetCollectorDemo();
              toast.success("Sample data reset");
            }}
          />
          <MenuRow icon={Home} label="Open the resident app" to="/" />
          <MenuRow
            icon={FlaskConical}
            label="Switch sample account"
            onClick={() => {
              actions.collectorSignOut();
              void navigate({ to: "/collector", replace: true });
            }}
          />
        </MenuGroup>

        <MenuGroup>
          <MenuRow
            icon={LogOut}
            label="Sign out"
            danger
            right={<span />}
            onClick={() => {
              actions.collectorSignOut();
              void navigate({ to: "/collector", replace: true });
            }}
          />
        </MenuGroup>
        <p className="mt-6 text-center text-xs text-muted-foreground">Remake collector prototype · sample data</p>
      </ScreenBody>
      <CollectorNav />
    </Screen>
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
