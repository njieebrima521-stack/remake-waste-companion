import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { toast } from "sonner";

import { Screen, ScreenBody, ScreenHeader } from "@/components/remake/Screen";
import { LANGUAGES } from "@/lib/remake/data";
import { pageHead } from "@/lib/remake/head";
import { actions, useApp } from "@/lib/remake/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_main/profile/language")({
  head: () => pageHead("Language", "Choose your preferred language."),
  component: Language,
});

function Language() {
  const language = useApp((s) => s.language);
  return (
    <Screen>
      <ScreenHeader title="Language" fallback="/profile" />
      <ScreenBody>
        <p className="mt-1 text-[15px] text-muted-foreground">
          Choose the language you prefer for messages and support calls.
        </p>
        <div
          className="mt-5 divide-y divide-border overflow-hidden rounded-3xl bg-card shadow-card"
          role="radiogroup"
        >
          {LANGUAGES.map((l) => {
            const on = l.id === language;
            return (
              <button
                key={l.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => {
                  actions.setLanguage(l.id);
                  toast.success(`${l.name} saved as your preference`);
                }}
                className="flex w-full items-center gap-3 px-4 py-4 text-left active:bg-muted"
              >
                <span className="min-w-0 flex-1">
                  <span className={cn("block text-[15px]", on && "font-semibold")}>{l.name}</span>
                  {l.native !== l.name && (
                    <span className="block text-xs text-muted-foreground">{l.native}</span>
                  )}
                </span>
                <span
                  className={cn(
                    "grid size-7 place-items-center rounded-full border-2",
                    on ? "border-primary bg-primary text-primary-foreground" : "border-border",
                  )}
                >
                  {on && <Check className="size-4" />}
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-4 rounded-2xl bg-info-soft p-4 text-sm text-info">
          In this demo the app text stays in English. Your choice is saved for SMS messages and
          support calls.
        </p>
      </ScreenBody>
    </Screen>
  );
}
