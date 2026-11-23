import { COIN_RATES, COLLECTORS, PARTNERS, RECYCLABLE, STATUS_FLOW } from "./data";
import type {
  AppState,
  Collector,
  DetectedItem,
  Draft,
  MaterialId,
  Pickup,
  Redemption,
  Reward,
  Transaction,
} from "./types";

export interface WalletSummary {
  available: number;
  pending: number;
  totalEarned: number;
  redeemed: number;
}

export function walletSummary(transactions: Transaction[]): WalletSummary {
  let totalEarned = 0;
  let pending = 0;
  let redeemed = 0;
  for (const t of transactions) {
    if (t.type === "redeem") redeemed += t.amount;
    else if (t.status === "pending") pending += t.amount;
    else totalEarned += t.amount;
  }
  return { available: totalEarned - redeemed, pending, totalEarned, redeemed };
}

/** Distinct material types found in a scan. */
export function materialTypes(items: DetectedItem[]): MaterialId[] {
  return Array.from(new Set(items.filter((i) => i.count > 0).map((i) => i.material)));
}

/** More than one recyclable material in the same photo must be separated before booking. */
export function isMixed(items: DetectedItem[]): boolean {
  return materialTypes(items).length > 1;
}

export function isAcceptedRecyclable(material: MaterialId): boolean {
  return RECYCLABLE.includes(material) || material === "organic";
}

/** The waste category a draft booking is for. General-waste bookings are always "general". */
export function draftMaterial(draft: Pick<Draft, "kind" | "material">): MaterialId | undefined {
  return draft.kind === "general" ? "general" : draft.material;
}

/**
 * Whether a collector takes this exact waste category. Non-recyclable categories (general waste,
 * mixed plastics) never go to recycling organisations, even if listed.
 */
export function collectorAccepts(c: Collector, material: MaterialId): boolean {
  if (!c.accepts.includes(material)) return false;
  if (!isAcceptedRecyclable(material) && c.type === "recycler") return false;
  return true;
}

export function estimateCoins(material: MaterialId, bags: number): number {
  return COIN_RATES[material] * Math.max(0, bags);
}

export function partnerFor(material: MaterialId) {
  return PARTNERS.find((p) => p.accepts.includes(material)) ?? null;
}

/** Non-recyclable or residual waste: handled by general-waste collectors, never recycling companies. */
export function isResidual(material: MaterialId): boolean {
  return !isAcceptedRecyclable(material);
}

/**
 * Collectors offered for a waste category in an area, recommended first. Empty when nobody suitable.
 *
 * - Recyclables: every collector approved for the material, local first, recycling companies
 *   before independent operators.
 * - Residual waste: private general-waste companies are prioritised. Independent operators
 *   (including donkey carts) are only offered when no private company that serves the area is
 *   available — they never get priority over a suitable private company.
 */
export function eligibleCollectors(
  material: MaterialId | undefined,
  area: string,
  collectors: Collector[] = directory,
  unavailable: readonly string[] = [],
): Collector[] {
  if (!material) return [];
  const pool = collectors.filter((c) => collectorAccepts(c, material) && !unavailable.includes(c.id));
  const rank = (c: Collector) => (c.category === "independent" ? 1 : 0);
  const sorted = (list: Collector[]) =>
    [...list].sort((a, b) => {
      const aLocal = a.areas.includes(area) ? 1 : 0;
      const bLocal = b.areas.includes(area) ? 1 : 0;
      if (aLocal !== bLocal) return bLocal - aLocal;
      if (rank(a) !== rank(b)) return rank(a) - rank(b);
      return b.rating - a.rating;
    });
  if (!isResidual(material)) return sorted(pool);
  const privates = pool.filter((c) => c.category !== "independent");
  if (privates.some((c) => c.areas.includes(area))) return sorted(privates);
  const fallback = pool.filter((c) => c.category === "independent" && c.areas.includes(area));
  if (fallback.length) return sorted(fallback);
  return sorted(privates);
}

let directory: Collector[] = COLLECTORS;

