import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronDown, Lock, MapPin, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AreaSheet } from "@/components/remake/AreaSheet";
import { Field } from "@/components/remake/Field";
import { Logo } from "@/components/remake/Logo";
import { BackButton } from "@/components/remake/Screen";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/remake/head";
import { actions } from "@/lib/remake/store";
import { PHONE_RE } from "@/lib/remake/validation";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/register")({
  head: () => pageHead("Create account", "Join Remake and start earning Green Coins for your recyclables."),
  component: Register,
});



function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", phone: "", password: "", area: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [areaOpen, setAreaOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (form.name.trim().length < 2) next["name"] = "Enter your full name";
    if (!PHONE_RE.test(form.phone)) next["phone"] = "Enter a valid 7-digit Gambian number";
    if (form.password.length < 6) next["password"] = "Use at least 6 characters";
    if (!form.area) next["area"] = "Choose your area so we can match collectors";
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    setTimeout(() => {
      actions.register({ name: form.name.trim(), phone: form.phone, area: form.area });
      void navigate({ to: "/verify" });
    }, 700);
  };

  return (
    <div className="flex h-full flex-col bg-background animate-screen-in">
      <div className="flex items-center justify-between px-5 pt-safe">
        <BackButton fallback="/welcome" />
        <Logo className="text-xl" />
      </div>
      <form onSubmit={submit} noValidate className="no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-safe">
        <h1 className="mt-6 text-[28px] font-bold">Join with Remake</h1>
        <p className="mt-2 text-[15px] text-muted-foreground">Sign up now and start your journey to make The Gambia greener.</p>

        <div className="mt-7 space-y-5">
          <Field label="Name" icon={User} placeholder="e.g. Awa Touray" autoComplete="name" value={form.name} onChange={(e) => set("name", e.target.value)} error={errors["name"]} />
          <Field
            label="Phone"
            prefix="+220"
            inputMode="numeric"
            placeholder="7 digit number"
            autoComplete="tel-national"
            maxLength={7}
            value={form.phone}
            onChange={(e) => set("phone", e.target.value.replace(/\D/g, ""))}
            error={errors["phone"]}
          />
          <Field label="Password" icon={Lock} type="password" placeholder="At least 6 characters" autoComplete="new-password" value={form.password} onChange={(e) => set("password", e.target.value)} error={errors["password"]} />
          <div>
            <span className="mb-2 block text-sm font-medium">Location</span>
            <button
              type="button"
              onClick={() => setAreaOpen(true)}
              className={cn(
                "flex h-14 w-full items-center gap-3 rounded-full border bg-card px-5 text-left",
                errors["area"] ? "border-destructive" : "border-input",
              )}
            >
              <MapPin className="size-5 text-muted-foreground" />
              <span className={cn("flex-1 text-base", !form.area && "text-muted-foreground/70")}>
                {form.area || "Use precise location"}
              </span>
              <ChevronDown className="size-5 text-muted-foreground" />
            </button>
            {errors["area"] && <p className="mt-1.5 px-2 text-xs font-medium text-destructive">{errors["area"]}</p>}
          </div>
        </div>

        <div className="mt-auto pt-8">
          <Button size="lg" type="submit" disabled={busy}>
            {busy ? "Creating account…" : "Confirm"}
          </Button>
          <p className="mt-4 text-center text-[15px]">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-primary">
              Login here
            </Link>
          </p>
        </div>
      </form>
      <AreaSheet
        open={areaOpen}
        onOpenChange={setAreaOpen}
        value={form.area}
        onSelect={(a, precise) => {
          set("area", a);
          setAreaOpen(false);
          if (precise) toast.success(`Location found: ${a}`, { description: "Simulated location — no GPS used." });
        }}
      />
    </div>
  );
}
