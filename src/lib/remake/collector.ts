/**
 * Collector-side rules: who sees which request, readiness and minimum quantities, accepting /
 * rejecting / proposing windows, collection routes, collection confirmation, material
 * verification, history and the registration demo. Pure functions over AppState — the store
 * applies them. All behaviour is simulated; there is no backend, GPS or route optimisation.
 */
import {
  COLLECTORS,
  DEFAULT_THRESHOLDS,
  KG_PER_BAG,
  MATERIALS,
  PARTNERS,
  SAMPLE_ACCOUNTS,
  SUSPENDED_COLLECTORS,
  ZONES,
  type SampleAccount,
} from "./data";
import {
  collectorAccepts,
  confirmCollection,
  eligibleCollectors,
  newCollectionToken,
  releaseCoins,
  type ScanStatus,
} from "./logic";
import type {
  AppNotification,
  AppState,
  CollectionRoute,
  Collector,
  CollectorApplication,
  CollectorEdits,
  MaterialId,
  MaterialVerification,
  Pickup,
  RouteStop,
  VerificationResult,
  WorkNotification,
} from "./types";

export type Result = { ok: true; state: AppState } | { ok: false; error: string };

export function isoDay(now: number) {
  return new Date(now).toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------------------------
// Directory, availability
// ---------------------------------------------------------------------------------------------

type DirectoryInput = Pick<AppState, "registeredCollectors" | "collectorEdits">;
let lastReg: Collector[] | undefined;
let lastEdits: Record<string, CollectorEdits> | undefined;
let lastDir: Collector[] = COLLECTORS;

function applyEdits(c: Collector, e: CollectorEdits | undefined): Collector {
  if (!e) return c;
  const next: Collector = { ...c };
  if (e.contactName) {
    next.contactName = e.contactName;
    if (c.category === "independent") next.name = e.contactName;
  }
  if (e.phone) next.phone = e.phone;
  if (e.email !== undefined) next.email = e.email;
  if (e.vehicle) next.vehicle = e.vehicle;
  if (e.capacityBags) next.capacityBags = e.capacityBags;
  if (e.image) next.image = e.image;
  if (e.areas?.length) next.areas = e.areas;
  return next;
}

/** Sample collectors plus approved registrations, with each collector's own edits applied. */
export function collectorDirectory(state: DirectoryInput): Collector[] {
  const reg = state.registeredCollectors ?? [];
  const edits = state.collectorEdits ?? {};
  if (reg === lastReg && edits === lastEdits) return lastDir;
  lastReg = reg;
  lastEdits = edits;
  lastDir = [...COLLECTORS, ...reg].map((c) => applyEdits(c, edits[c.id]));
  return lastDir;
}

export function getCollector(state: DirectoryInput, id: string | null | undefined) {
  return id ? collectorDirectory(state).find((c) => c.id === id) : undefined;
}

/** Available = not suspended by Remake and not switched to "unavailable" by the collector. */
export function isAvailable(state: Pick<AppState, "collectorEdits">, id: string) {
  return !SUSPENDED_COLLECTORS.includes(id) && state.collectorEdits?.[id]?.available !== false;
}

export function unavailableIds(state: DirectoryInput): string[] {
  return collectorDirectory(state)
    .filter((c) => !isAvailable(state, c.id))
    .map((c) => c.id);
}

// ---------------------------------------------------------------------------------------------
// Materials, minimum quantities, readiness
// ---------------------------------------------------------------------------------------------

export type MaterialClass = "confirmed" | "potential" | "residual" | "special";

/**
 * Recyclable with a confirmed partner, potentially recyclable (no partner accepts it yet — e.g.
 * mixed plastics, which are not automatically written off), residual, or special/hazardous.
 */
export function materialClass(m: MaterialId): MaterialClass {
  if (m === "special") return "special";
  if (PARTNERS.some((p) => p.accepts.includes(m))) return "confirmed";
  if (m === "mixed_plastic") return "potential";
  return "residual";
}

export function minimumFor(thresholds: AppState["thresholds"] | undefined, m: MaterialId) {
  return thresholds?.[m] ?? DEFAULT_THRESHOLDS[m];
}

export function estKg(p: Pickup) {
  return p.estimatedKg ?? p.quantity * KG_PER_BAG[p.material];
}

export type Readiness =
  | "below_minimum"
  | "awaiting_more"
  | "not_ready"
  | "ready"
  | "scheduled"
  | "collected"
  | "verified"
  | "cancelled";

/**
 * Where a request stands. Below-minimum requests stay visible as accumulation requests;
 * a collector can only accept a request once it is ready.
 */
export function readiness(p: Pickup, thresholds?: AppState["thresholds"]): Readiness {
  if (p.status === "cancelled") return "cancelled";
  if (p.status === "verified") return "verified";
  if (p.status === "collected") return "collected";
  if (p.notReady) return "not_ready";
  if (p.status === "assigned" || p.status === "on_the_way") return "scheduled";
  if (p.quantity < minimumFor(thresholds, p.material)) {
    return p.awaitingMore ? "awaiting_more" : "below_minimum";
  }
  if (p.separated === false) return "not_ready";
  if (p.readyFrom && p.readyFrom > p.date) return "not_ready";
  return "ready";
}

// ---------------------------------------------------------------------------------------------
// Visibility
// ---------------------------------------------------------------------------------------------

const OPEN = new Set(["submitted", "awaiting"]);

/** Sent to this collector by name and waiting for them to accept. */
export function isDirectRequest(p: Pickup, collectorId: string) {
  return p.collectorId === collectorId && OPEN.has(p.status);
}

export function isMyJob(p: Pickup, collectorId: string) {
  return p.collectorId === collectorId && (p.status === "assigned" || p.status === "on_the_way");
}

/**
 * An unassigned request this collector may take: an approved category, inside its service
 * area, never special waste, and allowed by the routing rules (residual waste goes to private
 * companies first; independents only as fallback). Unavailable collectors see none.
 */
export function canSeeOpenRequest(state: AppState, c: Collector, p: Pickup): boolean {
  if (p.collectorId || !OPEN.has(p.status)) return false;
  if (p.material === "special") return false;
  if (!collectorAccepts(c, p.material)) return false;
  if (!c.areas.includes(p.area)) return false;
  if (p.declined?.some((d) => d.collectorId === c.id)) return false;
  return eligibleCollectors(p.material, p.area, collectorDirectory(state), unavailableIds(state)).some(
    (x) => x.id === c.id,
  );
}

/** Whether this collector may open the request's details at all. */
export function canViewRequest(state: AppState, c: Collector, p: Pickup): boolean {
  return (
    canSeeOpenRequest(state, c, p) ||
    p.collectorId === c.id ||
    p.collectedBy === c.id ||
    !!p.declined?.some((d) => d.collectorId === c.id) ||
    p.proposal?.collectorId === c.id
  );
}

export interface RequestBoard {
  /** Ready requests: sent to me, or open to me. */
  incoming: Pickup[];
  /** Accepted, not yet collected. */
  accepted: Pickup[];
  /** Below minimum, awaiting more waste, or not ready yet. */
  building: Pickup[];
}

export function requestBoard(state: AppState, c: Collector): RequestBoard {
  const board: RequestBoard = { incoming: [], accepted: [], building: [] };
  for (const p of state.pickups) {
    if (isMyJob(p, c.id)) {
      board.accepted.push(p);
      continue;
    }
    if (!isDirectRequest(p, c.id) && !canSeeOpenRequest(state, c, p)) continue;
    (readiness(p, state.thresholds) === "ready" ? board.incoming : board.building).push(p);
  }
  const byDate = (a: Pickup, b: Pickup) => (a.date + a.slot).localeCompare(b.date + b.slot);
  board.incoming.sort((a, b) => {
    const da = isDirectRequest(a, c.id) ? 0 : 1;
    const db = isDirectRequest(b, c.id) ? 0 : 1;
    return da - db || byDate(a, b);
  });
  board.accepted.sort(byDate);
  board.building.sort(byDate);
  return board;
}

// ---------------------------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------------------------

let seq = 0;
function workNote(
  collectorId: string,
  kind: WorkNotification["kind"],
  title: string,
  body: string,
  now: number,
  link?: WorkNotification["link"],
): WorkNotification {
  seq++;
  return {
    id: `w${now}-${seq}`,
    collectorId,
    kind,
    title,
    body,
    at: new Date(now).toISOString(),
    read: false,
    ...(link && { link }),
  };
}

function residentNote(p: Pickup, title: string, body: string, now: number): AppNotification[] {
  if (p.institution) return [];
  seq++;
  return [
    {
      id: `n${now}-${seq}`,
      title,
      body,
      at: new Date(now).toISOString(),
      read: false,
      kind: "pickup",
      link: p.id,
    },
  ];
}

export function requesterName(p: Pickup) {
  return p.institution?.name ?? `Resident booking ${p.id}`;
}

function update(state: AppState, id: string, fn: (p: Pickup) => Pickup): AppState {
  return { ...state, pickups: state.pickups.map((p) => (p.id === id ? fn(p) : p)) };
}

// ---------------------------------------------------------------------------------------------
// Accept / reject / propose
// ---------------------------------------------------------------------------------------------

const NOT_READY_REASON: Partial<Record<Readiness, (p: Pickup, min: number) => string>> = {
  below_minimum: (p, min) => `Below the minimum of ${min} bags (has ${p.quantity}).`,
  awaiting_more: (p, min) => `The requester is still filling bags (${p.quantity} of ${min}).`,
  not_ready: () => "The waste isn't separated and ready for collection yet.",
  scheduled: () => "This request is already accepted.",
  collected: () => "This request was already collected.",
  verified: () => "This request was already collected and verified.",
  cancelled: () => "This request was cancelled.",
};

export function acceptRequest(state: AppState, id: string, collectorId: string, now: number): Result {
  const c = getCollector(state, collectorId);
  const p = state.pickups.find((x) => x.id === id);
  if (!c || !p) return { ok: false, error: "Request not found." };
  if (SUSPENDED_COLLECTORS.includes(c.id)) return { ok: false, error: "Your account is suspended." };
  const direct = isDirectRequest(p, c.id);
  if (!direct && !canSeeOpenRequest(state, c, p)) {
    return {
      ok: false,
      error: isAvailable(state, c.id)
        ? "This request isn't available to you."
        : "You're marked unavailable. Switch availability on to take new requests.",
    };
  }
  const r = readiness(p, state.thresholds);
  if (r !== "ready") {
    return { ok: false, error: NOT_READY_REASON[r]?.(p, minimumFor(state.thresholds, p.material)) ?? "Not ready." };
  }
  const at = new Date(now).toISOString();
  let next = update(state, id, (x) => {
    const u: Pickup = {
      ...x,
      collectorId: c.id,
      status: "assigned",
      timeline: [...x.timeline, { status: "assigned", at, note: `Accepted by ${c.name}` }],
    };
    delete u.flag;
    return u;
  });
  next = {
    ...next,
    workNotifications: [
      workNote(c.id, "accepted", `Accepted: ${requesterName(p)}`, `${p.quantity} bags · ${p.slot}`, now, {
        to: "request",
        id,
      }),
      ...next.workNotifications,
    ],
    notifications: [
      ...residentNote(p, "Collector confirmed", `${c.name} accepted ${p.id}.`, now),
      ...next.notifications,
    ],
  };
  return { ok: true, state: next };
}

export function rejectRequest(
  state: AppState,
  id: string,
  collectorId: string,
  reason: string,
  now: number,
): Result {
  const c = getCollector(state, collectorId);
  const p = state.pickups.find((x) => x.id === id);
  if (!c || !p) return { ok: false, error: "Request not found." };
  if (!reason.trim()) return { ok: false, error: "Choose a reason for rejecting." };
  const direct = isDirectRequest(p, c.id);
  if (!direct && !canSeeOpenRequest(state, c, p)) {
    return { ok: false, error: "This request isn't available to you." };
  }
  const at = new Date(now).toISOString();
  let next = update(state, id, (x) => {
    const declined = [...(x.declined ?? []), { collectorId: c.id, reason: reason.trim(), at }];
    if (!direct) return { ...x, declined };
    return {
      ...x,
      declined,
      collectorId: null,
      status: "awaiting",
      flag: "declined",
      timeline: [...x.timeline, { status: "awaiting", at, note: `Declined by ${c.name}: ${reason.trim()}` }],
    };
  });
  next = {
    ...next,
    workNotifications: [
      workNote(c.id, "rejected", `Rejected: ${requesterName(p)}`, reason.trim(), now, { to: "request", id }),
      ...next.workNotifications,
    ],
    notifications: direct
      ? [
          ...residentNote(p, "Collector declined", `${c.name} can't take ${p.id}. Choose another collector.`, now),
          ...next.notifications,
        ]
      : next.notifications,
  };
  return { ok: true, state: next };
}

export function proposeWindow(
  state: AppState,
  id: string,
  collectorId: string,
  date: string,
  slot: string,
  now: number,
): Result {
  const c = getCollector(state, collectorId);
  const p = state.pickups.find((x) => x.id === id);
  if (!c || !p) return { ok: false, error: "Request not found." };
  if (!isDirectRequest(p, c.id) && !canSeeOpenRequest(state, c, p)) {
    return { ok: false, error: "This request isn't available to you." };
  }
  if (!date || !slot) return { ok: false, error: "Choose a day and a time window." };
  if (date < isoDay(now)) return { ok: false, error: "Choose today or a later day." };
  if (p.proposal?.status === "pending") return { ok: false, error: "A proposal is already waiting for a reply." };
  const at = new Date(now).toISOString();
  let next = update(state, id, (x) => ({
    ...x,
    proposal: { collectorId: c.id, date, slot, status: "pending", at },
  }));
  next = {
    ...next,
    workNotifications: [
      workNote(c.id, "schedule", `Window proposed to ${requesterName(p)}`, `${date} · ${slot} — waiting for a reply`, now, {
        to: "request",
        id,
      }),
      ...next.workNotifications,
    ],
    notifications: [
      ...residentNote(p, "New collection time proposed", `${c.name} suggested ${date}, ${slot} for ${p.id}.`, now),
      ...next.notifications,
    ],
  };
  return { ok: true, state: next };
}

/**
 * Demo: the requester answers a proposed window. If they agree, the new window is set and —
 * once the request meets its minimum and is ready — it is assigned to the proposing collector.
 */
export function answerProposal(state: AppState, id: string, agree: boolean, now: number): Result {
  const p = state.pickups.find((x) => x.id === id);
  if (!p?.proposal || p.proposal.status !== "pending") return { ok: false, error: "No proposal waiting." };
  const prop = p.proposal;
  const c = getCollector(state, prop.collectorId);
  const at = new Date(now).toISOString();
  let assigned = false;
  let next = update(state, id, (x) => {
    if (!agree) return { ...x, proposal: { ...prop, status: "declined" } };
    const moved: Pickup = { ...x, date: prop.date, slot: prop.slot, proposal: { ...prop, status: "agreed" } };
    if (readiness(moved, state.thresholds) === "ready" && c) {
      assigned = true;
      const u: Pickup = {
        ...moved,
        collectorId: c.id,
        status: "assigned",
        timeline: [...x.timeline, { status: "assigned", at, note: `New window agreed with ${c.name}` }],
      };
      delete u.flag;
      return u;
    }
    return moved;
  });
  next = {
    ...next,
    workNotifications: [
      workNote(
        prop.collectorId,
        "schedule",
        agree ? `Window agreed: ${requesterName(p)}` : `Window declined: ${requesterName(p)}`,
        agree
          ? `${prop.date} · ${prop.slot}${assigned ? " — added to your accepted jobs" : " — accept once it's ready"}`
          : "The requester kept their original window.",
        now,
        { to: "request", id },
      ),
      ...next.workNotifications,
    ],
  };
  return { ok: true, state: next };
}

/** Demo: the requester adds bags to an accumulation request. */
export function addRequesterBags(state: AppState, id: string, bags: number): AppState {
  return update(state, id, (x) => {
    const quantity = x.quantity + bags;
    const u: Pickup = { ...x, quantity };
    if (x.estimatedKg) u.estimatedKg = Math.round((x.estimatedKg / x.quantity) * quantity);
    if (quantity >= minimumFor(state.thresholds, x.material)) delete u.awaitingMore;
    return u;
  });
}

/** Demo: the requester confirms the waste is separated and ready now. */
export function markWasteReady(state: AppState, id: string): AppState {
  return update(state, id, (x) => {
    const u: Pickup = { ...x, separated: true };
    delete u.notReady;
    delete u.readyFrom;
    return u;
  });
}

// ---------------------------------------------------------------------------------------------
// Collection routes (simulated — no GPS, maps or optimisation)
// ---------------------------------------------------------------------------------------------

export function zoneOf(area: string) {
  return ZONES.find((z) => z.areas.includes(area));
}

function areaRank(area: string) {
  return zoneOf(area)?.areas.indexOf(area) ?? 99;
}

export function partnerName(p: Pickup) {
  if (p.kind !== "recyclable") return "General waste";
  return PARTNERS.find((x) => x.id === p.partnerId)?.name ?? MATERIALS[p.material].name;
}

export interface RouteSuggestion {
  key: string;
  zoneId: string;
  zoneName: string;
  date: string;
  partner: string;
  window: string;
  pickupIds: string[];
  totalBags: number;
  totalKg: number;
  capacity: number;
  overCapacity: boolean;
}

/** Accepted jobs not yet on a route and not reported as not ready. */
export function routeCandidates(state: AppState, collectorId: string) {
  return state.pickups.filter(
    (p) => p.collectorId === collectorId && p.status === "assigned" && !p.routeId && !p.notReady,
  );
}

function windowOf(slots: string[]) {
  const starts = slots.map((s) => s.slice(0, 5)).sort();
  const ends = slots.map((s) => s.slice(-5)).sort();
  return starts.length ? `${starts[0]} – ${ends[ends.length - 1]}` : "";
}

/**
 * Groups compatible accepted jobs: same zone (proximity), same day (agreed windows), same
 * receiving partner or waste stream, ready, and within vehicle capacity. Stops are ordered by
 * the zone's driving order, a stand-in for geographic proximity.
 */
export function suggestRoutes(state: AppState, c: Collector): RouteSuggestion[] {
  const groups = new Map<string, Pickup[]>();
  for (const p of routeCandidates(state, c.id)) {
    const zone = zoneOf(p.area)?.id ?? p.area;
    const key = `${zone}|${p.date}|${p.kind === "recyclable" ? p.partnerId : "general"}`;
    groups.set(key, [...(groups.get(key) ?? []), p]);
  }
  const out: RouteSuggestion[] = [];
  for (const [key, list] of groups) {
    list.sort((a, b) => areaRank(a.area) - areaRank(b.area) || a.slot.localeCompare(b.slot));
    let chunk: Pickup[] = [];
    let n = 0;
    const flush = () => {
      if (!chunk.length) return;
      const first = chunk[0]!;
      const zone = zoneOf(first.area);
      const totalBags = chunk.reduce((s, p) => s + p.quantity, 0);
      out.push({
        key: `${key}|${n++}`,
        zoneId: zone?.id ?? first.area,
        zoneName: zone?.name ?? first.area,
        date: first.date,
        partner: partnerName(first),
        window: windowOf(chunk.map((p) => p.slot)),
        pickupIds: chunk.map((p) => p.id),
        totalBags,
        totalKg: chunk.reduce((s, p) => s + estKg(p), 0),
        capacity: c.capacityBags,
        overCapacity: totalBags > c.capacityBags,
      });
      chunk = [];
    };
    for (const p of list) {
      const load = chunk.reduce((s, x) => s + x.quantity, 0);
      if (chunk.length && load + p.quantity > c.capacityBags) flush();
      chunk.push(p);
    }
    flush();
  }
  return out.sort((a, b) => a.date.localeCompare(b.date) || a.zoneName.localeCompare(b.zoneName));
}

export function routeLoad(state: AppState, r: CollectionRoute) {
  const ps = r.stops.map((s) => state.pickups.find((p) => p.id === s.pickupId)).filter(Boolean) as Pickup[];
  return {
    pickups: ps,
    bags: ps.reduce((s, p) => s + p.quantity, 0),
    kg: ps.reduce((s, p) => s + estKg(p), 0),
    materials: Array.from(new Set(ps.map((p) => p.material))),
  };
}

export function createRoute(state: AppState, collectorId: string, pickupIds: string[], now: number): Result & { routeId?: string } {
  const c = getCollector(state, collectorId);
  if (!c) return { ok: false, error: "Collector not found." };
  if (!pickupIds.length) return { ok: false, error: "Choose at least one stop." };
  const candidates = new Set(routeCandidates(state, c.id).map((p) => p.id));
  if (pickupIds.some((id) => !candidates.has(id))) {
    return { ok: false, error: "Only your accepted, ready jobs can go on a route." };
  }
  const ps = pickupIds.map((id) => state.pickups.find((p) => p.id === id)!);
  const bags = ps.reduce((s, p) => s + p.quantity, 0);
  if (bags > c.capacityBags) {
    return { ok: false, error: `Over vehicle capacity: ${bags} of ${c.capacityBags} bags.` };
  }
  const first = ps[0]!;
  const zone = zoneOf(first.area);
  const id = `rt-${now}`;
  const ref = `RT-${303 + state.routes.length}`;
  const route: CollectionRoute = {
    id,
    ref,
    name: `${zone?.name ?? first.area} · ${partnerName(first)}`,
    collectorId: c.id,
    zone: zone?.id ?? first.area,
    date: first.date,
    window: windowOf(ps.map((p) => p.slot)),
    status: "planned",
    stops: ps.map((p) => ({ pickupId: p.id, state: "pending" as const })),
    createdAt: new Date(now).toISOString(),
  };
  const set = new Set(pickupIds);
  const next: AppState = {
    ...state,
    routes: [route, ...state.routes],
    pickups: state.pickups.map((p) => (set.has(p.id) ? { ...p, routeId: id } : p)),
    workNotifications: [
      workNote(c.id, "route", `Route ${ref} created`, `${ps.length} stops · ${bags} bags · ${route.window}`, now, {
        to: "route",
        id,
      }),
      ...state.workNotifications,
    ],
  };
  return { ok: true, state: next, routeId: id };
}

function withRoute(
  state: AppState,
  routeId: string,
  collectorId: string,
  fn: (r: CollectionRoute) => CollectionRoute | string,
): Result {
  const r = state.routes.find((x) => x.id === routeId);
  if (!r || r.collectorId !== collectorId) return { ok: false, error: "Route not found." };
  if (r.status === "completed") return { ok: false, error: "This route is already completed." };
  const out = fn(r);
  if (typeof out === "string") return { ok: false, error: out };
  return { ok: true, state: { ...state, routes: state.routes.map((x) => (x.id === routeId ? out : x)) } };
}

function setStop(r: CollectionRoute, pickupId: string, patch: Partial<RouteStop>): CollectionRoute {
  return {
    ...r,
    status: r.status === "planned" ? "in_progress" : r.status,
    stops: r.stops.map((s) => (s.pickupId === pickupId ? { ...s, ...patch } : s)),
  };
}

export function startRoute(state: AppState, routeId: string, collectorId: string): Result {
  return withRoute(state, routeId, collectorId, (r) => ({ ...r, status: "in_progress" }));
}

export function arriveAtStop(state: AppState, routeId: string, pickupId: string, collectorId: string, now: number): Result {
  const at = new Date(now).toISOString();
  const res = withRoute(state, routeId, collectorId, (r) => {
    const stop = r.stops.find((s) => s.pickupId === pickupId);
    if (!stop) return "Stop not found.";
    if (stop.state !== "pending") return "You already updated this stop.";
    return setStop(r, pickupId, { state: "arrived", at });
  });
  if (!res.ok) return res;
  return {
    ok: true,
    state: update(res.state, pickupId, (p) =>
      p.status === "assigned"
        ? { ...p, status: "on_the_way", timeline: [...p.timeline, { status: "on_the_way", at, note: "Collector arrived" }] }
        : p,
    ),
  };
}

export type ConfirmPickupResult =
  | { ok: true; state: AppState; pickup: Pickup }
  | { ok: false; reason: Exclude<ScanStatus, "ready"> };

/**
 * The assigned collector confirms collection (QR scan or route stop). Separate from material
 * verification; it never releases Green Coins. Duplicate confirmations are refused.
 */
export function confirmPickup(state: AppState, pickupId: string, collectorId: string, now: number): ConfirmPickupResult {
  const res = confirmCollection(state, pickupId, collectorId, now);
  if (!res.ok) return res;
  const p = res.pickup;
  const at = new Date(now).toISOString();
  let next = res.state;
  if (p.routeId) {
    next = {
      ...next,
      routes: next.routes.map((r) =>
        r.id === p.routeId ? setStop(r, p.id, { state: "collected", at }) : r,
      ),
    };
  }
  const c = getCollector(state, collectorId);
  const body =
    p.kind !== "recyclable"
      ? `${p.quantity} bags of ${MATERIALS[p.material].short.toLowerCase()} collected.`
      : c?.category === "recycling"
        ? "Collection confirmed. Record the material verification next — coins aren't released by this step."
        : "Collection confirmed. Material verification is pending with the recycling partner.";
  next = {
    ...next,
    workNotifications: [
      workNote(collectorId, "confirmation", `Collected: ${requesterName(p)}`, body, now, { to: "request", id: p.id }),
      ...next.workNotifications,
    ],
  };
  return { ok: true, state: next, pickup: next.pickups.find((x) => x.id === p.id)! };
}

function reportStop(
  state: AppState,
  routeId: string,
  pickupId: string,
  collectorId: string,
  kind: "missed" | "not_ready",
  note: string,
  now: number,
): Result {
  const at = new Date(now).toISOString();
  const res = withRoute(state, routeId, collectorId, (r) => {
    const stop = r.stops.find((s) => s.pickupId === pickupId);
    if (!stop) return "Stop not found.";
    if (stop.state === "collected" || stop.state === "missed" || stop.state === "not_ready") {
      return "This stop is already closed.";
    }
    return setStop(r, pickupId, { state: kind, at, note });
  });
  if (!res.ok) return res;
  const p = state.pickups.find((x) => x.id === pickupId)!;
  let next = update(res.state, pickupId, (x) => {
    const u: Pickup = {
      ...x,
      status: "assigned",
      issues: [...(x.issues ?? []), { kind, collectorId, note, at, routeId }],
      timeline: [
        ...x.timeline,
        { status: "assigned", at, note: kind === "missed" ? "Missed pickup — to be rescheduled" : "Waste not ready — collector will return" },
      ],
    };
    delete u.routeId;
    if (kind === "not_ready") u.notReady = true;
    return u;
  });
  next = {
    ...next,
    workNotifications: [
      workNote(
        collectorId,
        "reminder",
        kind === "missed" ? `Missed: ${requesterName(p)}` : `Not ready: ${requesterName(p)}`,
        note || (kind === "missed" ? "Reschedule this pickup." : "Waiting for the requester to get the waste ready."),
        now,
        { to: "request", id: pickupId },
      ),
      ...next.workNotifications,
    ],
    notifications: [
      ...residentNote(
        p,
        kind === "missed" ? "Pickup missed" : "Waste not ready",
        kind === "missed"
          ? `Your collector couldn't complete ${p.id}. It will be rescheduled.`
          : `Your collector reported ${p.id} wasn't ready. Separate and bag it, then they'll return.`,
        now,
      ),
      ...next.notifications,
    ],
  };
  return { ok: true, state: next };
}

export function reportMissed(state: AppState, routeId: string, pickupId: string, collectorId: string, note: string, now: number) {
  return reportStop(state, routeId, pickupId, collectorId, "missed", note, now);
}

export function reportNotReady(state: AppState, routeId: string, pickupId: string, collectorId: string, note: string, now: number) {
  return reportStop(state, routeId, pickupId, collectorId, "not_ready", note, now);
}

export function completeRoute(state: AppState, routeId: string, collectorId: string, now: number): Result {
  const at = new Date(now).toISOString();
  let summary = "";
  let ref = "";
  const res = withRoute(state, routeId, collectorId, (r) => {
    const open = r.stops.filter((s) => s.state === "pending" || s.state === "arrived").length;
    if (open) return `Finish every stop first — ${open} still open.`;
    const done = r.stops.filter((s) => s.state === "collected").length;
    summary = `${done} collected · ${r.stops.length - done} not collected`;
    ref = r.ref;
    return { ...r, status: "completed", completedAt: at };
  });
  if (!res.ok) return res;
  return {
    ok: true,
    state: {
      ...res.state,
      workNotifications: [
        workNote(collectorId, "route", `Route ${ref} completed`, summary, now, { to: "route", id: routeId }),
        ...res.state.workNotifications,
      ],
    },
  };
}

// ---------------------------------------------------------------------------------------------
// Material verification (recycling companies, after collection)
// ---------------------------------------------------------------------------------------------

export interface VerificationInput {
  received: boolean;
  actualKg: number;
  meetsRequirements: boolean;
  needsSorting: boolean;
  result: VerificationResult;
  note: string;
}

export function canVerify(state: AppState, collectorId: string, p: Pickup): boolean {
  const c = getCollector(state, collectorId);
  return (
    c?.category === "recycling" &&
    p.collectedBy === collectorId &&
    p.status === "collected" &&
    p.kind === "recyclable"
  );
}

export function verifyMaterial(
  state: AppState,
  pickupId: string,
  collectorId: string,
  input: VerificationInput,
  now: number,
): Result {
  const c = getCollector(state, collectorId);
  const p = state.pickups.find((x) => x.id === pickupId);
  if (!c || !p) return { ok: false, error: "Request not found." };
  if (c.category !== "recycling") return { ok: false, error: "Only recycling companies record material verification." };
  if (p.collectedBy !== collectorId) return { ok: false, error: "You can only verify material you collected." };
  if (p.status === "verified") return { ok: false, error: "This material is already verified." };
  if (p.status !== "collected") return { ok: false, error: "Material can only be verified after collection is confirmed." };
  if (p.kind !== "recyclable") return { ok: false, error: "General waste isn't verified." };
  if (!input.received && input.result !== "rejected") {
    return { ok: false, error: "Material that wasn't received can only be rejected." };
  }
  if (input.received && !(input.actualKg > 0)) return { ok: false, error: "Enter the actual weight in kg." };
  if (input.result === "accepted" && (!input.meetsRequirements || input.needsSorting)) {
    return { ok: false, error: "Only material that meets requirements without extra sorting can be accepted." };
  }
  const at = new Date(now).toISOString();
  const verification: MaterialVerification = {
    by: collectorId,
    at,
    received: input.received,
    actualKg: input.received ? input.actualKg : 0,
    meetsRequirements: input.meetsRequirements,
    needsSorting: input.result === "needs_sorting" || input.needsSorting,
    result: input.result,
  };
  if (input.note.trim()) verification.note = input.note.trim();
  let released: Pickup | null = null;
  let next = update(state, pickupId, (x) => {
    if (input.result !== "accepted") return { ...x, verification };
    const u: Pickup = {
      ...x,
      verification,
      status: "verified",
      timeline: [...x.timeline, { status: "verified", at, note: `Verified by ${c.name} · ${input.actualKg} kg` }],
    };
    released = u;
    return u;
  });
  if (released) next = { ...next, transactions: releaseCoins(next.transactions, released, now) };
  const label = { accepted: "Accepted", needs_sorting: "Needs sorting", rejected: "Rejected" }[input.result];
  next = {
    ...next,
    workNotifications: [
      workNote(collectorId, "verification", `Verification recorded: ${label}`, `${requesterName(p)} · ${verification.actualKg} kg`, now, {
        to: "request",
        id: pickupId,
      }),
      ...next.workNotifications,
    ],
    notifications: [
      ...residentNote(
        p,
        input.result === "accepted" ? "Material verified" : input.result === "needs_sorting" ? "Material needs sorting" : "Material not accepted",
        input.result === "accepted"
          ? `${c.name} verified ${p.id}. Your Green Coins are released.`
          : input.result === "needs_sorting"
            ? `${c.name} received ${p.id} but it needs extra sorting before it can be verified.`
            : `${c.name} couldn't accept the material from ${p.id}.`,
        now,
      ),
      ...next.notifications,
    ],
  };
  return { ok: true, state: next };
}

// ---------------------------------------------------------------------------------------------
// History & performance
// ---------------------------------------------------------------------------------------------

export type VerificationState = "verified" | "pending" | "needs_sorting" | "rejected" | "not_required";

export interface HistoryItem {
  pickup: Pickup;
  outcome: "completed" | "missed" | "rejected";
  at: string;
  verification: VerificationState;
  kg: number;
}

export function verificationState(p: Pickup): VerificationState {
  if (p.kind !== "recyclable") return "not_required";
  if (p.status === "verified" || p.verification?.result === "accepted") return "verified";
  if (p.verification?.result === "needs_sorting") return "needs_sorting";
  if (p.verification?.result === "rejected") return "rejected";
  return "pending";
}

export function collectorHistory(state: AppState, collectorId: string): HistoryItem[] {
  const out: HistoryItem[] = [];
  for (const p of state.pickups) {
    if (p.collectedBy === collectorId) {
      out.push({
        pickup: p,
        outcome: "completed",
        at: p.collectedAt ?? p.createdAt,
        verification: verificationState(p),
        kg: p.verification?.actualKg || estKg(p),
      });
      continue;
    }
    const missed = p.issues?.filter((i) => i.kind === "missed" && i.collectorId === collectorId).at(-1);
    if (missed) {
      out.push({ pickup: p, outcome: "missed", at: missed.at, verification: "not_required", kg: 0 });
      continue;
    }
    const declined = p.declined?.find((d) => d.collectorId === collectorId);
    if (declined) out.push({ pickup: p, outcome: "rejected", at: declined.at, verification: "not_required", kg: 0 });
  }
  return out.sort((a, b) => b.at.localeCompare(a.at));
}

export function historyStats(items: HistoryItem[], now: number) {
  const done = items.filter((i) => i.outcome === "completed");
  const byMaterial = new Map<MaterialId, number>();
  for (const i of done) byMaterial.set(i.pickup.material, (byMaterial.get(i.pickup.material) ?? 0) + i.pickup.quantity);
  const verification: Record<VerificationState, number> = {
    verified: 0,
    pending: 0,
    needs_sorting: 0,
    rejected: 0,
    not_required: 0,
  };
  for (const i of done) verification[i.verification]++;
  const week = 7 * 24 * 60 * 60 * 1000;
  const weekly = Array.from({ length: 6 }, (_, w) => {
    const end = now - (5 - w) * week;
    const start = end - week;
    const bags = done
      .filter((i) => {
        const t = Date.parse(i.at);
        return t > start && t <= end;
      })
      .reduce((s, i) => s + i.pickup.quantity, 0);
    return { label: w === 5 ? "This wk" : `${5 - w}w ago`, bags };
  });
  return {
    completed: done.length,
    missed: items.filter((i) => i.outcome === "missed").length,
    rejected: items.filter((i) => i.outcome === "rejected").length,
    bags: done.reduce((s, i) => s + i.pickup.quantity, 0),
    kg: Math.round(done.reduce((s, i) => s + i.kg, 0)),
    byMaterial: [...byMaterial.entries()].sort((a, b) => b[1] - a[1]),
    verification,
    weekly,
  };
}

// ---------------------------------------------------------------------------------------------
// Demo: a new request arrives for this collector
// ---------------------------------------------------------------------------------------------

const DEMO_REQUESTERS: [string, string][] = [
  ["Kairaba Avenue Pharmacy", "Business"],
  ["Tallinding Lower Basic School", "School"],
  ["Westfield Tailors' Cooperative", "Community group"],
  ["Sukuta Health Post", "Health centre"],
  ["Old Jeshwang Market", "Market"],
  ["Pipeline Mosque Committee", "Community group"],
];

export function simulateIncomingRequest(state: AppState, collectorId: string, now: number): Result & { pickupId?: string } {
  const c = getCollector(state, collectorId);
  if (!c) return { ok: false, error: "Collector not found." };
  const maxNum = state.pickups.reduce((m, p) => {
    const n = p.id.startsWith("REQ-") ? Number(p.id.slice(4)) : 0;
    return Math.max(m, n || 0);
  }, 3000);
  const [name, kind] = DEMO_REQUESTERS[maxNum % DEMO_REQUESTERS.length]!;
  const mats = c.accepts.filter((m) => m !== "special");
  const at = new Date(now).toISOString();
  for (const material of mats) {
    for (const area of c.areas) {
      const recyclable = materialClass(material) === "confirmed";
      const p: Pickup = {
        id: `REQ-${maxNum + 1}`,
        collectionToken: newCollectionToken(state.pickups.map((x) => x.collectionToken)),
        kind: recyclable ? "recyclable" : "general",
        material,
        items: [],
        quantity: minimumFor(state.thresholds, material) + 1,
        description: "",
        address: name,
        area,
        landmark: "",
        date: isoDay(now + 24 * 60 * 60 * 1000),
        slot: "10:00 – 12:00",
        collectorId: null,
        partnerId: recyclable ? (PARTNERS.find((x) => x.accepts.includes(material))?.id ?? null) : null,
        status: "awaiting",
        createdAt: at,
        timeline: [{ status: "submitted", at }, { status: "awaiting", at }],
        coins: 0,
        separated: true,
        institution: { name: `${name}, ${area}`, kind, contact: "Green Champion", contactRole: "Contact", phone: "+220 702 1300" },
      };
      const trial = { ...state, pickups: [p, ...state.pickups] };
      if (!canSeeOpenRequest(trial, c, p)) continue;
      return {
        ok: true,
        pickupId: p.id,
        state: {
          ...trial,
          workNotifications: [
            workNote(c.id, "request", `New request: ${p.institution!.name}`, `${p.quantity} bags of ${MATERIALS[material].short.toLowerCase()} · tomorrow`, now, {
              to: "request",
              id: p.id,
            }),
            ...trial.workNotifications,
          ],
        },
      };
    }
  }
  return { ok: false, error: "No compatible request could be generated for your categories and areas." };
}

// ---------------------------------------------------------------------------------------------
// Registration, verification status, sign-in
// ---------------------------------------------------------------------------------------------

export function validateApplication(a: CollectorApplication): Record<string, string> {
  const e: Record<string, string> = {};
  if (a.fullName.trim().length < 2) e["fullName"] = "Enter the full name";
  if (!/^[2-9]\d{6}$/.test(a.phone)) e["phone"] = "Enter a valid 7-digit Gambian number";
  if (a.email && !/^\S+@\S+\.\S+$/.test(a.email)) e["email"] = "Enter a valid email or leave it empty";
  if (a.category !== "independent") {
    if (a.organisation.trim().length < 2) e["organisation"] = "Enter the business or organisation name";
    if (a.registrationNo.trim().length < 4) e["registrationNo"] = "Enter the business registration number";
  }
  if (!a.areas.length) e["areas"] = "Choose at least one operating area";
  if (!a.materials.length) e["materials"] = "Choose at least one waste category";
  if (a.materials.includes("special")) e["materials"] = "Special waste needs a licensed handler";
  if (!a.vehicle) e["vehicle"] = "Choose your vehicle or equipment";
  if (!(a.capacityBags > 0)) e["capacityBags"] = "Enter a capacity";
  return e;
}

export function submitApplication(state: AppState, app: CollectorApplication, now: number): AppState {
  return {
    ...state,
    collectorAccount: {
      status: "awaiting",
      collectorId: null,
      // Remake issues the Collector ID after verification; applicants never choose it.
      application: { ...app, remakeId: "" },
      submittedAt: new Date(now).toISOString(),
      reviewNote: "Remake is checking your details. This usually takes 2 working days.",
    },
  };
}

/** Demo: Remake's review decides the pending application. Approval issues the Remake Collector ID. */
export function reviewApplication(
  state: AppState,
  outcome: "approved" | "rejected",
  now: number,
): AppState {
  const acc = state.collectorAccount;
  if (!acc || acc.status !== "awaiting") return state;
  const at = new Date(now).toISOString();
  if (outcome === "rejected") {
    return {
      ...state,
      collectorAccount: {
        ...acc,
        status: "rejected",
        reviewedAt: at,
        reviewNote: "Remake couldn't confirm your details. Check your registration number and photo, then apply again.",
      },
    };
  }
  const a = acc.application;
  const remakeId = `RMK-C-${4401 + state.registeredCollectors.length}`;
  const vehicleLower = a.vehicle.toLowerCase();
  const collector: Collector = {
    id: `c-reg-${now}`,
    name: a.organisation.trim() || a.fullName.trim(),
    type:
      a.category === "recycling"
        ? "recycler"
        : a.category === "general"
          ? "company"
          : vehicleLower.includes("donkey") || vehicleLower.includes("hand")
            ? "donkey_cart"
            : "tricycle",
    areas: a.areas,
    rating: 5,
    trips: 0,
    availability: "Mon – Sat · 8am – 5pm",
    description: "Newly approved Remake collector.",
    vehicle: a.vehicle,
    eta: "Arrives within your slot",
    accepts: a.materials.filter((m) => m !== "special"),
    sampleRate: "Set by the collector",
    phone: `+220 ${a.phone.slice(0, 3)} ${a.phone.slice(3)}`,
    category: a.category,
    remakeId,
    contactName: a.fullName.trim(),
    capacityBags: a.capacityBags,
  };
  if (a.registrationNo.trim()) collector.registrationNo = a.registrationNo.trim();
  if (a.email.trim()) collector.email = a.email.trim();
  if (a.image) collector.image = a.image;
  return {
    ...state,
    registeredCollectors: [...state.registeredCollectors, collector],
    collectorAccount: {
      ...acc,
      status: "approved",
      collectorId: collector.id,
      application: { ...a, remakeId },
      reviewedAt: at,
      reviewNote: `Approved. Your Remake Collector ID is ${remakeId}.`,
    },
    workNotifications: [
      workNote(collector.id, "verification", "Account approved", `Welcome to Remake. Your Collector ID is ${remakeId}.`, now),
      ...state.workNotifications,
    ],
  };
}

export function findSampleAccount(phone: string): SampleAccount | undefined {
  return SAMPLE_ACCOUNTS.find((a) => a.phone === phone);
}

/** Signs in a sample account or an account approved through registration, by phone number. */
export function collectorSignIn(state: AppState, phone: string, now: number): Result {
  const sample = findSampleAccount(phone);
  const at = new Date(now).toISOString();
  if (sample) {
    return {
      ok: true,
      state: {
        ...state,
        collectorAccount: {
          status: sample.status,
          collectorId: sample.collectorId,
          application: sample.application,
          submittedAt: at,
          ...(sample.reviewNote && { reviewNote: sample.reviewNote }),
        },
      },
    };
  }
  const reg = state.registeredCollectors.find((c) => c.phone.replace(/\D/g, "").endsWith(phone));
  if (reg) {
    return {
      ok: true,
      state: {
        ...state,
        collectorAccount: {
          status: "approved",
          collectorId: reg.id,
          application: {
            category: reg.category,
            fullName: reg.contactName,
            phone,
            email: reg.email ?? "",
            remakeId: reg.remakeId,
            registrationNo: reg.registrationNo ?? "",
            organisation: reg.category === "independent" ? "" : reg.name,
            areas: reg.areas,
            materials: reg.accepts,
            vehicle: reg.vehicle,
            capacityBags: reg.capacityBags,
          },
          submittedAt: at,
        },
      },
    };
  }
  return { ok: false, error: "No collector account uses this number. Register as a collector first." };
}

/** The signed-in collector, only when Remake has approved the account. */
export function approvedCollector(state: AppState): Collector | undefined {
  const acc = state.collectorAccount;
  if (!acc || acc.status !== "approved") return undefined;
  return getCollector(state, acc.collectorId);
}
