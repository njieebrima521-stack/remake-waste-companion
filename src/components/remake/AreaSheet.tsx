import { Check, LocateFixed, MapPin } from "lucide-react";

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { AREAS } from "@/lib/remake/data";
import { cn } from "@/lib/utils";

export function AreaSheet({
  open,
  onOpenChange,
  value,
  onSelect,
  allowPrecise = true,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  value: string;
  onSelect: (area: string, precise?: boolean) => void;
  allowPrecise?: boolean;
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85dvh]">
        <DrawerHeader className="text-left">
          <DrawerTitle className="font-display text-xl">Choose your area</DrawerTitle>
          <DrawerDescription>Collectors are matched by area.</DrawerDescription>
        </DrawerHeader>
        <div className="no-scrollbar overflow-y-auto px-4 pb-4">
          {allowPrecise && (
            <button
              onClick={() => onSelect("Bundung", true)}
              className="mb-2 flex w-full items-center gap-3 rounded-2xl bg-primary-soft px-4 py-4 text-left font-semibold text-primary-deep active:scale-[0.99]"
            >
              <LocateFixed className="size-5" />
              Use precise location
              <span className="ml-auto text-xs font-medium opacity-70">Demo</span>
            </button>
          )}
          {AREAS.map((a) => (
            <button
              key={a}
              onClick={() => onSelect(a)}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left text-[15px] active:bg-muted",
                value === a && "font-semibold text-primary-deep",
              )}
            >
              <MapPin className="size-5 text-muted-foreground" />
              {a}
              {value === a && <Check className="ml-auto size-5 text-primary" />}
            </button>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
