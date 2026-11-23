import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { CalendarClock, Coins, QrCode, Recycle, Truck } from "lucide-react";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SplashMark } from "@/components/remake/Splash";
import { Toaster } from "@/components/ui/sonner";
import { hydrateStore, useApp } from "@/lib/remake/store";

function NotFoundComponent() {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-background px-6 text-center">
      <p className="font-display text-7xl font-bold text-primary">404</p>
      <h1 className="mt-4 text-xl font-semibold">Screen not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">This part of Remake doesn't exist.</p>
      <Link
        to="/home"
        className="mt-6 inline-flex h-12 items-center rounded-full bg-primary px-6 font-semibold text-primary-foreground"
      >
        Back to home
      </Link>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex h-full flex-col items-center justify-center bg-background px-6 text-center">
      <h1 className="text-xl font-semibold">This screen didn't load</h1>
      <p className="mt-2 text-sm text-muted-foreground">Something went wrong. Try again or go home.</p>
      <div className="mt-6 flex gap-2">
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="inline-flex h-12 items-center rounded-full bg-primary px-6 font-semibold text-primary-foreground"
        >
          Try again
        </button>
        <a href="/home" className="inline-flex h-12 items-center rounded-full border border-input bg-card px-6 font-semibold">
          Home
        </a>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#00c14b" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "apple-mobile-web-app-title", content: "Remake" },
      { title: "Remake — Waste pickup & Green Coins" },
      { name: "description", content: "Book waste pickups, sort recyclables and earn Green Coins in The Gambia." },
      { name: "author", content: "Remake" },
      { property: "og:title", content: "Remake — Waste pickup & Green Coins" },
      { property: "og:description", content: "Book waste pickups, sort recyclables and earn Green Coins in The Gambia." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Poppins:wght@500;600;700;800&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/icon-192.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

const POINTS = [
  { icon: Truck, text: "Book collection for recyclables or general waste" },
  { icon: CalendarClock, text: "See when your waste will be collected" },
  { icon: QrCode, text: "Hand over with your booking QR code" },
  { icon: Coins, text: "Earn Green Coins once recyclables are verified" },
];

/**
 * Frame for screens outside the signed-in area (onboarding, sign-in, sign-up, collector status).
 * Full screen on phones; on wider screens a brand panel sits beside a centred card.
 */
function PublicFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-dvh w-full bg-background">
      <aside className="relative hidden w-[42%] max-w-[560px] shrink-0 flex-col justify-between overflow-hidden bg-gradient-category p-10 text-primary-foreground lg:flex">
        <Recycle className="pointer-events-none absolute -bottom-16 -right-16 size-80 opacity-10" />
        <div className="flex items-center gap-2 font-display text-2xl font-bold">
          <span className="grid size-10 place-items-center rounded-xl bg-primary-foreground/15">
            <Recycle className="size-5" strokeWidth={2.4} />
          </span>
          Remake
        </div>
        <div>
          <h2 className="max-w-md text-[32px] font-semibold leading-tight">
            Cleaner neighbourhoods, one pickup at a time.
          </h2>
          <ul className="mt-8 space-y-4">
            {POINTS.map((p) => (
              <li key={p.text} className="flex items-center gap-3 text-[15px]">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-foreground/15">
                  <p.icon className="size-5" />
                </span>
                {p.text}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm opacity-75">Demo · sample data only, saved in this browser.</p>
      </aside>
      <div className="flex min-w-0 flex-1 items-center justify-center md:p-6">
        <div className="relative h-full w-full overflow-hidden bg-background md:h-[min(880px,100%)] md:max-w-[480px] md:rounded-3xl md:border md:border-border md:bg-card md:shadow-card">
          {children}
        </div>
      </div>
    </div>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const hydrated = useApp((s) => s.hydrated);
  const inApp = useRouterState({
    select: (r) => r.matches.some((m) => m.routeId === "/_main" || m.routeId === "/collector/_app"),
  });

  useEffect(() => {
    hydrateStore();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Saved demo state lives on the device, so screens render once it has loaded. */}
      {!hydrated ? (
        <div className="h-dvh w-full">
          <SplashMark />
        </div>
      ) : inApp ? (
        <Outlet />
      ) : (
        <PublicFrame>
          <Outlet />
        </PublicFrame>
      )}
      <Toaster position="top-center" richColors closeButton={false} />
    </QueryClientProvider>
  );
}
