import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  BookOpenCheck,
  FileText,
  FlaskConical,
  Gift,
  Globe,
  HelpCircle,
  History,
  LogOut,
  MapPin,
  MessageCircleQuestion,
  Receipt,
  RotateCcw,
  ScanLine,
  ShieldCheck,
  Truck,
  UserPen,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { BottomNav } from "@/components/remake/BottomNav";
import { CoinIcon } from "@/components/remake/CoinIcon";
import { MenuGroup, MenuRow, ToggleRow } from "@/components/remake/bits";
import { Screen, ScreenBody, ScreenHeader } from "@/components/remake/Screen";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LANGUAGES } from "@/lib/remake/data";
import { coins, initials, phoneDisplay } from "@/lib/remake/format";
import { pageHead } from "@/lib/remake/head";
import { isCompleted, residentPickups, walletSummary } from "@/lib/remake/logic";
import { actions, useApp } from "@/lib/remake/store";

export const Route = createFileRoute("/_main/profile/")({
  head: () => pageHead("Profile", "Your details, addresses, settings and support."),
  component: Profile,
});

function Profile() {
  const navigate = useNavigate();
  const user = useApp((s) => s.user);
  const tx = useApp((s) => s.transactions);
  const pickups = useApp((s) => residentPickups(s.pickups));
  const addresses = useApp((s) => s.addresses.length);
  const unread = useApp((s) => s.notifications.filter((n) => !n.read).length);
  const language = useApp((s) => s.language);
  const demo = useApp((s) => s.demo);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const w = walletSummary(tx);
  const done = pickups.filter(isCompleted).length;

  return (
    <Screen animate={false}>
      <ScreenHeader title="Profile" back={false} />
      <ScreenBody>
        <div className="flex items-center gap-4 rounded-[2rem] bg-primary p-5 text-primary-foreground">
          <span className="grid size-16 shrink-0 place-items-center rounded-full bg-card font-display text-xl font-bold text-primary-deep">
            {initials(user.name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-xl font-semibold">{user.name}</p>
            <p className="text-sm opacity-90">{phoneDisplay(user.phone)}</p>
            <p className="flex items-center gap-1 text-sm opacity-90">
              <MapPin className="size-3.5" /> {user.area}
            </p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-3xl bg-card p-4 shadow-card">
            <p className="flex items-center gap-1.5 font-display text-2xl font-bold tabular-nums">
              {coins(w.available)} <CoinIcon className="size-4 text-[8px]" />
            </p>
            <p className="text-xs text-muted-foreground">Green Coins</p>
          </div>
          <div className="rounded-3xl bg-card p-4 shadow-card">
            <p className="font-display text-2xl font-bold tabular-nums">{done}</p>
            <p className="text-xs text-muted-foreground">Pickups completed</p>
          </div>
        </div>

        <MenuGroup title="Account">
          <MenuRow
            icon={UserPen}
            label="Edit personal details"
            hint={user.email}
            to="/profile/edit"
          />
          <MenuRow
            icon={MapPin}
            label="Saved addresses"
            hint={`${addresses} saved`}
            to="/profile/addresses"
          />
        </MenuGroup>

        <MenuGroup title="Coins & activity">
          <MenuRow icon={Wallet} label="Green Coins wallet" to="/wallet" />
          <MenuRow icon={Gift} label="Rewards" to="/rewards" />
          <MenuRow icon={Receipt} label="My redemptions" to="/redemptions" />
          <MenuRow icon={History} label="Collection history" to="/pickups/history" />
          <MenuRow
            icon={Bell}
            label="Notifications"
            hint={unread ? `${unread} unread` : "All read"}
            to="/notifications"
          />
        </MenuGroup>

        <MenuGroup title="Settings">
          <MenuRow
            icon={Globe}
            label="Language"
            hint={LANGUAGES.find((l) => l.id === language)?.name ?? "English"}
            to="/profile/language"
          />
          <MenuRow icon={Bell} label="Notification settings" to="/profile/notifications" />
        </MenuGroup>

        <MenuGroup title="Support">
          <MenuRow icon={HelpCircle} label="Help & support" to="/profile/help" />
          <MenuRow icon={MessageCircleQuestion} label="FAQs" to="/profile/faq" />
          <MenuRow icon={ShieldCheck} label="Privacy" to="/profile/privacy" />
          <MenuRow icon={FileText} label="Terms & conditions" to="/profile/terms" />
          <MenuRow icon={BookOpenCheck} label="Recycling guide" to="/guide" />
        </MenuGroup>

        <MenuGroup title="Demo settings">
          <MenuRow
            icon={ScanLine}
            label="Collector scanner"
            hint="Scan a booking QR"
            to="/collector-demo"
          />
          <MenuRow
            icon={Truck}
            label="Open the collector app"
            hint="Recycling, private and independent collectors"
            to="/collector"
          />
          {(
            [
              ["offline", "Show offline banner"],
              ["scanUnavailable", "Scanning unavailable"],
              ["noCollectors", "No collectors available"],
            ] as const
          ).map(([key, label]) => (
            <ToggleRow
              key={key}
              icon={FlaskConical}
              label={label}
              checked={demo[key]}
              onChange={(v) => actions.setDemo(key, v)}
            />
          ))}
          <MenuRow
            icon={RotateCcw}
            label="Reset demo data"
            onClick={() => {
              actions.resetDemo();
              toast.success("Demo data reset");
            }}
          />
        </MenuGroup>

        <MenuGroup>
          <MenuRow
            icon={LogOut}
            label="Sign out"
            danger
            onClick={() => setSignOutOpen(true)}
            right={<span />}
          />
        </MenuGroup>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Remake demo · All data stays on this phone
        </p>
      </ScreenBody>
      <BottomNav />

      <AlertDialog open={signOutOpen} onOpenChange={setSignOutOpen}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out of Remake?</AlertDialogTitle>
            <AlertDialogDescription>
              Your pickups and coins stay saved on this phone. Sign in again any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Stay signed in</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive"
              onClick={() => {
                actions.signOut();
                void navigate({ to: "/login", replace: true });
              }}
            >
              Sign out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Screen>
  );
}
