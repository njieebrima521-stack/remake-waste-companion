import { createFileRoute } from "@tanstack/react-router";

import { DocPage } from "@/components/remake/DocPage";
import { pageHead } from "@/lib/remake/head";

export const Route = createFileRoute("/_main/profile/terms")({
  head: () => pageHead("Terms & conditions", "The rules for using Remake."),
  component: Terms,
});

function Terms() {
  return (
    <DocPage
      title="Terms & conditions"
      intro="Simple rules for using Remake. This is a demonstration app."
      sections={[
        {
          h: "Booking a pickup",
          p: "Have your bags ready at the address and time you choose. You can cancel any time before collection.",
        },
        {
          h: "Sorting",
          p: "Put each recyclable material in its own bag. Mixed or dirty recyclables may be refused by the collector.",
        },
        {
          h: "Waste scan",
          p: "The scan is a guide only. It does not promise that a collector or recycling partner will accept your waste.",
        },
        {
          h: "Green Coins",
          p: "Coins are added only after your recyclables are collected and verified. A booking or a photo alone does not earn coins.",
        },
        {
          h: "Rewards",
          p: "Rewards shown are examples. They do not represent confirmed partnerships. Vouchers cannot be exchanged for cash.",
        },
        {
          h: "Fees",
          p: "Collectors set their own fees for general waste. You pay them directly. Prices shown are samples.",
        },
        {
          h: "Special waste",
          p: "Batteries, electronics, chemicals and medical waste must not be put in ordinary bags.",
        },
      ]}
    />
  );
}
