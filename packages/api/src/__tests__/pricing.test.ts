/* eslint-disable @typescript-eslint/no-unsafe-assignment -- vitest mock types (vi.fn, expect.objectContaining) are inherently `any` */
/* eslint-disable @typescript-eslint/no-explicit-any -- mock db/session types */
import { describe, expect, it, vi } from "vitest";

import { pricingRouter } from "../router/pricing";
import { createCallerFactory, createTRPCRouter } from "../trpc";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FACILITY_ID = "30000000-0000-4000-8000-000000000001";
const USER_ID = "30000000-0000-4000-8000-000000000020";
const ORG_ID = "30000000-0000-4000-8000-000000000030";
const COURT_ID = "30000000-0000-4000-8000-000000000040";
const NONEXISTENT_COURT_ID = "30000000-0000-4000-8000-000000000099";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const router = createTRPCRouter({ pricing: pricingRouter });
const createCaller = createCallerFactory(router);

function makeCallerMembership(role = "org_admin") {
  return {
    id: "caller-mem",
    organizationId: ORG_ID,
    userId: USER_ID,
    role,
    facilityIds: role === "staff" ? [FACILITY_ID] : [],
    createdAt: new Date(),
    updatedAt: new Date(),
    organization: {
      id: ORG_ID,
      name: "Test Org",
      slug: "test-org",
      logoUrl: null,
      contactEmail: null,
      contactPhone: null,
      description: null,
      billingEnabled: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };
}

function makeFacility(overrides?: Record<string, unknown>) {
  return {
    id: FACILITY_ID,
    organizationId: ORG_ID,
    defaultPriceInCents: null,
    defaultPeakPriceInCents: null,
    ...overrides,
  };
}

function makeCourt(overrides?: Record<string, unknown>) {
  return {
    id: COURT_ID,
    facilityId: FACILITY_ID,
    name: "Cancha 1",
    type: "indoor",
    status: "active",
    priceInCents: 5000,
    peakPriceInCents: null,
    isActive: true,
    createdAt: new Date(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Mock DB builder
// ---------------------------------------------------------------------------

interface MockOperatingHour {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

interface MockPeakPeriod {
  id: string;
  name: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  markupPercent: number;
  isActive: boolean;
  createdAt: Date;
}

interface MockDbOpts {
  facility?: ReturnType<typeof makeFacility>;
  courts?: ReturnType<typeof makeCourt>[];
  operatingHours?: MockOperatingHour[];
  peakPeriods?: MockPeakPeriod[];
  role?: string;
}

function createMockDb(opts?: MockDbOpts) {
  const facility = opts?.facility ?? makeFacility();
  const courtsList = opts?.courts ?? [makeCourt()];
  const hoursList = opts?.operatingHours ?? [];
  const periodsList = opts?.peakPeriods ?? [];
  const role = opts?.role ?? "org_admin";

  const updateReturningFn = vi.fn().mockResolvedValue([{ ...facility }]);
  const updateWhereFn = vi
    .fn()
    .mockReturnValue({ returning: updateReturningFn });
  const updateSetFn = vi.fn().mockReturnValue({ where: updateWhereFn });

  return {
    query: {
      organizationMembers: {
        findFirst: vi.fn().mockResolvedValue(makeCallerMembership(role)),
      },
      facilities: {
        findFirst: vi.fn().mockResolvedValue(facility),
      },
      courts: {
        findMany: vi.fn().mockResolvedValue(courtsList),
      },
      operatingHours: {
        findMany: vi.fn().mockResolvedValue(hoursList),
      },
      peakPeriods: {
        findMany: vi.fn().mockResolvedValue(periodsList),
      },
    },
    update: vi.fn().mockReturnValue({ set: updateSetFn }),
    _updateSetFn: updateSetFn,
    _updateReturningFn: updateReturningFn,
  };
}

type MockDb = ReturnType<typeof createMockDb>;

function authedCaller(db: MockDb) {
  return createCaller({
    db: db as any,
    session: { user: { id: USER_ID, email: "test@test.com" } } as any,
    authApi: {} as any,
  });
}

// ===========================================================================
// Tests: pricing.updateDefaultRates
// ===========================================================================

describe("pricing.updateDefaultRates", () => {
  it("updates facility default regular and peak rates", async () => {
    const facility = makeFacility();
    const updatedFacility = {
      ...facility,
      defaultPriceInCents: 6000,
      defaultPeakPriceInCents: 8000,
    };
    const db = createMockDb({ facility });
    db._updateReturningFn.mockResolvedValue([updatedFacility]);

    const caller = authedCaller(db);
    const result = await caller.pricing.updateDefaultRates({
      facilityId: FACILITY_ID,
      regularRateCents: 6000,
      peakRateCents: 8000,
    });

    expect(result.defaultPriceInCents).toBe(6000);
    expect(result.defaultPeakPriceInCents).toBe(8000);
  });

  it("validates regular rate must be positive", async () => {
    const db = createMockDb();
    const caller = authedCaller(db);

    await expect(
      caller.pricing.updateDefaultRates({
        facilityId: FACILITY_ID,
        regularRateCents: 0,
        peakRateCents: 5000,
      }),
    ).rejects.toThrow();
  });

  it("validates peak rate must be positive", async () => {
    const db = createMockDb();
    const caller = authedCaller(db);

    await expect(
      caller.pricing.updateDefaultRates({
        facilityId: FACILITY_ID,
        regularRateCents: 5000,
        peakRateCents: 0,
      }),
    ).rejects.toThrow();
  });

  it("validates peak rate must be >= regular rate", async () => {
    const db = createMockDb();
    const caller = authedCaller(db);

    await expect(
      caller.pricing.updateDefaultRates({
        facilityId: FACILITY_ID,
        regularRateCents: 8000,
        peakRateCents: 5000,
      }),
    ).rejects.toThrow(
      "La tarifa pico debe ser igual o mayor a la tarifa regular",
    );
  });

  it("allows peak rate equal to regular rate", async () => {
    const facility = makeFacility();
    const updatedFacility = {
      ...facility,
      defaultPriceInCents: 5000,
      defaultPeakPriceInCents: 5000,
    };
    const db = createMockDb({ facility });
    db._updateReturningFn.mockResolvedValue([updatedFacility]);

    const caller = authedCaller(db);
    const result = await caller.pricing.updateDefaultRates({
      facilityId: FACILITY_ID,
      regularRateCents: 5000,
      peakRateCents: 5000,
    });

    expect(result.defaultPriceInCents).toBe(5000);
    expect(result.defaultPeakPriceInCents).toBe(5000);
  });

  it("rejects staff role (no pricing:write permission)", async () => {
    const db = createMockDb({ role: "staff" });
    const caller = authedCaller(db);

    await expect(
      caller.pricing.updateDefaultRates({
        facilityId: FACILITY_ID,
        regularRateCents: 5000,
        peakRateCents: 7000,
      }),
    ).rejects.toThrow("No tienes permisos para realizar esta acción");
  });
});

// ===========================================================================
// Tests: pricing.getOverview (facility defaults)
// ===========================================================================

describe("pricing.getOverview", () => {
  it("returns facility default rates instead of median", async () => {
    const facility = makeFacility({
      defaultPriceInCents: 6000,
      defaultPeakPriceInCents: 8000,
    });
    const db = createMockDb({
      facility,
      courts: [
        makeCourt({ id: "c1", priceInCents: 5000 }),
        makeCourt({ id: "c2", priceInCents: 7000 }),
      ],
    });
    const caller = authedCaller(db);

    const result = await caller.pricing.getOverview({
      facilityId: FACILITY_ID,
    });

    // Should use facility defaults, not median (which would be 6000)
    expect(result.stats.defaultRegularCents).toBe(6000);
    expect(result.stats.defaultPeakCents).toBe(8000);
  });

  it("falls back to median when facility defaults are not set", async () => {
    const facility = makeFacility({
      defaultPriceInCents: null,
      defaultPeakPriceInCents: null,
    });
    const db = createMockDb({
      facility,
      courts: [
        makeCourt({ id: "c1", priceInCents: 4000 }),
        makeCourt({ id: "c2", priceInCents: 8000 }),
      ],
    });
    const caller = authedCaller(db);

    const result = await caller.pricing.getOverview({
      facilityId: FACILITY_ID,
    });

    // Median of [4000, 8000] = 6000
    expect(result.stats.defaultRegularCents).toBe(6000);
    // Peak computed from regular + markup (0% markup since no peak periods)
    expect(result.stats.defaultPeakCents).toBe(6000);
  });

  it("computes markup percentage from default rates", async () => {
    const facility = makeFacility({
      defaultPriceInCents: 5000,
      defaultPeakPriceInCents: 7500,
    });
    const db = createMockDb({ facility });
    const caller = authedCaller(db);

    const result = await caller.pricing.getOverview({
      facilityId: FACILITY_ID,
    });

    // Markup: ((7500 - 5000) / 5000) * 100 = 50%
    expect(result.stats.markupPercent).toBe(50);
  });

  it("returns 0 markup when regular and peak are equal", async () => {
    const facility = makeFacility({
      defaultPriceInCents: 5000,
      defaultPeakPriceInCents: 5000,
    });
    const db = createMockDb({ facility });
    const caller = authedCaller(db);

    const result = await caller.pricing.getOverview({
      facilityId: FACILITY_ID,
    });

    expect(result.stats.markupPercent).toBe(0);
  });
});

// ===========================================================================
// Helpers for calculateRevenue tests
// ===========================================================================

function makeOperatingHour(
  dayOfWeek: number,
  openTime = "08:00",
  closeTime = "22:00",
  isClosed = false,
): MockOperatingHour {
  return { dayOfWeek, openTime, closeTime, isClosed };
}

function makePeakPeriod(overrides?: Partial<MockPeakPeriod>): MockPeakPeriod {
  return {
    id: "peak-1",
    name: "Hora Punta",
    daysOfWeek: [1, 2, 3, 4, 5],
    startTime: "18:00",
    endTime: "21:00",
    markupPercent: 30,
    isActive: true,
    createdAt: new Date(),
    ...overrides,
  };
}

// ===========================================================================
// Tests: pricing.calculateRevenue
// ===========================================================================

describe("pricing.calculateRevenue", () => {
  it("calculates revenue using court custom pricing", async () => {
    // 1 court at S/50, 1 day open 08:00-10:00 = 2 hours, 100% occupancy
    const db = createMockDb({
      courts: [makeCourt({ priceInCents: 5000 })],
      operatingHours: [
        makeOperatingHour(0, "08:00", "10:00"),
        ...Array.from({ length: 6 }, (_, i) =>
          makeOperatingHour(i + 1, "08:00", "08:00", true),
        ),
      ],
    });
    const caller = authedCaller(db);

    const result = await caller.pricing.calculateRevenue({
      facilityId: FACILITY_ID,
      occupancyPercent: 100,
    });

    // 1 court × 2 hours × S/50 = S/100 = 10000 cents
    expect(result.totalWeekly).toBe(10000);
    expect(result.regularRevenue).toBe(10000);
    expect(result.peakRevenue).toBe(0);
    expect(result.courtCount).toBe(1);
  });

  it("uses facility defaults when court has no custom pricing", async () => {
    const facility = makeFacility({
      defaultPriceInCents: 6000,
      defaultPeakPriceInCents: 8000,
    });
    // Court with null pricing → should use facility defaults
    const db = createMockDb({
      facility,
      courts: [makeCourt({ priceInCents: null, peakPriceInCents: null })],
      operatingHours: [
        makeOperatingHour(0, "08:00", "10:00"),
        ...Array.from({ length: 6 }, (_, i) =>
          makeOperatingHour(i + 1, "08:00", "08:00", true),
        ),
      ],
    });
    const caller = authedCaller(db);

    const result = await caller.pricing.calculateRevenue({
      facilityId: FACILITY_ID,
      occupancyPercent: 100,
    });

    // 1 court × 2 hours × S/60 = 12000 cents (using facility default)
    expect(result.totalWeekly).toBe(12000);
    expect(result.regularRevenue).toBe(12000);
  });

  it("applies occupancy percentage correctly", async () => {
    const db = createMockDb({
      courts: [makeCourt({ priceInCents: 10000 })],
      operatingHours: [
        makeOperatingHour(0, "08:00", "09:00"), // 1 hour
        ...Array.from({ length: 6 }, (_, i) =>
          makeOperatingHour(i + 1, "08:00", "08:00", true),
        ),
      ],
    });
    const caller = authedCaller(db);

    const result = await caller.pricing.calculateRevenue({
      facilityId: FACILITY_ID,
      occupancyPercent: 50,
    });

    // 1 court × 1 hour × S/100 × 50% = 5000 cents
    expect(result.totalWeekly).toBe(5000);
  });

  it("separates regular and peak revenue correctly", async () => {
    // Monday open 08:00-21:00 with peak 18:00-21:00 (3 peak hours, 10 regular)
    const db = createMockDb({
      courts: [makeCourt({ priceInCents: 5000, peakPriceInCents: 7000 })],
      operatingHours: [
        makeOperatingHour(1, "08:00", "21:00"), // Monday
        makeOperatingHour(0, "08:00", "08:00", true),
        ...Array.from({ length: 5 }, (_, i) =>
          makeOperatingHour(i + 2, "08:00", "08:00", true),
        ),
      ],
      peakPeriods: [
        makePeakPeriod({
          daysOfWeek: [1],
          startTime: "18:00",
          endTime: "21:00",
          markupPercent: 40,
        }),
      ],
    });
    const caller = authedCaller(db);

    const result = await caller.pricing.calculateRevenue({
      facilityId: FACILITY_ID,
      occupancyPercent: 100,
    });

    // Regular: 10 hours × 5000 = 50000
    // Peak: 3 hours × 7000 = 21000
    expect(result.regularRevenue).toBe(50000);
    expect(result.peakRevenue).toBe(21000);
    expect(result.totalWeekly).toBe(71000);
    // Peak markup bonus: 3 × (7000 - 5000) = 6000
    expect(result.peakMarkupBonus).toBe(6000);
  });

  it("falls back to computed peak rate when no peak price set", async () => {
    // Court has regular price but no peak price, no facility defaults
    // Should compute peak from regular × (1 + markup/100)
    const db = createMockDb({
      courts: [makeCourt({ priceInCents: 5000, peakPriceInCents: null })],
      operatingHours: [
        makeOperatingHour(1, "18:00", "21:00"), // 3 peak hours only
        makeOperatingHour(0, "08:00", "08:00", true),
        ...Array.from({ length: 5 }, (_, i) =>
          makeOperatingHour(i + 2, "08:00", "08:00", true),
        ),
      ],
      peakPeriods: [
        makePeakPeriod({
          daysOfWeek: [1],
          startTime: "18:00",
          endTime: "21:00",
          markupPercent: 20,
        }),
      ],
    });
    const caller = authedCaller(db);

    const result = await caller.pricing.calculateRevenue({
      facilityId: FACILITY_ID,
      occupancyPercent: 100,
    });

    // Peak rate = 5000 × (1 + 20/100) = 6000
    // 3 hours × 6000 = 18000
    expect(result.peakRevenue).toBe(18000);
    // Markup bonus: 3 × (6000 - 5000) = 3000
    expect(result.peakMarkupBonus).toBe(3000);
  });

  it("handles multiple courts with mixed pricing", async () => {
    const facility = makeFacility({ defaultPriceInCents: 4000 });
    const db = createMockDb({
      facility,
      courts: [
        makeCourt({ id: "c1", priceInCents: 5000 }), // custom
        makeCourt({ id: "c2", priceInCents: null }), // uses facility default (4000)
      ],
      operatingHours: [
        makeOperatingHour(0, "08:00", "09:00"), // 1 hour
        ...Array.from({ length: 6 }, (_, i) =>
          makeOperatingHour(i + 1, "08:00", "08:00", true),
        ),
      ],
    });
    const caller = authedCaller(db);

    const result = await caller.pricing.calculateRevenue({
      facilityId: FACILITY_ID,
      occupancyPercent: 100,
    });

    // Court 1: 1 hour × 5000 = 5000
    // Court 2: 1 hour × 4000 = 4000
    expect(result.totalWeekly).toBe(9000);
    expect(result.courtCount).toBe(2);
  });

  it("skips closed days", async () => {
    const db = createMockDb({
      courts: [makeCourt({ priceInCents: 5000 })],
      operatingHours: [
        makeOperatingHour(0, "08:00", "10:00", true), // Sunday closed
        makeOperatingHour(1, "08:00", "10:00"), // Monday open
        ...Array.from({ length: 5 }, (_, i) =>
          makeOperatingHour(i + 2, "08:00", "08:00", true),
        ),
      ],
    });
    const caller = authedCaller(db);

    const result = await caller.pricing.calculateRevenue({
      facilityId: FACILITY_ID,
      occupancyPercent: 100,
    });

    // Only Monday: 2 hours × 5000 = 10000
    expect(result.totalWeekly).toBe(10000);
  });

  it("echoes the occupancy percent in response", async () => {
    const db = createMockDb();
    const caller = authedCaller(db);

    const result = await caller.pricing.calculateRevenue({
      facilityId: FACILITY_ID,
      occupancyPercent: 42,
    });

    expect(result.occupancyPercent).toBe(42);
  });
});

// ===========================================================================
// Tests: pricing.updateCourtPricing
// ===========================================================================

describe("pricing.updateCourtPricing", () => {
  it("sets custom regular and peak prices on a court", async () => {
    const court = makeCourt({ priceInCents: null, peakPriceInCents: null });
    const db = createMockDb({ courts: [court] });
    db.query.courts = {
      ...db.query.courts,
      findFirst: vi.fn().mockResolvedValue(court),
    } as any;
    db._updateReturningFn.mockResolvedValue([
      { ...court, priceInCents: 7000, peakPriceInCents: 9000 },
    ]);

    const caller = authedCaller(db);
    const result = await caller.pricing.updateCourtPricing({
      facilityId: FACILITY_ID,
      courtId: court.id,
      regularPriceCents: 7000,
      peakPriceCents: 9000,
    });

    expect(result.priceInCents).toBe(7000);
    expect(result.peakPriceInCents).toBe(9000);
  });

  it("validates peak price must be >= regular price", async () => {
    const court = makeCourt();
    const db = createMockDb({ courts: [court] });
    db.query.courts = {
      ...db.query.courts,
      findFirst: vi.fn().mockResolvedValue(court),
    } as any;

    const caller = authedCaller(db);

    await expect(
      caller.pricing.updateCourtPricing({
        facilityId: FACILITY_ID,
        courtId: court.id,
        regularPriceCents: 9000,
        peakPriceCents: 5000,
      }),
    ).rejects.toThrow(
      "La tarifa pico debe ser igual o mayor a la tarifa regular",
    );
  });

  it("allows peak price equal to regular price", async () => {
    const court = makeCourt();
    const db = createMockDb({ courts: [court] });
    db.query.courts = {
      ...db.query.courts,
      findFirst: vi.fn().mockResolvedValue(court),
    } as any;
    db._updateReturningFn.mockResolvedValue([
      { ...court, priceInCents: 6000, peakPriceInCents: 6000 },
    ]);

    const caller = authedCaller(db);
    const result = await caller.pricing.updateCourtPricing({
      facilityId: FACILITY_ID,
      courtId: court.id,
      regularPriceCents: 6000,
      peakPriceCents: 6000,
    });

    expect(result.priceInCents).toBe(6000);
    expect(result.peakPriceInCents).toBe(6000);
  });

  it("validates regular price must be positive", async () => {
    const court = makeCourt();
    const db = createMockDb({ courts: [court] });

    const caller = authedCaller(db);

    await expect(
      caller.pricing.updateCourtPricing({
        facilityId: FACILITY_ID,
        courtId: court.id,
        regularPriceCents: 0,
        peakPriceCents: 5000,
      }),
    ).rejects.toThrow();
  });

  it("rejects when court does not exist", async () => {
    const db = createMockDb();
    db.query.courts = {
      ...db.query.courts,
      findFirst: vi.fn().mockResolvedValue(null),
    } as any;

    const caller = authedCaller(db);

    await expect(
      caller.pricing.updateCourtPricing({
        facilityId: FACILITY_ID,
        courtId: NONEXISTENT_COURT_ID,
        regularPriceCents: 5000,
        peakPriceCents: 7000,
      }),
    ).rejects.toThrow("Cancha no encontrada");
  });

  it("rejects staff role (no pricing:write permission)", async () => {
    const db = createMockDb({ role: "staff" });

    const caller = authedCaller(db);

    await expect(
      caller.pricing.updateCourtPricing({
        facilityId: FACILITY_ID,
        courtId: COURT_ID,
        regularPriceCents: 5000,
        peakPriceCents: 7000,
      }),
    ).rejects.toThrow("No tienes permisos para realizar esta acción");
  });
});

// ===========================================================================
// Tests: pricing.resetCourtPricing
// ===========================================================================

describe("pricing.resetCourtPricing", () => {
  it("resets court prices to null (facility defaults)", async () => {
    const court = makeCourt({ priceInCents: 7000, peakPriceInCents: 9000 });
    const db = createMockDb({ courts: [court] });
    db.query.courts = {
      ...db.query.courts,
      findFirst: vi.fn().mockResolvedValue(court),
    } as any;
    db._updateReturningFn.mockResolvedValue([
      { ...court, priceInCents: null, peakPriceInCents: null },
    ]);

    const caller = authedCaller(db);
    const result = await caller.pricing.resetCourtPricing({
      facilityId: FACILITY_ID,
      courtId: court.id,
    });

    expect(result.priceInCents).toBeNull();
    expect(result.peakPriceInCents).toBeNull();
  });

  it("rejects when court does not exist", async () => {
    const db = createMockDb();
    db.query.courts = {
      ...db.query.courts,
      findFirst: vi.fn().mockResolvedValue(null),
    } as any;

    const caller = authedCaller(db);

    await expect(
      caller.pricing.resetCourtPricing({
        facilityId: FACILITY_ID,
        courtId: NONEXISTENT_COURT_ID,
      }),
    ).rejects.toThrow("Cancha no encontrada");
  });

  it("rejects staff role (no pricing:write permission)", async () => {
    const db = createMockDb({ role: "staff" });

    const caller = authedCaller(db);

    await expect(
      caller.pricing.resetCourtPricing({
        facilityId: FACILITY_ID,
        courtId: COURT_ID,
      }),
    ).rejects.toThrow("No tienes permisos para realizar esta acción");
  });
});
