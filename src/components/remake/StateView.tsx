import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type Tone = "primary" | "warning" | "destructive" | "info" | "muted";

const toneCls: Record<Tone, string> = {
  primary: "bg-primary-soft text-primary-deep",
  warning: "bg-warning-soft text-warning-foreground",
  destructive: "bg-destructive-soft text-destructive",
  info: "bg-info-soft text-info",
  muted: "bg-muted text-muted-foreground",
};

/** Illustrated empty / error / waiting state. */
export function StateView({
  icon: Icon,
  title,
  body,
  tone = "primary",
  children,
  className,
  spinning,
}: {
  icon: LucideIcon;
  title: ReactNode;
  body?: ReactNode;
  tone?: Tone;
  children?: ReactNode;
  className?: string;
  spinning?: boolean;
}) {
  return (
    <div
      className={cn("flex flex-col items-center px-4 py-10 text-center animate-fade-up", className)}
    >
      <div className="relative">
        <span
          className={cn(
            "absolute inset-0 rounded-full opacity-40",
            toneCls[tone],
            spinning && "animate-pulse-ring",
          )}
        />
        <span
          className={cn("relative grid size-24 place-items-center rounded-full", toneCls[tone])}
        >
          <Icon className={cn("size-10", spinning && "animate-spin")} strokeWidth={1.8} />
        </span>
      </div>
      <h2 className="mt-6 text-xl font-semibold">{title}</h2>
      {body && (
        <p className="mt-2 max-w-xs text-[15px] leading-relaxed text-muted-foreground">{body}</p>
      )}
      {children && <div className="mt-6 flex w-full flex-col gap-3">{children}</div>}
    </div>
  );
}
