import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { HelpCircle, Recycle, Trash2 } from "lucide-react";

import { ChoiceCard } from "@/components/remake/flow";
import { Screen, ScreenBody, ScreenHeader } from "@/components/remake/Screen";
import { pageHead } from "@/lib/remake/head";
import { actions } from "@/lib/remake/store";

export const Route = createFileRoute("/_main/collect/")({
  head: () => pageHead("Request collection", "Choose the kind of waste you want collected."),
  component: Collect,
});

function Collect() {
  const navigate = useNavigate();
  return (
    <Screen>
      <ScreenHeader title="Request collection" />
      <ScreenBody>
        <h2 className="mt-2 font-display text-2xl font-bold">What do you want collected?</h2>
        <p className="mt-1 text-[15px] text-muted-foreground">Pick one. You can change it later.</p>
        <div className="mt-6 space-y-3">
          <ChoiceCard
            icon={<Recycle />}
            title="Recyclable waste"
            body="Plastic, paper, glass or cans. Earn Green Coins once verified."
            onClick={() => {
              actions.startDraft("recyclable");
              navigate({ to: "/scan" });
            }}
          />
          <ChoiceCard
            tone="ink"
            icon={<Trash2 />}
            title="General waste"
            body="Mixed household rubbish in bags. No scan needed."
            onClick={() => {
              actions.startDraft("general");
              navigate({ to: "/general" });
            }}
          />
          <ChoiceCard
            tone="plain"
            icon={<HelpCircle />}
            title="I'm not sure"
            body="We'll help you decide."
            onClick={() => navigate({ to: "/collect/unsure" })}
          />
        </div>
      </ScreenBody>
    </Screen>
  );
}
