import { describe, expect, it } from "vitest";

import { DEFAULT_THRESHOLDS, seedState } from "@/lib/remake/data";
import {
  acceptRequest,
  answerProposal,
  addRequesterBags,
  approvedCollector,
  arriveAtStop,
  canSeeOpenRequest,
  collectorSignIn,
  completeRoute,
  confirmPickup,
  createRoute,
  getCollector,
  materialClass,
  proposeWindow,
  readiness,
  rejectRequest,
  reportMissed,
  requestBoard,
  reviewApplication,
  submitApplication,
  suggestRoutes,
  verifyMaterial,
} from "@/lib/remake/collector";
import { residentPickups, scanStatus, walletSummary } from "@/lib/remake/logic";
import type { AppState, CollectorApplication } from "@/lib/remake/types";

const NOW = Date.UTC(2026, 10, 22, 9, 0, 0);
const DAY = 24 * 60 * 60 * 1000;
const iso = (offset: number) => new Date(NOW + offset * DAY).toISOString().slice(0, 10);

const fresh = (): AppState => ({ ...seedState(NOW), hydrated: true });
const who = (s: AppState, id: string) => getCollector(s, id)!;
const pickup = (s: AppState, id: string) => s.pickups.find((p) => p.id === id)!;
const sees = (s: AppState, cid: string, pid: string) => canSeeOpenRequest(s, who(s, cid), pickup(s, pid));
const ok = <T extends { ok: boolean }>(r: T) => {
  if (!r.ok) throw new Error(JSON.stringify(r));
  return r as Extract<T, { ok: true }>;
};

describe("Category eligibility", () => {
  it("a collector never sees requests outside its approved categories", () => {
    const s = fresh();
    for (const cid of ["c-kombo", "c-greenbelt", "c-lamin", "c-modou", "c-kanifing", "c-rebottle"]) {
      const c = who(s, cid);
      const b = requestBoard(s, c);
      for (const p of [...b.incoming, ...b.building, ...b.accepted]) {
        expect(c.accepts).toContain(p.material);
      }
    }
  });

  it("recycling companies never get general waste; general companies never get recyclables", () => {
    const s = fresh();
    expect(sees(s, "c-kombo", "REQ-2105")).toBe(false); // general, Kotu
    expect(sees(s, "c-greenbelt", "REQ-2101")).toBe(false); // plastic, Bundung
    expect(sees(s, "c-kombo", "REQ-2101")).toBe(true);
  });

  it("special waste is never offered to ordinary collectors", () => {
    const s = fresh();
    for (const c of ["c-kombo", "c-greenbelt", "c-lamin", "c-modou", "c-kanifing", "c-fatou", "c-compost"]) {
      expect(sees(s, c, "REQ-2108")).toBe(false);
    }
    expect(materialClass("special")).toBe("special");
  });

  it("mixed plastics are potentially recyclable, not automatically non-recyclable", () => {
    expect(materialClass("mixed_plastic")).toBe("potential");
    expect(materialClass("plastic")).toBe("confirmed");
    expect(materialClass("general")).toBe("residual");
  });
});

describe("Residual waste routing", () => {
  it("private companies get residual waste first; independents don't see it", () => {
    const s = fresh();
    expect(sees(s, "c-greenbelt", "REQ-2105")).toBe(true); // Kotu Beach Hotel
    expect(sees(s, "c-modou", "REQ-2105")).toBe(false);
  });

  it("independents are the fallback where no private company is available", () => {
    const s = fresh();
    expect(sees(s, "c-modou", "REQ-2107")).toBe(true); // Fajara: no private company
    const off = { ...s, collectorEdits: { "c-greenbelt": { available: false } } };
    expect(sees(off, "c-modou", "REQ-2105")).toBe(true);
    expect(sees(off, "c-greenbelt", "REQ-2105")).toBe(false);
  });
});

