import { createFileRoute } from "@tanstack/react-router";

import { DocPage } from "@/components/remake/DocPage";
import { pageHead } from "@/lib/remake/head";

export const Route = createFileRoute("/_main/profile/privacy")({
  head: () => pageHead("Privacy", "How Remake uses your information."),
  component: Privacy,
});

function Privacy() {
  return (
    <DocPage
      title="Privacy"
      intro="This demo keeps all information on your phone. Nothing is sent to a server."
      sections={[
        {
          h: "What we keep",
          p: "Your name, phone number, saved addresses, pickups, Green Coins and reward vouchers.",
        },
        {
          h: "Why we keep it",
          p: "So collectors can find your gate, so we can track your pickups and so your coins add up correctly.",
        },
        {
          h: "Photos",
          p: "Photos you take or upload are only used to help you sort and to show the collector what to expect.",
        },
        {
          h: "Location",
          p: "The map in this demo is illustrative. Remake does not read your GPS location.",
        },
        {
          h: "Who sees it",
          p: "In a live service, only the collector you choose would see your address and phone number for that pickup.",
        },
        {
          h: "Your choices",
          p: "You can edit your details, remove addresses or sign out at any time from your profile.",
        },
      ]}
    />
  );
}
