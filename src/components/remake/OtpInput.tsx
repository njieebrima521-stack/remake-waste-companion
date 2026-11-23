import { OTPInput } from "input-otp";

import { cn } from "@/lib/utils";

export function OtpInput({
  value,
  onChange,
  error,
  onComplete,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: boolean;
  onComplete?: (v: string) => void;
}) {
  return (
    <OTPInput
      maxLength={6}
      value={value}
      onChange={onChange}
      inputMode="numeric"
      autoFocus
      {...(onComplete ? { onComplete } : {})}
      containerClassName="flex justify-center gap-2"
      render={({ slots }) => (
        <>
          {slots.map((slot, i) => (
            <div
              key={i}
              className={cn(
                "relative grid h-16 w-12 place-items-center rounded-2xl border-2 bg-card font-display text-2xl font-semibold transition",
                slot.isActive
                  ? "border-primary ring-4 ring-primary/15"
                  : error
                    ? "border-destructive"
                    : "border-input",
              )}
            >
              {slot.char}
              {slot.hasFakeCaret && (
                <span className="absolute h-7 w-0.5 animate-pulse bg-foreground" />
              )}
            </div>
          ))}
        </>
      )}
    />
  );
}
