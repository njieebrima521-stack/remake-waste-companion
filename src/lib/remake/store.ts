import { useSyncExternalStore } from "react";

import { DEFAULT_THRESHOLDS, emptyDraft, seedState, SSR_NOW } from "./data";
import {
  advancePickup,
  cancelPickup,
  collectorAccepts,
  confirmCollection,
  createPickup,
  draftMaterial,
  findCollector,
  redeemReward,
} from "./logic";
import * as work from "./collector";
import { setCollectorDirectory } from "./logic";
import type {
  Address,
  AppState,
  CollectorApplication,
  CollectorEdits,
  Draft,
  MaterialId,
  Pickup,
  Reward,
} from "./types";

const STORAGE_KEY = "remake-demo-v3";
/** Earlier saved demos: only the account details carry over, bookings are re-seeded. */
const LEGACY_KEYS = ["remake-demo-v2", "remake-demo-v1"];

const serverState = seedState(SSR_NOW);
let state: AppState = serverState;

function syncDirectory() {
  setCollectorDirectory(work.collectorDirectory(state));
}
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    const { hydrated: _h, ...rest } = state;
    const draft = { ...rest.draft };
    if (draft.photo && (draft.photo.startsWith("blob:") || draft.photo.startsWith("data:"))) {
      delete draft.photo;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...rest, draft }));
  } catch {
    /* storage full or blocked — demo keeps working in memory */
  }
}

export function setState(update: (s: AppState) => AppState) {
  state = update(state);
  syncDirectory();
  persist();
  emit();
}

export function getState() {
  return state;
}

/** Loads saved demo state on the device. Call once after the app mounts. */
export function hydrateStore() {
  if (state.hydrated) return;
  let next: AppState = { ...seedState(Date.now()), hydrated: true };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) next = { ...next, ...(JSON.parse(raw) as Partial<AppState>), hydrated: true };
    else {
      const legacyKey = LEGACY_KEYS.find((k) => window.localStorage.getItem(k));
      const legacy = legacyKey ? window.localStorage.getItem(legacyKey) : null;
      if (legacy && legacyKey) {
        const old = JSON.parse(legacy) as Partial<AppState>;
        next = {
          ...next,
          ...(old.onboarded !== undefined && { onboarded: old.onboarded }),
          ...(old.signedIn !== undefined && { signedIn: old.signedIn }),
          ...(old.user && { user: old.user }),
          ...(old.addresses && { addresses: old.addresses }),
          ...(old.language && { language: old.language }),
        };
        window.localStorage.removeItem(legacyKey);
      }
    }
  } catch {
    /* ignore corrupt storage */
  }
  state = next;
  syncDirectory();
  emit();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useApp<T>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(serverState),
  );
}

