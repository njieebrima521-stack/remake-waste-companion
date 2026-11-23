import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { SplashMark } from "@/components/remake/Splash";
import { getState } from "@/lib/remake/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Remake — Waste pickup & Green Coins for The Gambia" },
      { name: "description", content: "Request waste collection, scan and sort recyclables, and earn Green Coins rewards." },
      { property: "og:title", content: "Remake — Waste pickup & Green Coins for The Gambia" },
      { property: "og:description", content: "Request waste collection, scan and sort recyclables, and earn Green Coins rewards." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Splash,
});

function Splash() {
  const navigate = useNavigate();
  useEffect(() => {
    const t = setTimeout(() => {
      const s = getState();
      const to = !s.onboarded ? "/welcome" : !s.signedIn ? "/login" : "/home";
      void navigate({ to, replace: true });
    }, 1400);
    return () => clearTimeout(t);
  }, [navigate]);
  return <SplashMark />;
}
