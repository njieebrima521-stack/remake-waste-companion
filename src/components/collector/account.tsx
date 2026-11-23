import { Pill } from "@/components/remake/bits";
import type { VerificationStatus } from "@/lib/remake/types";
import { cn } from "@/lib/utils";

const STATUS: Record<VerificationStatus, { label: string; tone: string }> = {
  awaiting: { label: "Awaiting verification", tone: "bg-warning-soft text-warning-foreground" },
  approved: { label: "Approved", tone: "bg-primary-soft text-primary-deep" },
  rejected: { label: "Rejected", tone: "bg-destructive-soft text-destructive" },
  suspended: { label: "Suspended", tone: "bg-destructive-soft text-destructive" },
};

export function VerificationStatusPill({ status, className }: { status: VerificationStatus; className?: string }) {
  return <Pill className={cn(STATUS[status].tone, className)}>{STATUS[status].label}</Pill>;
}

export function statusLabel(s: VerificationStatus) {
  return STATUS[s].label;
}
