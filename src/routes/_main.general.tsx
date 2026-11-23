import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ImageOff } from "lucide-react";
import { useEffect, useState } from "react";

import {
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
import { PhotoSource } from "@/components/remake/flow";
import {
  FlowProgress,
  Screen,
  ScreenBody,
  ScreenFooter,
  ScreenHeader,
} from "@/components/remake/Screen";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/remake/head";
import { catGeneral } from "@/lib/remake/media";
import { actions, useApp } from "@/lib/remake/store";

export const Route = createFileRoute("/_main/general")({
  head: () => pageHead("General waste collection", "Book a collector for mixed household rubbish."),
  component: General,
});

type Step = "photo" | "details" | "location" | "schedule" | "collector" | "summary";
const STEPS: Step[] = ["photo", "details", "location", "schedule", "collector", "summary"];
const TITLES: Record<Step, string> = {
  photo: "Garbage handover",
  details: "Quantity",
  location: "Pickup location",
  schedule: "Date & time",
  collector: "Collector",
  summary: "Booking summary",
};

function General() {
  const navigate = useNavigate();
  const draft = useApp((s) => s.draft);
  const [step, setStep] = useState<Step>("photo");
  const [photoMode, setPhotoMode] = useState<"source" | "camera" | "preview">(
    draft.photo ? "preview" : "source",
  );
  const [fromSummary, setFromSummary] = useState(false);

  // Arriving here directly (e.g. from a link) still starts a general booking.
  useEffect(() => {
    if (draft.kind !== "general") {
      actions.startDraft("general");
      setPhotoMode("source");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const idx = STEPS.indexOf(step);
  const back = () => {
    if (step === "photo" && photoMode === "preview") return setPhotoMode("source");
    if (fromSummary) {
      setFromSummary(false);
      return setStep("summary");
    }
    if (idx === 0) return navigate({ to: "/collect" });
    setStep(STEPS[idx - 1]!);
  };
  const ready = step === "photo" ? photoMode === "preview" : stepReady(step, draft);
  const next = () => {
    if (step === "summary") {
      const pickup = actions.submitDraft();
      void navigate({ to: "/booked/$id", params: { id: pickup.id }, replace: true }).then(() =>
        actions.startDraft("general"),
      );
      return;
    }
    if (fromSummary) {
      setFromSummary(false);
      return setStep("summary");
    }
    setStep(STEPS[idx + 1]!);
  };

  if (step === "photo" && photoMode === "camera")
    return (
      <Screen animate={false}>
        <div className="relative flex h-full flex-col bg-camera text-camera-foreground md:mx-auto md:my-6 md:h-[calc(100%-3rem)] md:w-full md:max-w-xl md:overflow-hidden md:rounded-3xl">
          <div className="relative min-h-0 flex-1 overflow-hidden">
            <img src={catGeneral} alt="Camera view" className="size-full object-cover" />
            <div className="pointer-events-none absolute inset-10 rounded-3xl border-2 border-camera-foreground/70" />
            <p className="absolute inset-x-0 top-0 bg-photo-fade px-5 pb-6 pt-safe text-center text-sm font-medium">
              Show all your bags in the frame
            </p>
            <Button
              variant="camera"
              size="sm"
              className="absolute left-4 top-4 mt-safe"
              onClick={() => setPhotoMode("source")}
            >
              Close
            </Button>
          </div>
          <div className="flex shrink-0 flex-col items-center px-5 pb-safe pt-4">
            <p className="text-xs opacity-70">Demo camera — uses a sample photo</p>
            <button
              type="button"
              aria-label="Take photo"
              onClick={() => {
                actions.updateDraft({ photo: catGeneral });
                setPhotoMode("preview");
              }}
              className="my-5 size-20 rounded-full border-4 border-camera-foreground bg-camera-foreground/30 active:scale-95"
            />
          </div>
        </div>
      </Screen>
    );

  return (
    <Screen key={`${step}-${photoMode}`}>
      <ScreenHeader
        title={TITLES[step]}
        subtitle={`Step ${idx + 1} of ${STEPS.length}`}
        onBack={back}
      />
      <FlowProgress value={idx + 1} total={STEPS.length} />
      <ScreenBody>
        {step === "photo" && photoMode === "source" && (
          <>
            <StepHeading
              title="Add a photo of your bags"
              body="It helps the collector know what to bring. No scan needed."
            />
            <div className="mt-6">
              <PhotoSource
                onCamera={() => setPhotoMode("camera")}
                onUpload={(url) => {
                  actions.updateDraft({ photo: url });
                  setPhotoMode("preview");
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => {
                actions.clearDraftPhoto();
                setStep("details");
              }}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-4 text-sm font-semibold text-muted-foreground"
            >
              <ImageOff className="size-4" /> Continue without a photo
            </button>
          </>
        )}
        {step === "photo" && photoMode === "preview" && (
          <>
            <p className="mt-2 text-sm font-medium">Trash photo</p>
            {draft.photo && (
              <img
                src={draft.photo}
                alt="Your bags"
                className="mt-2 aspect-[4/3] w-full rounded-[2rem] object-cover"
              />
            )}
            <h2 className="mt-5 text-center font-display text-xl font-bold">Image confirmation</h2>
            <p className="text-center text-[15px] text-muted-foreground">
              Nice picture! Continue to enter the pickup details.
            </p>
          </>
        )}
        {step === "details" && (
          <DetailsStep draft={draft}>
            <Note tone="primary">
              Take out bottles, cans and cardboard first — sorted recyclables earn Green Coins.
            </Note>
          </DetailsStep>
        )}
        {step === "location" && <LocationStep draft={draft} />}
        {step === "schedule" && <ScheduleStep draft={draft} />}
        {step === "collector" && (
          <CollectorStep draft={draft} onChangeWaste={() => void navigate({ to: "/collect" })} />
        )}
        {step === "summary" && (
          <SummaryStep
            draft={draft}
            onEdit={(s: Step) => {
              setFromSummary(true);
              if (s === "photo") setPhotoMode(draft.photo ? "preview" : "source");
              setStep(s);
            }}
            steps={{
              waste: "photo",
              details: "details",
              location: "location",
              schedule: "schedule",
              collector: "collector",
            }}
          />
        )}
      </ScreenBody>
      {!(step === "photo" && photoMode === "source") && (
        <ScreenFooter className={step === "photo" ? "grid grid-cols-2 gap-3 space-y-0" : undefined}>
          {step === "photo" ? (
            <>
              <Button variant="outline" size="lg" onClick={() => setPhotoMode("source")}>
                Retake
              </Button>
              <Button size="lg" onClick={next}>
                {fromSummary ? "Save" : "Next"}
              </Button>
            </>
          ) : (
            <>
              {!ready && STEP_HINT[step] && (
                <p className="text-center text-xs text-muted-foreground">{STEP_HINT[step]}</p>
              )}
              <Button size="lg" disabled={!ready} onClick={next}>
                {step === "summary"
                  ? "Hand over the trash"
                  : fromSummary
                    ? "Save and review"
                    : "Continue"}
              </Button>
            </>
          )}
        </ScreenFooter>
      )}
    </Screen>
  );
}
