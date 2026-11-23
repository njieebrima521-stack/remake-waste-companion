import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Split } from "lucide-react";
import { useEffect, useState } from "react";

import {
  CoinEstimate,
  CollectorStep,
  DetailsStep,
  LocationStep,
  Note,
  ScheduleStep,
  STEP_HINT,
  StepHeading,
  stepReady,
  SummaryStep,
} from "@/components/remake/booking";
import { MATERIAL_ICON } from "@/components/remake/icons";
import {
  FlowProgress,
  Screen,
  ScreenBody,
  ScreenFooter,
  ScreenHeader,
} from "@/components/remake/Screen";
import { Button } from "@/components/ui/button";
import { MATERIALS, RECYCLABLE } from "@/lib/remake/data";
import { pageHead } from "@/lib/remake/head";
import { MATERIAL_IMAGE, SCENE_IMAGE } from "@/lib/remake/media";
import { actions, useApp } from "@/lib/remake/store";
import type { MaterialId } from "@/lib/remake/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_main/book")({
  head: () =>
    pageHead(
      "Book recyclable pickup",
      "Confirm your material, bags, location, time and collector.",
    ),
  component: Book,
});

type Step = "material" | "details" | "location" | "schedule" | "collector" | "summary";
const STEPS: Step[] = ["material", "details", "location", "schedule", "collector", "summary"];
const TITLES: Record<Step, string> = {
  material: "Confirm material",
  details: "Quantity",
  location: "Pickup location",
  schedule: "Date & time",
  collector: "Collector",
  summary: "Booking summary",
};
const BOOKABLE: MaterialId[] = [...RECYCLABLE, "organic"];
/** Bookable here, but matched only to general/private waste operators. */
const NON_RECYCLABLE: MaterialId[] = ["mixed_plastic"];

