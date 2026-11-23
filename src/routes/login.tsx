import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Lock, UserRoundSearch } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { DemoBadge } from "@/components/remake/bits";
import { Field } from "@/components/remake/Field";
import { Logo } from "@/components/remake/Logo";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/remake/head";
import { actions } from "@/lib/remake/store";
import { DEMO_ACCOUNT, UNKNOWN_PHONE, validatePassword, validatePhone } from "@/lib/remake/validation";

export const Route = createFileRoute("/login")({
  head: () => pageHead("Sign in", "Sign in to Remake to book pickups and manage your Green Coins."),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ phone?: string; password?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const pe = validatePhone(phone);
    const pw = validatePassword(password);
    const next: typeof errors = {};
    if (pe) next.phone = pe;
    if (pw) next.password = pw;
    setErrors(next);
    if (pe || pw) return;
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      if (phone === UNKNOWN_PHONE) {
        setErrors({ form: "No account found with this number. Check it or create an account." });
        return;
      }
      actions.signIn(phone);
      toast.success("Welcome back!");
      void navigate({ to: "/home", replace: true });
    }, 700);
  };

  return (
    <div className="flex h-full flex-col bg-background animate-screen-in">
      <form onSubmit={submit} noValidate className="no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-safe pt-safe">
        <Logo className="mt-4 text-2xl" />
        <h1 className="mt-10 text-[28px] font-bold">Welcome back</h1>
        <p className="mt-2 text-[15px] text-muted-foreground">Sign in to book pickups and check your Green Coins.</p>

        {errors.form && (
          <div className="mt-6 flex gap-3 rounded-2xl bg-destructive-soft p-4 text-sm text-destructive">
            <UserRoundSearch className="size-5 shrink-0" />
            {errors.form}
          </div>
        )}

        <div className="mt-7 space-y-5">
          <Field
            label="Phone"
            prefix="+220"
            inputMode="numeric"
            placeholder="7 digit number"
            autoComplete="tel-national"
            maxLength={7}
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value.replace(/\D/g, ""));
              setErrors({});
            }}
            error={errors.phone}
          />
          <Field
            label="Password"
            icon={Lock}
            type="password"
            placeholder="Enter password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrors({});
            }}
            error={errors.password}
          />
          <div className="text-right">
            <Link to="/forgot-password" className="text-sm font-semibold text-primary">
              Forgot password?
            </Link>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setPhone(DEMO_ACCOUNT.phone);
            setPassword(DEMO_ACCOUNT.password);
            setErrors({});
          }}
          className="mt-6 flex items-center justify-between rounded-2xl border border-dashed border-warning/60 bg-warning-soft/60 px-4 py-3 text-left"
        >
          <span>
            <span className="block text-sm font-semibold">Use the demo account</span>
            <span className="block text-xs text-muted-foreground">Fills +220 701 2345 · remake123</span>
          </span>
          <DemoBadge>Demo</DemoBadge>
        </button>

        <div className="mt-auto pt-8">
          <Button size="lg" type="submit" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </Button>
          <p className="mt-4 text-center text-[15px]">
            New to Remake?{" "}
            <Link to="/register" className="font-semibold text-primary">
              Create account
            </Link>
          </p>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Collecting waste?{" "}
            <Link to="/collector" className="font-semibold text-foreground underline underline-offset-4">
              Collector sign in
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
