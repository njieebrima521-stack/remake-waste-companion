import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Lock, Mail, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Chip, PhotoPicker } from "@/components/collector/PhotoPicker";
import { useMe, useWorkState } from "@/components/collector/ui";
import { NumberStepper } from "@/components/remake/bits";
import { Field } from "@/components/remake/Field";
import { Screen, ScreenBody, ScreenFooter, ScreenHeader } from "@/components/remake/Screen";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { isAvailable } from "@/lib/remake/collector";
import { AREAS, VEHICLE_OPTIONS } from "@/lib/remake/data";
import { pageHead } from "@/lib/remake/head";
import { actions } from "@/lib/remake/store";
import { PHONE_RE } from "@/lib/remake/validation";

export const Route = createFileRoute("/collector/_app/profile/edit")({
  head: () => pageHead("Edit collector profile", "Update your contact details, vehicle, capacity, service areas and photo."),
  component: EditProfile,
});

function EditProfile() {
  const me = useMe();
  const state = useWorkState();
  const navigate = useNavigate();
  const [f, setF] = useState({
    contactName: me.contactName,
    phone: me.phone.replace(/\D/g, "").slice(-7),
    email: me.email ?? "",
    vehicle: me.vehicle,
    capacityBags: me.capacityBags,
    areas: me.areas,
    image: me.image,
    available: isAvailable(state, me.id),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const vehicles = Array.from(new Set([me.vehicle, ...VEHICLE_OPTIONS[me.category]]));

  const save = () => {
    const e: Record<string, string> = {};
    if (f.contactName.trim().length < 2) e["contactName"] = "Enter a name";
    if (!PHONE_RE.test(f.phone)) e["phone"] = "Enter a valid 7-digit Gambian number";
    if (f.email && !/^\S+@\S+\.\S+$/.test(f.email)) e["email"] = "Enter a valid email or leave it empty";
    if (!f.areas.length) e["areas"] = "Keep at least one service area";
    setErrors(e);
    if (Object.keys(e).length) return;
    actions.updateCollectorProfile(me.id, {
      contactName: f.contactName.trim(),
      phone: `+220 ${f.phone.slice(0, 3)} ${f.phone.slice(3)}`,
      email: f.email.trim(),
      vehicle: f.vehicle,
      capacityBags: f.capacityBags,
      areas: f.areas,
      available: f.available,
      ...(f.image && { image: f.image }),
    });
    toast.success("Profile updated");
    void navigate({ to: "/collector/profile" });
  };

  return (
    <Screen>
      <ScreenHeader title="Edit profile" fallback="/collector/profile" />
      <ScreenBody>
        <PhotoPicker
          label={me.category === "independent" ? "Profile photo" : "Company logo"}
          value={f.image}
          onChange={(image) => setF({ ...f, image })}
        />

        <div className="mt-5 rounded-3xl bg-muted p-4 text-sm">
          <p className="flex items-center gap-2 font-semibold">
            <Lock className="size-4" /> {me.remakeId} · Approved
          </p>
          <p className="mt-1 text-muted-foreground">
            Your Remake Collector ID, verification status and approved categories can only be changed by Remake.
          </p>
        </div>

        <div className="mt-5 space-y-5">
          <Field
            label={me.category === "independent" ? "Full name" : "Contact person"}
            icon={User}
            value={f.contactName}
            onChange={(e) => setF({ ...f, contactName: e.target.value })}
            error={errors["contactName"]}
          />
          <Field
            label="Phone"
            prefix="+220"
            inputMode="numeric"
            maxLength={7}
            value={f.phone}
            onChange={(e) => setF({ ...f, phone: e.target.value.replace(/\D/g, "") })}
            error={errors["phone"]}
          />
          <Field
            label="Email (optional)"
            icon={Mail}
            value={f.email}
            onChange={(e) => setF({ ...f, email: e.target.value })}
            error={errors["email"]}
          />
          <div>
            <p className="mb-2 text-sm font-medium">Vehicle or equipment</p>
            <div className="flex flex-wrap gap-2">
              {vehicles.map((v) => (
                <Chip key={v} selected={f.vehicle === v} onClick={() => setF({ ...f, vehicle: v })}>
                  {v}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Capacity per trip</p>
            <NumberStepper value={f.capacityBags} onChange={(n) => setF({ ...f, capacityBags: n })} min={1} max={200} unit="bags" />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Service areas</p>
            <div className="flex flex-wrap gap-2">
              {AREAS.map((a) => (
                <Chip
                  key={a}
                  selected={f.areas.includes(a)}
                  onClick={() => setF({ ...f, areas: f.areas.includes(a) ? f.areas.filter((x) => x !== a) : [...f.areas, a] })}
                >
                  {a}
                </Chip>
              ))}
            </div>
            {errors["areas"] && <p className="mt-1.5 px-2 text-xs font-medium text-destructive">{errors["areas"]}</p>}
          </div>
          <label className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-card">
            <span>
              <span className="block font-medium">Available for new requests</span>
              <span className="block text-xs text-muted-foreground">Off duty hides open requests from you.</span>
            </span>
            <Switch checked={f.available} onCheckedChange={(v) => setF({ ...f, available: v })} />
          </label>
        </div>
      </ScreenBody>
      <ScreenFooter>
        <Button size="lg" onClick={save}>
          Save changes
        </Button>
      </ScreenFooter>
    </Screen>
  );
}
