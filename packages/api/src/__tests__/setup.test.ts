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
    phone: "+51 999 888 777",
    email: "test@example.com",
    website: "https://example.com",
    description: "A test facility",
    address: "Av. Test 123",
    district: "Miraflores",
    city: "Lima",
    photos: [],
    amenities: [],
    allowedDurationMinutes: [60, 90],
    isActive: true,
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

// ---------------------------------------------------------------------------
// facility.getProfile
// ---------------------------------------------------------------------------

describe("facility.getProfile", () => {
  it("returns allowedDurationMinutes from facility", async () => {
    mockFacility = makeFacility({ allowedDurationMinutes: [60, 90, 120] });
    mockCourts = [makeCourt({ id: "c1" })];
    const caller = buildCaller();

    const result = await caller.facility.getProfile({
      facilityId: FACILITY_ID,
    });

    expect(result.allowedDurationMinutes).toEqual([60, 90, 120]);
  });

  it("returns default [60, 90] when allowedDurationMinutes is not set", async () => {
    mockFacility = makeFacility();
    mockCourts = [];
    const caller = buildCaller();

    const result = await caller.facility.getProfile({
      facilityId: FACILITY_ID,
    });

    expect(result.allowedDurationMinutes).toEqual([60, 90]);
  });

  it("returns empty array when allowedDurationMinutes is null", async () => {
    mockFacility = makeFacility({ allowedDurationMinutes: null });
    mockCourts = [];
    const caller = buildCaller();

    const result = await caller.facility.getProfile({
      facilityId: FACILITY_ID,
    });

    expect(result.allowedDurationMinutes).toEqual([]);
  });

  it("returns slug when facility has one", async () => {
    mockFacility = makeFacility({ slug: "arena-miraflores" });
    mockCourts = [];
    const caller = buildCaller();

    const result = await caller.facility.getProfile({
      facilityId: FACILITY_ID,
    });

    expect(result.slug).toBe("arena-miraflores");
  });

  it("returns null when facility has no slug", async () => {
    mockFacility = makeFacility({ slug: null });
    mockCourts = [];
    const caller = buildCaller();

    const result = await caller.facility.getProfile({
      facilityId: FACILITY_ID,
    });

    expect(result.slug).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// facility.updateProfile
// ---------------------------------------------------------------------------

describe("facility.updateProfile", () => {
  let mockUpdate: ReturnType<typeof vi.fn>;
  let mockSet: ReturnType<typeof vi.fn>;
  let mockWhere: ReturnType<typeof vi.fn>;

  function buildUpdateDb() {
    mockWhere = vi.fn().mockResolvedValue(undefined);
    mockSet = vi.fn().mockReturnValue({ where: mockWhere });
    mockUpdate = vi.fn().mockReturnValue({ set: mockSet });
    return {
      query: {
        courts: { findMany: vi.fn().mockResolvedValue([]) },
        operatingHours: { findMany: vi.fn().mockResolvedValue([]) },
      },
      update: mockUpdate,
    };
  }

  it("persists allowedDurationMinutes when provided", async () => {
    mockFacility = makeFacility();
    const db = buildUpdateDb();
    const caller = buildCaller(db);

    await caller.facility.updateProfile({
      facilityId: FACILITY_ID,
      name: "Test Facility",
      phone: "+51 999 888 777",
      address: { street: "Av. Test 123", district: "Miraflores", city: "Lima" },
      amenities: [],
      allowedDurationMinutes: [60, 90, 120],
    });

    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        allowedDurationMinutes: [60, 90, 120],
      }),
    );
  });

  it("persists allowedDurationMinutes with single value", async () => {
    mockFacility = makeFacility();
    const db = buildUpdateDb();
    const caller = buildCaller(db);

    await caller.facility.updateProfile({
      facilityId: FACILITY_ID,
      name: "Test Facility",
      phone: "+51 999 888 777",
      address: { street: "Av. Test 123", district: "Miraflores", city: "Lima" },
      amenities: [],
      allowedDurationMinutes: [90],
    });

    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        allowedDurationMinutes: [90],
      }),
    );
  });

  it("rejects empty allowedDurationMinutes array", async () => {
    mockFacility = makeFacility();
    const db = buildUpdateDb();
    const caller = buildCaller(db);

    await expect(
      caller.facility.updateProfile({
        facilityId: FACILITY_ID,
        name: "Test Facility",
        phone: "+51 999 888 777",
        address: {
          street: "Av. Test 123",
          district: "Miraflores",
          city: "Lima",
        },
        amenities: [],
        allowedDurationMinutes: [],
      }),
    ).rejects.toThrow();
  });

  it("rejects invalid duration values", async () => {
    mockFacility = makeFacility();
    const db = buildUpdateDb();
    const caller = buildCaller(db);

    await expect(
      caller.facility.updateProfile({
        facilityId: FACILITY_ID,
        name: "Test Facility",
        phone: "+51 999 888 777",
        address: {
          street: "Av. Test 123",
          district: "Miraflores",
          city: "Lima",
        },
        amenities: [],
        allowedDurationMinutes: [45] as any,
      }),
    ).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// facility.getSetupStatus
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
        hasBasicInfo: true,
        hasCourts: false,
        hasSchedule: false,
        hasPricing: false,
        hasPhotos: false,
        hasAmenities: false,
        completedSteps: 1,
        totalSteps: 4,
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

  it("completedSteps=1 when only basic info configured (default facility)", async () => {
    mockFacility = makeFacility();
    mockCourts = [];
    mockHours = [];
    const caller = buildCaller();

    const result = await caller.facility.getSetupStatus({
      facilityId: FACILITY_ID,
    });

    expect(result.completedSteps).toBe(1); // hasBasicInfo only
    expect(result.totalSteps).toBe(4);
  });

  it("completedSteps=2 when basic info + courts exist (no pricing)", async () => {
    mockFacility = makeFacility();
    mockCourts = [makeCourt({ id: "c1", priceInCents: null })];
    mockHours = [];
    const caller = buildCaller();

    const result = await caller.facility.getSetupStatus({
      facilityId: FACILITY_ID,
    });

    expect(result.completedSteps).toBe(2); // hasBasicInfo + hasCourts
  });

  it("completedSteps=3 when basic info + courts with pricing exist", async () => {
    mockFacility = makeFacility();
    mockCourts = [makeCourt({ id: "c1", priceInCents: 5000 })];
    mockHours = [];
    const caller = buildCaller();

    const result = await caller.facility.getSetupStatus({
      facilityId: FACILITY_ID,
    });

    expect(result.completedSteps).toBe(3); // hasBasicInfo + hasCourts + hasPricing
  });

  it("completedSteps=4 when basic info + courts + pricing + schedule", async () => {
    mockFacility = makeFacility();
    mockCourts = [makeCourt({ id: "c1", priceInCents: 5000 })];
    mockHours = [{ id: "h1" }];
    const caller = buildCaller();

    const result = await caller.facility.getSetupStatus({
      facilityId: FACILITY_ID,
    });

    expect(result.completedSteps).toBe(4);
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
      hasBasicInfo: true,
      hasCourts: true,
      hasSchedule: true,
      hasPricing: true,
      hasPhotos: true,
      hasAmenities: true,
      completedSteps: 4,
      totalSteps: 4,
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
      hasBasicInfo: true,
      hasCourts: true,
      hasSchedule: false,
      hasPricing: false,
      hasPhotos: true,
      hasAmenities: false,
      completedSteps: 2,
      canActivate: false,
    });
  });
});

