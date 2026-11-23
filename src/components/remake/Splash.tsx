import { Logo } from "./Logo";

export function SplashMark() {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-primary">
      <Logo onGreen dot className="animate-splash-mark text-6xl" />
      <p className="mt-3 animate-fade-up text-sm font-medium text-primary-foreground/85 [animation-delay:250ms]">
        Cleaner Gambia, together
      </p>
    </div>
  );
}
