import { Camera, ImagePlus } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

/** Reads a picked image and shrinks it to a small square, kept on this device only. */
function shrink(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read failed"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("decode failed"));
      img.onload = () => {
        const size = 192;
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no canvas"));
        const s = Math.min(img.width, img.height);
        ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function PhotoPicker({
  value,
  onChange,
  label,
  className,
}: {
  value?: string | undefined;
  onChange: (dataUrl: string) => void;
  label: string;
  className?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className={cn("flex items-center gap-4", className)}>
      <button
        type="button"
        onClick={() => input.current?.click()}
        className="relative grid size-24 shrink-0 place-items-center overflow-hidden rounded-3xl border-2 border-dashed border-border bg-card text-muted-foreground active:scale-95"
        aria-label={label}
      >
        {value ? <img src={value} alt="" className="size-full object-cover" /> : <ImagePlus className="size-8" />}
        {value && (
          <span className="absolute bottom-1.5 right-1.5 grid size-7 place-items-center rounded-full bg-ink text-ink-foreground">
            <Camera className="size-3.5" />
          </span>
        )}
      </button>
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">JPG or PNG. Stays on this phone in the demo.</p>
        <button type="button" onClick={() => input.current?.click()} className="mt-2 text-sm font-semibold text-primary">
          {value ? "Change photo" : "Choose photo"}
        </button>
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          try {
            onChange(await shrink(f));
          } catch {
            toast.error("That image couldn't be read. Try another photo.");
          }
        }}
      />
    </div>
  );
}

/** Tappable chip used for multi-select lists (areas, waste categories, vehicles). */
export function Chip({
  selected,
  onClick,
  children,
  disabled,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition active:scale-95 disabled:opacity-40",
        selected ? "border-primary bg-primary-soft text-primary-deep" : "border-input bg-card",
      )}
    >
      {children}
    </button>
  );
}
