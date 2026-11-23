import { addDays, format } from "date-fns";
import { Camera, Check, ImageUp, Star } from "lucide-react";
import { useRef, type ReactNode } from "react";

import { CollectorAvatar } from "@/components/remake/CollectorAvatar";
import { COLLECTOR_TYPE_LABEL } from "@/components/remake/icons";
import { MATERIALS, SCENES } from "@/lib/remake/data";
import { SCENE_IMAGE } from "@/lib/remake/media";
import type { Collector, MaterialId, SceneId } from "@/lib/remake/types";
import { cn } from "@/lib/utils";

/** Big tappable choice card used on entry screens. */
export function ChoiceCard({
  icon,
  title,
  body,
  onClick,
  tone = "soft",
}: {
  icon: ReactNode;
  title: string;
  body: string;
  onClick: () => void;
  tone?: "soft" | "ink" | "plain";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-4 rounded-3xl p-5 text-left shadow-card transition active:scale-[0.99]",
        tone === "soft" && "bg-primary-soft text-primary-deep",
        tone === "ink" && "bg-ink text-ink-foreground",
        tone === "plain" && "bg-card text-foreground",
      )}
    >
      <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-card text-primary-deep [&_svg]:size-7">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-lg font-semibold">{title}</span>
        <span className="mt-0.5 block text-sm opacity-80">{body}</span>
      </span>
    </button>
  );
}

/** Choose camera or upload a photo. Upload returns a local preview URL. */
export function PhotoSource({
  onCamera,
  onUpload,
}: {
  onCamera: () => void;
  onUpload: (url: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        onClick={onCamera}
        className="flex flex-col items-center gap-3 rounded-3xl bg-primary p-6 font-semibold text-primary-foreground shadow-float active:scale-[0.98]"
      >
        <Camera className="size-9" /> Open camera
      </button>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="flex flex-col items-center gap-3 rounded-3xl border border-border bg-card p-6 font-semibold active:scale-[0.98]"
      >
        <ImageUp className="size-9 text-primary" /> Upload photo
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onUpload(URL.createObjectURL(f));
          e.target.value = "";
        }}
      />
    </div>
  );
}

/** Simulated camera viewfinder. The resident picks a sample scene to "photograph". */
export function CameraView({
  scene,
  onScene,
  onShoot,
  onClose,
  scenes = ["mixed", "plastic", "cans", "blurry"],
}: {
  scene: Exclude<SceneId, "upload">;
  onScene: (s: Exclude<SceneId, "upload">) => void;
  onShoot: () => void;
  onClose: () => void;
  scenes?: Exclude<SceneId, "upload">[];
}) {
  return (
    <div className="relative flex h-full flex-col bg-camera text-camera-foreground md:mx-auto md:my-6 md:h-[calc(100%-3rem)] md:w-full md:max-w-xl md:overflow-hidden md:rounded-3xl">
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <img
          src={SCENE_IMAGE[scene]}
          alt="Camera view"
          className={cn("size-full object-cover", scene === "blurry" && "blur-md")}
        />
        <div className="pointer-events-none absolute inset-10 rounded-3xl border-2 border-camera-foreground/70" />
        <p className="absolute inset-x-0 top-0 bg-photo-fade px-5 pb-6 pt-safe text-center text-sm font-medium">
          Fit all your waste inside the frame
        </p>
        <button
          type="button"
          onClick={onClose}
          className="absolute left-4 top-4 mt-safe rounded-full bg-camera-foreground/15 px-4 py-2 text-sm font-semibold backdrop-blur"
        >
          Close
        </button>
      </div>
      <div className="shrink-0 px-5 pb-safe pt-4">
        <p className="mb-2 text-center text-xs opacity-70">Demo: choose a sample scene</p>
        <div className="no-scrollbar flex justify-center gap-2 overflow-x-auto">
          {scenes.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onScene(s)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold",
                s === scene ? "bg-camera-foreground text-camera" : "bg-camera-foreground/15",
              )}
            >
              {SCENES[s].label}
            </button>
          ))}
        </div>
        <div className="flex justify-center py-5">
          <button
            type="button"
            aria-label="Take photo"
            onClick={onShoot}
            className="size-20 rounded-full border-4 border-camera-foreground bg-camera-foreground/30 active:scale-95"
          />
        </div>
      </div>
    </div>
  );
}

