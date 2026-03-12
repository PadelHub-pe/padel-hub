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
const COURT_A_ID = "40000000-0000-4000-8000-000000000041";

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

function makeBooking(overrides?: Record<string, unknown>) {
  return {
    id: "booking-1",
    code: "PH-2026-AB12",
    facilityId: FACILITY_ID,
    courtId: COURT_A_ID,
    date: new Date("2026-03-12"),
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

// ---------------------------------------------------------------------------
// Mock DB builder
// ---------------------------------------------------------------------------

interface MockDbOpts {
  bookings?: ReturnType<typeof makeBooking>[];
  totalCount?: number;
  role?: string;
}

function makeFacility() {
  return {
    id: FACILITY_ID,
    organizationId: ORG_ID,
    name: "Test Facility",
    slug: "test-facility",
    isActive: true,
  };
}

function createMockDb(opts?: MockDbOpts) {
  const bookingsList = opts?.bookings ?? [];
  const totalCount = opts?.totalCount ?? bookingsList.length;
  const role = opts?.role ?? "org_admin";

  // The list procedure uses both:
  //   1. ctx.db.select({count}).from(bookings).where(...) for total count
  //   2. ctx.db.query.bookings.findMany({where, with, orderBy, limit, offset}) for data

  const selectFromWhereFn = vi.fn().mockResolvedValue([{ count: totalCount }]);
  const selectFromFn = vi.fn().mockReturnValue({ where: selectFromWhereFn });
  const selectFn = vi.fn().mockReturnValue({ from: selectFromFn });

  // Add court and players with data for each booking
  const bookingsWithRelations = bookingsList.map((b) => ({
    ...b,
    court: {
      id: b.courtId,
      name: b.courtId === COURT_A_ID ? "Cancha A" : "Cancha B",
      facilityId: FACILITY_ID,
    },
    user: null,
    players: [],
  }));

  return {
    query: {
      facilities: {
        findFirst: vi.fn().mockResolvedValue(makeFacility()),
      },
      organizationMembers: {
        findFirst: vi.fn().mockResolvedValue(makeCallerMembership(role)),
      },
      bookings: {
        findMany: vi.fn().mockResolvedValue(bookingsWithRelations),
      },
    },
    select: selectFn,
    _selectFromFn: selectFromFn,
    _selectFromWhereFn: selectFromWhereFn,
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
// Tests: booking.list — multi-status filter
// ===========================================================================

describe("booking.list", () => {
  describe("multi-status filter", () => {
    it("accepts an array of statuses", async () => {
      const db = createMockDb({ bookings: [] });
      const caller = authedCaller(db);

      const result = await caller.booking.list({
        facilityId: FACILITY_ID,
        status: ["pending", "confirmed"],
      });

      expect(result.bookings).toEqual([]);
      expect(result.total).toBe(0);
    });

    it("accepts a single status in array", async () => {
      const booking = makeBooking({ status: "pending" });
      const db = createMockDb({ bookings: [booking] });
      const caller = authedCaller(db);

      const result = await caller.booking.list({
        facilityId: FACILITY_ID,
        status: ["pending"],
      });

      expect(result.bookings).toHaveLength(1);
    });

    it("accepts empty array (no status filter)", async () => {
      const db = createMockDb({ bookings: [makeBooking()] });
      const caller = authedCaller(db);

      const result = await caller.booking.list({
        facilityId: FACILITY_ID,
        status: [],
      });

      expect(result.bookings).toHaveLength(1);
    });

    it("accepts all valid status values", async () => {
      const db = createMockDb({ bookings: [] });
      const caller = authedCaller(db);

      const result = await caller.booking.list({
        facilityId: FACILITY_ID,
        status: [
          "pending",
          "confirmed",
          "in_progress",
          "completed",
          "cancelled",
          "open_match",
        ],
      });

      expect(result.total).toBe(0);
    });

    it("works without status parameter (returns all)", async () => {
      const db = createMockDb({ bookings: [makeBooking()] });
      const caller = authedCaller(db);

      const result = await caller.booking.list({
        facilityId: FACILITY_ID,
      });

      expect(result.bookings).toHaveLength(1);
    });
  });

  // ===========================================================================
  // Tests: booking.list — date range filter
  // ===========================================================================

  describe("date range filter", () => {
    it("accepts a date range object", async () => {
      const db = createMockDb({ bookings: [] });
      const caller = authedCaller(db);

      const result = await caller.booking.list({
        facilityId: FACILITY_ID,
        dateRange: {
          start: new Date("2026-03-01"),
          end: new Date("2026-03-31"),
        },
      });

      expect(result.bookings).toEqual([]);
    });

    it("filters bookings within date range", async () => {
      const booking = makeBooking({ date: new Date("2026-03-15") });
      const db = createMockDb({ bookings: [booking] });
      const caller = authedCaller(db);

      const result = await caller.booking.list({
        facilityId: FACILITY_ID,
        dateRange: {
          start: new Date("2026-03-01"),
          end: new Date("2026-03-31"),
        },
      });

      expect(result.bookings).toHaveLength(1);
    });

    it("works without date range (returns all dates)", async () => {
      const db = createMockDb({ bookings: [makeBooking()] });
      const caller = authedCaller(db);

      const result = await caller.booking.list({
        facilityId: FACILITY_ID,
      });

      expect(result.bookings).toHaveLength(1);
    });

    it("supports single-day date range (same start and end)", async () => {
      const db = createMockDb({ bookings: [] });
      const caller = authedCaller(db);

      const result = await caller.booking.list({
        facilityId: FACILITY_ID,
        dateRange: {
          start: new Date("2026-03-12"),
          end: new Date("2026-03-12"),
        },
      });

      expect(result.total).toBe(0);
    });
  });

  // ===========================================================================
  // Tests: booking.list — sorting
  // ===========================================================================

  describe("sorting", () => {
    it("accepts sortBy and sortOrder params", async () => {
      const db = createMockDb({ bookings: [] });
      const caller = authedCaller(db);

      const result = await caller.booking.list({
        facilityId: FACILITY_ID,
        sortBy: "date",
        sortOrder: "asc",
      });

      expect(result.bookings).toEqual([]);
    });

    it("accepts all valid sortBy values", async () => {
      const db = createMockDb({ bookings: [] });
      const caller = authedCaller(db);

      for (const sortBy of [
        "date",
        "time",
        "court",
        "price",
        "status",
      ] as const) {
        const result = await caller.booking.list({
          facilityId: FACILITY_ID,
          sortBy,
          sortOrder: "asc",
        });
        expect(result.bookings).toEqual([]);
      }
    });

    it("defaults to date desc when no sort params provided", async () => {
      const db = createMockDb({ bookings: [makeBooking()] });
      const caller = authedCaller(db);

      const result = await caller.booking.list({
        facilityId: FACILITY_ID,
      });

      expect(result.bookings).toHaveLength(1);
    });

    it("accepts desc sort order", async () => {
      const db = createMockDb({ bookings: [] });
      const caller = authedCaller(db);

      const result = await caller.booking.list({
        facilityId: FACILITY_ID,
        sortBy: "price",
        sortOrder: "desc",
      });

      expect(result.bookings).toEqual([]);
    });
  });

  // ===========================================================================
  // Tests: booking.list — combined filters
  // ===========================================================================

  describe("combined filters", () => {
    it("combines multi-status + date range + court + search", async () => {
      const db = createMockDb({ bookings: [] });
      const caller = authedCaller(db);

      const result = await caller.booking.list({
        facilityId: FACILITY_ID,
        status: ["pending", "confirmed"],
        dateRange: {
          start: new Date("2026-03-01"),
          end: new Date("2026-03-31"),
        },
        courtId: COURT_A_ID,
        search: "PH-2026",
        sortBy: "date",
        sortOrder: "desc",
      });

      expect(result.total).toBe(0);
    });

    it("combines status filter with sorting", async () => {
      const b1 = makeBooking({ id: "b1", status: "confirmed" });
      const b2 = makeBooking({
        id: "b2",
        status: "confirmed",
        priceInCents: 8000,
      });
      const db = createMockDb({ bookings: [b1, b2] });
      const caller = authedCaller(db);

      const result = await caller.booking.list({
        facilityId: FACILITY_ID,
        status: ["confirmed"],
        sortBy: "price",
        sortOrder: "asc",
      });

      expect(result.bookings).toHaveLength(2);
    });
  });

  // ===========================================================================
  // Tests: booking.list — pagination
  // ===========================================================================

  describe("pagination", () => {
    it("returns pagination metadata", async () => {
      const db = createMockDb({ bookings: [makeBooking()], totalCount: 25 });
      const caller = authedCaller(db);

      const result = await caller.booking.list({
        facilityId: FACILITY_ID,
        page: 1,
        limit: 10,
      });

      expect(result.total).toBe(25);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(3);
    });

    it("returns correct totalPages for exact division", async () => {
      const db = createMockDb({ bookings: [], totalCount: 20 });
      const caller = authedCaller(db);

      const result = await caller.booking.list({
        facilityId: FACILITY_ID,
        page: 2,
        limit: 10,
      });

      expect(result.totalPages).toBe(2);
      expect(result.page).toBe(2);
    });
  });

  // ===========================================================================
  // Tests: booking.list — backward compatibility with single date
  // ===========================================================================

  describe("single date filter", () => {
    it("still supports single date parameter", async () => {
      const db = createMockDb({ bookings: [] });
      const caller = authedCaller(db);

      const result = await caller.booking.list({
        facilityId: FACILITY_ID,
        date: new Date("2026-03-12"),
      });

      expect(result.bookings).toEqual([]);
    });
  });
});
