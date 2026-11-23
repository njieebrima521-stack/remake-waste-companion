import { Link } from "@tanstack/react-router";
import { Bell, Lock } from "lucide-react";
import type { ReactNode } from "react";

import { CollectorAvatar } from "@/components/remake/CollectorAvatar";
import { COLLECTOR_CATEGORY_LABEL } from "@/lib/remake/data";
import { useApp } from "@/lib/remake/store";
import type { Collector } from "@/lib/remake/types";

/** Dark identity card at the top of each collector dashboard. */
export function WorkHero({ me, children }: { me: Collector; children?: ReactNode }) {
  const unread = useApp((s) => s.workNotifications.filter((n) => n.collectorId === me.id && !n.read).length);
  return (
    <section className="rounded-[2rem] bg-gradient-ink p-5 text-ink-foreground">
      <div className="flex items-center gap-3">
        <CollectorAvatar collector={me} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-lg font-semibold">{me.name}</p>
          <p className="truncate text-xs text-ink-muted">{COLLECTOR_CATEGORY_LABEL[me.category]}</p>
          <p className="mt-0.5 flex items-center gap-1 font-mono text-[11px] tracking-wider text-ink-muted">
            <Lock className="size-3" /> {me.remakeId}
          </p>
        </div>
        <Link
          to="/collector/notifications"
          aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
          className="relative grid size-11 shrink-0 place-items-center rounded-full bg-ink-foreground/10"
        >
          <Bell className="size-5" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {unread}
            </span>
          )}
        </Link>
      </div>
      {children}
    </section>
  );
}

export function HeroStat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex-1 rounded-2xl bg-ink-foreground/10 px-3 py-2.5">
      <p className="font-display text-xl font-bold tabular-nums">{value}</p>
      <p className="text-[11px] text-ink-muted">{label}</p>
    </div>
  );
}
