import { createFileRoute } from "@tanstack/react-router";
import { Home, MapPin, Plus, Star, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AreaSheet } from "@/components/remake/AreaSheet";
import { Pill } from "@/components/remake/bits";
import { Field } from "@/components/remake/Field";
import { Screen, ScreenBody, ScreenFooter, ScreenHeader } from "@/components/remake/Screen";
import { StateView } from "@/components/remake/StateView";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { pageHead } from "@/lib/remake/head";
import { actions, useApp } from "@/lib/remake/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_main/profile/addresses")({
  head: () => pageHead("Saved addresses", "Places where collectors can pick up your waste."),
  component: Addresses,
});

const LABELS = ["Home", "Work", "Family", "Shop"];

function Addresses() {
  const addresses = useApp((s) => s.addresses);
  const [open, setOpen] = useState(false);
  const [areaOpen, setAreaOpen] = useState(false);
  const [label, setLabel] = useState("Home");
  const [line, setLine] = useState("");
  const [area, setArea] = useState("");
  const [landmark, setLandmark] = useState("");
  const ok = line.trim().length > 2 && !!area;

  const reset = () => {
    setLabel("Home");
    setLine("");
    setArea("");
    setLandmark("");
  };

  return (
    <Screen>
      <ScreenHeader title="Saved addresses" fallback="/profile" />
      <ScreenBody>
        {addresses.length === 0 ? (
          <StateView
            icon={MapPin}
            tone="muted"
            title="No saved addresses"
            body="Save your home so booking is faster next time."
          />
        ) : (
          <div className="space-y-3">
            {addresses.map((a) => (
              <div
                key={a.id}
                className={cn(
                  "rounded-3xl border-2 bg-card p-4 shadow-card",
                  a.isDefault ? "border-primary" : "border-transparent",
                )}
              >
                <div className="flex items-start gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary-deep">
                    <Home className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 font-semibold">
                      {a.label}{" "}
                      {a.isDefault && (
                        <Pill className="bg-primary text-primary-foreground">Default</Pill>
                      )}
                    </p>
                    <p className="text-[15px]">{a.line}</p>
                    <p className="text-sm text-muted-foreground">
                      {a.area}
                      {a.landmark ? ` · ${a.landmark}` : ""}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  {!a.isDefault && (
                    <Button
                      variant="soft"
                      size="sm"
                      onClick={() => actions.setDefaultAddress(a.id)}
                    >
                      <Star /> Make default
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => {
                      actions.removeAddress(a.id);
                      toast(`${a.label} removed`);
                    }}
                  >
                    <Trash2 /> Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScreenBody>
      <ScreenFooter>
        <Button size="lg" onClick={() => setOpen(true)}>
          <Plus /> Add address
        </Button>
      </ScreenFooter>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="max-h-[90dvh]">
          <DrawerHeader className="text-left">
            <DrawerTitle className="font-display text-xl">New address</DrawerTitle>
            <DrawerDescription>Collectors use this to find your gate.</DrawerDescription>
          </DrawerHeader>
          <div className="no-scrollbar space-y-4 overflow-y-auto px-4 pb-6">
            <div className="flex flex-wrap gap-2">
              {LABELS.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLabel(l)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-semibold",
                    label === l
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card",
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
            <Field
              label="Street or compound"
              icon={MapPin}
              value={line}
              onChange={(e) => setLine(e.target.value)}
              placeholder="e.g. Compound 3, Mosque Road"
            />
            <div>
              <span className="mb-2 block text-sm font-medium">Area</span>
              <button
                type="button"
                onClick={() => setAreaOpen(true)}
                className="flex h-14 w-full items-center gap-3 rounded-full border border-input bg-card px-5 text-left text-base"
              >
                <MapPin className="size-5 text-muted-foreground" />
                <span className={cn("flex-1", !area && "text-muted-foreground/70")}>
                  {area || "Choose your area"}
                </span>
              </button>
            </div>
            <Field
              label="Landmark (optional)"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              placeholder="e.g. Next to the bakery"
            />
            <Button
              size="lg"
              disabled={!ok}
              onClick={() => {
                actions.addAddress({ label, line: line.trim(), area, landmark: landmark.trim() });
                toast.success("Address saved");
                setOpen(false);
                reset();
              }}
            >
              Save address
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
      <AreaSheet
        open={areaOpen}
        onOpenChange={setAreaOpen}
        value={area}
        allowPrecise={false}
        onSelect={(a) => {
          setArea(a);
          setAreaOpen(false);
        }}
      />
    </Screen>
  );
}
