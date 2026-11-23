import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, Info, Minus, Plus, ScanLine, Sparkles, Split, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";

import { CameraView, PhotoSource } from "@/components/remake/flow";
import { MATERIAL_ICON } from "@/components/remake/icons";
import { FlowProgress, Screen, ScreenBody, ScreenFooter, ScreenHeader } from "@/components/remake/Screen";
import { StateView } from "@/components/remake/StateView";
import { Button } from "@/components/ui/button";
import { MATERIALS, RECYCLABLE, SCENES, UPLOAD_SAMPLE_ITEMS } from "@/lib/remake/data";
import { pageHead } from "@/lib/remake/head";
import { materialTypes } from "@/lib/remake/logic";
import { MATERIAL_IMAGE, SCENE_IMAGE } from "@/lib/remake/media";
import { actions, useApp } from "@/lib/remake/store";
import type { DetectedItem, MaterialId, SceneId } from "@/lib/remake/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_main/scan")({
  head: () => pageHead("Scan waste", "Take a photo to see what kind of waste you have."),
  component: Scan,
});

type Step = "intro" | "source" | "camera" | "preview" | "scanning" | "results" | "separate";
const ORDER: Step[] = ["intro", "source", "camera", "preview", "scanning", "results", "separate"];
const EDITABLE: MaterialId[] = [...RECYCLABLE, "organic", "general", "special"];