/**
 * The collector list every screen uses: the sample collectors plus any approved through the
 * registration demo, with each collector's own profile edits applied. Set by the store.
 */
export function setCollectorDirectory(list: Collector[]) {
  directory = list;
}

export function allCollectors(): Collector[] {
  return directory;
}

export function findCollector(id: string | null | undefined): Collector | undefined {
  return id ? directory.find((c) => c.id === id) : undefined;
}

export type RedeemResult =
  | { ok: true; state: AppState; redemption: Redemption }
  | { ok: false; reason: "insufficient"; shortBy: number };

export function redeemReward(state: AppState, reward: Reward, now: number): RedeemResult {
  const { available } = walletSummary(state.transactions);
  if (available < reward.cost) {
    return { ok: false, reason: "insufficient", shortBy: reward.cost - available };
  }
  const at = new Date(now).toISOString();
  const code = `RMK-${reward.id.slice(2, 4).toUpperCase()}-${String(now).slice(-4)}`;
  const redemption: Redemption = {
    id: `x${now}`,
    rewardId: reward.id,
    name: reward.name,
    cost: reward.cost,
    at,
    code,
    status: "issued",
  };
  const tx: Transaction = {
    id: `t${now}`,
    type: "redeem",
    amount: reward.cost,
    label: `${reward.name} · ${reward.tagline}`,
    at,
    status: "completed",
  };
  return {
    ok: true,
    redemption,
    state: {
      ...state,
      transactions: [tx, ...state.transactions],
      redemptions: [redemption, ...state.redemptions],
      notifications: [
        {
          id: `n${now}`,
          title: "Reward redeemed",
          body: `${reward.name} voucher ${code} is ready.`,
          at,
          read: false,
          kind: "reward",
        },
        ...state.notifications,
      ],
    },
  };
}

export function nextPickupId(pickups: Pickup[]): string {
  const max = pickups.reduce((m, p) => Math.max(m, Number(p.id.replace("RMK-", "")) || 0), 1000);
  return `RMK-${max + 1}`;
}

const TOKEN_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

/** A random, unguessable token for a booking's collection QR code. Contains no personal details. */
export function newCollectionToken(taken: Iterable<string> = []): string {
  const used = new Set(taken);
  for (;;) {
    const bytes = new Uint8Array(16);
    globalThis.crypto.getRandomValues(bytes);
    const token = Array.from(bytes, (b) => TOKEN_ALPHABET[b % TOKEN_ALPHABET.length]).join("");
    if (!used.has(token)) return token;
  }
}

const QR_PREFIX = "REMAKE-COLLECT:";

/** What the booking's QR code encodes: only the opaque token. */
export function qrPayload(p: Pickup): string {
  return `${QR_PREFIX}${p.collectionToken}`;
}

/** Short code printed under the QR, for collectors to type if scanning fails. */
export function collectionCode(p: Pickup): string {
  const t = p.collectionToken;
  return `${t.slice(0, 4)}-${t.slice(4, 8)}`;
}

/** Finds the booking for a scanned QR payload or a typed short code. */
export function resolveScan(pickups: Pickup[], input: string): Pickup | null {
  const raw = input.trim().toUpperCase();
  if (!raw) return null;
  if (raw.startsWith(QR_PREFIX)) {
    const token = raw.slice(QR_PREFIX.length);
    return pickups.find((p) => p.collectionToken === token) ?? null;
  }
  const short = raw.replace(/[^0-9A-Z]/g, "");
  if (short.length !== 8) return null;
  return pickups.find((p) => p.collectionToken.slice(0, 8) === short) ?? null;
}

export type ScanStatus =
  "ready" | "invalid" | "cancelled" | "collected" | "verified" | "unassigned" | "wrong_collector";

/** What a collector sees after scanning: whether they may confirm collection now. */
export function scanStatus(p: Pickup | null, scannerId: string): ScanStatus {
  if (!p) return "invalid";
  if (p.status === "cancelled") return "cancelled";
  if (p.status === "verified") return "verified";
  if (p.status === "collected") return "collected";
  if (!p.collectorId) return "unassigned";
  if (p.collectorId !== scannerId) return "wrong_collector";
  return "ready";
}