describe("Minimum quantities and readiness", () => {
  it("thresholds differ by material (not one universal two-bag rule)", () => {
    expect(new Set(Object.values(DEFAULT_THRESHOLDS)).size).toBeGreaterThan(2);
    expect(DEFAULT_THRESHOLDS.plastic).toBe(3);
    expect(DEFAULT_THRESHOLDS.glass).toBe(2);
  });

  it("a request below the minimum stays visible as an accumulation request and can't be accepted", () => {
    const s = fresh();
    const p = pickup(s, "REQ-2103"); // 1 bag of plastic
    expect(readiness(p, s.thresholds)).toBe("below_minimum");
    expect(requestBoard(s, who(s, "c-rebottle")).building.map((x) => x.id)).toContain("REQ-2103");
    expect(acceptRequest(s, "REQ-2103", "c-rebottle", NOW).ok).toBe(false);
    const topped = addRequesterBags(s, "REQ-2103", 2);
    expect(readiness(pickup(topped, "REQ-2103"), topped.thresholds)).toBe("ready");
    expect(acceptRequest(topped, "REQ-2103", "c-rebottle", NOW).ok).toBe(true);
  });

  it("changing a material's threshold changes readiness", () => {
    const s = fresh();
    const lowered = { ...s, thresholds: { ...s.thresholds, plastic: 1 } };
    expect(readiness(pickup(lowered, "REQ-2103"), lowered.thresholds)).toBe("ready");
  });

  it("shows awaiting more waste, scheduled, collected and verified states", () => {
    const s = fresh();
    expect(readiness(pickup(s, "REQ-2102"), s.thresholds)).toBe("awaiting_more");
    expect(readiness(pickup(s, "REQ-2115"), s.thresholds)).toBe("scheduled");
    expect(readiness(pickup(s, "REQ-2129"), s.thresholds)).toBe("collected");
    expect(readiness(pickup(s, "RMK-1031"), s.thresholds)).toBe("verified");
  });
});

describe("Accepting, rejecting and proposing", () => {
  it("accepting a request assigns it to the collector", () => {
    const s = ok(acceptRequest(fresh(), "REQ-2110", "c-kombo", NOW)).state;
    expect(pickup(s, "REQ-2110").status).toBe("assigned");
    expect(pickup(s, "REQ-2110").collectorId).toBe("c-kombo");
  });

  it("a collector can't accept a request outside its categories", () => {
    expect(acceptRequest(fresh(), "REQ-2105", "c-kombo", NOW).ok).toBe(false);
  });

  it("rejecting needs a reason and hides the request only for that collector", () => {
    const s = fresh();
    expect(rejectRequest(s, "REQ-2101", "c-kombo", "  ", NOW).ok).toBe(false);
    const after = ok(rejectRequest(s, "REQ-2101", "c-kombo", "Vehicle full for that day", NOW)).state;
    expect(sees(after, "c-kombo", "REQ-2101")).toBe(false);
    expect(sees(after, "c-lamin", "REQ-2101")).toBe(true);
  });

  it("rejecting a request sent by name returns it to the pool and flags it declined", () => {
    const after = ok(rejectRequest(fresh(), "REQ-2112", "c-lamin", "Outside my service area today", NOW)).state;
    const p = pickup(after, "REQ-2112");
    expect(p.collectorId).toBeNull();
    expect(p.flag).toBe("declined");
  });

  it("an agreed new window makes a not-ready request ready and assigns it", () => {
    const s = fresh();
    expect(readiness(pickup(s, "REQ-2104"), s.thresholds)).toBe("not_ready");
    const proposed = ok(proposeWindow(s, "REQ-2104", "c-kombo", iso(3), "10:00 – 12:00", NOW)).state;
    expect(pickup(proposed, "REQ-2104").proposal?.status).toBe("pending");
    const agreed = ok(answerProposal(proposed, "REQ-2104", true, NOW)).state;
    const p = pickup(agreed, "REQ-2104");
    expect(p.date).toBe(iso(3));
    expect(p.collectorId).toBe("c-kombo");
    expect(p.status).toBe("assigned");
  });
});

describe("Collection routes", () => {
  it("groups accepted jobs by zone, day and receiving partner", () => {
    const s = fresh();
    const groups = suggestRoutes(s, who(s, "c-kombo")).map((g) => [...g.pickupIds].sort());
    expect(groups).toContainEqual(["REQ-2115", "REQ-2116"]);
    expect(groups).toContainEqual(["REQ-2117"]);
  });

  it("refuses a route over the vehicle capacity", () => {
    const s = fresh();
    const small = { ...s, collectorEdits: { "c-kombo": { capacityBags: 5 } } };
    expect(createRoute(small, "c-kombo", ["REQ-2115", "REQ-2116"], NOW).ok).toBe(false);
  });

  it("stops can be arrived at, confirmed or missed; the route completes only when every stop is closed", () => {
    let s = fresh();
    const made = createRoute(s, "c-kombo", ["REQ-2116", "REQ-2115"], NOW);
    s = ok(made).state;
    const rid = made.routeId!;
    s = ok(arriveAtStop(s, rid, "REQ-2116", "c-kombo", NOW)).state;
    expect(pickup(s, "REQ-2116").status).toBe("on_the_way");
    expect(completeRoute(s, rid, "c-kombo", NOW).ok).toBe(false);
    s = ok(confirmPickup(s, "REQ-2116", "c-kombo", NOW)).state;
    s = ok(reportMissed(s, rid, "REQ-2115", "c-kombo", "Gate locked", NOW)).state;
    expect(pickup(s, "REQ-2115").routeId).toBeUndefined();
    s = ok(completeRoute(s, rid, "c-kombo", NOW)).state;
    expect(s.routes.find((r) => r.id === rid)?.status).toBe("completed");
  });
});

