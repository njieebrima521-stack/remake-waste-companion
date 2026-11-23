import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Lock, UserPlus, UserRoundSearch } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { VerificationStatusPill } from "@/components/collector/account";
import { DemoBadge } from "@/components/remake/bits";
import { CollectorAvatar } from "@/components/remake/CollectorAvatar";
import { Field } from "@/components/remake/Field";
import { Logo } from "@/components/remake/Logo";
import { Button } from "@/components/ui/button";
import { getCollector } from "@/lib/remake/collector";
import { COLLECTOR_CATEGORY_LABEL, DEMO_COLLECTOR_PASSWORD, SAMPLE_ACCOUNTS, type SampleAccount } from "@/lib/remake/data";
import { initials, phoneDisplay } from "@/lib/remake/format";
import { pageHead } from "@/lib/remake/head";
import { actions, getState, useApp } from "@/lib/remake/store";
import { validatePassword, validatePhone } from "@/lib/remake/validation";

export const Route = createFileRoute("/collector/")({
  head: () =>
    pageHead(
      "Collector sign in",
      "Sign in to Remake for collectors: requests, collection routes, QR confirmation and history.",
    ),
  component: CollectorEntry,
});

function CollectorEntry() {
  const account = useApp((s) => s.collectorAccount);
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ phone?: string; password?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);

  if (account) return <Navigate to={account.status === "approved" ? "/collector/home" : "/collector/status"} replace />;

  const signIn = (number: string) => {
    const res = actions.collectorSignIn(number);
    if (!res.ok) {
      setErrors({ form: res.error });
      return;
    }
    const acc = getState().collectorAccount;
    if (acc?.status === "approved") toast.success("Signed in to Remake for collectors");
    void navigate({ to: acc?.status === "approved" ? "/collector/home" : "/collector/status", replace: true });
  };

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
      signIn(phone);
    }, 600);
  };

  return (
    <div className="flex h-full animate-screen-in flex-col bg-background">
      <div className="no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-safe pt-safe">
        <div className="mt-2 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <ArrowLeft className="size-4" /> Resident app
          </Link>
          <DemoBadge>Prototype</DemoBadge>
        </div>

        <div className="mt-5 rounded-[2rem] bg-gradient-ink p-6 text-ink-foreground">
          <Logo onInk className="text-2xl" />
          <h1 className="mt-4 text-[26px] font-bold leading-tight">Remake for collectors</h1>
          <p className="mt-2 text-sm text-ink-muted">
            Requests, collection routes, QR confirmation and material verification — in one place.
          </p>
        </div>

        <form onSubmit={submit} noValidate className="mt-6 space-y-4">
          {errors.form && (
            <div className="flex gap-3 rounded-2xl bg-destructive-soft p-4 text-sm text-destructive">
              <UserRoundSearch className="size-5 shrink-0" />
              {errors.form}
            </div>
          )}
          <Field
            label="Phone"
            prefix="+220"
            inputMode="numeric"
            placeholder="7 digit number"
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
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrors({});
            }}
            error={errors.password}
          />
          <Button size="lg" type="submit" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <div className="mt-8">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-[17px] font-semibold">Sample accounts</h2>
            <span className="text-xs text-muted-foreground">Password {DEMO_COLLECTOR_PASSWORD}</span>
          </div>
          <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            {SAMPLE_ACCOUNTS.map((a) => (
              <SampleRow key={a.key} account={a} onPick={() => signIn(a.phone)} />
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-dashed border-border p-5 text-center">
          <p className="font-semibold">New collector?</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Recycling companies, private waste companies and independent operators can apply.
          </p>
          <Button asChild variant="soft" className="mt-4 w-full">
            <Link to="/collector/register">
              <UserPlus /> Register as a collector
            </Link>
          </Button>
        </div>
        <p className="mt-6 pb-2 text-center text-xs text-muted-foreground">Sample data only · stays on this phone</p>
      </div>
    </div>
  );
}

function SampleRow({ account, onPick }: { account: SampleAccount; onPick: () => void }) {
  const c = getCollector({ registeredCollectors: [], collectorEdits: {} }, account.collectorId);
  const name = account.application.organisation || account.application.fullName;
  return (
    <button type="button" onClick={onPick} className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-muted">
      {c ? (
        <CollectorAvatar collector={c} size="sm" />
      ) : (
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted font-display text-sm font-bold">
          {initials(name)}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-semibold">{name}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {COLLECTOR_CATEGORY_LABEL[account.application.category]} · {phoneDisplay(account.phone)}
        </span>
      </span>
      <VerificationStatusPill status={account.status} className="shrink-0 px-2 py-0.5 text-[10px]" />
    </button>
  );
}