function Book() {
  const navigate = useNavigate();
  const draft = useApp((s) => s.draft);
  const [step, setStep] = useState<Step>("material");
  const [fromSummary, setFromSummary] = useState(false);

  useEffect(() => {
    if (draft.kind !== "recyclable") actions.startDraft("recyclable");
    // Only on arrival: keep whatever the scan put in the draft.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const idx = STEPS.indexOf(step);
  const go = (s: Step) => setStep(s);
  const back = () => {
    if (fromSummary) {
      setFromSummary(false);
      return go("summary");
    }
    if (idx === 0) return navigate({ to: draft.items.length ? "/scan" : "/collect" });
    go(STEPS[idx - 1]!);
  };
  const ready = step === "material" ? !!draft.material : stepReady(step, draft);

  const next = () => {
    if (step === "summary") {
      const pickup = actions.submitDraft();
      void navigate({ to: "/booked/$id", params: { id: pickup.id }, replace: true }).then(() =>
        actions.startDraft("recyclable"),
      );
      return;
    }
    if (fromSummary) {
      setFromSummary(false);
      return go("summary");
    }
    go(STEPS[idx + 1]!);
  };

  const photo =
    draft.scene === "upload"
      ? draft.photo
      : draft.scene
        ? SCENE_IMAGE[draft.scene]
        : draft.material
          ? MATERIAL_IMAGE[draft.material]
          : undefined;
  const scanned = draft.items.length > 0;

  return (
    <Screen key={step}>
      <ScreenHeader
        title={TITLES[step]}
        subtitle={`Step ${idx + 1} of ${STEPS.length}`}
        onBack={back}
      />
      <FlowProgress value={idx + 1} total={STEPS.length} />
      <ScreenBody>
        {step === "material" && (
          <>
            <StepHeading
              title={scanned ? "Is this right?" : "What are you recycling?"}
              body={
                scanned
                  ? "This booking is for one material only."
                  : "Choose one material per booking."
              }
            />
            {scanned && photo && (
              <div className="relative mt-5 overflow-hidden rounded-3xl">
                <img src={photo} alt="Your scanned waste" className="h-40 w-full object-cover" />
                <span className="absolute bottom-3 left-3 rounded-full bg-card px-3 py-1 text-xs font-semibold shadow-card">
                  From your scan
                </span>
              </div>
            )}
            {draft.separatedConfirmed && scanned && (
              <p className="mt-4 flex gap-2 rounded-2xl bg-primary-soft p-4 text-sm text-primary-deep">
                <Split className="size-5 shrink-0" /> You confirmed your materials are in separate
                bags.
              </p>
            )}
            <div className="mt-5 grid grid-cols-2 gap-3">
              {BOOKABLE.map((m) => {
                const Icon = MATERIAL_ICON[m];
                const on = draft.material === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => actions.updateDraft({ material: m })}
                    className={cn(
                      "overflow-hidden rounded-3xl border-2 bg-card text-left shadow-card transition active:scale-[0.98]",
                      on ? "border-primary" : "border-transparent",
                    )}
                  >
                    <img src={MATERIAL_IMAGE[m]} alt="" className="h-20 w-full object-cover" />
                    <span className="flex items-center gap-2 p-3">
                      <Icon className="size-4 text-primary" />
                      <span className="flex-1 text-sm font-semibold">{MATERIALS[m].name}</span>
                      {on && <CheckCircle2 className="size-5 text-primary" />}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mb-2 mt-6 text-sm font-medium">Not recyclable</p>
            {NON_RECYCLABLE.map((m) => {
              const Icon = MATERIAL_ICON[m];
              const on = draft.material === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => actions.updateDraft({ material: m })}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-3xl border-2 bg-card p-4 text-left shadow-card transition active:scale-[0.99]",
                    on ? "border-primary" : "border-transparent",
                  )}
                >
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-ink text-ink-foreground">
                    <Icon className="size-6" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{MATERIALS[m].name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {MATERIALS[m].examples} · collected by general waste operators, no coins
                    </span>
                  </span>
                  {on && <CheckCircle2 className="size-5 shrink-0 text-primary" />}
                </button>
              );
            })}
            {scanned && draft.material && (
              <div className="mt-5 rounded-3xl bg-card p-4 shadow-card">
                <p className="text-sm font-medium">Items in this bag</p>
                <ul className="mt-2 space-y-1 text-[15px]">
                  {draft.items
                    .filter((i) => i.material === draft.material)
                    .map((i) => (
                      <li key={i.id} className="flex justify-between">
                        <span>{i.label}</span>
                        <span className="font-semibold tabular-nums">{i.count}</span>
                      </li>
                    ))}
                  {!draft.items.some((i) => i.material === draft.material) && (
                    <li className="text-sm text-muted-foreground">
                      No scanned items match this material.
                    </li>
                  )}
                </ul>
              </div>
            )}
            <Note>The scan helps you sort. The collector checks your waste on pickup.</Note>
          </>
        )}

        {step === "details" && (
          <DetailsStep draft={draft}>
            <CoinEstimate draft={draft} />
          </DetailsStep>
        )}
        {step === "location" && <LocationStep draft={draft} />}
        {step === "schedule" && <ScheduleStep draft={draft} />}
        {step === "collector" && (
          <CollectorStep
            draft={draft}
            onChangeWaste={() => {
              setFromSummary(false);
              go("material");
            }}
          />
        )}
        {step === "summary" && (
          <SummaryStep
            draft={draft}
            onEdit={(s: Step) => {
              setFromSummary(true);
              go(s);
            }}
            steps={{
              waste: "material",
              details: "details",
              location: "location",
              schedule: "schedule",
              collector: "collector",
            }}
          />
        )}
      </ScreenBody>
      <ScreenFooter>
        {!ready && STEP_HINT[step] && (
          <p className="text-center text-xs text-muted-foreground">{STEP_HINT[step]}</p>
        )}
        <Button size="lg" disabled={!ready} onClick={next}>
          {step === "summary" ? "Confirm booking" : fromSummary ? "Save and review" : "Continue"}
        </Button>
      </ScreenFooter>
    </Screen>
  );
}
