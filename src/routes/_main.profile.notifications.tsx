import { createFileRoute } from "@tanstack/react-router";
import { Coins, Gift, Lightbulb, MessageSquare, Truck } from "lucide-react";

import { MenuGroup, ToggleRow } from "@/components/remake/bits";
import { Screen, ScreenBody, ScreenHeader } from "@/components/remake/Screen";
import { pageHead } from "@/lib/remake/head";
import { actions, useApp } from "@/lib/remake/store";

export const Route = createFileRoute("/_main/profile/notifications")({
  head: () => pageHead("Notification settings", "Choose which updates you receive."),
  component: NotificationSettings,
});

const PREFS = [
  {
    key: "pickups",
    label: "Pickup updates",
    hint: "Collector assigned, on the way, collected",
    icon: Truck,
  },
  { key: "coins", label: "Green Coins", hint: "Pending and released coins", icon: Coins },
  { key: "rewards", label: "Rewards", hint: "Vouchers and new rewards", icon: Gift },
  { key: "tips", label: "Recycling tips", hint: "Short weekly tips", icon: Lightbulb },
] as const;

function NotificationSettings() {
  const prefs = useApp((s) => s.notificationPrefs);
  const row = (key: string, label: string, hint: string, icon: typeof Truck) => (
    <ToggleRow
      key={key}
      icon={icon}
      label={label}
      hint={hint}
      checked={!!prefs[key]}
      onChange={(v) => actions.setNotificationPref(key, v)}
    />
  );
  return (
    <Screen>
      <ScreenHeader title="Notification settings" fallback="/profile" />
      <ScreenBody>
        <MenuGroup title="In the app">
          {PREFS.map((p) => row(p.key, p.label, p.hint, p.icon))}
        </MenuGroup>
        <MenuGroup title="By SMS">
          {row("sms", "SMS for pickups", "Useful when you have no data", MessageSquare)}
        </MenuGroup>
        <p className="mt-4 px-1 text-xs text-muted-foreground">
          Important safety and account messages are always sent.
        </p>
      </ScreenBody>
    </Screen>
  );
}
