import { createFileRoute } from "@tanstack/react-router";
import {
  FileText,
  Mail,
  MessageCircle,
  MessageCircleQuestion,
  Phone,
  ShieldCheck,
  Truck,
} from "lucide-react";

import { MenuGroup, MenuRow } from "@/components/remake/bits";
import { Screen, ScreenBody, ScreenHeader } from "@/components/remake/Screen";
import { pageHead } from "@/lib/remake/head";

export const Route = createFileRoute("/_main/profile/help")({
  head: () => pageHead("Help & support", "Get help with pickups, coins and your account."),
  component: Help,
});

function Help() {
  return (
    <Screen>
      <ScreenHeader title="Help & support" fallback="/profile" />
      <ScreenBody>
        <div className="rounded-[2rem] bg-primary-soft p-5">
          <h2 className="font-display text-xl font-bold text-primary-deep">How can we help?</h2>
          <p className="mt-1 text-[15px] text-primary-deep/80">
            Our team answers Monday to Saturday, 8am – 6pm.
          </p>
        </div>
        <MenuGroup title="Contact us">
          <a
            href="tel:+2207010000"
            className="flex w-full items-center gap-3 px-4 py-3 active:bg-muted"
          >
            <span className="grid size-11 place-items-center rounded-2xl bg-primary-soft text-primary-deep">
              <Phone className="size-5" />
            </span>
            <span className="flex-1">
              <span className="block text-[15px] font-medium">Call support</span>
              <span className="block text-xs text-muted-foreground">
                +220 701 0000 (sample number)
              </span>
            </span>
          </a>
          <a
            href="sms:+2207010000"
            className="flex w-full items-center gap-3 px-4 py-3 active:bg-muted"
          >
            <span className="grid size-11 place-items-center rounded-2xl bg-primary-soft text-primary-deep">
              <MessageCircle className="size-5" />
            </span>
            <span className="flex-1">
              <span className="block text-[15px] font-medium">Send a text message</span>
              <span className="block text-xs text-muted-foreground">
                We reply within a few hours
              </span>
            </span>
          </a>
          <a
            href="mailto:help@remake.example"
            className="flex w-full items-center gap-3 px-4 py-3 active:bg-muted"
          >
            <span className="grid size-11 place-items-center rounded-2xl bg-primary-soft text-primary-deep">
              <Mail className="size-5" />
            </span>
            <span className="flex-1">
              <span className="block text-[15px] font-medium">Email</span>
              <span className="block text-xs text-muted-foreground">
                help@remake.example (sample)
              </span>
            </span>
          </a>
        </MenuGroup>
        <MenuGroup title="Self help">
          <MenuRow
            icon={Truck}
            label="Problem with a pickup"
            hint="Open the pickup to cancel or change collector"
            to="/pickups"
          />
          <MenuRow icon={MessageCircleQuestion} label="FAQs" to="/profile/faq" />
          <MenuRow icon={ShieldCheck} label="Privacy" to="/profile/privacy" />
          <MenuRow icon={FileText} label="Terms & conditions" to="/profile/terms" />
        </MenuGroup>
      </ScreenBody>
    </Screen>
  );
}
