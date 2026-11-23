import { useCanGoBack, useNavigate, useRouter } from "@tanstack/react-router";
import { ChevronLeft, WifiOff } from "lucide-react";
import type { ReactNode } from "react";

import { useApp } from "@/lib/remake/store";
import { cn } from "@/lib/utils";

/** Full-height app screen: fixed header, scrolling body, optional sticky footer / tab bar. */
export function Screen({
  children,
  className,
  animate = true,
}: {
  children: ReactNode;
  className?: string;
  animate?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col bg-background",
        animate && "animate-screen-in",
        className,
      )}
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
      className={cn("relative z-10 flex shrink-0 items-center gap-3 px-5 pb-3 pt-safe", className)}
    >
      <div className="flex min-h-11 w-11 items-center">
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
      <div className="min-w-0 flex-1 text-center">
        {title && <h1 className="truncate text-[17px] font-semibold">{title}</h1>}
        {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex min-h-11 w-11 items-center justify-end">{right}</div>
    </header>
  );
}

export function ScreenBody({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <main className={cn("no-scrollbar min-h-0 flex-1 overflow-y-auto px-5 pb-6", className)}>
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
        "shrink-0 space-y-3 border-t border-border/60 bg-background/95 px-5 pb-safe pt-3 backdrop-blur",
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
    <div className="flex gap-1.5 px-5 pb-2" aria-label={`Step ${value} of ${total}`}>
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
