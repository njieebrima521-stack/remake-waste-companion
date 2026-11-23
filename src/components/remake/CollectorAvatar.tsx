import { useState } from "react";

import { initials } from "@/lib/remake/format";
import type { Collector } from "@/lib/remake/types";
import { cn } from "@/lib/utils";

const SIZE = {
  sm: "size-10 rounded-xl text-sm",
  md: "size-14 rounded-2xl text-lg",
  lg: "size-20 rounded-3xl text-2xl",
} as const;

/** Companies and recycling organisations show their logo; individual operators show their photo. */
export function isOrganisation(c: Collector) {
  return c.type !== "donkey_cart";
}

export function CollectorAvatar({
  collector,
  size = "md",
  className,
}: {
  collector: Collector;
  size?: keyof typeof SIZE;
  className?: string;
}) {
  const [broken, setBroken] = useState(false);
  const logo = isOrganisation(collector);
  if (!collector.image || broken)
    return (
      <span
        aria-hidden
        className={cn(
          "grid shrink-0 place-items-center bg-gradient-brand font-display font-bold text-primary-foreground",
          SIZE[size],
          className,
        )}
      >
        {initials(collector.name)}
      </span>
    );
  return (
    <img
      src={collector.image}
      alt={logo ? `${collector.name} logo` : `Photo of ${collector.name}`}
      loading="lazy"
      onError={() => setBroken(true)}
      className={cn(
        "shrink-0 border border-border",
        SIZE[size],
        logo ? "bg-paper object-contain p-1" : "object-cover object-top",
        className,
      )}
    />
  );
}
