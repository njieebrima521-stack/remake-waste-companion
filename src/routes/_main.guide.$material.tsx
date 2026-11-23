import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Ban,
  CheckCircle2,
  Lightbulb,
  ShieldAlert,
  XCircle,
} from "lucide-react";

import { CoinIcon } from "@/components/remake/CoinIcon";
import { BackButton, Screen, ScreenBody, ScreenFooter } from "@/components/remake/Screen";
import { Button } from "@/components/ui/button";
import { COIN_RATES, GUIDE_ORDER, MATERIALS } from "@/lib/remake/data";
import { pageHead } from "@/lib/remake/head";
import { MATERIAL_IMAGE } from "@/lib/remake/media";
import { actions } from "@/lib/remake/store";
import type { MaterialId } from "@/lib/remake/types";

export const Route = createFileRoute("/_main/guide/$material")({
  loader: ({ params }) => {
    if (!GUIDE_ORDER.includes(params.material as MaterialId)) throw notFound();
    return { material: params.material as MaterialId };
  },
  head: ({ loaderData }) =>
    loaderData
      ? pageHead(
          `${MATERIALS[loaderData.material].name} guide`,
          `What ${MATERIALS[loaderData.material].name.toLowerCase()} is accepted and how to prepare it.`,
        )
      : pageHead("Guide", "Recycling guide category."),
  component: GuideDetail,
});

function GuideDetail() {
  const { material } = Route.useLoaderData();
  const navigate = useNavigate();
  const m = MATERIALS[material];
  const i = GUIDE_ORDER.indexOf(material);
  const prev = GUIDE_ORDER[i - 1];
  const next = GUIDE_ORDER[i + 1];
  const rate = COIN_RATES[material];

  return (
    <Screen key={material}>
      <ScreenBody flush>
        <div className="relative h-64 overflow-hidden">
          <img src={MATERIAL_IMAGE[material]} alt={m.name} className="size-full object-cover" />
          <div className="absolute inset-0 bg-photo-fade" />
          <div className="absolute left-5 top-0 pt-safe">
            <BackButton fallback="/guide" />
          </div>
          <div className="absolute inset-x-5 bottom-5 text-camera-foreground">
            <h1 className="font-display text-3xl font-bold">{m.name}</h1>
            <p className="text-sm opacity-90">{m.examples}</p>
          </div>
        </div>

        <div className="px-5">
          <div className="-mt-4 relative flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card">
            <CoinIcon className="size-9 text-sm" />
            <p className="text-sm">
              {rate > 0 ? (
                <>
                  <span className="font-semibold">About {rate} Green Coins per bag</span>
                  <span className="block text-muted-foreground">
                    Paid only after the material is collected and verified.
                  </span>
                </>
              ) : material === "general" ? (
                <>
                  <span className="font-semibold">No Green Coins</span>
                  <span className="block text-muted-foreground">
                    You pay the collector's fee directly.
                  </span>
                </>
              ) : (
                <>
                  <span className="font-semibold">Not collected in ordinary pickups</span>
                  <span className="block text-muted-foreground">
                    Store it safely for a special drop-off day.
                  </span>
                </>
              )}
            </p>
          </div>

          <Section icon={<CheckCircle2 className="size-5 text-primary" />} title="Accepted">
            <ul className="space-y-2.5">
              {m.accepted.map((a) => (
                <li key={a} className="flex gap-3 text-[15px]">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" /> {a}
                </li>
              ))}
            </ul>
          </Section>

          <Section icon={<Ban className="size-5 text-destructive" />} title="Keep separate">
            <ul className="space-y-2.5">
              {m.rejected.map((a) => (
                <li key={a} className="flex gap-3 text-[15px]">
                  <XCircle className="mt-0.5 size-5 shrink-0 text-destructive" /> {a}
                </li>
              ))}
            </ul>
          </Section>

          <Section title="How to prepare">
            <ol className="space-y-3">
              {m.prep.map((p, n) => (
                <li key={p} className="flex gap-3 text-[15px]">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary font-display text-sm font-bold text-primary-foreground">
                    {n + 1}
                  </span>
                  <span className="pt-0.5">{p}</span>
                </li>
              ))}
            </ol>
          </Section>

          <div className="mt-5 flex gap-3 rounded-3xl bg-coin-soft p-4">
            <Lightbulb className="size-6 shrink-0 text-warning-foreground" />
            <p className="text-[15px]">
              <span className="block font-semibold">Practical tip</span>
              {m.tip}
            </p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            {prev ? (
              <Link
                to="/guide/$material"
                params={{ material: prev }}
                className="flex items-center gap-2 rounded-2xl bg-card p-3 text-sm font-semibold shadow-card"
              >
                <ArrowLeft className="size-4 shrink-0" />{" "}
                <span className="truncate">{MATERIALS[prev].name}</span>
              </Link>
            ) : (
              <span />
            )}
            {next && (
              <Link
                to="/guide/$material"
                params={{ material: next }}
                className="flex items-center justify-end gap-2 rounded-2xl bg-card p-3 text-sm font-semibold shadow-card"
              >
                <span className="truncate">{MATERIALS[next].name}</span>{" "}
                <ArrowRight className="size-4 shrink-0" />
              </Link>
            )}
          </div>
        </div>
      </ScreenBody>
      <ScreenFooter>
        {material === "special" ? (
          <p className="flex items-center justify-center gap-2 py-2 text-center text-sm text-muted-foreground">
            <ShieldAlert className="size-4" /> Special waste can't be booked in this demo.
          </p>
        ) : material === "general" ? (
          <Button
            size="lg"
            onClick={() => {
              actions.startDraft("general");
              void navigate({ to: "/general" });
            }}
          >
            Book general collection
          </Button>
        ) : (
          <Button
            size="lg"
            onClick={() => {
              actions.startDraft("recyclable");
              actions.updateDraft({ material });
              void navigate({ to: "/book" });
            }}
          >
            Book a {m.short.toLowerCase()} pickup
          </Button>
        )}
      </ScreenFooter>
    </Screen>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mt-5 rounded-2xl border border-border bg-card p-5 shadow-card">
      <h2 className="mb-3 flex items-center gap-2 text-[17px] font-semibold">
        {icon} {title}
      </h2>
      {children}
    </section>
  );
}
