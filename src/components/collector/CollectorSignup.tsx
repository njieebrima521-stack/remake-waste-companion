import { useNavigate } from "@tanstack/react-router";
import { BadgeCheck, Building2, Check, Lock, Mail, Recycle, Truck, User, type LucideIcon } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Chip, PhotoPicker } from "@/components/collector/PhotoPicker";
import { NumberStepper } from "@/components/remake/bits";
import { Field } from "@/components/remake/Field";
import { MATERIAL_ICON } from "@/components/remake/icons";
import { FlowProgress, Screen, ScreenBody, ScreenFooter, ScreenHeader } from "@/components/remake/Screen";
import { Button } from "@/components/ui/button";
import { validateApplication } from "@/lib/remake/collector";
import { AREAS, CATEGORY_MATERIALS, COLLECTOR_CATEGORY_LABEL, MATERIALS, VEHICLE_OPTIONS } from "@/lib/remake/data";
import { phoneDisplay } from "@/lib/remake/format";
import { actions } from "@/lib/remake/store";
import type { CollectorApplication, CollectorCategory } from "@/lib/remake/types";
import { cn } from "@/lib/utils";

const TYPES: { id: CollectorCategory; icon: LucideIcon; body: string }[] = [
  { id: "recycling", icon: Recycle, body: "You collect sorted recyclables and deliver them for recycling." },
  { id: "general", icon: Building2, body: "Your registered company collects general and residual waste." },
  { id: "independent", icon: Truck, body: "You collect with a donkey cart, tricycle or hand cart." },
];

const STEPS = ["Collector type", "Contact details", "Business & ID", "Operations", "Photo & review"];

const empty: CollectorApplication = {
  category: "independent",
  fullName: "",
  phone: "",
  email: "",
  remakeId: "",
  registrationNo: "",
  organisation: "",
  areas: [],
  materials: [],
  vehicle: "",
  capacityBags: 8,
};

const STEP_FIELDS: string[][] = [[], ["fullName", "phone", "email"], ["organisation", "registrationNo"], ["areas", "materials", "vehicle", "capacityBags"], []];

/**
 * Multi-step collector application. Used by /collector/register and by the
 * shared sign-up page (/register?role=collector), where `intro` holds the
 * resident/collector switch shown above the first step.
 */
