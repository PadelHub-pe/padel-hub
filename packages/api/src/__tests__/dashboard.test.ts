/* eslint-disable @typescript-eslint/no-unsafe-assignment -- vitest mock types (vi.fn, expect.objectContaining) are inherently `any` */
/* eslint-disable @typescript-eslint/no-explicit-any -- mock db/session types */
/* eslint-disable @typescript-eslint/no-non-null-assertion -- test assertions on known-length arrays */
/* eslint-disable @typescript-eslint/no-unsafe-argument -- mock types passed to tRPC callers */
/* eslint-disable @typescript-eslint/no-unnecessary-condition -- mock data may have conditional values */
import { describe, expect, it, vi } from "vitest";

import { dashboardRouter } from "../router/dashboard";
import { createCallerFactory, createTRPCRouter } from "../trpc";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FACILITY_ID = "d0000000-0000-4000-8000-000000000001";
const USER_ID = "d0000000-0000-4000-8000-000000000020";
const ORG_ID = "d0000000-0000-4000-8000-000000000030";
const COURT_ID_1 = "d0000000-0000-4000-8000-000000000041";
const COURT_ID_2 = "d0000000-0000-4000-8000-000000000042";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const router = createTRPCRouter({ dashboard: dashboardRouter });
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
    name: "Test Facility",
    ...overrides,
  };
}

