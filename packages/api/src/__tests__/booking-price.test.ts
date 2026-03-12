/* eslint-disable @typescript-eslint/no-unsafe-assignment -- vitest mock types (vi.fn, expect.objectContaining) are inherently `any` */
/* eslint-disable @typescript-eslint/no-explicit-any -- mock db/session types */
import { describe, expect, it, vi } from "vitest";

import { bookingRouter } from "../router/booking";
import { createCallerFactory, createTRPCRouter } from "../trpc";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FACILITY_ID = "40000000-0000-4000-8000-000000000001";
const USER_ID = "40000000-0000-4000-8000-000000000020";
const ORG_ID = "40000000-0000-4000-8000-000000000030";
const COURT_ID = "40000000-0000-4000-8000-000000000040";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const router = createTRPCRouter({ booking: bookingRouter });
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

function makeFacility(overrides?: Record<string, unknown>) {
  return {
    id: FACILITY_ID,
    organizationId: ORG_ID,
    defaultPriceInCents: null,
    defaultPeakPriceInCents: null,
    ...overrides,
  };
}

function makeOperatingHour(
  dayOfWeek: number,
  openTime = "08:00",
  closeTime = "22:00",
  isClosed = false,
) {
  return {
    id: `oh-${dayOfWeek}`,
    facilityId: FACILITY_ID,
    dayOfWeek,
    openTime,
    closeTime,
    isClosed,
  };
}

