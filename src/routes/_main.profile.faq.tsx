import { createFileRoute } from "@tanstack/react-router";

import { Screen, ScreenBody, ScreenHeader } from "@/components/remake/Screen";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FAQS } from "@/lib/remake/data";
import { pageHead } from "@/lib/remake/head";

export const Route = createFileRoute("/_main/profile/faq")({
  head: () => pageHead("FAQs", "Answers to common questions about pickups and Green Coins."),
  component: Faq,
});

function Faq() {
  return (
    <Screen>
      <ScreenHeader title="FAQs" fallback="/profile/help" />
      <ScreenBody>
        <Accordion type="single" collapsible className="space-y-3">
          {FAQS.map((f, i) => (
            <AccordionItem
              key={f.q}
              value={`q${i}`}
              className="rounded-3xl border-none bg-card px-4 shadow-card"
            >
              <AccordionTrigger className="py-4 text-left text-[15px] font-semibold hover:no-underline">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="pb-4 text-[15px] leading-relaxed text-muted-foreground">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </ScreenBody>
    </Screen>
  );
}