// ---------------------------------------------------------------------------
// facility.completeSetup
// ---------------------------------------------------------------------------

describe("facility.completeSetup", () => {
  let mockUpdate: ReturnType<typeof vi.fn>;
  let mockSet: ReturnType<typeof vi.fn>;
  let mockWhere: ReturnType<typeof vi.fn>;

  function buildCompleteSetupDb(opts?: { courts?: any[]; hours?: any[] }) {
    mockWhere = vi.fn().mockResolvedValue(undefined);
    mockSet = vi.fn().mockReturnValue({ where: mockWhere });
    mockUpdate = vi.fn().mockReturnValue({ set: mockSet });

    return {
      query: {
        courts: {
          findMany: vi.fn().mockResolvedValue(opts?.courts ?? []),
        },
        operatingHours: {
          findMany: vi.fn().mockResolvedValue(opts?.hours ?? []),
        },
      },
      update: mockUpdate,
    };
  }

  it("throws when no courts exist", async () => {
    mockFacility = makeFacility();
    const db = buildCompleteSetupDb({ courts: [], hours: [{ id: "h1" }] });
    const caller = buildCaller(db);

    await expect(
      caller.facility.completeSetup({ facilityId: FACILITY_ID }),
    ).rejects.toThrow(
      "Debe agregar al menos una cancha antes de completar la configuración",
    );
  });

  it("throws when no operating hours exist", async () => {
    mockFacility = makeFacility();
    const db = buildCompleteSetupDb({
      courts: [makeCourt({ id: "c1", priceInCents: 5000 })],
      hours: [],
    });
    const caller = buildCaller(db);

    await expect(
      caller.facility.completeSetup({ facilityId: FACILITY_ID }),
    ).rejects.toThrow(
      "Debe configurar los horarios de operación antes de completar la configuración",
    );
  });

  it("throws when any court has priceInCents <= 0", async () => {
    mockFacility = makeFacility();
    const db = buildCompleteSetupDb({
      courts: [
        makeCourt({ id: "c1", priceInCents: 5000 }),
        makeCourt({ id: "c2", priceInCents: 0 }),
      ],
      hours: [{ id: "h1" }],
    });
    const caller = buildCaller(db);

    await expect(
      caller.facility.completeSetup({ facilityId: FACILITY_ID }),
    ).rejects.toThrow("Todas las canchas necesitan un precio por hora");
  });

  it("throws when any court has priceInCents = null", async () => {
    mockFacility = makeFacility();
    const db = buildCompleteSetupDb({
      courts: [
        makeCourt({ id: "c1", priceInCents: 5000 }),
        makeCourt({ id: "c2", priceInCents: null }),
      ],
      hours: [{ id: "h1" }],
    });
    const caller = buildCaller(db);

    await expect(
      caller.facility.completeSetup({ facilityId: FACILITY_ID }),
    ).rejects.toThrow("Todas las canchas necesitan un precio por hora");
  });

  it("succeeds and returns warnings for missing photos", async () => {
    mockFacility = makeFacility({ photos: [], amenities: ["wifi"] });
    const db = buildCompleteSetupDb({
      courts: [makeCourt({ id: "c1", priceInCents: 5000 })],
      hours: [{ id: "h1" }],
    });
    const caller = buildCaller(db);

    const result = await caller.facility.completeSetup({
      facilityId: FACILITY_ID,
    });

    expect(result.success).toBe(true);
    expect(result.warnings).toContainEqual(
      expect.objectContaining({ type: "photos" }),
    );
    expect(result.warnings).not.toContainEqual(
      expect.objectContaining({ type: "amenities" }),
    );
  });

  it("succeeds and returns warnings for missing amenities", async () => {
    mockFacility = makeFacility({ photos: ["img-1"], amenities: [] });
    const db = buildCompleteSetupDb({
      courts: [makeCourt({ id: "c1", priceInCents: 5000 })],
      hours: [{ id: "h1" }],
    });
    const caller = buildCaller(db);

    const result = await caller.facility.completeSetup({
      facilityId: FACILITY_ID,
    });

    expect(result.success).toBe(true);
    expect(result.warnings).toContainEqual(
      expect.objectContaining({ type: "amenities" }),
    );
    expect(result.warnings).not.toContainEqual(
      expect.objectContaining({ type: "photos" }),
    );
  });

  it("succeeds with no warnings when photos and amenities exist", async () => {
    mockFacility = makeFacility({
      photos: ["img-1"],
      amenities: ["wifi", "parking"],
    });
    const db = buildCompleteSetupDb({
      courts: [makeCourt({ id: "c1", priceInCents: 5000 })],
      hours: [{ id: "h1" }],
    });
    const caller = buildCaller(db);

    const result = await caller.facility.completeSetup({
      facilityId: FACILITY_ID,
    });

    expect(result.success).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });

  it("succeeds with both warnings when nothing optional configured", async () => {
    mockFacility = makeFacility({ photos: [], amenities: [] });
    const db = buildCompleteSetupDb({
      courts: [makeCourt({ id: "c1", priceInCents: 5000 })],
      hours: [{ id: "h1" }],
    });
    const caller = buildCaller(db);

    const result = await caller.facility.completeSetup({
      facilityId: FACILITY_ID,
    });

    expect(result.success).toBe(true);
    expect(result.warnings).toHaveLength(2);
    expect(result.warnings).toContainEqual(
      expect.objectContaining({ type: "photos" }),
    );
    expect(result.warnings).toContainEqual(
      expect.objectContaining({ type: "amenities" }),
    );
  });

  it("activates facility (sets onboardingCompletedAt and isActive)", async () => {
    mockFacility = makeFacility({ photos: ["img-1"], amenities: ["wifi"] });
    const db = buildCompleteSetupDb({
      courts: [makeCourt({ id: "c1", priceInCents: 5000 })],
      hours: [{ id: "h1" }],
    });
    const caller = buildCaller(db);

    await caller.facility.completeSetup({ facilityId: FACILITY_ID });

    expect(db.update).toHaveBeenCalled();
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        isActive: true,
        onboardingCompletedAt: expect.any(Date),
      }),
    );
  });

  it("returns courtCount in result", async () => {
    mockFacility = makeFacility({ photos: ["img-1"], amenities: ["wifi"] });
    const db = buildCompleteSetupDb({
      courts: [
        makeCourt({ id: "c1", priceInCents: 5000 }),
        makeCourt({ id: "c2", priceInCents: 8000 }),
      ],
      hours: [{ id: "h1" }],
    });
    const caller = buildCaller(db);

    const result = await caller.facility.completeSetup({
      facilityId: FACILITY_ID,
    });

    expect(result.courtCount).toBe(2);
  });
});
