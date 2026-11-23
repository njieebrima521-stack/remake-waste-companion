import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MessageSquareText } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { DemoBadge } from "@/components/remake/bits";
import { OtpInput } from "@/components/remake/OtpInput";
import { ScreenHeader } from "@/components/remake/Screen";
import { Button } from "@/components/ui/button";
import { phoneDisplay } from "@/lib/remake/format";
import { pageHead } from "@/lib/remake/head";
import { actions, useApp } from "@/lib/remake/store";
import { DEMO_CODE } from "@/lib/remake/validation";

export const Route = createFileRoute("/verify")({
  head: () => pageHead("Verify phone", "Confirm your phone number with the code we sent."),
  component: Verify,
});



function Verify() {
  const phone = useApp((s) => s.user.phone);
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(30);

  useEffect(() => {
    if (timer <= 0) return;
    const t = setTimeout(() => setTimer((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  const verify = (value = code) => {
    if (value.length < 6) return setError("Enter all 6 digits");
    if (value !== DEMO_CODE) return setError("That code is incorrect. Try 123456 for this demo.");
    actions.signIn();
    toast.success("Phone verified", { description: "Welcome to Remake! You've got 100 bonus Green Coins." });
    void navigate({ to: "/home", replace: true });
  };

  return (
    <div className="flex h-full flex-col bg-background animate-screen-in">
      <ScreenHeader fallback="/register" />
      <div className="flex flex-1 flex-col px-5 pb-safe">
        <span className="grid size-16 place-items-center rounded-3xl bg-primary-soft text-primary-deep">
          <MessageSquareText className="size-8" />
        </span>
        <h1 className="mt-6 text-[28px] font-bold">Verify your number</h1>
        <p className="mt-2 text-[15px] text-muted-foreground">
          Enter the 6-digit code sent by SMS to <span className="font-semibold text-foreground">{phoneDisplay(phone)}</span>
        </p>
        <div className="mt-8">
          <OtpInput
            value={code}
            onChange={(v) => {
              setCode(v);
              setError("");
            }}
            onComplete={verify}
            error={!!error}
          />
          {error && <p className="mt-3 text-center text-sm font-medium text-destructive">{error}</p>}
        </div>
        <div className="mt-6 flex flex-col items-center gap-3">
          <DemoBadge>Demo code: 123456</DemoBadge>
          <button
            disabled={timer > 0}
            onClick={() => {
              setTimer(30);
              toast("New code sent", { description: "Simulated SMS — use 123456." });
            }}
            className="text-[15px] font-semibold text-primary disabled:text-muted-foreground"
          >
            {timer > 0 ? `Resend code in ${timer}s` : "Resend code"}
          </button>
        </div>
        <div className="mt-auto">
          <Button size="lg" onClick={() => verify()}>
            Verify
          </Button>
        </div>
      </div>
    </div>
  );
}
