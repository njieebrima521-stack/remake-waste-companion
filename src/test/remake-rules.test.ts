import { describe, expect, it } from "vitest";

import { COLLECTORS, emptyDraft, seedState } from "@/lib/remake/data";
import {
  advancePickup,
  confirmCollection,
  createPickup,
  eligibleCollectors,
  isMixed,
  qrPayload,
  redeemReward,
  resolveScan,
  scanStatus,
  slotAvailable,
  trackingSteps,
  walletSummary,
} from "@/lib/remake/logic";
import type { AppState, MaterialId } from "@/lib/remake/types";

const NOW = Date.UTC(2026, 10, 22, 9, 0, 0);

function bookPlastic(state: AppState, bags = 2) {
  const draft = {
    ...emptyDraft("recyclable"),
    material: "plastic" as const,
    quantity: bags,
    address: "Compound 14, Kombo Coastal Road",
    area: "Bundung",
    collectorId: "c-lamin",
    date: "2026-11-23",
    slot: "10:00 – 12:00",
  };
  const pickup = createPickup(state, draft, NOW);
  return { pickup, state: { ...state, pickups: [pickup, ...state.pickups] } };
}

/** submitted -> awaiting -> assigned -> on_the_way, then the assigned collector scans the QR. */
function collect(state: AppState, id: string, collectorId = "c-lamin") {
  for (let i = 0; i < 3; i++) state = advancePickup(state, id, NOW + i);
  const res = confirmCollection(state, id, collectorId, NOW + 5);
  if (!res.ok) throw new Error(res.reason);
  return res.state;
}

describe("Green Coins release", () => {
  it("a booking does not add any available or pending coins", () => {
    const start = seedState(NOW);
    const before = walletSummary(start.transactions);
    const { state } = bookPlastic(start);
    expect(walletSummary(state.transactions)).toEqual(before);
  });

  it("the QR scan makes coins pending only; they become available once verified", () => {
    let { state, pickup } = bookPlastic(seedState(NOW), 2);
    const start = walletSummary(state.transactions);
    state = collect(state, pickup.id);
    expect(state.pickups.find((p) => p.id === pickup.id)?.status).toBe("collected");
    expect(walletSummary(state.transactions).available).toBe(start.available);
    expect(walletSummary(state.transactions).pending).toBe(start.pending + 100);

    state = advancePickup(state, pickup.id, NOW + 10);
    expect(state.pickups.find((p) => p.id === pickup.id)?.status).toBe("verified");
    expect(walletSummary(state.transactions).available).toBe(start.available + 100);
    expect(walletSummary(state.transactions).pending).toBe(start.pending);
  });

  it("the tracking timeline separates collection, verification and coin release", () => {
    let { state, pickup } = bookPlastic(seedState(NOW));
    state = collect(state, pickup.id);
    const collected = state.pickups.find((p) => p.id === pickup.id)!;
    const steps = trackingSteps(collected);
    expect(steps.find((s) => s.key === "collected")?.state).toBe("done");
    expect(steps.find((s) => s.key === "verification")?.state).toBe("current");
    expect(steps.find((s) => s.key === "verified")?.state).toBe("upcoming");
    expect(steps.at(-1)?.state).toBe("upcoming");
    state = advancePickup(state, pickup.id, NOW + 10);
    const verified = state.pickups.find((p) => p.id === pickup.id)!;
    expect(trackingSteps(verified).at(-1)?.state).toBe("done");
    expect(trackingSteps(verified)).toHaveLength(8);
  });

  it("general waste never earns coins", () => {
    const state = seedState(NOW);
    const draft = { ...emptyDraft("general"), quantity: 3 };
    expect(createPickup(state, draft, NOW).coins).toBe(0);
  });

  it("mixed plastics are non-recyclable: no coins and no recycling partner", () => {
    const state = seedState(NOW);
    const draft = { ...emptyDraft("recyclable"), material: "mixed_plastic" as const, quantity: 4 };
    const p = createPickup(state, draft, NOW);
    expect(p.coins).toBe(0);
    expect(p.kind).toBe("general");
    expect(p.partnerId).toBeNull();
  });
});

