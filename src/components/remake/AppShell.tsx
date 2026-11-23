import { Link, useLocation, type LinkProps } from "@tanstack/react-router";
import { FlaskConical, Recycle, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Logo } from "./Logo";

export type ShellItem = {
  to: NonNullable<LinkProps["to"]>;
  label: string;
  icon: LucideIcon;
  /** Other paths that belong to this section (e.g. booking steps under "Request collection"). */
  match?: string[];
  badge?: number;
};

function isOn(pathname: string, path: string) {
  return pathname === path || pathname.startsWith(`${path}/`);
}

/**
 * Signed-in layout. Wider screens get the left sidebar and a compact top header;
 * phones show only the screen, which carries its own header and bottom navigation.
 */
export function AppShell({
  items,
  sectionLabel,
  homeTo,
  headerLeft,
  headerRight,
  sidebarFooter,
  children,
}: {
  items: ShellItem[];
  sectionLabel: string;
  homeTo: NonNullable<LinkProps["to"]>;
  headerLeft?: ReactNode;
  headerRight?: ReactNode;
  sidebarFooter?: ReactNode;
  children: ReactNode;
}) {
  const { pathname } = useLocation();
  return (
    <div className="flex h-dvh w-full bg-background">
      <aside className="hidden h-full w-[76px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex lg:w-[256px]">
        <div className="flex h-16 shrink-0 items-center justify-center border-b border-sidebar-border lg:justify-start lg:px-6">
          <Link to={homeTo} aria-label="Remake home" className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-primary font-display text-base font-bold text-primary-foreground shadow-float">
              <Recycle className="size-5" strokeWidth={2.4} />
            </span>
            <Logo className="hidden text-xl lg:inline" />
          </Link>
        </div>
        <nav aria-label="Sidebar" className="no-scrollbar flex-1 overflow-y-auto px-3 py-5">
          <p className="mb-2 hidden px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground lg:block">
            {sectionLabel}
          </p>
          <ul className="space-y-1">
            {items.map((item) => {
              const paths = [String(item.to), ...(item.match ?? [])];
              const active = paths.some((p) => isOn(pathname, p));
              const Icon = item.icon;
              return (
                <li key={String(item.to)}>
                  <Link
                    to={item.to}
                    title={item.label}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative flex items-center justify-center gap-3 rounded-xl px-0 py-2.5 text-sm font-medium transition-colors lg:justify-start lg:px-3",
                      active
                        ? "bg-primary text-primary-foreground shadow-float"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    )}
                  >
                    <Icon className="size-[18px] shrink-0" />
                    <span className="hidden flex-1 truncate lg:inline">{item.label}</span>
                    {!!item.badge && (
                      <span
                        className={cn(
                          "absolute right-1 top-1 grid min-w-5 place-items-center rounded-full px-1 text-[10px] font-bold lg:static",
                          active ? "bg-card text-primary-deep" : "bg-destructive text-destructive-foreground",
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="shrink-0 space-y-2 border-t border-sidebar-border p-3">
          {sidebarFooter}
          <div className="hidden rounded-xl bg-primary-soft p-3 text-xs text-primary-deep lg:block">
            <p className="flex items-center gap-1.5 font-semibold">
              <FlaskConical className="size-3.5" /> Demo mode
            </p>
            <p className="mt-1 opacity-80">All data is sample data, saved only in this browser.</p>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="hidden h-16 shrink-0 items-center gap-3 border-b border-border bg-card px-8 md:flex">
          <div className="min-w-0 flex-1">{headerLeft}</div>
          <div className="flex shrink-0 items-center gap-2.5">{headerRight}</div>
        </header>
        <div className="relative flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}

/** Round header icon button with an optional unread count. */
export function HeaderIconLink({
  to,
  label,
  icon: Icon,
  count = 0,
}: {
  to: NonNullable<LinkProps["to"]>;
  label: string;
  icon: LucideIcon;
  count?: number;
}) {
  return (
    <Link
      to={to}
      aria-label={count ? `${label}, ${count} unread` : label}
      className="relative grid size-10 place-items-center rounded-full border border-border bg-card transition-colors hover:bg-muted"
    >
      <Icon className="size-[18px]" />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
          {count}
        </span>
      )}
    </Link>
  );
}
