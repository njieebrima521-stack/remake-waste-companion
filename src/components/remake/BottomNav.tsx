import { Link, useLocation } from "@tanstack/react-router";
import { BookOpen, Home, ScanLine, Truck, User } from "lucide-react";

import { cn } from "@/lib/utils";

const tabs = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/guide", label: "Guide", icon: BookOpen },
  { to: "/pickups", label: "Pickups", icon: Truck },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function BottomNav() {
  const { pathname } = useLocation();
  const item = (t: (typeof tabs)[number]) => {
    const active = pathname === t.to || pathname.startsWith(`${t.to}/`);
    const Icon = t.icon;
    return (
      <Link
        key={t.to}
        to={t.to}
        className={cn(
          "flex h-14 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
          active ? "text-primary" : "text-muted-foreground",
        )}
        aria-current={active ? "page" : undefined}
      >
        <Icon className={cn("size-6", active && "stroke-[2.4]")} />
        {t.label}
      </Link>
    );
  };
  return (
    <nav
      className="relative z-20 shrink-0 rounded-t-3xl bg-card px-2 pb-safe pt-1 shadow-nav"
      aria-label="Main"
    >
      <div className="flex items-end">
        {item(tabs[0])}
        {item(tabs[1])}
        <div className="flex flex-1 justify-center">
          <Link
            to="/scan"
            aria-label="Scan waste"
            className="-mt-9 grid size-[68px] place-items-center rounded-full bg-primary text-primary-foreground shadow-float ring-[6px] ring-background transition active:scale-95"
          >
            <ScanLine className="size-7" />
          </Link>
        </div>
        {item(tabs[2])}
        {item(tabs[3])}
      </div>
    </nav>
  );
}
