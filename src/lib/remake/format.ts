import { differenceInCalendarDays, format, formatDistanceToNowStrict, parseISO } from "date-fns";

export function coins(n: number) {
  return n.toLocaleString("en-GB");
}

export function dayLabel(dateIso: string) {
  const d = parseISO(dateIso);
  const diff = differenceInCalendarDays(d, new Date());
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return format(d, "EEE d MMM");
}

export function longDate(dateIso: string) {
  return format(parseISO(dateIso), "EEEE, d MMMM yyyy");
}

export function shortDateTime(iso: string) {
  return format(parseISO(iso), "d MMM · HH:mm");
}

export function ago(iso: string) {
  return `${formatDistanceToNowStrict(parseISO(iso))} ago`;
}

export function phoneDisplay(p: string) {
  const d = p.replace(/\D/g, "");
  return `+220 ${d.slice(0, 3)} ${d.slice(3)}`.trim();
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
}