function Scan() {
  const navigate = useNavigate();
  const draft = useApp((s) => s.draft);
  const scanDown = useApp((s) => s.demo.scanUnavailable);
  const [step, setStep] = useState<Step>("intro");
  const [scene, setScene] = useState<Exclude<SceneId, "upload">>("mixed");
  const [items, setItems] = useState<DetectedItem[]>([]);
  const [separated, setSeparated] = useState(false);
  const [first, setFirst] = useState<MaterialId | null>(null);

  const photo = draft.scene === "upload" && draft.photo ? draft.photo : SCENE_IMAGE[scene];

  useEffect(() => {
    if (step !== "scanning") return;
    const t = setTimeout(() => {
      const found = draft.scene === "upload" ? UPLOAD_SAMPLE_ITEMS : SCENES[scene].items;
      setItems(found.map((i) => ({ ...i })));
      setStep("results");
    }, 2200);
    return () => clearTimeout(t);
  }, [step, scene, draft.scene]);

  const back = () => {
    const i = ORDER.indexOf(step);
    if (step === "intro") return navigate({ to: "/home" });
    if (step === "preview") return setStep(draft.scene === "upload" ? "source" : "camera");
    if (step === "results") return setStep("preview");
    setStep(ORDER[Math.max(0, i - 1)]!);
  };

  if (step === "camera")
    return (
      <Screen animate={false}>
        <CameraView
          scene={scene}
          onScene={setScene}
          onClose={() => setStep("source")}
          onShoot={() => {
            actions.updateDraft({ scene });
            setStep("preview");
          }}
        />
      </Screen>
    );

  const recyclableTypes = materialTypes(items).filter((m) => RECYCLABLE.includes(m) || m === "organic");
  const hasSpecial = items.some((i) => i.material === "special" && i.count > 0);
  const onlyGeneral = items.length > 0 && items.every((i) => i.material === "general");
  const mixed = recyclableTypes.length > 1;

  const goBook = (material: MaterialId, list: DetectedItem[], sep: boolean) => {
    actions.updateDraft({
      kind: "recyclable",
      material,
      items: list.filter((i) => i.material === material),
      separatedConfirmed: sep,
      ...(draft.scene === "upload" ? {} : { scene }),
    });
    navigate({ to: "/book" });
  };

  const titles: Record<Step, string> = {
    intro: "Waste scan",
    source: "Add a photo",
    camera: "",
    preview: "Image confirmation",
    scanning: "Scanning",
    results: "Result waste scan",
    separate: "Separate your waste",
  };

  return (
    <Screen key={step}>
      <ScreenHeader title={titles[step]} onBack={back} />
      {step !== "intro" && <FlowProgress value={ORDER.indexOf(step)} total={ORDER.length - 1} />}

      {step === "intro" && (
        <>
          <ScreenBody>
            <div className="mt-2 overflow-hidden rounded-[2rem] bg-primary-soft">
              <img src={SCENE_IMAGE.mixed} alt="Waste ready to scan" className="h-56 w-full object-cover" />
            </div>
            <h2 className="mt-6 font-display text-2xl font-bold">What's in your waste?</h2>
            <p className="mt-1 text-[15px] text-muted-foreground">Take one clear photo. We'll show the materials we can see.</p>
            <ul className="mt-5 space-y-3 text-[15px]">
              {["Spread items out in good light", "Show the whole pile in the frame", "Check the result and fix anything wrong"].map((t) => (
                <li key={t} className="flex gap-3">
                  <CheckCircle2 className="size-5 shrink-0 text-primary" /> {t}
                </li>
              ))}
            </ul>
            <p className="mt-5 flex gap-2 rounded-2xl bg-info-soft p-4 text-sm text-info">
              <Info className="size-5 shrink-0" /> The scan is a helper, not a promise. Collectors check your waste on pickup.
            </p>
          </ScreenBody>
          <ScreenFooter>
            {scanDown ? (
              <>
                <p className="text-center text-sm text-muted-foreground">Scanning is not available right now.</p>
                <Button size="lg" onClick={() => { actions.updateDraft({ kind: "recyclable", items: [] }); navigate({ to: "/book" }); }}>
                  Choose material myself
                </Button>
              </>
            ) : (
              <Button
                size="lg"
                onClick={() => {
                  if (draft.kind !== "recyclable") actions.startDraft("recyclable");
                  setStep("source");
                }}
              >
                <ScanLine /> Start scan
              </Button>
            )}
          </ScreenFooter>
        </>
      )}

      {step === "source" && (
        <ScreenBody>
          <h2 className="mt-2 font-display text-2xl font-bold">How do you want to add a photo?</h2>
          <p className="mb-6 mt-1 text-[15px] text-muted-foreground">Use your camera now or pick a photo you already took.</p>
          <PhotoSource
            onCamera={() => {
              actions.updateDraft({ scene });
              setStep("camera");
            }}
            onUpload={(url) => {
              actions.updateDraft({ photo: url, scene: "upload" });
              setStep("preview");
            }}
          />
        </ScreenBody>
      )}

      {step === "preview" && (
        <>
          <ScreenBody>
            <img src={photo} alt="Your photo" className={cn("mt-2 aspect-[4/5] w-full rounded-[2rem] object-cover", scene === "blurry" && draft.scene !== "upload" && "blur-sm")} />
            <h2 className="mt-5 text-center font-display text-xl font-bold">Nice picture!</h2>
            <p className="text-center text-[15px] text-muted-foreground">Is everything clear and inside the photo?</p>
          </ScreenBody>
          <ScreenFooter className="grid grid-cols-2 gap-3 space-y-0">
            <Button variant="outline" size="lg" onClick={() => setStep(draft.scene === "upload" ? "source" : "camera")}>
              Retake
            </Button>
            <Button size="lg" onClick={() => setStep("scanning")}>
              Scan photo
            </Button>
          </ScreenFooter>
        </>
      )}

      {step === "scanning" && (
        <ScreenBody>
          <div className="relative mt-2 overflow-hidden rounded-[2rem]">
            <img src={photo} alt="Scanning" className="aspect-[4/5] w-full object-cover" />
            <div className="absolute inset-x-0 top-0 h-1 animate-scan-line bg-primary shadow-float" />
          </div>
          <StateView icon={Sparkles} title="Looking at your waste…" body="This takes a few seconds." spinning className="py-6" />
        </ScreenBody>
      )}

      {step === "results" && (
        <>
          <ScreenBody>
            <img src={photo} alt="Scanned waste" className="mt-2 h-48 w-full rounded-[2rem] object-cover" />
            {items.length === 0 ? (
              <StateView icon={AlertTriangle} tone="warning" title="We couldn't see clearly" body="The photo is too blurry. Please take another one in better light.">
                <Button size="lg" onClick={() => setStep("source")}>Take another photo</Button>
              </StateView>
            ) : (
              <>
                <div className="mt-4 rounded-2xl bg-primary py-4 text-center font-display text-lg font-semibold text-primary-foreground">
                  Trash detected
                </div>
                <p className="mb-2 mt-5 text-sm font-medium">Details — tap to fix anything wrong</p>
                <div className="space-y-2.5">
                  {items.map((it) => (
                    <ItemRow
                      key={it.id}
                      item={it}
                      onChange={(n) => setItems((l) => l.map((x) => (x.id === it.id ? n : x)))}
                      onRemove={() => setItems((l) => l.filter((x) => x.id !== it.id))}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setItems((l) => [...l, { id: `d${Date.now()}`, label: "Other item", material: "plastic", count: 1 }])
                  }
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-3 text-sm font-semibold text-primary"
                >
                  <Plus className="size-4" /> Add an item we missed
                </button>
                {hasSpecial && (
                  <p className="mt-4 flex gap-2 rounded-2xl bg-destructive-soft p-4 text-sm text-destructive">
                    <AlertTriangle className="size-5 shrink-0" /> Special waste (batteries, phones, bulbs) can't go in an ordinary collection. Remove it and store it safely.
                  </p>
                )}
                {mixed && !hasSpecial && (
                  <p className="mt-4 flex gap-2 rounded-2xl bg-warning-soft p-4 text-sm text-warning-foreground">
                    <Split className="size-5 shrink-0" /> We found {recyclableTypes.length} different materials. You'll need to separate them first.
                  </p>
                )}
                {onlyGeneral && (
                  <p className="mt-4 rounded-2xl bg-muted p-4 text-sm">
                    This looks like general waste.{" "}
                    <Link to="/general" onClick={() => actions.startDraft("general")} className="font-semibold text-primary">
                      Book general collection
                    </Link>
                  </p>
                )}
              </>
            )}
          </ScreenBody>
          {items.length > 0 && (
            <ScreenFooter>
              <Button
                size="lg"
                disabled={hasSpecial || recyclableTypes.length === 0}
                onClick={() => {
                  if (mixed) {
                    setSeparated(false);
                    setFirst(null);
                    setStep("separate");
                  } else goBook(recyclableTypes[0]!, items, true);
                }}
              >
                {mixed ? "Next: separate materials" : "Hand over the trash"}
              </Button>
            </ScreenFooter>
          )}
        </>
      )}

      {step === "separate" && (
        <>
          <ScreenBody>
            <h2 className="mt-2 font-display text-2xl font-bold">Put each material in its own bag</h2>
            <p className="mt-1 text-[15px] text-muted-foreground">
              Mixed recyclables can't be recycled. Separate them so collectors can accept them.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {recyclableTypes.map((m, i) => {
                const Icon = MATERIAL_ICON[m];
                return (
                  <div key={m} className="overflow-hidden rounded-3xl bg-card shadow-card">
                    <img src={MATERIAL_IMAGE[m]} alt={MATERIALS[m].name} className="h-24 w-full object-cover" />
                    <div className="p-3">
                      <p className="flex items-center gap-1.5 font-semibold"><Icon className="size-4 text-primary" /> Bag {i + 1}</p>
                      <p className="text-sm text-muted-foreground">{MATERIALS[m].name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {items.filter((x) => x.material === m).map((x) => `${x.count} ${x.label.toLowerCase()}`).join(", ")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl bg-card p-4 shadow-card">
              <input type="checkbox" checked={separated} onChange={(e) => setSeparated(e.target.checked)} className="mt-0.5 size-5 accent-primary" />
              <span className="text-[15px]">I have put each material in a different bag.</span>
            </label>
            <p className="mb-2 mt-6 text-sm font-medium">Which bag do you want to book first?</p>
            <div className="flex flex-wrap gap-2">
              {recyclableTypes.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setFirst(m)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-semibold",
                    first === m ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card",
                  )}
                >
                  {MATERIALS[m].name}
                </button>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">You can book the other bags after this one.</p>
          </ScreenBody>
          <ScreenFooter>
            {!separated && <p className="text-center text-xs text-muted-foreground">Tick the box once your waste is separated.</p>}
            <Button size="lg" disabled={!separated || !first} onClick={() => first && goBook(first, items, true)}>
              Continue with {first ? MATERIALS[first].name : "one material"}
            </Button>
          </ScreenFooter>
        </>
      )}
    </Screen>
  );
}

function ItemRow({ item, onChange, onRemove }: { item: DetectedItem; onChange: (i: DetectedItem) => void; onRemove: () => void }) {
  const [open, setOpen] = useState(false);
  const Icon = MATERIAL_ICON[item.material];
  return (
    <div className="rounded-2xl bg-card p-3 shadow-card">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => setOpen((o) => !o)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary-deep"><Icon className="size-5" /></span>
          <span className="min-w-0">
            <span className="block truncate font-medium">{item.label}</span>
            <span className="block text-xs text-primary">{MATERIALS[item.material].name} · change</span>
          </span>
        </button>
        <button type="button" aria-label="Fewer" onClick={() => onChange({ ...item, count: Math.max(1, item.count - 1) })} className="grid size-8 place-items-center rounded-full bg-muted"><Minus className="size-4" /></button>
        <span className="w-6 text-center font-semibold tabular-nums">{item.count}</span>
        <button type="button" aria-label="More" onClick={() => onChange({ ...item, count: item.count + 1 })} className="grid size-8 place-items-center rounded-full bg-muted"><Plus className="size-4" /></button>
        <button type="button" aria-label="Remove" onClick={onRemove} className="grid size-8 place-items-center rounded-full text-destructive"><Trash2 className="size-4" /></button>
      </div>
      {open && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {EDITABLE.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                onChange({ ...item, material: m });
                setOpen(false);
              }}
              className={cn("rounded-full px-3 py-1.5 text-xs font-semibold", m === item.material ? "bg-primary text-primary-foreground" : "bg-muted")}
            >
              {MATERIALS[m].short}
            </button>
          ))}
          <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="ml-auto"><X className="size-4" /></button>
        </div>
      )}
    </div>
  );
}
