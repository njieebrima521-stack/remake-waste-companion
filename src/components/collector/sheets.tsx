import { useState } from "react";

import { TextArea } from "@/components/remake/Field";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { REJECT_REASONS, TIME_SLOTS } from "@/lib/remake/data";
import { dayLabel } from "@/lib/remake/format";
import { isoDay } from "@/lib/remake/collector";
import { cn } from "@/lib/utils";

import { Chip } from "./PhotoPicker";

export function RejectSheet({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState<string>("");
  const [other, setOther] = useState("");
  const final = reason === "Other" ? other.trim() : reason;
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90dvh]">
        <DrawerHeader className="text-left">
          <DrawerTitle className="font-display text-xl">Reject this request?</DrawerTitle>
          <DrawerDescription>Tell the requester why. It goes to the next suitable collector.</DrawerDescription>
        </DrawerHeader>
        <div className="no-scrollbar space-y-2 overflow-y-auto px-4 pb-4">
          {REJECT_REASONS.map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={reason === r}
              onClick={() => setReason(r)}
              className={cn(
                "flex w-full items-center rounded-2xl border-2 bg-card px-4 py-3.5 text-left text-[15px] font-medium",
                reason === r ? "border-primary" : "border-transparent",
              )}
            >
              {r}
            </button>
          ))}
          {reason === "Other" && (
            <TextArea label="Reason" value={other} onChange={setOther} placeholder="Write a short reason" />
          )}
          <Button
            size="lg"
            variant="destructive"
            className="mt-2 w-full"
            disabled={!final}
            onClick={() => {
              onConfirm(final);
              setReason("");
              setOther("");
            }}
          >
            Reject request
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export function ProposeSheet({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onConfirm: (date: string, slot: string) => void;
}) {
  const days = Array.from({ length: 6 }, (_, i) => isoDay(Date.now() + i * 24 * 60 * 60 * 1000));
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("");
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle className="font-display text-xl">Propose another window</DrawerTitle>
          <DrawerDescription>The requester can agree or keep their original time.</DrawerDescription>
        </DrawerHeader>
        <div className="space-y-4 px-4 pb-4">
          <div>
            <p className="mb-2 text-sm font-medium">Day</p>
            <div className="flex flex-wrap gap-2">
              {days.map((d) => (
                <Chip key={d} selected={date === d} onClick={() => setDate(d)}>
                  {dayLabel(d)}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Time window</p>
            <div className="flex flex-wrap gap-2">
              {TIME_SLOTS.map((s) => (
                <Chip key={s} selected={slot === s} onClick={() => setSlot(s)}>
                  {s}
                </Chip>
              ))}
            </div>
          </div>
          <Button size="lg" className="w-full" disabled={!date || !slot} onClick={() => onConfirm(date, slot)}>
            Send proposal
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export function NoteSheet({
  open,
  onOpenChange,
  title,
  description,
  suggestions,
  confirmLabel,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description: string;
  suggestions: string[];
  confirmLabel: string;
  onConfirm: (note: string) => void;
}) {
  const [note, setNote] = useState("");
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle className="font-display text-xl">{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>
        <div className="space-y-3 px-4 pb-4">
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <Chip key={s} selected={note === s} onClick={() => setNote(s)}>
                {s}
              </Chip>
            ))}
          </div>
          <TextArea label="Note" value={note} onChange={setNote} placeholder="What happened?" />
          <Button
            size="lg"
            className="w-full"
            disabled={!note.trim()}
            onClick={() => {
              onConfirm(note.trim());
              setNote("");
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
