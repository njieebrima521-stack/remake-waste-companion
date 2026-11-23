import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
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
        href: "https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&family=Poppins:wght@500;600;700;800&display=swap",
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

/** The phone-sized app frame. Full screen on phones; a centred device on larger screens. */
function AppFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-dvh w-full items-center justify-center md:p-6">
      <div
        id="app-frame"
        className="relative h-full w-full max-w-[440px] overflow-hidden bg-background md:h-[min(920px,100%)] md:rounded-[2.75rem] md:border-[10px] md:border-ink md:shadow-frame"
      >
        {children}
      </div>
    </div>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const hydrated = useApp((s) => s.hydrated);

  useEffect(() => {
    hydrateStore();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AppFrame>
        {/* Saved demo state lives on the device, so screens render once it has loaded. */}
        {hydrated ? <Outlet /> : <SplashMark />}
      </AppFrame>
      <Toaster position="top-center" richColors closeButton={false} />
    </QueryClientProvider>
  );
}
