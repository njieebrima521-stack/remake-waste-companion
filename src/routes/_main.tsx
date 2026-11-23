import { createFileRoute, Link, Navigate, Outlet } from "@tanstack/react-router";
import { Bell, BookOpen, Gift, Home, ScanLine, Truck, User, Wallet, ClipboardList } from "lucide-react";

import { AppShell, HeaderIconLink, type ShellItem } from "@/components/remake/AppShell";
import { CoinIcon } from "@/components/remake/CoinIcon";
import { coins, initials } from "@/lib/remake/format";
import { walletSummary } from "@/lib/remake/logic";
import { useApp } from "@/lib/remake/store";

/** Signed-in area of the app. Sends signed-out visitors to sign in. */
export const Route = createFileRoute("/_main")({
  component: MainLayout,
});

const NAV: ShellItem[] = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/collect", label: "Request collection", icon: Truck, match: ["/book", "/general", "/booked"] },
  { to: "/scan", label: "Scan waste", icon: ScanLine },
  { to: "/pickups", label: "My pickups", icon: ClipboardList },
  { to: "/guide", label: "Recycling guide", icon: BookOpen },
  { to: "/rewards", label: "Rewards", icon: Gift, match: ["/redemptions"] },
  { to: "/wallet", label: "Green Coins", icon: Wallet },
  { to: "/profile", label: "Profile", icon: User },
];

function MainLayout() {
  const signedIn = useApp((s) => s.signedIn);
  const user = useApp((s) => s.user);
  const tx = useApp((s) => s.transactions);
  const unread = useApp((s) => s.notifications.filter((n) => !n.read).length);
  if (!signedIn) return <Navigate to="/login" replace />;
  const w = walletSummary(tx);
  return (
    <AppShell
      items={NAV}
      sectionLabel="Resident"
      homeTo="/home"
      headerLeft={
        <p className="truncate text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Resident</span> · {user.area}
        </p>
      }
      headerRight={
        <>
          <Link
            to="/wallet"
            className="flex items-center gap-2 rounded-full bg-ink px-3 py-1.5 text-sm font-semibold text-ink-foreground"
            aria-label={`${coins(w.available)} Green Coins`}
          >
            <CoinIcon className="size-4 text-[8px]" />
            <span className="tabular-nums">{coins(w.available)}</span>
          </Link>
          <HeaderIconLink to="/notifications" label="Notifications" icon={Bell} count={unread} />
          <Link to="/profile" className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 hover:bg-muted">
            <span className="grid size-9 place-items-center rounded-full bg-gradient-brand font-display text-sm font-bold text-primary-foreground">
              {initials(user.name)}
            </span>
            <span className="hidden max-w-36 truncate text-sm font-medium lg:inline">{user.name}</span>
          </Link>
        </>
      }
    >
      <Outlet />
    </AppShell>
  );
}