function makeBooking(overrides?: Record<string, unknown>) {
  return {
    id: "booking-" + Math.random().toString(36).slice(2, 8),
    code: "PH-2026-0001",
    facilityId: FACILITY_ID,
    courtId: COURT_ID_1,
    status: "confirmed" as string,
    date: new Date(),
    startTime: "10:00",
    endTime: "11:30",
    priceInCents: 8000,
    isPeakRate: false,
    customerName: "Carlos Mendoza" as string | null,
    customerEmail: "carlos@test.com" as string | null,
    customerPhone: null as string | null,
    isManualBooking: true,
    userId: null as string | null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Mock DB builder
// ---------------------------------------------------------------------------

interface MockDbOpts {
  facility?: ReturnType<typeof makeFacility>;
  role?: string;
  todayBookings?: ReturnType<typeof makeBooking>[];
  yesterdayBookings?: ReturnType<typeof makeBooking>[];
  allBookings?: ReturnType<typeof makeBooking>[];
  courts?: { id: string; name: string }[];
}

function createMockDb(opts?: MockDbOpts) {
  const role = opts?.role ?? "org_admin";
  const facility = opts?.facility ?? makeFacility();
  const todayBookings = opts?.todayBookings ?? [];
  const yesterdayBookings = opts?.yesterdayBookings ?? [];
  const allBookings = opts?.allBookings ?? [
    ...todayBookings,
    ...yesterdayBookings,
  ];
  const courts = opts?.courts ?? [
    { id: COURT_ID_1, name: "Cancha 1" },
    { id: COURT_ID_2, name: "Cancha 2" },
  ];

  // Today's non-cancelled bookings
  const todayActive = todayBookings.filter((b) => b.status !== "cancelled");
  const yesterdayActive = yesterdayBookings.filter(
    (b) => b.status !== "cancelled",
  );

  // Revenue calculations
  const todayRevenue = todayActive.reduce(
    (sum, b) => sum + (b.priceInCents ?? 0),
    0,
  );
  const yesterdayRevenue = yesterdayActive.reduce(
    (sum, b) => sum + (b.priceInCents ?? 0),
    0,
  );

  // Pending count
  const pendingCount = allBookings.filter((b) => b.status === "pending").length;

  // Month bookings (simplified: use allBookings as current month)
  const monthRevenue = allBookings
    .filter((b) => b.status !== "cancelled")
    .reduce((sum, b) => sum + (b.priceInCents ?? 0), 0);

  // Build mock select chains for getStats
  // We need to handle multiple chained .select().from().where() calls
  const selectResults = [
    // 1. todayBookings count
    [{ count: todayActive.length }],
    // 2. todayRevenue
    [{ total: todayRevenue }],
    // 3. yesterdayBookings count
    [{ count: yesterdayActive.length }],
    // 4. yesterdayRevenue
    [{ total: yesterdayRevenue }],
    // 5. pendingBookings count
    [{ count: pendingCount }],
    // 6. monthRevenue
    [{ total: monthRevenue }],
    // 7. lastMonthRevenue (use 0 for simplicity)
    [{ total: 0 }],
    // 8. courts count (for occupancy)
    [{ count: courts.length }],
  ];

  let selectCallIndex = 0;

  // Build today schedule booking results with court joins
  const todayScheduleBookings = todayBookings
    .filter((b) => b.status !== "cancelled")
    .map((b) => ({
      ...b,
      court: courts.find((c) => c.id === b.courtId) ?? {
        id: b.courtId,
        name: "Unknown",
      },
      user: b.userId
        ? { id: b.userId, name: "Test User", email: "test@test.com" }
        : null,
    }));

  const mockSelectChain = () => {
    const idx = selectCallIndex++;
    const result = selectResults[idx] ?? [{}];
    return {
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(result),
      }),
    };
  };

  return {
    query: {
      organizationMembers: {
        findFirst: vi.fn().mockResolvedValue(makeCallerMembership(role)),
      },
      facilities: {
        findFirst: vi.fn().mockResolvedValue(facility),
      },
      bookings: {
        findMany: vi.fn().mockResolvedValue(todayScheduleBookings),
      },
    },
    select: vi.fn().mockImplementation(mockSelectChain),
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
// Tests: dashboard.getStats
// ===========================================================================

describe("dashboard.getStats", () => {
  it("returns real stats with facility scoping", async () => {
    const todayBookings = [
      makeBooking({ priceInCents: 8000, status: "confirmed" }),
      makeBooking({ priceInCents: 12000, status: "in_progress" }),
    ];
    const db = createMockDb({ todayBookings });
    const caller = authedCaller(db);

    const result = await caller.dashboard.getStats({ facilityId: FACILITY_ID });

    expect(result.todayBookings).toBeDefined();
    expect(result.todayRevenue).toBeDefined();
    expect(result.pendingBookings).toBeDefined();
    expect(result.monthlyRevenue).toBeDefined();
  });

  it("returns proper stat labels in Spanish", async () => {
    const db = createMockDb();
    const caller = authedCaller(db);

    const result = await caller.dashboard.getStats({ facilityId: FACILITY_ID });

    expect(result.todayBookings.label).toBe("Reservas Hoy");
    expect(result.todayRevenue.label).toBe("Ingresos Hoy");
    expect(result.pendingBookings.label).toBe("Pendientes");
    expect(result.monthlyRevenue.label).toBe("Ingresos Mensual");
  });

  it("computes change percentage between today and yesterday", async () => {
    const todayBookings = [
      makeBooking({ priceInCents: 10000, status: "confirmed" }),
      makeBooking({ priceInCents: 10000, status: "confirmed" }),
    ];
    const yesterdayBookings = [
      makeBooking({ priceInCents: 5000, status: "completed" }),
    ];
    const db = createMockDb({ todayBookings, yesterdayBookings });
    const caller = authedCaller(db);

    const result = await caller.dashboard.getStats({ facilityId: FACILITY_ID });

    // Today: 2 bookings, yesterday: 1 → +100% change
    expect(result.todayBookings.change).toBe(100);
  });

  it("requires facilityId input", async () => {
    const db = createMockDb();
    const caller = authedCaller(db);

    await expect(caller.dashboard.getStats({} as any)).rejects.toThrow();
  });

  it("blocks access for unauthorized users", async () => {
    const db = createMockDb({ role: "staff" });
    // Staff with no matching facilityIds should be blocked
    db.query.organizationMembers.findFirst.mockResolvedValue({
      ...makeCallerMembership("staff"),
      facilityIds: [], // no access
    });
    const caller = authedCaller(db);

    await expect(
      caller.dashboard.getStats({ facilityId: FACILITY_ID }),
    ).rejects.toThrow();
  });
});

// ===========================================================================
// Tests: dashboard.getTodaySchedule
// ===========================================================================

describe("dashboard.getTodaySchedule", () => {
  it("returns today's bookings with court and customer info", async () => {
    const todayBookings = [
      makeBooking({
        courtId: COURT_ID_1,
        startTime: "09:00",
        endTime: "10:30",
        customerName: "Carlos Mendoza",
        customerEmail: "carlos@test.com",
        priceInCents: 8000,
        status: "confirmed",
      }),
    ];
    const db = createMockDb({ todayBookings });
    const caller = authedCaller(db);

    const result = await caller.dashboard.getTodaySchedule({
      facilityId: FACILITY_ID,
    });

    expect(result).toHaveLength(1);
    expect(result[0]!.time).toBe("09:00 - 10:30");
    expect(result[0]!.court).toBe("Cancha 1");
    expect(result[0]!.customer.name).toBe("Carlos Mendoza");
    expect(result[0]!.amount).toBe(80);
    expect(result[0]!.status).toBe("confirmed");
  });

  it("returns bookings sorted by start time (via DB orderBy)", async () => {
    // Mock returns already sorted data (as the DB would via orderBy)
    const todayBookings = [
      makeBooking({
        startTime: "09:00",
        endTime: "10:30",
        status: "confirmed",
      }),
      makeBooking({
        startTime: "11:00",
        endTime: "12:30",
        status: "confirmed",
      }),
      makeBooking({
        startTime: "14:00",
        endTime: "15:30",
        status: "confirmed",
      }),
    ];
    const db = createMockDb({ todayBookings });
    const caller = authedCaller(db);

    const result = await caller.dashboard.getTodaySchedule({
      facilityId: FACILITY_ID,
    });

    expect(result[0]!.time).toBe("09:00 - 10:30");
    expect(result[1]!.time).toBe("11:00 - 12:30");
    expect(result[2]!.time).toBe("14:00 - 15:30");
  });

  it("excludes cancelled bookings", async () => {
    const todayBookings = [
      makeBooking({ status: "confirmed" }),
      makeBooking({ status: "cancelled" }),
    ];
    const db = createMockDb({ todayBookings });
    // Only non-cancelled returned from findMany mock
    db.query.bookings.findMany.mockResolvedValue(
      todayBookings
        .filter((b) => b.status !== "cancelled")
        .map((b) => ({
          ...b,
          court: { id: b.courtId, name: "Cancha 1" },
          user: null,
        })),
    );
    const caller = authedCaller(db);

    const result = await caller.dashboard.getTodaySchedule({
      facilityId: FACILITY_ID,
    });

    expect(result).toHaveLength(1);
    expect(result[0]!.status).toBe("confirmed");
  });

  it("uses user name when customer name is not set", async () => {
    const todayBookings = [
      makeBooking({
        customerName: null,
        userId: USER_ID,
        status: "confirmed",
      }),
    ];
    const db = createMockDb({ todayBookings });
    // Override to include user
    db.query.bookings.findMany.mockResolvedValue([
      {
        ...todayBookings[0]!,
        court: { id: COURT_ID_1, name: "Cancha 1" },
        user: { id: USER_ID, name: "Test User", email: "test@test.com" },
      },
    ]);
    const caller = authedCaller(db);

    const result = await caller.dashboard.getTodaySchedule({
      facilityId: FACILITY_ID,
    });

    expect(result[0]!.customer.name).toBe("Test User");
  });

  it("returns empty array when no bookings today", async () => {
    const db = createMockDb({ todayBookings: [] });
    const caller = authedCaller(db);

    const result = await caller.dashboard.getTodaySchedule({
      facilityId: FACILITY_ID,
    });

    expect(result).toEqual([]);
  });

  it("requires facilityId input", async () => {
    const db = createMockDb();
    const caller = authedCaller(db);

    await expect(
      caller.dashboard.getTodaySchedule({} as any),
    ).rejects.toThrow();
  });
});
