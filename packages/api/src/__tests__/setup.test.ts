/* eslint-disable @typescript-eslint/no-unsafe-assignment -- vitest mock types */
/* eslint-disable @typescript-eslint/no-explicit-any -- mock DB/context types */
import { describe, expect, it, vi } from "vitest";

import { facilityRouter } from "../router/facility";
import { createCallerFactory, createTRPCRouter } from "../trpc";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ORG_ID = "00000000-0000-4000-a000-000000000001";
const FACILITY_ID = "00000000-0000-4000-a000-000000000010";
const USER_ID = "00000000-0000-4000-a000-000000000100";

// ---------------------------------------------------------------------------
// Mock access control
// ---------------------------------------------------------------------------

let mockFacility: Record<string, any> = {};

vi.mock("../lib/access-control", () => ({
  verifyFacilityAccess: vi.fn().mockImplementation(() =>
    Promise.resolve({
      facility: mockFacility,
      membership: {
        id: "mem-1",
        organizationId: ORG_ID,
        userId: USER_ID,
        role: "org_admin",
        facilityIds: [],
      },
    }),
  ),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const router = createTRPCRouter({ facility: facilityRouter });
const createCaller = createCallerFactory(router);

function makeFacility(overrides?: Partial<Record<string, any>>) {
  return {
    id: FACILITY_ID,
    organizationId: ORG_ID,
    name: "Test Facility",
    photos: [],
    amenities: [],
    onboardingCompletedAt: null,
    ...overrides,
  };
}

function makeCourt(
  overrides?: Partial<{ id: string; priceInCents: number | null }>,
) {
  return {
    id: overrides?.id ?? "court-1",
    priceInCents: overrides?.priceInCents ?? null,
  };
}

let mockCourts: any[] = [];
let mockHours: any[] = [];

function buildMockDb() {
  return {
    query: {
      courts: {
        findMany: vi.fn().mockResolvedValue(mockCourts),
      },
      operatingHours: {
        findMany: vi.fn().mockResolvedValue(mockHours),
      },
    },
  };
}

function buildCaller(db?: any) {
  return createCaller({
    db: db ?? buildMockDb(),
    session: { user: { id: USER_ID } } as any,
    authApi: {} as any,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("facility.getSetupStatus", () => {
  it("returns all expected fields", async () => {
    mockFacility = makeFacility();
    mockCourts = [];
    mockHours = [];
    const caller = buildCaller();

    const result = await caller.facility.getSetupStatus({
      facilityId: FACILITY_ID,
    });

    expect(result).toEqual(
      expect.objectContaining({
        isComplete: false,
        onboardingCompletedAt: null,
        hasCourts: false,
        hasSchedule: false,
        hasPricing: false,
        hasPhotos: false,
        hasAmenities: false,
        completedSteps: 0,
        totalSteps: 3,
        canActivate: false,
        steps: expect.objectContaining({
          courts: expect.objectContaining({ completed: false, count: 0 }),
          schedule: expect.objectContaining({ completed: false, count: 0 }),
        }),
      }),
    );
  });

  // -------------------------------------------------------------------------
  // hasCourts
  // -------------------------------------------------------------------------

  it("hasCourts=false when no courts", async () => {
    mockFacility = makeFacility();
    mockCourts = [];
    mockHours = [];
    const caller = buildCaller();

    const result = await caller.facility.getSetupStatus({
      facilityId: FACILITY_ID,
    });

    expect(result.hasCourts).toBe(false);
    expect(result.steps.courts.completed).toBe(false);
    expect(result.steps.courts.count).toBe(0);
  });

  it("hasCourts=true when courts exist", async () => {
    mockFacility = makeFacility();
    mockCourts = [makeCourt({ id: "c1" }), makeCourt({ id: "c2" })];
    mockHours = [];
    const caller = buildCaller();

    const result = await caller.facility.getSetupStatus({
      facilityId: FACILITY_ID,
    });

    expect(result.hasCourts).toBe(true);
    expect(result.steps.courts.count).toBe(2);
  });

  // -------------------------------------------------------------------------
  // hasSchedule
  // -------------------------------------------------------------------------

  it("hasSchedule=false when no operating hours", async () => {
    mockFacility = makeFacility();
    mockCourts = [];
    mockHours = [];
    const caller = buildCaller();

    const result = await caller.facility.getSetupStatus({
      facilityId: FACILITY_ID,
    });

    expect(result.hasSchedule).toBe(false);
  });

  it("hasSchedule=true when operating hours exist", async () => {
    mockFacility = makeFacility();
    mockCourts = [];
    mockHours = [{ id: "h1" }, { id: "h2" }, { id: "h3" }];
    const caller = buildCaller();

    const result = await caller.facility.getSetupStatus({
      facilityId: FACILITY_ID,
    });

    expect(result.hasSchedule).toBe(true);
    expect(result.steps.schedule.count).toBe(3);
  });

  // -------------------------------------------------------------------------
  // hasPricing
  // -------------------------------------------------------------------------

  it("hasPricing=false when no courts exist", async () => {
    mockFacility = makeFacility();
    mockCourts = [];
    mockHours = [];
    const caller = buildCaller();

    const result = await caller.facility.getSetupStatus({
      facilityId: FACILITY_ID,
    });

    expect(result.hasPricing).toBe(false);
  });

  it("hasPricing=false when some courts have no price", async () => {
    mockFacility = makeFacility();
    mockCourts = [
      makeCourt({ id: "c1", priceInCents: 5000 }),
      makeCourt({ id: "c2", priceInCents: null }),
    ];
    mockHours = [];
    const caller = buildCaller();

    const result = await caller.facility.getSetupStatus({
      facilityId: FACILITY_ID,
    });

    expect(result.hasPricing).toBe(false);
  });

  it("hasPricing=false when some courts have priceInCents=0", async () => {
    mockFacility = makeFacility();
    mockCourts = [
      makeCourt({ id: "c1", priceInCents: 5000 }),
      makeCourt({ id: "c2", priceInCents: 0 }),
    ];
    mockHours = [];
    const caller = buildCaller();

    const result = await caller.facility.getSetupStatus({
      facilityId: FACILITY_ID,
    });

    expect(result.hasPricing).toBe(false);
  });

  it("hasPricing=true when ALL courts have priceInCents > 0", async () => {
    mockFacility = makeFacility();
    mockCourts = [
      makeCourt({ id: "c1", priceInCents: 5000 }),
      makeCourt({ id: "c2", priceInCents: 8000 }),
    ];
    mockHours = [];
    const caller = buildCaller();

    const result = await caller.facility.getSetupStatus({
      facilityId: FACILITY_ID,
    });

    expect(result.hasPricing).toBe(true);
  });

  // -------------------------------------------------------------------------
  // hasPhotos
  // -------------------------------------------------------------------------

  it("hasPhotos=false when photos is empty", async () => {
    mockFacility = makeFacility({ photos: [] });
    mockCourts = [];
    mockHours = [];
    const caller = buildCaller();

    const result = await caller.facility.getSetupStatus({
      facilityId: FACILITY_ID,
    });

    expect(result.hasPhotos).toBe(false);
  });

  it("hasPhotos=false when photos is null", async () => {
    mockFacility = makeFacility({ photos: null });
    mockCourts = [];
    mockHours = [];
    const caller = buildCaller();

    const result = await caller.facility.getSetupStatus({
      facilityId: FACILITY_ID,
    });

    expect(result.hasPhotos).toBe(false);
  });

  it("hasPhotos=true when photos has entries", async () => {
    mockFacility = makeFacility({ photos: ["img-1", "img-2"] });
    mockCourts = [];
    mockHours = [];
    const caller = buildCaller();

    const result = await caller.facility.getSetupStatus({
      facilityId: FACILITY_ID,
    });

    expect(result.hasPhotos).toBe(true);
  });

  // -------------------------------------------------------------------------
  // hasAmenities
  // -------------------------------------------------------------------------

  it("hasAmenities=false when amenities is empty", async () => {
    mockFacility = makeFacility({ amenities: [] });
    mockCourts = [];
    mockHours = [];
    const caller = buildCaller();

    const result = await caller.facility.getSetupStatus({
      facilityId: FACILITY_ID,
    });

    expect(result.hasAmenities).toBe(false);
  });

  it("hasAmenities=false when amenities is null", async () => {
    mockFacility = makeFacility({ amenities: null });
    mockCourts = [];
    mockHours = [];
    const caller = buildCaller();

    const result = await caller.facility.getSetupStatus({
      facilityId: FACILITY_ID,
    });

    expect(result.hasAmenities).toBe(false);
  });

  it("hasAmenities=true when amenities has entries", async () => {
    mockFacility = makeFacility({ amenities: ["wifi", "parking"] });
    mockCourts = [];
    mockHours = [];
    const caller = buildCaller();

    const result = await caller.facility.getSetupStatus({
      facilityId: FACILITY_ID,
    });

    expect(result.hasAmenities).toBe(true);
  });

  // -------------------------------------------------------------------------
  // completedSteps / totalSteps
  // -------------------------------------------------------------------------

  it("completedSteps=0 when nothing configured", async () => {
    mockFacility = makeFacility();
    mockCourts = [];
    mockHours = [];
    const caller = buildCaller();

    const result = await caller.facility.getSetupStatus({
      facilityId: FACILITY_ID,
    });

    expect(result.completedSteps).toBe(0);
    expect(result.totalSteps).toBe(3);
  });

  it("completedSteps=1 when only courts exist (no pricing)", async () => {
    mockFacility = makeFacility();
    mockCourts = [makeCourt({ id: "c1", priceInCents: null })];
    mockHours = [];
    const caller = buildCaller();

    const result = await caller.facility.getSetupStatus({
      facilityId: FACILITY_ID,
    });

    expect(result.completedSteps).toBe(1); // hasCourts only
  });

  it("completedSteps=2 when courts with pricing exist", async () => {
    mockFacility = makeFacility();
    mockCourts = [makeCourt({ id: "c1", priceInCents: 5000 })];
    mockHours = [];
    const caller = buildCaller();

    const result = await caller.facility.getSetupStatus({
      facilityId: FACILITY_ID,
    });

    expect(result.completedSteps).toBe(2); // hasCourts + hasPricing
  });

  it("completedSteps=3 when courts + pricing + schedule", async () => {
    mockFacility = makeFacility();
    mockCourts = [makeCourt({ id: "c1", priceInCents: 5000 })];
    mockHours = [{ id: "h1" }];
    const caller = buildCaller();

    const result = await caller.facility.getSetupStatus({
      facilityId: FACILITY_ID,
    });

    expect(result.completedSteps).toBe(3);
  });

  // -------------------------------------------------------------------------
  // canActivate
  // -------------------------------------------------------------------------

  it("canActivate=false when missing courts", async () => {
    mockFacility = makeFacility();
    mockCourts = [];
    mockHours = [{ id: "h1" }];
    const caller = buildCaller();

    const result = await caller.facility.getSetupStatus({
      facilityId: FACILITY_ID,
    });

    expect(result.canActivate).toBe(false);
  });

  it("canActivate=false when missing schedule", async () => {
    mockFacility = makeFacility();
    mockCourts = [makeCourt({ id: "c1", priceInCents: 5000 })];
    mockHours = [];
    const caller = buildCaller();

    const result = await caller.facility.getSetupStatus({
      facilityId: FACILITY_ID,
    });

    expect(result.canActivate).toBe(false);
  });

  it("canActivate=false when missing pricing", async () => {
    mockFacility = makeFacility();
    mockCourts = [makeCourt({ id: "c1", priceInCents: null })];
    mockHours = [{ id: "h1" }];
    const caller = buildCaller();

    const result = await caller.facility.getSetupStatus({
      facilityId: FACILITY_ID,
    });

    expect(result.canActivate).toBe(false);
  });

  it("canActivate=true when courts + schedule + pricing all present", async () => {
    mockFacility = makeFacility();
    mockCourts = [
      makeCourt({ id: "c1", priceInCents: 5000 }),
      makeCourt({ id: "c2", priceInCents: 8000 }),
    ];
    mockHours = [{ id: "h1" }, { id: "h2" }];
    const caller = buildCaller();

    const result = await caller.facility.getSetupStatus({
      facilityId: FACILITY_ID,
    });

    expect(result.canActivate).toBe(true);
  });

  // -------------------------------------------------------------------------
  // isComplete
  // -------------------------------------------------------------------------

  it("isComplete=false when onboardingCompletedAt is null", async () => {
    mockFacility = makeFacility({ onboardingCompletedAt: null });
    mockCourts = [];
    mockHours = [];
    const caller = buildCaller();

    const result = await caller.facility.getSetupStatus({
      facilityId: FACILITY_ID,
    });

    expect(result.isComplete).toBe(false);
  });

  it("isComplete=true when onboardingCompletedAt is set", async () => {
    const completedAt = new Date("2025-01-15T12:00:00Z");
    mockFacility = makeFacility({ onboardingCompletedAt: completedAt });
    mockCourts = [makeCourt({ id: "c1", priceInCents: 5000 })];
    mockHours = [{ id: "h1" }];
    const caller = buildCaller();

    const result = await caller.facility.getSetupStatus({
      facilityId: FACILITY_ID,
    });

    expect(result.isComplete).toBe(true);
    expect(result.onboardingCompletedAt).toEqual(completedAt);
  });

  // -------------------------------------------------------------------------
  // Combined scenarios
  // -------------------------------------------------------------------------

  it("fully configured facility with photos and amenities", async () => {
    mockFacility = makeFacility({
      photos: ["img-1", "img-2", "img-3"],
      amenities: ["wifi", "parking", "showers"],
      onboardingCompletedAt: new Date("2025-06-01"),
    });
    mockCourts = [
      makeCourt({ id: "c1", priceInCents: 5000 }),
      makeCourt({ id: "c2", priceInCents: 8000 }),
      makeCourt({ id: "c3", priceInCents: 6000 }),
    ];
    mockHours = [
      { id: "h1" },
      { id: "h2" },
      { id: "h3" },
      { id: "h4" },
      { id: "h5" },
      { id: "h6" },
      { id: "h7" },
    ];
    const caller = buildCaller();

    const result = await caller.facility.getSetupStatus({
      facilityId: FACILITY_ID,
    });

    expect(result).toMatchObject({
      isComplete: true,
      hasCourts: true,
      hasSchedule: true,
      hasPricing: true,
      hasPhotos: true,
      hasAmenities: true,
      completedSteps: 3,
      totalSteps: 3,
      canActivate: true,
    });
  });

  it("partially configured: courts without pricing, no schedule", async () => {
    mockFacility = makeFacility({ photos: ["img-1"] });
    mockCourts = [
      makeCourt({ id: "c1", priceInCents: 5000 }),
      makeCourt({ id: "c2", priceInCents: null }),
    ];
    mockHours = [];
    const caller = buildCaller();

    const result = await caller.facility.getSetupStatus({
      facilityId: FACILITY_ID,
    });

    expect(result).toMatchObject({
      isComplete: false,
      hasCourts: true,
      hasSchedule: false,
      hasPricing: false,
      hasPhotos: true,
      hasAmenities: false,
      completedSteps: 1,
      canActivate: false,
    });
  });
});
