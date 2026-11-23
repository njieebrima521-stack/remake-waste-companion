import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ScanLine, Trash2 } from "lucide-react";

import { ChoiceCard } from "@/components/remake/flow";
import { Screen, ScreenBody, ScreenHeader } from "@/components/remake/Screen";
import { pageHead } from "@/lib/remake/head";
import { actions } from "@/lib/remake/store";

export const Route = createFileRoute("/_main/collect/unsure")({
  head: () => pageHead("Not sure?", "Get help identifying your waste or book general collection."),
  component: Unsure,
});

function Unsure() {
  const navigate = useNavigate();
  return (
    <Screen>
      <ScreenHeader title="I'm not sure" fallback="/collect" />
      <ScreenBody>
        <h2 className="mt-2 font-display text-2xl font-bold">That's okay!</h2>
        <p className="mt-1 text-[15px] text-muted-foreground">How would you like to continue?</p>
        <div className="mt-6 space-y-3">
          <ChoiceCard
            icon={<ScanLine />}
            title="Help me identify my waste"
            body="Take a photo and we'll show what we see."
            onClick={() => {
              actions.startDraft("recyclable");
              navigate({ to: "/scan" });
            }}
          />
          <ChoiceCard
            tone="ink"
            icon={<Trash2 />}
            title="I want general waste collection"
            body="Book a collector for mixed rubbish."
            onClick={() => {
              actions.startDraft("general");
              navigate({ to: "/general" });
            }}
          />
        </div>
      </ScreenBody>
    </Screen>
  );
}