describe("Collector matching", () => {
  const recyclables: MaterialId[] = ["plastic", "glass", "metal", "paper", "organic"];
  for (const m of recyclables) {
    it(`${m}: only collectors that accept ${m} are shown`, () => {
      const list = eligibleCollectors(m, "Bundung");
      expect(list.length).toBeGreaterThan(0);
      expect(list.every((c) => c.accepts.includes(m))).toBe(true);
      const missing = COLLECTORS.filter((c) => c.accepts.includes(m) && !list.includes(c));
      expect(missing).toEqual([]);
    });
  }

  it("mixed plastics only go to general/private operators, never recycling organisations", () => {
    const list = eligibleCollectors("mixed_plastic", "Bundung");
    expect(list.length).toBeGreaterThan(0);
    expect(list.every((c) => c.accepts.includes("mixed_plastic") && c.type !== "recycler")).toBe(
      true,
    );
    // Recycling-only specialists such as ReBottle never appear.
    expect(list.some((c) => c.id === "c-rebottle" || c.id === "c-kombo")).toBe(false);
  });

  it("a category nobody accepts returns no collectors", () => {
    expect(eligibleCollectors("special", "Bundung")).toEqual([]);
  });

  it("a booking never keeps a collector that doesn't accept its waste", () => {
    const state = seedState(NOW);
    // ReBottle only takes plastic.
    const draft = {
      ...emptyDraft("recyclable"),
      material: "glass" as const,
      collectorId: "c-rebottle",
    };
    expect(createPickup(state, draft, NOW).collectorId).toBeNull();
  });

  it("the recommended collector serves the resident's area", () => {
    const [first] = eligibleCollectors("plastic", "Kanifing");
    expect(first?.areas).toContain("Kanifing");
  });
});

describe("Booking QR codes", () => {
  it("every booking gets its own QR code with no personal details", () => {
    let { state, pickup: a } = bookPlastic(seedState(NOW));
    const b = createPickup(state, { ...emptyDraft("recyclable"), material: "plastic" }, NOW + 1);
    state = { ...state, pickups: [b, ...state.pickups] };
    expect(qrPayload(a)).not.toBe(qrPayload(b));
    const payload = qrPayload(a);
    for (const secret of [state.user.name, state.user.phone, state.user.email, a.address, a.id]) {
      expect(payload).not.toContain(secret);
    }
    expect(resolveScan(state.pickups, payload)?.id).toBe(a.id);
    expect(resolveScan(state.pickups, "REMAKE-COLLECT:NOPE")).toBeNull();
  });

  it("only the assigned collector can confirm, and only once", () => {
    let { state, pickup } = bookPlastic(seedState(NOW));
    for (let i = 0; i < 3; i++) state = advancePickup(state, pickup.id, NOW + i);
    const wrong = confirmCollection(state, pickup.id, "c-kombo", NOW + 5);
    expect(wrong.ok).toBe(false);
    if (!wrong.ok) expect(wrong.reason).toBe("wrong_collector");

    const first = confirmCollection(state, pickup.id, "c-lamin", NOW + 5);
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const again = confirmCollection(first.state, pickup.id, "c-lamin", NOW + 6);
    expect(again.ok).toBe(false);
    if (!again.ok) expect(again.reason).toBe("collected");
    const pendingTx = first.state.transactions.filter((t) => t.pickupId === pickup.id);
    expect(pendingTx).toHaveLength(1);
  });

  it("the simulated stages never confirm collection without a scan", () => {
    let { state, pickup } = bookPlastic(seedState(NOW));
    for (let i = 0; i < 10; i++) state = advancePickup(state, pickup.id, NOW + i);
    expect(state.pickups.find((p) => p.id === pickup.id)?.status).toBe("on_the_way");
  });

  it("cancelled bookings can't be confirmed", () => {
    const state = seedState(NOW);
    const cancelled = state.pickups.find((p) => p.status === "cancelled")!;
    expect(scanStatus(cancelled, cancelled.collectorId ?? "")).toBe("cancelled");
  });
});

describe("Mixed recyclables", () => {
  it("plastic bottles, cans and cardboard together must be separated", () => {
    expect(
      isMixed([
        { id: "1", label: "Plastic bottles", material: "plastic", count: 9 },
        { id: "2", label: "Drink cans", material: "metal", count: 6 },
        { id: "3", label: "Cardboard box", material: "paper", count: 1 },
      ]),
    ).toBe(true);
    expect(isMixed([{ id: "1", label: "Plastic bottles", material: "plastic", count: 9 }])).toBe(
      false,
    );
  });
});

describe("Rewards", () => {
  it("cannot redeem a reward that costs more than the available coins", () => {
    const state = seedState(NOW);
    const res = redeemReward(
      state,
      {
        id: "r-x",
        name: "Big",
        cost: 999999,
        tagline: "",
        description: "",
        partner: "",
        delivery: "",
        icon: "gift",
      },
      NOW,
    );
    expect(res.ok).toBe(false);
  });
});

describe("Time slots", () => {
  it("today's slots that start within the next hour can't be booked", () => {
    const now = new Date(2026, 10, 22, 9, 30);
    expect(slotAvailable("2026-11-22", "08:00 – 10:00", now)).toBe(false);
    expect(slotAvailable("2026-11-22", "10:00 – 12:00", now)).toBe(false);
    expect(slotAvailable("2026-11-22", "14:00 – 16:00", now)).toBe(true);
    expect(slotAvailable("2026-11-23", "08:00 – 10:00", now)).toBe(true);
  });
});