describe("QR collection confirmation", () => {
  it("shows the right result for each booking", () => {
    const s = fresh();
    expect(scanStatus(pickup(s, "RMK-1042"), "c-lamin")).toBe("ready");
    expect(scanStatus(pickup(s, "RMK-1042"), "c-kombo")).toBe("wrong_collector");
    expect(scanStatus(pickup(s, "RMK-1045"), "c-kombo")).toBe("unassigned");
    expect(scanStatus(pickup(s, "RMK-1039"), "c-kombo")).toBe("collected");
    expect(scanStatus(pickup(s, "RMK-1020"), "c-greenbelt")).toBe("cancelled");
    expect(scanStatus(null, "c-kombo")).toBe("invalid");
  });

  it("only the assigned collector confirms, only once, and no coins are released", () => {
    const s = fresh();
    expect(confirmPickup(s, "RMK-1042", "c-kombo", NOW).ok).toBe(false);
    const before = walletSummary(s.transactions).available;
    const done = ok(confirmPickup(s, "RMK-1042", "c-lamin", NOW)).state;
    expect(walletSummary(done.transactions).available).toBe(before);
    expect(confirmPickup(done, "RMK-1042", "c-lamin", NOW + 1).ok).toBe(false);
  });
});

describe("Material verification", () => {
  const input = { received: true, actualKg: 28, meetsRequirements: true, needsSorting: false, note: "" };

  it("is a separate step after collection, only for recycling companies", () => {
    const s = fresh();
    expect(verifyMaterial(s, "REQ-2115", "c-kombo", { ...input, result: "accepted" }, NOW).ok).toBe(false);
    expect(verifyMaterial(s, "RMK-1039", "c-greenbelt", { ...input, result: "accepted" }, NOW).ok).toBe(false);
  });

  it("accepting verified material releases the resident's pending coins", () => {
    const s = fresh();
    const before = walletSummary(s.transactions);
    const after = ok(verifyMaterial(s, "RMK-1039", "c-kombo", { ...input, result: "accepted" }, NOW)).state;
    expect(pickup(after, "RMK-1039").status).toBe("verified");
    expect(walletSummary(after.transactions).available).toBe(before.available + 150);
  });

  it("needs-sorting and rejected results keep the material unverified", () => {
    const s = fresh();
    const sorted = ok(verifyMaterial(s, "REQ-2129", "c-kombo", { ...input, needsSorting: true, result: "needs_sorting" }, NOW)).state;
    expect(pickup(sorted, "REQ-2129").status).toBe("collected");
    expect(verifyMaterial(s, "REQ-2129", "c-kombo", { ...input, meetsRequirements: false, result: "accepted" }, NOW).ok).toBe(false);
  });
});

describe("Registration and verification status", () => {
  const app: CollectorApplication = {
    category: "general",
    fullName: "Musa Bah",
    phone: "7019999",
    email: "",
    remakeId: "SELF-CHOSEN",
    registrationNo: "BRS-2025-12345",
    organisation: "Bah Waste Services",
    areas: ["Fajara"],
    materials: ["general"],
    vehicle: "Covered truck",
    capacityBags: 50,
  };

  it("applicants don't choose their Remake ID; approval issues one separate from the registration number", () => {
    let s = submitApplication(fresh(), app, NOW);
    expect(s.collectorAccount?.status).toBe("awaiting");
    expect(s.collectorAccount?.application.remakeId).toBe("");
    expect(approvedCollector(s)).toBeUndefined();
    s = reviewApplication(s, "approved", NOW);
    const c = approvedCollector(s)!;
    expect(c.remakeId).toMatch(/^RMK-C-\d{4}$/);
    expect(c.registrationNo).toBe("BRS-2025-12345");
    expect(c.remakeId).not.toBe(c.registrationNo);
  });

  it("only approved accounts reach assignments", () => {
    const s = fresh();
    for (const [phone, approved] of [
      ["7010004", true], // Kombo — approved
      ["7010007", false], // Banjul City Haulage — suspended
      ["7010021", false], // awaiting
      ["7010022", false], // rejected
    ] as const) {
      const signed = ok(collectorSignIn(s, phone, NOW)).state;
      expect(!!approvedCollector(signed)).toBe(approved);
    }
  });
});

describe("Resident experience", () => {
  it("institutional requests never appear in the resident's bookings", () => {
    const s = fresh();
    expect(residentPickups(s.pickups).every((p) => !p.institution)).toBe(true);
    expect(residentPickups(s.pickups).map((p) => p.id)).toContain("RMK-1042");
  });
});
