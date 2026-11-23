import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";

import { useApp } from "@/lib/remake/store";

/** Signed-in area of the app. Sends signed-out visitors to sign in. */
export const Route = createFileRoute("/_main")({
  component: MainLayout,
});

function MainLayout() {
  const signedIn = useApp((s) => s.signedIn);
  if (!signedIn) return <Navigate to="/login" replace />;
  return <Outlet />;
}