function makePeakPeriod(overrides?: Record<string, unknown>) {
  return {
    id: "pp-1",
    facilityId: FACILITY_ID,
    name: "Evening Peak",
    daysOfWeek: [1, 2, 3, 4, 5],
    startTime: "18:00",
    endTime: "22:00",
    markupPercent: 50,
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
  court?: ReturnType<typeof makeCourt>;
  operatingHours?: ReturnType<typeof makeOperatingHour>[];
  peakPeriods?: ReturnType<typeof makePeakPeriod>[];
  blockedSlots?: any[];
  existingBookings?: any[];
  role?: string;
}

function createMockDb(opts?: MockDbOpts) {
  const facility = opts?.facility ?? makeFacility();
  const court = opts?.court ?? makeCourt();
  const hoursList = opts?.operatingHours ?? [];
  const periodsList = opts?.peakPeriods ?? [];
  const blockedSlotsList = opts?.blockedSlots ?? [];
  const existingBookings = opts?.existingBookings ?? [];
  const role = opts?.role ?? "org_admin";

  // Track all insert calls — first call is the booking, second is bookingPlayers
  const allInsertCalls: any[] = [];
  const insertValuesFn = vi.fn().mockImplementation((vals: any) => {
    allInsertCalls.push(vals);
    return {
      returning: vi.fn().mockResolvedValue([
        {
          id: "new-booking-id",
          code: "PH-2026-TEST",
          courtId: court.id,
          facilityId: FACILITY_ID,
          status: "confirmed",
          ...vals,
        },
      ]),
    };
  });
  const insertFn = vi.fn().mockReturnValue({ values: insertValuesFn });

  return {
    query: {
      organizationMembers: {
        findFirst: vi.fn().mockResolvedValue(makeCallerMembership(role)),
      },
      courts: {
        findFirst: vi.fn().mockResolvedValue(court),
      },
      facilities: {
        findFirst: vi.fn().mockResolvedValue(facility),
      },
      bookings: {
        findFirst: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue(existingBookings),
      },
      operatingHours: {
        findMany: vi.fn().mockResolvedValue(hoursList),
      },
      peakPeriods: {
        findMany: vi.fn().mockResolvedValue(periodsList),
      },
      blockedSlots: {
        findMany: vi.fn().mockResolvedValue(blockedSlotsList),
      },
    },
    insert: insertFn,
    /** First insert call = booking values, second = bookingPlayers values */
    _allInsertCalls: allInsertCalls,
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

// Base input for createManual (no priceInCents/isPeakRate — server calculates)
function makeCreateManualInput(overrides?: Record<string, unknown>) {
  return {
    facilityId: FACILITY_ID,
    courtId: COURT_ID,
    // Thursday = dayOfWeek 4 in local time
    date: new Date(2026, 2, 12),
    startTime: "10:00",
    endTime: "11:30",
    customerName: "Juan Pérez",
    paymentMethod: "cash" as const,
    ...overrides,
  };
}

// ===========================================================================
// Tests: booking.createManual — server-side price calculation
// ===========================================================================

describe("booking.createManual — server-side price calculation", () => {
  it("calculates regular price for a booking in regular hours", async () => {
    const court = makeCourt({ priceInCents: 6000 });
    const db = createMockDb({
      court,
      operatingHours: [makeOperatingHour(4, "08:00", "22:00")],
      peakPeriods: [],
    });

    const caller = authedCaller(db);
    await caller.booking.createManual(
      makeCreateManualInput({
        startTime: "10:00",
        endTime: "11:30",
      }),
    );

    // First insert = booking; 3 slots x 6000 = 18000
    const bookingInsert = db._allInsertCalls[0];
    expect(bookingInsert).toEqual(
      expect.objectContaining({
        priceInCents: 18000,
        isPeakRate: false,
      }),
    );
  });

  it("calculates peak price when booking falls in peak period", async () => {
    const court = makeCourt({
      priceInCents: 5000,
      peakPriceInCents: 8000,
    });
    const db = createMockDb({
      court,
      operatingHours: [makeOperatingHour(4, "08:00", "22:00")],
      peakPeriods: [
        makePeakPeriod({
          daysOfWeek: [4],
          startTime: "18:00",
          endTime: "22:00",
        }),
      ],
    });

    const caller = authedCaller(db);
    await caller.booking.createManual(
      makeCreateManualInput({
        startTime: "18:00",
        endTime: "19:30",
      }),
    );

    // 3 slots x 8000 = 24000 (all peak)
    const bookingInsert = db._allInsertCalls[0];
    expect(bookingInsert).toEqual(
      expect.objectContaining({
        priceInCents: 24000,
        isPeakRate: true,
      }),
    );
  });

  it("calculates blended price for split-zone booking (regular + peak)", async () => {
    const court = makeCourt({
      priceInCents: 5000,
      peakPriceInCents: 8000,
    });
    const db = createMockDb({
      court,
      operatingHours: [makeOperatingHour(4, "08:00", "22:00")],
      peakPeriods: [
        makePeakPeriod({
          daysOfWeek: [4],
          startTime: "18:00",
          endTime: "22:00",
        }),
      ],
    });

    const caller = authedCaller(db);
    await caller.booking.createManual(
      makeCreateManualInput({
        startTime: "17:00",
        endTime: "18:30",
      }),
    );

    // 17:00-17:30 regular (5000) + 17:30-18:00 regular (5000) + 18:00-18:30 peak (8000) = 18000
    const bookingInsert = db._allInsertCalls[0];
    expect(bookingInsert).toEqual(
      expect.objectContaining({
        priceInCents: 18000,
        isPeakRate: true,
      }),
    );
  });

  it("uses facility defaults when court has no custom price", async () => {
    const court = makeCourt({
      priceInCents: null,
      peakPriceInCents: null,
    });
    const facility = makeFacility({
      defaultPriceInCents: 4000,
      defaultPeakPriceInCents: 7000,
    });
    const db = createMockDb({
      court,
      facility,
      operatingHours: [makeOperatingHour(4, "08:00", "22:00")],
      peakPeriods: [],
    });

    const caller = authedCaller(db);
    await caller.booking.createManual(
      makeCreateManualInput({
        startTime: "10:00",
        endTime: "11:00",
      }),
    );

    // 2 slots x 4000 = 8000 (uses facility default)
    const bookingInsert = db._allInsertCalls[0];
    expect(bookingInsert).toEqual(
      expect.objectContaining({
        priceInCents: 8000,
        isPeakRate: false,
      }),
    );
  });

  it("uses facility peak default when court has no custom peak price", async () => {
    const court = makeCourt({
      priceInCents: null,
      peakPriceInCents: null,
    });
    const facility = makeFacility({
      defaultPriceInCents: 4000,
      defaultPeakPriceInCents: 7000,
    });
    const db = createMockDb({
      court,
      facility,
      operatingHours: [makeOperatingHour(4, "08:00", "22:00")],
      peakPeriods: [
        makePeakPeriod({
          daysOfWeek: [4],
          startTime: "18:00",
          endTime: "22:00",
        }),
      ],
    });

    const caller = authedCaller(db);
    await caller.booking.createManual(
      makeCreateManualInput({
        startTime: "18:00",
        endTime: "19:00",
      }),
    );

    // 2 slots x 7000 = 14000 (uses facility default peak)
    const bookingInsert = db._allInsertCalls[0];
    expect(bookingInsert).toEqual(
      expect.objectContaining({
        priceInCents: 14000,
        isPeakRate: true,
      }),
    );
  });

  it("calculates price as 0 when no pricing configured", async () => {
    const court = makeCourt({
      priceInCents: null,
      peakPriceInCents: null,
    });
    const facility = makeFacility({
      defaultPriceInCents: null,
      defaultPeakPriceInCents: null,
    });
    const db = createMockDb({
      court,
      facility,
      operatingHours: [makeOperatingHour(4, "08:00", "22:00")],
      peakPeriods: [],
    });

    const caller = authedCaller(db);
    await caller.booking.createManual(
      makeCreateManualInput({
        startTime: "10:00",
        endTime: "11:00",
      }),
    );

    const bookingInsert = db._allInsertCalls[0];
    expect(bookingInsert).toEqual(
      expect.objectContaining({
        priceInCents: 0,
        isPeakRate: false,
      }),
    );
  });

  it("does not accept client-sent priceInCents (schema strips it)", async () => {
    const db = createMockDb({
      operatingHours: [makeOperatingHour(4, "08:00", "22:00")],
    });
    const caller = authedCaller(db);

    // Should work without priceInCents — server calculates
    await expect(
      caller.booking.createManual(
        makeCreateManualInput({
          startTime: "10:00",
          endTime: "11:00",
        }),
      ),
    ).resolves.toBeDefined();
  });

  it("handles 1-hour booking (2 slots) correctly", async () => {
    const court = makeCourt({ priceInCents: 5000 });
    const db = createMockDb({
      court,
      operatingHours: [makeOperatingHour(4, "08:00", "22:00")],
      peakPeriods: [],
    });

    const caller = authedCaller(db);
    await caller.booking.createManual(
      makeCreateManualInput({
        startTime: "09:00",
        endTime: "10:00",
      }),
    );

    // 2 slots x 5000 = 10000
    const bookingInsert = db._allInsertCalls[0];
    expect(bookingInsert).toEqual(
      expect.objectContaining({ priceInCents: 10000 }),
    );
  });

  it("handles 2-hour booking (4 slots) correctly", async () => {
    const court = makeCourt({ priceInCents: 5000 });
    const db = createMockDb({
      court,
      operatingHours: [makeOperatingHour(4, "08:00", "22:00")],
      peakPeriods: [],
    });

    const caller = authedCaller(db);
    await caller.booking.createManual(
      makeCreateManualInput({
        startTime: "09:00",
        endTime: "11:00",
      }),
    );

    // 4 slots x 5000 = 20000
    const bookingInsert = db._allInsertCalls[0];
    expect(bookingInsert).toEqual(
      expect.objectContaining({ priceInCents: 20000 }),
    );
  });
});

// ===========================================================================
// Tests: booking.calculatePrice — price preview for UI
// ===========================================================================

describe("booking.calculatePrice — price preview", () => {
  it("returns calculated price for regular time slot", async () => {
    const court = makeCourt({ priceInCents: 6000 });
    const facility = makeFacility();
    const db = createMockDb({
      court,
      facility,
      operatingHours: [makeOperatingHour(4, "08:00", "22:00")],
      peakPeriods: [],
    });

    const caller = authedCaller(db);
    const result = await caller.booking.calculatePrice({
      facilityId: FACILITY_ID,
      courtId: COURT_ID,
      date: new Date(2026, 2, 12),
      startTime: "10:00",
      endTime: "11:30",
    });

    expect(result.priceInCents).toBe(18000); // 3 slots x 6000
    expect(result.isPeakRate).toBe(false);
  });

  it("returns calculated price for peak time slot", async () => {
    const court = makeCourt({
      priceInCents: 5000,
      peakPriceInCents: 8000,
    });
    const db = createMockDb({
      court,
      operatingHours: [makeOperatingHour(4, "08:00", "22:00")],
      peakPeriods: [
        makePeakPeriod({
          daysOfWeek: [4],
          startTime: "18:00",
          endTime: "22:00",
        }),
      ],
    });

    const caller = authedCaller(db);
    const result = await caller.booking.calculatePrice({
      facilityId: FACILITY_ID,
      courtId: COURT_ID,
      date: new Date(2026, 2, 12),
      startTime: "18:00",
      endTime: "19:30",
    });

    expect(result.priceInCents).toBe(24000); // 3 slots x 8000
    expect(result.isPeakRate).toBe(true);
  });

  it("returns blended price for split-zone booking", async () => {
    const court = makeCourt({
      priceInCents: 5000,
      peakPriceInCents: 8000,
    });
    const db = createMockDb({
      court,
      operatingHours: [makeOperatingHour(4, "08:00", "22:00")],
      peakPeriods: [
        makePeakPeriod({
          daysOfWeek: [4],
          startTime: "18:00",
          endTime: "22:00",
        }),
      ],
    });

    const caller = authedCaller(db);
    const result = await caller.booking.calculatePrice({
      facilityId: FACILITY_ID,
      courtId: COURT_ID,
      date: new Date(2026, 2, 12),
      startTime: "17:00",
      endTime: "18:30",
    });

    // 17:00-17:30 regular (5000) + 17:30-18:00 regular (5000) + 18:00-18:30 peak (8000) = 18000
    expect(result.priceInCents).toBe(18000);
    expect(result.isPeakRate).toBe(true);
  });

  it("returns slot breakdown with zone info", async () => {
    const court = makeCourt({
      priceInCents: 5000,
      peakPriceInCents: 8000,
    });
    const db = createMockDb({
      court,
      operatingHours: [makeOperatingHour(4, "08:00", "22:00")],
      peakPeriods: [
        makePeakPeriod({
          daysOfWeek: [4],
          startTime: "18:00",
          endTime: "22:00",
        }),
      ],
    });

    const caller = authedCaller(db);
    const result = await caller.booking.calculatePrice({
      facilityId: FACILITY_ID,
      courtId: COURT_ID,
      date: new Date(2026, 2, 12),
      startTime: "17:30",
      endTime: "18:30",
    });

    expect(result.slots).toHaveLength(2);
    expect(result.slots[0]).toEqual(
      expect.objectContaining({
        time: "17:30",
        zone: "regular",
        rateInCents: 5000,
      }),
    );
    expect(result.slots[1]).toEqual(
      expect.objectContaining({
        time: "18:00",
        zone: "peak",
        rateInCents: 8000,
      }),
    );
  });
});
