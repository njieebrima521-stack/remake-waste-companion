import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

import { BottomNav } from "@/components/remake/BottomNav";
import { CoinIcon } from "@/components/remake/CoinIcon";
import { MATERIAL_ICON } from "@/components/remake/icons";
import { Screen, ScreenBody, ScreenHeader } from "@/components/remake/Screen";
import { COIN_RATES, GUIDE_ORDER, MATERIALS } from "@/lib/remake/data";
import { pageHead } from "@/lib/remake/head";
import { MATERIAL_IMAGE } from "@/lib/remake/media";

export const Route = createFileRoute("/_main/guide/")({
  head: () =>
    pageHead(
      "Recycling guide",
      "Learn how to sort plastic, paper, glass, metal, organic, general and special waste.",
    ),
  component: Guide,
});

function Guide() {
  const [first, ...rest] = GUIDE_ORDER;
  return (
    <Screen animate={false}>
      <ScreenHeader title="Recycling guide" back={false} />
      <ScreenBody>
        <h2 className="mt-1 font-display text-2xl font-bold">Choose waste category</h2>
        <p className="mt-1 text-[15px] text-muted-foreground">
          Tap a category to see what goes in and how to prepare it.
        </p>

        {first && (
          <Link
            to="/guide/$material"
            params={{ material: first }}
            className="relative mt-5 block overflow-hidden rounded-[2rem] bg-gradient-category text-primary-foreground shadow-card active:scale-[0.99]"
          >
            <img
              src={MATERIAL_IMAGE[first]}
              alt=""
              className="absolute inset-0 size-full object-cover opacity-35"
            />
            <div className="relative p-5 pt-16">
              <p className="font-display text-2xl font-bold">{MATERIALS[first].name}</p>
              <p className="text-sm opacity-90">{MATERIALS[first].examples}</p>
              <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1 text-xs font-semibold text-foreground">
                <CoinIcon className="size-4 text-[8px]" /> {COIN_RATES[first]} coins per bag
              </span>
            </div>
          </Link>
        )}

        <div className="mt-3 space-y-3">
          {rest.map((m) => {
            const Icon = MATERIAL_ICON[m];
            return (
              <Link
                key={m}
                to="/guide/$material"
                params={{ material: m }}
                className="flex items-center gap-4 rounded-2xl border border-border bg-card p-3 shadow-card active:scale-[0.99]"
              >
                <img
                  src={MATERIAL_IMAGE[m]}
                  alt=""
                  className="size-20 shrink-0 rounded-2xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 font-display text-lg font-semibold">
                    <Icon className="size-4 text-primary" /> {MATERIALS[m].name}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">{MATERIALS[m].examples}</p>
                  <p className="mt-1 text-xs font-medium text-primary-deep">
                    {COIN_RATES[m] > 0
                      ? `${COIN_RATES[m]} coins per bag`
                      : m === "special"
                        ? "Store safely — not collected"
                        : "No coins · fee paid to collector"}
                  </p>
                </div>
                <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
              </Link>
            );
          })}
        </div>
      </ScreenBody>
      <BottomNav />
    </Screen>
  );
}
