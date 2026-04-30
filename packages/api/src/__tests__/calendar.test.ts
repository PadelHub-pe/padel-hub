/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument -- vitest mock types (vi.fn, expect.objectContaining) are inherently `any` */
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion -- mock db/session types */
import { describe, expect, it, vi } from "vitest";

import { calendarRouter } from "../router/calendar";
import { createCallerFactory, createTRPCRouter } from "../trpc";

// Mock resolveAndPersistBookingStatuses
vi.mock("../lib/booking-status-persist", () => ({
  resolveAndPersistBookingStatuses: vi.fn().mockResolvedValue(new Map()),
}));

// =============================================================================
// Constants
// =============================================================================

const FACILITY_ID = "40000000-0000-4000-8000-000000000001";
const USER_ID = "40000000-0000-4000-8000-000000000020";
const ORG_ID = "40000000-0000-4000-8000-000000000030";
const COURT_ID_1 = "40000000-0000-4000-8000-000000000041";
const COURT_ID_2 = "40000000-0000-4000-8000-000000000042";
const COURT_ID_3 = "40000000-0000-4000-8000-000000000043";
const BOOKING_ID = "40000000-0000-4000-8000-000000000050";

// Tuesday March 17, 2026 — dayOfWeek = 2 (noon UTC avoids TZ drift)
const TEST_DATE = new Date("2026-03-17T15:00:00Z");

// =============================================================================
// Factories
// =============================================================================

const router = createTRPCRouter({ calendar: calendarRouter });
const createCaller = createCallerFactory(router);

function makeCallerMembership(role = "org_admin", facilityIds: string[] = []) {
  return {
    id: "caller-mem",
    organizationId: ORG_ID,
    userId: USER_ID,
    role,
    facilityIds:
      role === "staff" && facilityIds.length === 0 ? [] : facilityIds,
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
    name: "Test Facility",
    slug: "test-facility",
    isActive: true,
    defaultPriceInCents: null,
    defaultPeakPriceInCents: null,
    ...overrides,
  };
}

