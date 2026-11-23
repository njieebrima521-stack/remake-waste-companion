import { Link } from "@tanstack/react-router";
import { Bell, Lock } from "lucide-react";
import type { ReactNode } from "react";

import { AppShell, HeaderIconLink, type ShellItem } from "@/components/remake/AppShell";
import { CollectorAvatar } from "@/components/remake/CollectorAvatar";
import { COLLECTOR_CATEGORY_LABEL } from "@/lib/remake/data";
import { useApp } from "@/lib/remake/store";

import { SIDEBAR_NAV, useBoard, useMe } from "./ui";

/** Desktop frame for the approved collector area; the sidebar follows the collector type. */
export function CollectorShell({ children }: { children: ReactNode }) {
  const me = useMe();
  const board = useBoard(me);
  const unread = useApp((s) => s.workNotifications.filter((n) => n.collectorId === me.id && !n.read).length);
  const items: ShellItem[] = SIDEBAR_NAV[me.category].map((t) => ({
    ...t,
    ...(t.to === "/collector/requests" && board.incoming.length ? { badge: board.incoming.length } : {}),
  }));
  return (
    <AppShell
      items={items}
      sectionLabel={COLLECTOR_CATEGORY_LABEL[me.category]}
      homeTo="/collector/home"
      headerLeft={
        <div className="flex min-w-0 items-center gap-3">
          <p className="truncate text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Collector</span> · {COLLECTOR_CATEGORY_LABEL[me.category]}
          </p>
          <span className="hidden items-center gap-1 rounded-full bg-muted px-2.5 py-1 font-mono text-[11px] tracking-wider text-muted-foreground lg:inline-flex">
            <Lock className="size-3" /> {me.remakeId}
          </span>
        </div>
      }
      headerRight={
        <>
          <HeaderIconLink to="/collector/notifications" label="Notifications" icon={Bell} count={unread} />
          <Link to="/collector/profile" className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 hover:bg-muted">
            <CollectorAvatar collector={me} size="sm" className="size-9 rounded-full" />
            <span className="hidden max-w-44 truncate text-sm font-medium lg:inline">{me.name}</span>
          </Link>
        </>
      }
    >
      {children}
    </AppShell>
  );
}
