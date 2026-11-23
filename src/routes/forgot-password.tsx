import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, KeyRound, Lock } from "lucide-react";
import { useState } from "react";

import { DemoBadge } from "@/components/remake/bits";
import { Field } from "@/components/remake/Field";
import { OtpInput } from "@/components/remake/OtpInput";
import { FlowProgress, ScreenHeader } from "@/components/remake/Screen";
import { StateView } from "@/components/remake/StateView";
import { Button } from "@/components/ui/button";
import { phoneDisplay } from "@/lib/remake/format";
import { pageHead } from "@/lib/remake/head";
import { DEMO_CODE, validatePassword, validatePhone } from "@/lib/remake/validation";

export const Route = createFileRoute("/forgot-password")({
  head: () => pageHead("Reset password", "Reset your Remake password with a code sent to your phone."),
  component: Forgot,
});

function Forgot() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [error, setError] = useState("");

  const next = () => {
    setError("");
    if (step === 1) {
      const e = validatePhone(phone);
      if (e) return setError(e);
      setStep(2);
    } else if (step === 2) {
      if (code !== DEMO_CODE) return setError("That code is incorrect. Try 123456 for this demo.");
      setStep(3);
    } else if (step === 3) {
      const e = validatePassword(pw);
      if (e) return setError(e);
      if (pw !== pw2) return setError("Passwords don't match");
      setStep(4);
    }
  };

  return (
    <div className="flex h-full flex-col bg-background animate-screen-in">
      <ScreenHeader
        title="Reset password"
        {...(step > 1 && step < 4 ? { onBack: () => setStep((s) => (s - 1) as 1 | 2 | 3) } : { fallback: "/login" })}
      />
      {step < 4 && <FlowProgress value={step} total={3} />}
      <div key={step} className="flex flex-1 flex-col px-5 pb-safe pt-4 animate-screen-in">
        {step === 1 && (
          <>
            <Icon />
            <h1 className="mt-6 text-2xl font-bold">Forgot your password?</h1>
            <p className="mt-2 text-[15px] text-muted-foreground">Enter your phone number and we'll text you a reset code.</p>
            <Field
              className="mt-7"
              label="Phone"
              prefix="+220"
              inputMode="numeric"
              maxLength={7}
              placeholder="7 digit number"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value.replace(/\D/g, ""));
                setError("");
              }}
              error={error}
            />
          </>
        )}
        {step === 2 && (
          <>
            <Icon />
            <h1 className="mt-6 text-2xl font-bold">Enter reset code</h1>
            <p className="mt-2 text-[15px] text-muted-foreground">Sent to {phoneDisplay(phone)}</p>
            <div className="mt-8">
              <OtpInput value={code} onChange={(v) => { setCode(v); setError(""); }} error={!!error} />
              {error && <p className="mt-3 text-center text-sm font-medium text-destructive">{error}</p>}
            </div>
            <div className="mt-5 text-center"><DemoBadge>Demo code: 123456</DemoBadge></div>
          </>
        )}
        {step === 3 && (
          <>
            <Icon />
            <h1 className="mt-6 text-2xl font-bold">Create a new password</h1>
            <div className="mt-7 space-y-5">
              <Field label="New password" icon={Lock} type="password" value={pw} onChange={(e) => { setPw(e.target.value); setError(""); }} placeholder="At least 6 characters" />
              <Field label="Confirm password" icon={Lock} type="password" value={pw2} onChange={(e) => { setPw2(e.target.value); setError(""); }} placeholder="Repeat password" error={error} />
            </div>
          </>
        )}
        {step === 4 && (
          <StateView icon={CheckCircle2} title="Password updated" body="You can now sign in with your new password." className="my-auto" />
        )}
        <div className="mt-auto pt-6">
          {step < 4 ? (
            <Button size="lg" onClick={next}>
              {step === 1 ? "Send code" : step === 2 ? "Verify code" : "Save password"}
            </Button>
          ) : (
            <Button size="lg" onClick={() => navigate({ to: "/login", replace: true })}>
              Back to sign in
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Icon() {
  return (
    <span className="grid size-16 place-items-center rounded-3xl bg-primary-soft text-primary-deep">
      <KeyRound className="size-8" />
    </span>
  );
}