function makeCourt(overrides?: Record<string, unknown>) {
  return {
    id: COURT_ID_1,
    facilityId: FACILITY_ID,
    name: "Cancha 1",
    type: "indoor",
    status: "active",
    priceInCents: 5000,
    peakPriceInCents: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeBooking(overrides?: Record<string, unknown>) {
  return {
    id: BOOKING_ID,
    code: "PH-2026-AB12",
    facilityId: FACILITY_ID,
    courtId: COURT_ID_1,
    date: TEST_DATE,
    startTime: "10:00:00",
    endTime: "11:00:00",
    priceInCents: 5000,
    isPeakRate: false,
    status: "confirmed",
    customerName: "Juan Pérez",
    customerPhone: "999111222",
    customerEmail: "juan@test.com",
    paymentMethod: "cash",
    notes: null,
    isManualBooking: true,
    confirmedAt: new Date(),
    cancelledAt: null,
    cancelledBy: null,
    cancellationReason: null,
    userId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeOperatingHour(
  dayOfWeek: number,
  openTime = "08:00:00",
  closeTime = "22:00:00",
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
    name: "Hora Pico Noche",
    daysOfWeek: [1, 2, 3, 4, 5],
    startTime: "18:00:00",
    endTime: "22:00:00",
    markupPercent: 50,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeBlockedSlot(overrides?: Record<string, unknown>) {
  return {
    id: "bs-1",
    facilityId: FACILITY_ID,
    courtId: COURT_ID_1,
    date: TEST_DATE,
    startTime: "14:00:00",
    endTime: "16:00:00",
    reason: "maintenance",
    notes: "Reparación de red",
    createdBy: null,
    createdAt: new Date(),
    ...overrides,
  };
}

// =============================================================================
// Mock DB builder
// =============================================================================

interface MockDbOpts {
  facility?: ReturnType<typeof makeFacility> | null;
  courts?: ReturnType<typeof makeCourt>[];
  bookings?: (ReturnType<typeof makeBooking> & {
    court: ReturnType<typeof makeCourt>;
    user: any;
    players: any[];
  })[];
  operatingHours?: ReturnType<typeof makeOperatingHour>[];
  peakPeriods?: ReturnType<typeof makePeakPeriod>[];
  blockedSlots?: ReturnType<typeof makeBlockedSlot>[];
  role?: string;
  facilityIds?: string[];
  membershipOverride?: ReturnType<typeof makeCallerMembership> | null;
}

function createMockDb(opts?: MockDbOpts) {
  const facility = opts && "facility" in opts ? opts.facility : makeFacility();
  const courtsList = opts?.courts ?? [makeCourt()];
  const bookingsList = opts?.bookings ?? [];
  const operatingHoursList = opts?.operatingHours ?? [makeOperatingHour(2)]; // Tuesday default
  const peakPeriodsList = opts?.peakPeriods ?? [];
  const blockedSlotsList = opts?.blockedSlots ?? [];
  const role = opts?.role ?? "org_admin";
  const facilityIds =
    opts?.facilityIds ?? (role === "staff" ? [FACILITY_ID] : []);
  const membership =
    opts?.membershipOverride !== undefined
      ? opts.membershipOverride
      : makeCallerMembership(role, facilityIds);

  // select().from().where() chain for count queries (getDayStats)
  const selectFromWhereFn = vi
    .fn()
    .mockResolvedValue([{ count: bookingsList.length, totalRevenue: null }]);
  const selectFromFn = vi.fn().mockReturnValue({ where: selectFromWhereFn });
  const selectFn = vi.fn().mockReturnValue({ from: selectFromFn });

  // update().set().where() chain (for status persist mock)
  const updateWhereFn = vi.fn().mockResolvedValue([]);
  const updateSetFn = vi.fn().mockReturnValue({ where: updateWhereFn });
  const updateFn = vi.fn().mockReturnValue({ set: updateSetFn });

  // selectDistinct().from().where() chain for getMonthBookingDates
  const selectDistinctFromWhereFn = vi.fn().mockResolvedValue([]);
  const selectDistinctFromFn = vi
    .fn()
    .mockReturnValue({ where: selectDistinctFromWhereFn });
  const selectDistinctFn = vi
    .fn()
    .mockReturnValue({ from: selectDistinctFromFn });

  return {
    query: {
      organizationMembers: {
        findFirst: vi.fn().mockResolvedValue(membership),
      },
      facilities: {
        findFirst: vi.fn().mockResolvedValue(facility),
      },
      courts: {
        findMany: vi.fn().mockResolvedValue(courtsList),
      },
      operatingHours: {
        findMany: vi.fn().mockResolvedValue(operatingHoursList),
      },
      bookings: {
        findMany: vi.fn().mockResolvedValue(bookingsList),
      },
      peakPeriods: {
        findMany: vi.fn().mockResolvedValue(peakPeriodsList),
      },
      blockedSlots: {
        findMany: vi.fn().mockResolvedValue(blockedSlotsList),
      },
    },
    select: selectFn,
    selectDistinct: selectDistinctFn,
    update: updateFn,
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

// =============================================================================
// getDayView
// =============================================================================

describe("calendar.getDayView", () => {
  it("returns correct data shape with courts, bookings, operating hours", async () => {
    const court = makeCourt();
    const booking = {
      ...makeBooking(),
      court,
      user: null,
      players: [],
    };
    const db = createMockDb({
      courts: [court],
      bookings: [booking],
      operatingHours: [makeOperatingHour(2)],
    });
    const caller = authedCaller(db);

    const result = await caller.calendar.getDayView({
      facilityId: FACILITY_ID,
      date: TEST_DATE,
    });

    expect(result.courts).toHaveLength(1);
    expect(result.courts[0]).toEqual(
      expect.objectContaining({
        id: COURT_ID_1,
        name: "Cancha 1",
        type: "indoor",
        status: "active",
      }),
    );
    expect(result.bookings).toHaveLength(1);
    expect(result.bookings[0]).toEqual(
      expect.objectContaining({
        id: BOOKING_ID,
        code: "PH-2026-AB12",
        courtId: COURT_ID_1,
        startTime: "10:00:00",
        endTime: "11:00:00",
        status: "confirmed",
        customerName: "Juan Pérez",
      }),
    );
    expect(result.operatingHours).toEqual({
      openTime: "08:00:00",
      closeTime: "22:00:00",
      isClosed: false,
    });
  });

  it("sources peak periods from peakPeriods table (not timeSlotTemplates)", async () => {
    const pp = makePeakPeriod({
      daysOfWeek: [2], // Tuesday — matches TEST_DATE
      startTime: "18:00:00",
      endTime: "22:00:00",
    });
    const db = createMockDb({
      peakPeriods: [pp],
    });
    const caller = authedCaller(db);

    const result = await caller.calendar.getDayView({
      facilityId: FACILITY_ID,
      date: TEST_DATE,
    });

    expect(result.peakPeriods).toHaveLength(1);
    expect(result.peakPeriods[0]).toEqual(
      expect.objectContaining({
        name: "Hora Pico Noche",
        startTime: "18:00:00",
        endTime: "22:00:00",
        markupPercent: 50,
      }),
    );
  });

  it("filters peak periods by active status and matching dayOfWeek", async () => {
    const activePP = makePeakPeriod({
      id: "pp-active",
      daysOfWeek: [2], // Tuesday — matches TEST_DATE
      isActive: true,
    });
    const inactivePP = makePeakPeriod({
      id: "pp-inactive",
      daysOfWeek: [2],
      isActive: false,
    });
    const wrongDayPP = makePeakPeriod({
      id: "pp-wrong-day",
      daysOfWeek: [4, 5], // Thu-Fri only
      isActive: true,
    });

    // The mock returns all, but the router should filter by isActive and daysOfWeek
    const db = createMockDb({
      peakPeriods: [activePP, inactivePP, wrongDayPP],
    });
    const caller = authedCaller(db);

    const result = await caller.calendar.getDayView({
      facilityId: FACILITY_ID,
      date: TEST_DATE,
    });

    // Only the active PP whose daysOfWeek includes 2 should be returned
    expect(result.peakPeriods).toHaveLength(1);
    expect(result.peakPeriods[0]!.name).toBe("Hora Pico Noche");
  });

  it("includes blocked slots in response", async () => {
    const blocked = makeBlockedSlot();
    const db = createMockDb({
      blockedSlots: [blocked],
    });
    const caller = authedCaller(db);

    const result = await caller.calendar.getDayView({
      facilityId: FACILITY_ID,
      date: TEST_DATE,
    });

    expect(result.blockedSlots).toHaveLength(1);
    expect(result.blockedSlots[0]).toEqual(
      expect.objectContaining({
        courtId: COURT_ID_1,
        startTime: "14:00:00",
        endTime: "16:00:00",
        reason: "maintenance",
        notes: "Reparación de red",
      }),
    );
  });

  it("calls resolveAndPersistBookingStatuses on bookings", async () => {
    const { resolveAndPersistBookingStatuses } = await import(
      "../lib/booking-status-persist"
    );
    const statusMap = new Map<string, string>();
    statusMap.set(BOOKING_ID, "in_progress");
    vi.mocked(resolveAndPersistBookingStatuses).mockResolvedValueOnce(
      statusMap as any,
    );

    const court = makeCourt();
    const booking = {
      ...makeBooking({ status: "confirmed" }),
      court,
      user: null,
      players: [],
    };
    const db = createMockDb({
      bookings: [booking],
    });
    const caller = authedCaller(db);

    const result = await caller.calendar.getDayView({
      facilityId: FACILITY_ID,
      date: TEST_DATE,
    });

    expect(resolveAndPersistBookingStatuses).toHaveBeenCalledWith(
      db,
      expect.any(Array),
      expect.any(Date),
    );
    // Status should be updated in response
    expect(result.bookings[0]!.status).toBe("in_progress");
  });

  it("excludes cancelled bookings from stats", async () => {
    const court = makeCourt();
    const activeBooking = {
      ...makeBooking({ id: "b1", priceInCents: 5000, status: "confirmed" }),
      court,
      user: null,
      players: [],
    };
    const cancelledBooking = {
      ...makeBooking({ id: "b2", priceInCents: 3000, status: "cancelled" }),
      court,
      user: null,
      players: [],
    };
    const db = createMockDb({
      bookings: [activeBooking, cancelledBooking],
      operatingHours: [makeOperatingHour(2)],
    });
    const caller = authedCaller(db);

    const result = await caller.calendar.getDayView({
      facilityId: FACILITY_ID,
      date: TEST_DATE,
    });

    // Only active booking should count
    expect(result.stats.totalBookings).toBe(1);
    expect(result.stats.revenueInCents).toBe(5000);
  });

  it("sorts courts: active first by name, then maintenance by name, hides inactive", async () => {
    const activeB = makeCourt({
      id: COURT_ID_2,
      name: "Cancha B",
      status: "active",
    });
    const activeA = makeCourt({
      id: COURT_ID_1,
      name: "Cancha A",
      status: "active",
    });
    const maintenance = makeCourt({
      id: COURT_ID_3,
      name: "Cancha C",
      status: "maintenance",
    });
    const inactive = makeCourt({
      id: "court-inactive",
      name: "Cancha D",
      status: "inactive",
    });

    // Mock returns all courts (the router should filter and sort)
    const db = createMockDb({
      courts: [maintenance, inactive, activeB, activeA],
    });
    const caller = authedCaller(db);

    const result = await caller.calendar.getDayView({
      facilityId: FACILITY_ID,
      date: TEST_DATE,
    });

    // Inactive should be hidden
    expect(result.courts).toHaveLength(3);
    // Active first, alphabetically, then maintenance
    expect(result.courts.map((c) => c.name)).toEqual([
      "Cancha A",
      "Cancha B",
      "Cancha C",
    ]);
    expect(result.courts[2]!.status).toBe("maintenance");
  });

  it("returns default operating hours when none configured", async () => {
    const db = createMockDb({ operatingHours: [] });
    const caller = authedCaller(db);

    const result = await caller.calendar.getDayView({
      facilityId: FACILITY_ID,
      date: TEST_DATE,
    });

    expect(result.operatingHours).toEqual({
      openTime: "08:00:00",
      closeTime: "22:00:00",
      isClosed: false,
    });
  });

  it("denies access for staff without facility access", async () => {
    const db = createMockDb({
      role: "staff",
      facilityIds: [], // no access
    });
    const caller = authedCaller(db);

    await expect(
      caller.calendar.getDayView({
        facilityId: FACILITY_ID,
        date: TEST_DATE,
      }),
    ).rejects.toThrow();
  });
});

// =============================================================================
// getWeekView
// =============================================================================

describe("calendar.getWeekView", () => {
  it("returns 7 days of data starting from Monday", async () => {
    const db = createMockDb({
      operatingHours: Array.from({ length: 7 }, (_, i) => makeOperatingHour(i)),
    });
    const caller = authedCaller(db);

    // March 17 is Tuesday, so weekStart should be aligned to Monday March 16
    const result = await caller.calendar.getWeekView({
      facilityId: FACILITY_ID,
      weekStart: TEST_DATE,
    });

    expect(result.days).toHaveLength(7);
    // First day should be Monday
    expect(result.days[0]!.dayOfWeek).toBe(1); // Monday
    expect(result.days[6]!.dayOfWeek).toBe(0); // Sunday
  });

  it("includes blocked slots in response", async () => {
    const blocked = makeBlockedSlot();
    const db = createMockDb({
      blockedSlots: [blocked],
      operatingHours: Array.from({ length: 7 }, (_, i) => makeOperatingHour(i)),
    });
    const caller = authedCaller(db);

    const result = await caller.calendar.getWeekView({
      facilityId: FACILITY_ID,
      weekStart: TEST_DATE,
    });

    expect(result.blockedSlots).toHaveLength(1);
    expect(result.blockedSlots[0]).toEqual(
      expect.objectContaining({
        courtId: COURT_ID_1,
        startTime: "14:00:00",
        endTime: "16:00:00",
        reason: "maintenance",
      }),
    );
  });

  it("calls resolveAndPersistBookingStatuses on bookings", async () => {
    const { resolveAndPersistBookingStatuses } = await import(
      "../lib/booking-status-persist"
    );
    vi.mocked(resolveAndPersistBookingStatuses).mockResolvedValueOnce(
      new Map(),
    );

    const court = makeCourt();
    const booking = {
      ...makeBooking(),
      court,
      user: null,
      players: [],
    };
    const db = createMockDb({
      bookings: [booking],
      operatingHours: Array.from({ length: 7 }, (_, i) => makeOperatingHour(i)),
    });
    const caller = authedCaller(db);

    await caller.calendar.getWeekView({
      facilityId: FACILITY_ID,
      weekStart: TEST_DATE,
    });

    expect(resolveAndPersistBookingStatuses).toHaveBeenCalled();
  });

  it("excludes cancelled bookings from day stats", async () => {
    const court = makeCourt();
    const activeBooking = {
      ...makeBooking({
        id: "b1",
        priceInCents: 5000,
        status: "confirmed",
        date: "2026-03-18",
      }),
      court,
      user: null,
      players: [],
    };
    const cancelledBooking = {
      ...makeBooking({
        id: "b2",
        priceInCents: 3000,
        status: "cancelled",
        date: "2026-03-18",
      }),
      court,
      user: null,
      players: [],
    };
    const db = createMockDb({
      bookings: [activeBooking, cancelledBooking],
      operatingHours: Array.from({ length: 7 }, (_, i) => makeOperatingHour(i)),
    });
    const caller = authedCaller(db);

    const result = await caller.calendar.getWeekView({
      facilityId: FACILITY_ID,
      weekStart: TEST_DATE,
    });

    // Weekly total should exclude cancelled
    expect(result.stats.totalBookings).toBe(1);
    expect(result.stats.revenueInCents).toBe(5000);
  });

  it("sorts courts: active first, then maintenance, hides inactive", async () => {
    const activeB = makeCourt({
      id: COURT_ID_2,
      name: "Cancha B",
      status: "active",
    });
    const activeA = makeCourt({
      id: COURT_ID_1,
      name: "Cancha A",
      status: "active",
    });
    const maintenance = makeCourt({
      id: COURT_ID_3,
      name: "Cancha C",
      status: "maintenance",
    });
    const inactive = makeCourt({
      id: "court-inactive",
      name: "Cancha D",
      status: "inactive",
    });

    const db = createMockDb({
      courts: [maintenance, inactive, activeB, activeA],
      operatingHours: Array.from({ length: 7 }, (_, i) => makeOperatingHour(i)),
    });
    const caller = authedCaller(db);

    const result = await caller.calendar.getWeekView({
      facilityId: FACILITY_ID,
      weekStart: TEST_DATE,
    });

    expect(result.courts).toHaveLength(3);
    expect(result.courts.map((c) => c.name)).toEqual([
      "Cancha A",
      "Cancha B",
      "Cancha C",
    ]);
  });
});

// =============================================================================
// getDayStats
// =============================================================================

describe("calendar.getDayStats", () => {
  it("returns booking count, revenue, and utilization", async () => {
    const db = createMockDb({
      bookings: [],
      operatingHours: [makeOperatingHour(2)],
    });
    // Override the findMany to return some bookings for utilization calc
    db.query.bookings.findMany = vi.fn().mockResolvedValue([
      {
        startTime: "10:00:00",
        endTime: "11:30:00",
        status: "confirmed",
      },
    ]);
    const caller = authedCaller(db);

    const result = await caller.calendar.getDayStats({
      facilityId: FACILITY_ID,
      date: TEST_DATE,
    });

    expect(result).toHaveProperty("bookingCount");
    expect(result).toHaveProperty("revenueInCents");
    expect(result).toHaveProperty("utilizationPercent");
    expect(result.bookingCount).toBe(1);
  });

  it("excludes cancelled bookings from aggregate count", async () => {
    const db = createMockDb({
      operatingHours: [makeOperatingHour(2)],
    });
    // Stats query now filters cancelled — mock the filtered result
    db.select = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ count: 2, totalRevenue: "10000" }]),
      }),
    });
    // findMany for utilization — only non-cancelled
    db.query.bookings.findMany = vi.fn().mockResolvedValue([
      { startTime: "10:00:00", endTime: "11:00:00", status: "confirmed" },
      { startTime: "11:00:00", endTime: "12:00:00", status: "in_progress" },
    ]);
    const caller = authedCaller(db);

    const result = await caller.calendar.getDayStats({
      facilityId: FACILITY_ID,
      date: TEST_DATE,
    });

    // Should only count non-cancelled bookings
    expect(result.bookingCount).toBe(2);
    expect(result.revenueInCents).toBe(10000);
  });

  it("returns zero utilization when no courts exist", async () => {
    const db = createMockDb({
      courts: [],
      operatingHours: [makeOperatingHour(2)],
    });
    db.query.bookings.findMany = vi.fn().mockResolvedValue([]);
    const caller = authedCaller(db);

    const result = await caller.calendar.getDayStats({
      facilityId: FACILITY_ID,
      date: TEST_DATE,
    });

    expect(result.utilizationPercent).toBe(0);
  });

  it("denies access for staff without facility access", async () => {
    const db = createMockDb({
      role: "staff",
      facilityIds: [],
    });
    const caller = authedCaller(db);

    await expect(
      caller.calendar.getDayStats({
        facilityId: FACILITY_ID,
        date: TEST_DATE,
      }),
    ).rejects.toThrow();
  });
});