export function nextDays(n = 7) {
  const today = new Date();
  return Array.from({ length: n }, (_, i) => addDays(today, i));
}

export function DateChips({
  value,
  onChange,
}: {
  value?: string | undefined;
  onChange: (iso: string) => void;
}) {
  return (
    <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
      {nextDays(10).map((d) => {
        const iso = format(d, "yyyy-MM-dd");
        const on = iso === value;
        return (
          <button
            key={iso}
            type="button"
            onClick={() => onChange(iso)}
            className={cn(
              "flex w-16 shrink-0 flex-col items-center rounded-2xl border py-3 transition",
              on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card",
            )}
          >
            <span className="text-xs font-medium uppercase opacity-80">{format(d, "EEE")}</span>
            <span className="font-display text-xl font-bold">{format(d, "d")}</span>
            <span className="text-[11px] opacity-80">{format(d, "MMM")}</span>
          </button>
        );
      })}
    </div>
  );
}

export function CollectorCard({
  c,
  selected,
  recommended,
  material,
  onSelect,
}: {
  c: Collector;
  selected: boolean;
  recommended?: boolean;
  /** The resident's selected waste category, highlighted among what this collector accepts. */
  material?: MaterialId | undefined;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "w-full rounded-3xl border-2 bg-card p-4 text-left shadow-card transition active:scale-[0.99]",
        selected ? "border-primary" : "border-transparent",
      )}
    >
      {recommended && (
        <span className="mb-3 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground">
          <Star className="size-3" /> Recommended by Remake
        </span>
      )}
      <div className="flex items-start gap-3">
        <CollectorAvatar collector={c} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{c.name}</p>
          <p className="text-xs text-muted-foreground">
            {COLLECTOR_TYPE_LABEL[c.type]} · ★ {c.rating} · {c.trips} trips
          </p>
          <p className="mt-1 line-clamp-2 text-xs">{c.description}</p>
        </div>
        <span
          className={cn(
            "grid size-7 shrink-0 place-items-center rounded-full border-2",
            selected ? "border-primary bg-primary text-primary-foreground" : "border-border",
          )}
        >
          {selected && <Check className="size-4" />}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Accepts">
        {c.accepts.map((m) => (
          <span
            key={m}
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-semibold",
              m === material
                ? "bg-primary-soft text-primary-deep"
                : "bg-muted text-muted-foreground",
            )}
          >
            {m === material && <Check className="-mt-0.5 mr-0.5 inline size-3" />}
            {MATERIALS[m].short}
          </span>
        ))}
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-2xl bg-muted p-2.5">
          <dt className="text-muted-foreground">Service area</dt>
          <dd className="font-medium">{c.areas.slice(0, 3).join(", ")}</dd>
        </div>
        <div className="rounded-2xl bg-muted p-2.5">
          <dt className="text-muted-foreground">Available</dt>
          <dd className="font-medium">{c.availability}</dd>
        </div>
        <div className="col-span-2 rounded-2xl bg-muted p-2.5">
          <dt className="text-muted-foreground">Estimated collection window</dt>
          <dd className="font-medium">
            {c.eta} · {c.sampleRate}
          </dd>
        </div>
      </dl>
    </button>
  );
}

export function SummaryRow({
  label,
  value,
  onEdit,
}: {
  label: string;
  value: ReactNode;
  onEdit?: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="flex items-start gap-2 text-right text-[15px] font-medium">
        <span>{value}</span>
        {onEdit && (
          <button type="button" onClick={onEdit} className="text-sm font-semibold text-primary">
            Edit
          </button>
        )}
      </span>
    </div>
  );
}
