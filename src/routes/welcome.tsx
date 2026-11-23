import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Camera, Coins, Truck } from "lucide-react";
import { useRef, useState } from "react";

import { Logo } from "@/components/remake/Logo";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/remake/head";
import { ONBOARDING_IMAGES } from "@/lib/remake/media";
import { actions } from "@/lib/remake/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/welcome")({
  head: () => pageHead("Welcome", "See how Remake helps you hand over waste and earn Green Coins."),
  component: Welcome,
});

const slides = [
  {
    image: ONBOARDING_IMAGES.welcome,
    title: (
      <>
        Welcome to <Logo />
      </>
    ),
    body: "Together we create a cleaner and greener Gambia by managing waste the smart way.",
  },
  {
    image: ONBOARDING_IMAGES.pickup,
    title: "How Remake works",
    body: null,
    steps: [
      { icon: Camera, label: "Snap a photo of your waste" },
      { icon: Truck, label: "Book a collector to your gate" },
      { icon: Coins, label: "Earn Green Coins for recyclables" },
    ],
  },
  {
    image: ONBOARDING_IMAGES.rewards,
    title: "Redeem coins for rewards",
    body: "Collect Green Coins from every verified pickup and swap them for airtime, bags, books and more.",
  },
];

function Welcome() {
  const [i, setI] = useState(0);
  const navigate = useNavigate();
  const startX = useRef<number | null>(null);
  const last = i === slides.length - 1;
  const slide = slides[i]!;

  const finish = (to: "/register" | "/login") => {
    actions.completeOnboarding();
    void navigate({ to });
  };

  return (
    <div
      className="flex h-full flex-col bg-background pt-safe"
      onPointerDown={(e) => (startX.current = e.clientX)}
      onPointerUp={(e) => {
        if (startX.current === null) return;
        const dx = e.clientX - startX.current;
        if (dx < -50 && !last) setI(i + 1);
        if (dx > 50 && i > 0) setI(i - 1);
        startX.current = null;
      }}
    >
      <div className="flex gap-2 px-5 pt-2">
        {slides.map((_, n) => (
          <span key={n} className={cn("h-1.5 flex-1 rounded-full transition-colors duration-300", n <= i ? "bg-primary" : "bg-border")} />
        ))}
      </div>
      <div className="flex items-center justify-between px-5 pt-4">
        <Logo className="text-xl" />
        {!last ? (
          <button onClick={() => setI(slides.length - 1)} className="h-10 rounded-full border border-border px-5 text-sm font-medium">
            Skip
          </button>
        ) : (
          <span className="h-10" />
        )}
      </div>

      <div key={i} className="flex min-h-0 flex-1 flex-col px-5 pt-5 animate-screen-in">
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-[2.25rem] rounded-tl-[5.5rem] rounded-br-[5.5rem]">
          <img src={slide.image} alt="" className="absolute inset-0 size-full object-cover" draggable={false} />
        </div>
        <div className="pb-2 pt-6 text-center">
          <h1 className="text-[28px] font-bold leading-tight">{slide.title}</h1>
          {slide.body && <p className="mx-auto mt-3 max-w-xs text-[15px] leading-relaxed text-muted-foreground">{slide.body}</p>}
          {slide.steps && (
            <ol className="mx-auto mt-4 max-w-xs space-y-2.5 text-left">
              {slide.steps.map((s, n) => (
                <li key={n} className="flex items-center gap-3 rounded-2xl bg-card px-4 py-3 shadow-card">
                  <span className="grid size-9 place-items-center rounded-xl bg-primary-soft text-primary-deep">
                    <s.icon className="size-5" />
                  </span>
                  <span className="text-[15px] font-medium">{s.label}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      <div className="space-y-3 px-5 pb-safe pt-3">
        {last ? (
          <>
            <Button size="lg" onClick={() => finish("/register")}>
              Get started
            </Button>
            <button onClick={() => finish("/login")} className="h-11 w-full text-[15px] font-medium">
              I already have an account · <span className="text-primary">Sign in</span>
            </button>
          </>
        ) : (
          <div className="flex gap-3">
            {i > 0 && (
              <Button variant="outline" size="lg" className="flex-1" onClick={() => setI(i - 1)}>
                Previous
              </Button>
            )}
            <Button size="lg" className="flex-1" onClick={() => setI(i + 1)}>
              Next
            </Button>
          </div>
        )}
        {!last && (
          <p className="text-center text-xs text-muted-foreground">
            Swipe to continue · <Link to="/login" className="font-medium text-primary">Sign in</Link>
          </p>
        )}
      </div>
    </div>
  );
}