export type ConfirmResult =
  | { ok: true; state: AppState; pickup: Pickup }
  | { ok: false; reason: Exclude<ScanStatus, "ready"> };

/**
 * The assigned collector confirms physical collection by scanning the booking QR.
 * Coins move to pending only; they're released later, after material verification.
 */
export function confirmCollection(
  state: AppState,
  pickupId: string,
  scannerId: string,
  now: number,
): ConfirmResult {
  const current = state.pickups.find((p) => p.id === pickupId) ?? null;
  const check = scanStatus(current, scannerId);
  if (check !== "ready" || !current)
    return { ok: false, reason: check === "ready" ? "invalid" : check };
  const at = new Date(now).toISOString();
  const collector = findCollector(scannerId);
  const updated: Pickup = {
    ...current,
    status: "collected",
    collectedAt: at,
    collectedBy: scannerId,
    timeline: [
      ...current.timeline,
      { status: "collected", at, note: `QR scanned by ${collector?.name ?? "your collector"}` },
    ],
  };
  delete updated.flag;
  let transactions = state.transactions;
  if (updated.coins > 0 && !updated.institution && !transactions.some((t) => t.pickupId === updated.id)) {
    transactions = [
      {
        id: `t${now}`,
        type: "earn",
        amount: updated.coins,
        label: `${updated.quantity} bag${updated.quantity > 1 ? "s" : ""} collected`,
        at,
        status: "pending",
        pickupId: updated.id,
      },
      ...transactions,
    ];
  }
  const recyclable = updated.kind === "recyclable";
  const pickups = state.pickups.map((p) => (p.id === pickupId ? updated : p));
  // Institutional requests aren't the resident's bookings: no resident notification.
  if (updated.institution) return { ok: true, pickup: updated, state: { ...state, pickups } };
  return {
    ok: true,
    pickup: updated,
    state: {
      ...state,
      pickups,
      transactions,
      notifications: [
        {
          id: `n${now}`,
          title: "Collection confirmed",
          body: recyclable
            ? `${collector?.name ?? "Your collector"} scanned ${updated.id}. Material verification is pending — coins are released once it's verified.`
            : `${collector?.name ?? "Your collector"} scanned ${updated.id} and collected your waste.`,
          at,
          read: false,
          kind: "pickup",
          link: updated.id,
        },
        ...state.notifications,
      ],
    },
  };
}

export function createPickup(
  state: AppState,
  draft: Draft,
  now: number,
  token: string = newCollectionToken(state.pickups.map((p) => p.collectionToken)),
): Pickup {
  const material: MaterialId = draftMaterial(draft) ?? "plastic";
  const kind = isAcceptedRecyclable(material) ? "recyclable" : "general";
  const at = new Date(now).toISOString();
  const chosen = findCollector(draft.collectorId);
  // Never keep a collector that doesn't accept this waste category.
  const collectorId = chosen && collectorAccepts(chosen, material) ? chosen.id : null;
  const pickup: Pickup = {
    id: nextPickupId(state.pickups),
    collectionToken: token,
    kind,
    material,
    items: draft.items.filter((i) => i.material === material),
    quantity: draft.quantity,
    description: draft.description,
    address: draft.address,
    area: draft.area,
    landmark: draft.landmark,
    date: draft.date ?? at.slice(0, 10),
    slot: draft.slot ?? "",
    collectorId,
    partnerId: kind === "recyclable" ? (partnerFor(material)?.id ?? null) : null,
    status: collectorId ? "submitted" : "awaiting",
    createdAt: at,
    timeline: collectorId
      ? [{ status: "submitted", at }]
      : [
          { status: "submitted", at },
          { status: "awaiting", at, note: "We'll match a collector as soon as one is free." },
        ],
    coins: kind === "recyclable" ? estimateCoins(material, draft.quantity) : 0,
  };
  if (draft.photo && !draft.photo.startsWith("blob:")) pickup.photo = draft.photo;
  return pickup;
}

