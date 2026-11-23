import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Scale, ShieldBan } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Chip } from "@/components/collector/PhotoPicker";
import { MaterialBubble, bags, useMe, useWorkState } from "@/components/collector/ui";
import { Field, TextArea } from "@/components/remake/Field";
import { StateView } from "@/components/remake/StateView";
import { Screen, ScreenBody, ScreenFooter, ScreenHeader } from "@/components/remake/Screen";
import { Button } from "@/components/ui/button";
import { canVerify, estKg, requesterName, type VerificationInput } from "@/lib/remake/collector";
import { MATERIALS } from "@/lib/remake/data";
import { shortDateTime } from "@/lib/remake/format";
import { pageHead } from "@/lib/remake/head";
import { actions } from "@/lib/remake/store";
import type { VerificationResult } from "@/lib/remake/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/collector/_app/verify/$id")({
  head: () => pageHead("Material verification", "Record whether collected material was received and meets requirements."),
  component: Verify,
});

const RESULTS: { id: VerificationResult; label: string }[] = [
  { id: "accepted", label: "Accepted" },
  { id: "needs_sorting", label: "Needs sorting" },
  { id: "rejected", label: "Rejected" },
];

function suggest(i: Pick<VerificationInput, "received" | "meetsRequirements" | "needsSorting">): VerificationResult {
  if (!i.received || !i.meetsRequirements) return "rejected";
  if (i.needsSorting) return "needs_sorting";
  return "accepted";
}

function Verify() {
  const { id } = Route.useParams();
  const me = useMe();
  const state = useWorkState();
  const navigate = useNavigate();
  const p = state.pickups.find((x) => x.id === id);
  const [form, setForm] = useState({
    received: true,
    actualKg: p ? String(estKg(p)) : "",
    meetsRequirements: true,
    needsSorting: false,
    result: "accepted" as VerificationResult,
    note: "",
  });

  if (!p || !canVerify(state, me.id, p)) {
    const why = !p
      ? "This request doesn't exist."
      : me.category !== "recycling"
        ? "Only recycling companies record material verification."
        : p.status === "verified"
          ? "This material is already verified."
          : p.status !== "collected"
            ? "Material can only be verified after the collection is confirmed."
            : "You can only verify material you collected.";
    return (
      <Screen>
        <ScreenHeader title="Material verification" fallback="/collector/verify" />
        <ScreenBody>
          <StateView icon={ShieldBan} tone="muted" title="Can't verify this" body={why}>
            {p && (
              <Button asChild size="lg" variant="outline">
                <Link to="/collector/requests/$id" params={{ id: p.id }}>
                  Open request
                </Link>
              </Button>
            )}
          </StateView>
        </ScreenBody>
      </Screen>
    );
  }

  const set = (patch: Partial<typeof form>) =>
    setForm((f) => {
      const next = { ...f, ...patch };
      if (!("result" in patch)) next.result = suggest(next);
      return next;
    });

  const submit = () => {
    const res = actions.verifyMaterial(p.id, me.id, {
      received: form.received,
      actualKg: Number(form.actualKg),
      meetsRequirements: form.meetsRequirements,
      needsSorting: form.needsSorting,
      result: form.result,
      note: form.note,
    });
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Verification recorded");
    void navigate({ to: "/collector/requests/$id", params: { id: p.id }, replace: true });
  };

  return (
    <Screen>
      <ScreenHeader title="Material verification" subtitle={p.id} fallback="/collector/verify" />
      <ScreenBody>
        <ol className="flex gap-2 text-xs font-semibold">
          <li className="flex flex-1 items-center gap-1.5 rounded-full bg-primary-soft px-3 py-2 text-primary-deep">
            <CheckCircle2 className="size-4" /> 1 · Collection confirmed
          </li>
          <li className="flex flex-1 items-center gap-1.5 rounded-full bg-ink px-3 py-2 text-ink-foreground">
            <Scale className="size-4" /> 2 · Verify material
          </li>
        </ol>

        <section className="mt-4 flex items-center gap-3 rounded-3xl bg-card p-4 shadow-card">
          <MaterialBubble material={p.material} />
          <div className="min-w-0">
            <p className="truncate font-semibold">{requesterName(p)}</p>
            <p className="text-xs text-muted-foreground">
              {MATERIALS[p.material].name} · {bags(p.quantity)} · ~{estKg(p)} kg estimated
            </p>
            {p.collectedAt && <p className="text-xs text-muted-foreground">Collected {shortDateTime(p.collectedAt)}</p>}
          </div>
        </section>

        <div className="mt-5 space-y-5">
          <YesNo label="Material received?" value={form.received} onChange={(v) => set({ received: v })} />
          <Field
            label="Actual weight (kg)"
            inputMode="decimal"
            value={form.actualKg}
            disabled={!form.received}
            onChange={(e) => set({ actualKg: e.target.value.replace(/[^\d.]/g, "") })}
            hint="Weighed on arrival at the yard."
          />
          <YesNo label="Meets acceptance requirements?" value={form.meetsRequirements} onChange={(v) => set({ meetsRequirements: v })} />
          <details className="rounded-2xl bg-muted px-4 py-3 text-sm">
            <summary className="cursor-pointer font-medium">What's accepted for {MATERIALS[p.material].short.toLowerCase()}</summary>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              {MATERIALS[p.material].accepted.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </details>
          <YesNo label="Additional sorting needed?" value={form.needsSorting} onChange={(v) => set({ needsSorting: v })} />

          <div>
            <p className="mb-2 text-sm font-medium">Result</p>
            <div className="grid grid-cols-3 gap-2">
              {RESULTS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  aria-pressed={form.result === r.id}
                  onClick={() => set({ result: r.id })}
                  className={cn(
                    "h-12 rounded-2xl border-2 text-sm font-semibold",
                    form.result === r.id
                      ? r.id === "accepted"
                        ? "border-primary bg-primary-soft text-primary-deep"
                        : r.id === "needs_sorting"
                          ? "border-info bg-info-soft text-info"
                          : "border-destructive bg-destructive-soft text-destructive"
                      : "border-input bg-card",
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <TextArea label="Verification notes" value={form.note} onChange={(v) => set({ note: v })} placeholder="e.g. Caps mixed in, labels removed" />
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Accepted material is marked verified. Needs sorting and rejected keep it unverified.
        </p>
      </ScreenBody>
      <ScreenFooter>
        <Button size="lg" onClick={submit}>
          Save verification
        </Button>
      </ScreenFooter>
    </Screen>
  );
}

function YesNo({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex gap-2">
        <Chip selected={value} onClick={() => onChange(true)}>
          Yes
        </Chip>
        <Chip selected={!value} onClick={() => onChange(false)}>
          No
        </Chip>
      </div>
    </div>
  );
}
