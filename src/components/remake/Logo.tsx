import { cn } from "@/lib/utils";

/** Remake wordmark: "Re" in ink, "make" in brand green (or white on green). */
export function Logo({
  className,
  onGreen = false,
  onInk = false,
  dot = false,
}: {
  className?: string;
  onGreen?: boolean;
  /** On the dark ink surface: "Re" in light ink text, "make" in brand green. */
  onInk?: boolean;
  dot?: boolean;
}) {
  return (
    <span className={cn("font-display font-bold tracking-tight", className)} aria-label="Remake">
      <span className={onGreen ? "text-ink" : onInk ? "text-ink-foreground" : "text-foreground"}>Re</span>
      <span className={onGreen ? "text-primary-foreground" : "text-primary"}>
        make{dot ? "." : ""}
      </span>
    </span>
  );
}
