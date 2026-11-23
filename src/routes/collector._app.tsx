import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";

import { CollectorShell } from "@/components/collector/CollectorShell";
import { useCollector } from "@/components/collector/ui";
import { useApp } from "@/lib/remake/store";

/** Approved collector area. Unapproved, suspended or signed-out accounts never reach assignments. */
export const Route = createFileRoute("/collector/_app")({
  component: CollectorLayout,
});

function CollectorLayout() {
  const account = useApp((s) => s.collectorAccount);
  const me = useCollector();
  if (!account) return <Navigate to="/collector" replace />;
  if (!me) return <Navigate to="/collector/status" replace />;
  return (
    <CollectorShell>
      <Outlet />
    </CollectorShell>
  );
}