export function CollectorSignup({
  title = "Collector registration",
  fallback = "/collector",
  intro,
}: {
  title?: string;
  fallback?: string;
  intro?: ReactNode;
}) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState(false);
  const [a, setA] = useState<CollectorApplication>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const company = a.category !== "independent";

  const set = <K extends keyof CollectorApplication>(k: K, v: CollectorApplication[K]) => {
    setA((x) => ({ ...x, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const next = () => {
    const all = validateApplication(a);
    const mine = Object.fromEntries(Object.entries(all).filter(([k]) => STEP_FIELDS[step]!.includes(k)));
    setErrors(mine);
    if (Object.keys(mine).length) return;
    if (step < STEPS.length - 1) setStep(step + 1);
    else {
      actions.submitCollectorApplication(a);
      void navigate({ to: "/collector/status", replace: true });
    }
  };

  return (
    <Screen>
      <ScreenHeader
        title={title}
        subtitle={`Step ${step + 1} of ${STEPS.length} · ${STEPS[step]}`}
        {...(step > 0 ? { onBack: () => setStep(step - 1) } : { fallback })}
      />
      <FlowProgress value={step + 1} total={STEPS.length} />
      <ScreenBody className="pt-3">
        {step === 0 && intro}
        {step === 0 && (
          <div className="space-y-3">
            <h2 className="text-xl font-semibold">What kind of collector are you?</h2>
            {TYPES.map((t) => {
              const on = picked && a.category === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    setPicked(true);
                    setA((x) => ({
                      ...x,
                      category: t.id,
                      materials: x.materials.filter((m) => CATEGORY_MATERIALS[t.id].includes(m)),
                      vehicle: VEHICLE_OPTIONS[t.id].includes(x.vehicle) ? x.vehicle : "",
                      capacityBags: t.id === "independent" ? 8 : t.id === "general" ? 60 : 30,
                    }));
                  }}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-3xl border-2 bg-card p-4 text-left shadow-card transition active:scale-[0.99]",
                    on ? "border-primary" : "border-transparent",
                  )}
                >
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary-deep">
                    <t.icon className="size-6" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{COLLECTOR_CATEGORY_LABEL[t.id]}</span>
                    <span className="mt-0.5 block text-sm text-muted-foreground">{t.body}</span>
                  </span>
                  {on && <Check className="size-5 text-primary" />}
                </button>
              );
            })}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <Field
              label={company ? "Contact person's full name" : "Full name"}
              icon={User}
              value={a.fullName}
              onChange={(e) => set("fullName", e.target.value)}
              placeholder="e.g. Awa Touray"
              error={errors["fullName"]}
            />
            <Field
              label="Phone number"
              prefix="+220"
              inputMode="numeric"
              maxLength={7}
              placeholder="7 digit number"
              value={a.phone}
              onChange={(e) => set("phone", e.target.value.replace(/\D/g, ""))}
              error={errors["phone"]}
            />
            <Field
              label="Email (optional)"
              icon={Mail}
              type="email"
              value={a.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="name@example.com"
              error={errors["email"]}
            />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <Field
              label={company ? "Business or organisation name" : "Business name (optional)"}
              icon={Building2}
              value={a.organisation}
              onChange={(e) => set("organisation", e.target.value)}
              placeholder={company ? "e.g. Kombo Recycling Collectors" : "Leave empty if you work alone"}
              error={errors["organisation"]}
            />
            <Field
              label={company ? "Business registration number" : "Business registration number (optional)"}
              icon={BadgeCheck}
              value={a.registrationNo}
              onChange={(e) => set("registrationNo", e.target.value.toUpperCase())}
              placeholder="e.g. BRS-2021-01882"
              hint="Issued by the Registrar of Companies — not your Remake ID."
              error={errors["registrationNo"]}
            />
            <div className="rounded-3xl bg-muted p-4">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Lock className="size-4" /> Remake Collector ID
              </p>
              <p className="mt-2 font-mono text-lg font-semibold tracking-wider text-muted-foreground">RMK-C-····</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Remake issues your Collector ID after verifying your details. You don't choose it, and it's separate
                from any business registration number.
              </p>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-sm font-medium">Operating areas</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {AREAS.map((ar) => (
                <Chip key={ar} selected={a.areas.includes(ar)} onClick={() => set("areas", toggle(a.areas, ar))}>
                  {ar}
                </Chip>
              ))}
            </div>
            {errors["areas"] && <p className="mt-1.5 px-2 text-xs font-medium text-destructive">{errors["areas"]}</p>}

            <h2 className="mt-6 text-sm font-medium">Waste categories you want to handle</h2>
            <p className="text-xs text-muted-foreground">Remake approves the final list. Special waste needs a licensed handler.</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {CATEGORY_MATERIALS[a.category].map((m) => {
                const Icon = MATERIAL_ICON[m];
                return (
                  <Chip key={m} selected={a.materials.includes(m)} onClick={() => set("materials", toggle(a.materials, m))}>
                    <Icon className="size-4" /> {MATERIALS[m].short}
                  </Chip>
                );
              })}
            </div>
            {errors["materials"] && <p className="mt-1.5 px-2 text-xs font-medium text-destructive">{errors["materials"]}</p>}

            <h2 className="mt-6 text-sm font-medium">Vehicle or equipment</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {VEHICLE_OPTIONS[a.category].map((v) => (
                <Chip key={v} selected={a.vehicle === v} onClick={() => set("vehicle", v)}>
                  {v}
                </Chip>
              ))}
            </div>
            {errors["vehicle"] && <p className="mt-1.5 px-2 text-xs font-medium text-destructive">{errors["vehicle"]}</p>}

            <h2 className="mb-2 mt-6 text-sm font-medium">Capacity per trip</h2>
            <NumberStepper value={a.capacityBags} onChange={(n) => set("capacityBags", n)} min={1} max={200} unit="bags" />
          </div>
        )}

        {step === 4 && (
          <div>
            <PhotoPicker
              label={company ? "Company logo" : "Your profile photo"}
              value={a.image}
              onChange={(img) => set("image", img)}
            />
            <div className="mt-6 divide-y divide-border rounded-3xl bg-card px-4 text-sm shadow-card">
              <Row label="Type" value={COLLECTOR_CATEGORY_LABEL[a.category]} />
              <Row label="Name" value={a.fullName} />
              {a.organisation && <Row label="Business" value={a.organisation} />}
              <Row label="Phone" value={phoneDisplay(a.phone)} />
              {a.email && <Row label="Email" value={a.email} />}
              <Row label="Registration no." value={a.registrationNo || "—"} />
              <Row label="Remake Collector ID" value="Issued after verification" />
              <Row label="Areas" value={a.areas.join(", ")} />
              <Row label="Categories" value={a.materials.map((m) => MATERIALS[m].short).join(", ")} />
              <Row label="Vehicle" value={`${a.vehicle} · ${a.capacityBags} bags`} />
            </div>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Remake checks every application before you can receive assignments.
            </p>
          </div>
        )}
      </ScreenBody>
      <ScreenFooter>
        <Button size="lg" onClick={next} disabled={step === 0 && !picked}>
          {step === STEPS.length - 1 ? "Submit for verification" : "Continue"}
        </Button>
      </ScreenFooter>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