export const actions = {
  completeOnboarding() {
    setState((s) => ({ ...s, onboarded: true }));
  },
  register(user: { name: string; phone: string; area: string }) {
    setState((s) => ({ ...s, onboarded: true, user: { ...s.user, ...user } }));
  },
  signIn(phone?: string) {
    setState((s) => ({
      ...s,
      onboarded: true,
      signedIn: true,
      user: phone ? { ...s.user, phone } : s.user,
    }));
  },
  signOut() {
    setState((s) => ({ ...s, signedIn: false }));
  },
  resetDemo() {
    const fresh = { ...seedState(Date.now()), hydrated: true, onboarded: true, signedIn: true };
    setState(() => fresh);
  },
  updateUser(user: Partial<AppState["user"]>) {
    setState((s) => ({ ...s, user: { ...s.user, ...user } }));
  },
  setLanguage(language: string) {
    setState((s) => ({ ...s, language }));
  },
  setNotificationPref(key: string, value: boolean) {
    setState((s) => ({ ...s, notificationPrefs: { ...s.notificationPrefs, [key]: value } }));
  },
  setDemo(key: keyof AppState["demo"], value: boolean) {
    setState((s) => ({ ...s, demo: { ...s.demo, [key]: value } }));
  },

  // Draft booking
  startDraft(kind: Draft["kind"]) {
    setState((s) => {
      const def = s.addresses.find((a) => a.isDefault) ?? s.addresses[0];
      const draft = emptyDraft(kind);
      if (def) {
        draft.address = def.line;
        draft.area = def.area;
        draft.landmark = def.landmark;
      }
      return { ...s, draft };
    });
  },
  updateDraft(patch: Partial<Draft>) {
    setState((s) => {
      const draft = { ...s.draft, ...patch };
      // Changing the waste category drops a collector who doesn't accept the new one.
      const material = draftMaterial(draft);
      const chosen = findCollector(draft.collectorId);
      if (chosen && (!material || !collectorAccepts(chosen, material))) delete draft.collectorId;
      return { ...s, draft };
    });
  },
  /** No collector chosen: the request waits for the next free collector. */
  clearDraftCollector() {
    setState((s) => {
      const draft = { ...s.draft };
      delete draft.collectorId;
      return { ...s, draft };
    });
  },
  clearDraftPhoto() {
    setState((s) => {
      const draft = { ...s.draft };
      delete draft.photo;
      delete draft.scene;
      return { ...s, draft };
    });
  },
  submitDraft(): Pickup {
    const now = Date.now();
    const pickup = createPickup(state, state.draft, now);
    setState((s) => ({
      ...s,
      pickups: [pickup, ...s.pickups],
      notifications: [
        {
          id: `n${now}`,
          title: "Booking confirmed",
          body: `${pickup.id} is booked. Your collection QR code is in the pickup details.`,
          at: new Date(now).toISOString(),
          read: false,
          kind: "pickup",
          link: pickup.id,
        },
        ...s.notifications,
      ],
    }));
    return pickup;
  },

  // Pickups
  advancePickup(id: string) {
    setState((s) => advancePickup(s, id, Date.now()));
  },
  /** Collector-side demo: the assigned collector scans the booking QR and confirms collection. */
  confirmCollection(pickupId: string, collectorId: string) {
    const result = confirmCollection(state, pickupId, collectorId, Date.now());
    if (result.ok) setState(() => result.state);
    return result;
  },
  cancelPickup(id: string, reason: string) {
    setState((s) => cancelPickup(s, id, reason, Date.now()));
  },
  reassignPickup(id: string, collectorId: string) {
    const at = new Date().toISOString();
    setState((s) => ({
      ...s,
      pickups: s.pickups.map((p) => {
        if (p.id !== id) return p;
        const next: Pickup = {
          ...p,
          collectorId,
          status: "assigned",
          timeline: [...p.timeline, { status: "assigned", at, note: "New collector selected" }],
        };
        delete next.flag;
        return next;
      }),
    }));
  },

  // Rewards
  redeem(reward: Reward) {
    const result = redeemReward(state, reward, Date.now());
    if (result.ok) setState(() => result.state);
    return result;
  },

  // Notifications
  markAllRead() {
    setState((s) => ({ ...s, notifications: s.notifications.map((n) => ({ ...n, read: true })) }));
  },
  markRead(id: string) {
    setState((s) => ({
      ...s,
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  },
  deleteNotification(id: string) {
    setState((s) => ({ ...s, notifications: s.notifications.filter((n) => n.id !== id) }));
  },
  updateAddress(id: string, patch: Partial<Omit<Address, "id" | "isDefault">>) {
    setState((s) => ({
      ...s,
      addresses: s.addresses.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    }));
  },
  clearNotifications() {
    setState((s) => ({ ...s, notifications: [] }));
  },

  // Addresses
  addAddress(a: Omit<Address, "id" | "isDefault">) {
    setState((s) => ({
      ...s,
      addresses: [
        ...s.addresses,
        { ...a, id: `a${Date.now()}`, isDefault: s.addresses.length === 0 },
      ],
    }));
  },
  removeAddress(id: string) {
    setState((s) => {
      const addresses = s.addresses.filter((a) => a.id !== id);
      if (addresses.length && !addresses.some((a) => a.isDefault))
        addresses[0] = { ...addresses[0]!, isDefault: true };
      return { ...s, addresses };
    });
  },
  setDefaultAddress(id: string) {
    setState((s) => ({
      ...s,
      addresses: s.addresses.map((a) => ({ ...a, isDefault: a.id === id })),
    }));
  },

  // ---------------- Collector app ----------------
  collectorSignIn(phone: string) {
    return run((s) => work.collectorSignIn(s, phone, Date.now()));
  },
  collectorSignOut() {
    setState((s) => ({ ...s, collectorAccount: null }));
  },
  submitCollectorApplication(app: CollectorApplication) {
    setState((s) => work.submitApplication(s, app, Date.now()));
  },
  reviewCollectorApplication(outcome: "approved" | "rejected") {
    setState((s) => work.reviewApplication(s, outcome, Date.now()));
  },
  updateCollectorProfile(collectorId: string, edits: CollectorEdits) {
    setState((s) => ({
      ...s,
      collectorEdits: { ...s.collectorEdits, [collectorId]: { ...s.collectorEdits[collectorId], ...edits } },
    }));
  },
  acceptRequest(id: string, collectorId: string) {
    return run((s) => work.acceptRequest(s, id, collectorId, Date.now()));
  },
  rejectRequest(id: string, collectorId: string, reason: string) {
    return run((s) => work.rejectRequest(s, id, collectorId, reason, Date.now()));
  },
  proposeWindow(id: string, collectorId: string, date: string, slot: string) {
    return run((s) => work.proposeWindow(s, id, collectorId, date, slot, Date.now()));
  },
  answerProposal(id: string, agree: boolean) {
    return run((s) => work.answerProposal(s, id, agree, Date.now()));
  },
  addRequesterBags(id: string, bags = 1) {
    setState((s) => work.addRequesterBags(s, id, bags));
  },
  markWasteReady(id: string) {
    setState((s) => work.markWasteReady(s, id));
  },
  simulateIncomingRequest(collectorId: string) {
    const r = work.simulateIncomingRequest(state, collectorId, Date.now());
    if (r.ok) setState(() => r.state);
    return r;
  },
  createRoute(collectorId: string, pickupIds: string[]) {
    const r = work.createRoute(state, collectorId, pickupIds, Date.now());
    if (r.ok) setState(() => r.state);
    return r;
  },
  startRoute(routeId: string, collectorId: string) {
    return run((s) => work.startRoute(s, routeId, collectorId));
  },
  arriveAtStop(routeId: string, pickupId: string, collectorId: string) {
    return run((s) => work.arriveAtStop(s, routeId, pickupId, collectorId, Date.now()));
  },
  reportMissed(routeId: string, pickupId: string, collectorId: string, note: string) {
    return run((s) => work.reportMissed(s, routeId, pickupId, collectorId, note, Date.now()));
  },
  reportNotReady(routeId: string, pickupId: string, collectorId: string, note: string) {
    return run((s) => work.reportNotReady(s, routeId, pickupId, collectorId, note, Date.now()));
  },
  completeRoute(routeId: string, collectorId: string) {
    return run((s) => work.completeRoute(s, routeId, collectorId, Date.now()));
  },
  /** Collector confirms collection (QR scan or route stop). Never releases Green Coins. */
  confirmPickup(pickupId: string, collectorId: string) {
    const r = work.confirmPickup(state, pickupId, collectorId, Date.now());
    if (r.ok) setState(() => r.state);
    return r;
  },
  verifyMaterial(pickupId: string, collectorId: string, input: work.VerificationInput) {
    return run((s) => work.verifyMaterial(s, pickupId, collectorId, input, Date.now()));
  },
  markWorkRead(id: string) {
    setState((s) => ({
      ...s,
      workNotifications: s.workNotifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  },
  markAllWorkRead(collectorId: string) {
    setState((s) => ({
      ...s,
      workNotifications: s.workNotifications.map((n) =>
        n.collectorId === collectorId ? { ...n, read: true } : n,
      ),
    }));
  },
  setThreshold(material: MaterialId, bags: number) {
    setState((s) => ({ ...s, thresholds: { ...s.thresholds, [material]: Math.max(1, bags) } }));
  },
  resetThresholds() {
    setState((s) => ({ ...s, thresholds: { ...DEFAULT_THRESHOLDS } }));
  },
  /** Resets all demo data but keeps the signed-in collector account. */
  resetCollectorDemo() {
    setState((s) => ({
      ...seedState(Date.now()),
      hydrated: true,
      onboarded: s.onboarded,
      signedIn: s.signedIn,
      collectorAccount: s.collectorAccount,
      registeredCollectors: s.registeredCollectors,
    }));
  },
};

function run(fn: (s: AppState) => work.Result): work.Result {
  const r = fn(state);
  if (r.ok) setState(() => r.state);
  return r;
}
