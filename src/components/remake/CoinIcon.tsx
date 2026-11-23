import { cn } from "@/lib/utils";

export function CoinIcon({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-grid size-5 shrink-0 place-items-center rounded-full bg-coin text-[10px] font-black text-ink ring-2 ring-coin/30",
        className,
      )}
    >
      G
    </span>
  );
}
