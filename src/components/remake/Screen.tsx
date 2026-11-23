import { useCanGoBack, useNavigate, useRouter } from "@tanstack/react-router";
import { ChevronLeft, WifiOff } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

import { useApp } from "@/lib/remake/store";
import { cn } from "@/lib/utils";

/**
 * Full-height app screen: fixed header, scrolling body, optional sticky footer / tab bar.
 * On wider screens the content centres in a readable column; `wide` gives dashboards more room.
 */
export function Screen({
  children,
  className,
  animate = true,
  wide = false,
}: {
  children: ReactNode;
  className?: string;
  animate?: boolean;
  wide?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col bg-background",
        animate && "animate-screen-in",
        className,
      )}
      style={{ "--screen-max": wide ? "76rem" : "48rem" } as CSSProperties}
    >
      <OfflineBanner />
      {children}
    </div>
  );
}

export function OfflineBanner() {
  const offline = useApp((s) => s.demo.offline);
  if (!offline) return null;
  return (
    <div className="flex items-center justify-center gap-2 bg-ink px-4 pb-2 pt-safe text-xs font-medium text-ink-foreground">
      <WifiOff className="size-3.5" /> You're offline — showing saved information
    </div>
  );
}

export function BackButton({
  fallback = "/home",
  className,
}: {
  fallback?: string;
  className?: string;
}) {
  const router = useRouter();
  const canGoBack = useCanGoBack();
  const navigate = useNavigate();
  return (
    <button
      type="button"
      aria-label="Go back"
      onClick={() => (canGoBack ? router.history.back() : navigate({ to: fallback }))}
      className={cn(
        "grid size-11 shrink-0 place-items-center rounded-full border border-border bg-card text-foreground transition active:scale-95",
        className,
      )}
    >
      <ChevronLeft className="size-5" />
    </button>
  );
}

export function ScreenHeader({
  title,
  back = true,
  fallback,
  right,
  onBack,
  className,
  subtitle,
}: {
  title?: ReactNode;
  back?: boolean;
  fallback?: string;
  right?: ReactNode;
  onBack?: () => void;
  className?: string;
  subtitle?: ReactNode;
}) {
  return (
    <header
      className={cn(
        "relative z-10 flex shrink-0 items-center gap-3 px-screen pb-3 pt-safe md:pb-4 md:pt-7",
        className,
      )}
    >
      <div className={cn("flex min-h-11 w-11 items-center", !back && "md:hidden")}>
        {back &&
          (onBack ? (
            <button
              type="button"
              aria-label="Go back"
              onClick={onBack}
              className="grid size-11 place-items-center rounded-full border border-border bg-card active:scale-95"
            >
              <ChevronLeft className="size-5" />
            </button>
          ) : (
            <BackButton {...(fallback ? { fallback } : {})} />
          ))}
      </div>
      <div className="min-w-0 flex-1 text-center md:text-left">
        {title && (
          <h1 className="truncate text-[17px] font-semibold md:text-[26px] md:leading-tight">{title}</h1>
        )}
        {subtitle && (
          <p className="truncate text-xs text-muted-foreground md:mt-0.5 md:text-sm">{subtitle}</p>
        )}
      </div>
      <div className="flex min-h-11 w-11 items-center justify-end md:w-auto">{right}</div>
    </header>
  );
}

export function ScreenBody({
  children,
  className,
  flush = false,
}: {
  children: ReactNode;
  className?: string;
  /** Edge-to-edge on phones (e.g. a full-bleed photo); still centred on wider screens. */
  flush?: boolean;
}) {
  return (
    <main
      className={cn(
        "no-scrollbar min-h-0 flex-1 overflow-y-auto pb-6 md:pb-10",
        flush ? "px-screen-md" : "px-screen",
        className,
      )}
    >
      {children}
    </main>
  );
}

export function ScreenFooter({
  children,
  className,
}: {
  children: ReactNode;
  className?: string | undefined;
}) {
  return (
    <div
      className={cn(
        "shrink-0 space-y-3 border-t border-border bg-card/95 px-screen pb-safe pt-3 backdrop-blur md:pb-4 md:pt-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Thin step progress bar for multi-step flows. */
export function FlowProgress({ value, total }: { value: number; total: number }) {
  return (
    <div className="flex gap-1.5 px-screen pb-2" aria-label={`Step ${value} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 flex-1 rounded-full transition-colors",
            i < value ? "bg-primary" : "bg-border",
          )}
        />
      ))}
    </div>
  );
}
