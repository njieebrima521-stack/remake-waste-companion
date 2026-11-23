import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Mail, MapPin, Phone, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AreaSheet } from "@/components/remake/AreaSheet";
import { Field } from "@/components/remake/Field";
import { Screen, ScreenBody, ScreenFooter, ScreenHeader } from "@/components/remake/Screen";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/remake/head";
import { actions, useApp } from "@/lib/remake/store";
import { validatePhone } from "@/lib/remake/validation";

export const Route = createFileRoute("/_main/profile/edit")({
  head: () => pageHead("Edit details", "Update your name, phone, email and area."),
  component: EditProfile,
});

function EditProfile() {
  const navigate = useNavigate();
  const user = useApp((s) => s.user);
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [email, setEmail] = useState(user.email);
  const [area, setArea] = useState(user.area);
  const [areaOpen, setAreaOpen] = useState(false);
  const [tried, setTried] = useState(false);

  const errors = {
    name: name.trim().length < 2 ? "Enter your name" : "",
    phone: validatePhone(phone),
    email: email && !/^\S+@\S+\.\S+$/.test(email) ? "Enter a valid email or leave it empty" : "",
  };
  const valid = !errors.name && !errors.phone && !errors.email;

  return (
    <Screen>
      <ScreenHeader title="Edit personal details" fallback="/profile" />
      <ScreenBody>
        <form
          id="edit-profile"
          className="mt-2 space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            setTried(true);
            if (!valid) return;
            actions.updateUser({ name: name.trim(), phone, email: email.trim(), area });
            toast.success("Details saved");
            void navigate({ to: "/profile" });
          }}
        >
          <Field
            label="Full name"
            icon={User}
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={tried ? errors.name : ""}
            autoComplete="name"
          />
          <Field
            label="Phone"
            icon={Phone}
            prefix="+220"
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 7))}
            error={tried ? errors.phone : ""}
          />
          <Field
            label="Email (optional)"
            icon={Mail}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={tried ? errors.email : ""}
            autoComplete="email"
          />
          <div>
            <span className="mb-2 block text-sm font-medium">Area</span>
            <button
              type="button"
              onClick={() => setAreaOpen(true)}
              className="flex h-14 w-full items-center gap-3 rounded-full border border-input bg-card px-5 text-left text-base"
            >
              <MapPin className="size-5 text-muted-foreground" />
              <span className="flex-1">{area}</span>
              <span className="text-sm font-semibold text-primary">Change</span>
            </button>
          </div>
        </form>
      </ScreenBody>
      <ScreenFooter>
        <Button size="lg" type="submit" form="edit-profile">
          Save changes
        </Button>
      </ScreenFooter>
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