// =============================================================================
// getMonthBookingDates
// =============================================================================

describe("calendar.getMonthBookingDates", () => {
  it("returns dates that have non-cancelled bookings", async () => {
    const db = createMockDb();
    // Mock the select chain for getMonthBookingDates
    const mockRows = [
      { date: "2026-03-10" },
      { date: "2026-03-15" },
      { date: "2026-03-20" },
    ];
    db.selectDistinct = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(mockRows),
      }),
    }) as any;

    const caller = authedCaller(db);

    const result = await caller.calendar.getMonthBookingDates({
      facilityId: FACILITY_ID,
      month: new Date("2026-03-01"),
    });

    expect(result.dates).toHaveLength(3);
    expect(result.dates).toEqual(["2026-03-10", "2026-03-15", "2026-03-20"]);
  });

  it("returns empty array when no bookings exist", async () => {
    const db = createMockDb();
    db.selectDistinct = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    }) as any;

    const caller = authedCaller(db);

    const result = await caller.calendar.getMonthBookingDates({
      facilityId: FACILITY_ID,
      month: new Date("2026-03-01"),
    });

    expect(result.dates).toHaveLength(0);
  });

  it("denies access for staff without facility access", async () => {
    const db = createMockDb({
      role: "staff",
      facilityIds: [],
    });
    db.selectDistinct = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    }) as any;
    const caller = authedCaller(db);

    await expect(
      caller.calendar.getMonthBookingDates({
        facilityId: FACILITY_ID,
        month: new Date("2026-03-01"),
      }),
    ).rejects.toThrow();
  });
});
