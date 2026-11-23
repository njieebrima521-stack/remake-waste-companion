import { createFileRoute } from "@tanstack/react-router";

import { CollectorSignup } from "@/components/collector/CollectorSignup";
import { pageHead } from "@/lib/remake/head";

export const Route = createFileRoute("/collector/register")({
  head: () =>
    pageHead("Register as a collector", "Apply to collect waste with Remake as a recycling company, private company or independent operator."),
  component: () => <CollectorSignup />,
});