export type DemoStep = "advance" | "scan" | "verify" | null;

/**
 * What the demo can do next for this pickup: move the collector along, wait for the
 * collector's QR scan, or simulate the recycling partner verifying the material.
 */
export function nextDemoStep(p: Pickup): DemoStep {
  if (p.status === "cancelled" || p.status === "verified") return null;
  if (p.status === "collected") return p.kind === "recyclable" ? "verify" : null;
  if (p.status === "on_the_way") return "scan";
  return "advance";
}

/**
 * Moves a pickup one simulated step forward. It never confirms collection — only the
 * assigned collector's QR scan does that. Verifying recyclables releases their coins.
 */
export function advancePickup(state: AppState, id: string, now: number): AppState {
  const at = new Date(now).toISOString();
  let credited: Pickup | null = null;
  const pickups = state.pickups.map((p) => {
    if (p.id !== id) return p;
    const step = nextDemoStep(p);
    if (step !== "advance" && step !== "verify") return p;
    const next = STATUS_FLOW[STATUS_FLOW.indexOf(p.status) + 1];
    if (!next) return p;
    let collectorId = p.collectorId;
    if (next === "assigned" && !collectorId) {
      // Only match a collector that accepts this waste category; otherwise keep waiting.
      collectorId = eligibleCollectors(p.material, p.area)[0]?.id ?? null;
      if (!collectorId) return p;
    }
    const updated: Pickup = {
      ...p,
      collectorId,
      status: next,
      timeline: [...p.timeline, { status: next, at }],
    };
    delete updated.flag;
    if (next === "verified" && p.coins > 0) credited = updated;
    return updated;
  });
  const transactions = credited
    ? releaseCoins(state.transactions, credited, now)
    : state.transactions;
  return { ...state, pickups, transactions };
}

/** Verified material: the pickup's pending coins become available (or are added if missing). */
export function releaseCoins(transactions: Transaction[], p: Pickup, now: number): Transaction[] {
  if (p.coins <= 0 || p.institution) return transactions;
  const at = new Date(now).toISOString();
  const exists = transactions.some((t) => t.pickupId === p.id);
  return exists
    ? transactions.map((t) => (t.pickupId === p.id ? { ...t, status: "completed" as const, at } : t))
    : [
        {
          id: `t${now}`,
          type: "earn",
          amount: p.coins,
          label: `${p.quantity} bag${p.quantity > 1 ? "s" : ""} verified`,
          at,
          status: "completed",
          pickupId: p.id,
        },
        ...transactions,
      ];
}

const residentCache = new WeakMap<Pickup[], Pickup[]>();
/** The resident's own bookings — institutional requests only appear in the collector app. */
export function residentPickups(pickups: Pickup[]): Pickup[] {
  let hit = residentCache.get(pickups);
  if (!hit) {
    hit = pickups.filter((p) => !p.institution);
    residentCache.set(pickups, hit);
  }
  return hit;
}

export function cancelPickup(state: AppState, id: string, reason: string, now: number): AppState {
  const at = new Date(now).toISOString();
  return {
    ...state,
    pickups: state.pickups.map((p) =>
      p.id === id && p.status !== "collected" && p.status !== "verified"
        ? {
            ...p,
            status: "cancelled",
            cancelReason: reason,
            timeline: [...p.timeline, { status: "cancelled", at, note: "Cancelled by you" }],
          }
        : p,
    ),
  };
}

export function isActive(p: Pickup) {
  return p.status === "on_the_way" || (p.flag === "delayed" && p.status === "assigned");
}
export function isUpcoming(p: Pickup) {
  return ["submitted", "awaiting", "assigned"].includes(p.status) && !isActive(p);
}
export function isCompleted(p: Pickup) {
  return p.status === "collected" || p.status === "verified";
}

export function isCancelled(p: Pickup) {
  return p.status === "cancelled";
}

