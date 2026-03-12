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
    id: "court-1",
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

interface MockDbOpts {
  facility?: ReturnType<typeof makeFacility>;
  courts?: ReturnType<typeof makeCourt>[];
  role?: string;
}

function createMockDb(opts?: MockDbOpts) {
  const facility = opts?.facility ?? makeFacility();
  const courtsList = opts?.courts ?? [makeCourt()];
  const role = opts?.role ?? "org_admin";

  const updateReturningFn = vi
    .fn()
    .mockResolvedValue([{ ...facility }]);
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
        findMany: vi.fn().mockResolvedValue([]),
      },
      peakPeriods: {
        findMany: vi.fn().mockResolvedValue([]),
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