/** A time slot can be booked unless it starts within the next hour of today. */
export function slotAvailable(dateIso: string, slot: string, now: Date = new Date()): boolean {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  if (dateIso !== `${y}-${m}-${d}`) return dateIso > `${y}-${m}-${d}`;
  const start = Number(slot.slice(0, 2));
  return start > now.getHours() + 1;
}

export type TrackState = "done" | "current" | "upcoming" | "skipped";

export interface TrackStep {
  key: string;
  label: string;
  state: TrackState;
  at?: string;
  note?: string;
}

/**
 * The tracking timeline shown on a pickup. Collection (QR scan), material verification and
 * the Green Coins release are separate steps; coins only count as released once verified.
 */
export function trackingSteps(p: Pickup): TrackStep[] {
  const recyclable = p.kind === "recyclable";
  const flow: [PickupStatusInFlow, string][] = [
    ["submitted", "Booking confirmed"],
    ["awaiting", "Awaiting collector"],
    ["assigned", "Collector assigned"],
    ["on_the_way", "Collector on the way"],
    ["collected", "QR scanned · collection confirmed"],
  ];
  const cancelled = p.status === "cancelled";
  const reached = cancelled
    ? Math.max(
        -1,
        ...p.timeline
          .filter((t) => t.status !== "cancelled")
          .map((t) => STATUS_FLOW.indexOf(t.status)),
      )
    : STATUS_FLOW.indexOf(p.status);
  const stateAt = (i: number): TrackState =>
    i <= reached
      ? "done"
      : !cancelled && i === reached + 1
        ? "current"
        : cancelled
          ? "skipped"
          : "upcoming";

  const steps: TrackStep[] = flow.map(([status, label], i) => {
    const entry = [...p.timeline].reverse().find((t) => t.status === status);
    const state = stateAt(i);
    const step: TrackStep = { key: status, label, state };
    if (entry && i <= reached) step.at = entry.at;
    if (entry?.note && i <= reached) step.note = entry.note;
    if (status === "collected" && state === "current")
      step.note = "Show your QR code when the collector arrives";
    if (state === "current" && p.flag === "delayed")
      step.note = "Running late — we'll keep you updated";
    if (state === "current" && p.flag === "declined")
      step.note = "The collector declined. Choose another one.";
    return step;
  });

  const collectedIdx = STATUS_FLOW.indexOf("collected");
  const verifiedIdx = STATUS_FLOW.indexOf("verified");
  if (!recyclable) {
    const coins: TrackStep = {
      key: "coins",
      label: "Green Coins released",
      state: "skipped",
      note: "General waste doesn't earn Green Coins",
    };
    return [...steps, coins];
  }

  const pending: TrackStep = {
    key: "verification",
    label: "Material verification pending",
    state: "upcoming",
  };
  const verified: TrackStep = {
    key: "verified",
    label: "Material received and verified",
    state: "upcoming",
  };
  const coinsStep: TrackStep = { key: "coins", label: "Green Coins released", state: "upcoming" };
  const v = p.timeline.find((t) => t.status === "verified");
  if (cancelled) {
    pending.state = verified.state = coinsStep.state = "skipped";
    coinsStep.note = "Pickup was cancelled";
  } else if (reached >= verifiedIdx) {
    pending.state = verified.state = "done";
    if (v) verified.at = v.at;
    if (p.coins > 0) {
      coinsStep.state = "done";
      coinsStep.note = `${p.coins} Green Coins added to your wallet`;
      if (v) coinsStep.at = v.at;
    } else {
      coinsStep.state = "skipped";
      coinsStep.note = "This material doesn't earn Green Coins";
    }
  } else if (reached >= collectedIdx) {
    pending.state = "current";
    pending.note = "The recycling partner is checking your material";
    coinsStep.note = `Up to ${p.coins} coins, pending verification`;
  } else {
    coinsStep.note = `Up to ${p.coins} coins once your material is verified`;
  }
  return [...steps, pending, verified, coinsStep];
}

type PickupStatusInFlow = Exclude<Pickup["status"], "cancelled">;
