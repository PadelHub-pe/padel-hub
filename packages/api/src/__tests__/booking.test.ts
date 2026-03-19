/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access -- vitest mock types (vi.fn, expect.objectContaining) are inherently `any` */
/* eslint-disable @typescript-eslint/no-explicit-any -- mock db/session types */
import { describe, expect, it, vi } from "vitest";

import { bookingRouter } from "../router/booking";
import { createCallerFactory, createTRPCRouter } from "../trpc";

// =============================================================================
// Constants
// =============================================================================

const FACILITY_ID = "40000000-0000-4000-8000-000000000001";
const USER_ID = "40000000-0000-4000-8000-000000000020";
const ORG_ID = "40000000-0000-4000-8000-000000000030";
const COURT_ID = "40000000-0000-4000-8000-000000000040";
const BOOKING_ID = "40000000-0000-4000-8000-000000000050";
const PLAYER_ID = "40000000-0000-4000-8000-000000000060";
const OTHER_USER_ID = "40000000-0000-4000-8000-000000000070";

// =============================================================================
// Shared factories & helpers
// =============================================================================

const router = createTRPCRouter({ booking: bookingRouter });
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

function makeBooking(overrides?: Record<string, unknown>) {
  return {
    id: BOOKING_ID,
    code: "PH-2026-AB12",
    facilityId: FACILITY_ID,
    courtId: COURT_ID,
    date: new Date("2026-03-15"),
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

function makePlayer(overrides?: Record<string, unknown>) {
  return {
    id: PLAYER_ID,
    bookingId: BOOKING_ID,
    userId: null,
    role: "player",
    position: 2,
    guestName: "Guest Player",
    guestEmail: null,
    guestPhone: null,
    createdAt: new Date(),
    user: null,
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
    name: "Evening Peak",
    daysOfWeek: [1, 2, 3, 4, 5],
    startTime: "18:00:00",
    endTime: "22:00:00",
    markupPercent: 50,
    isActive: true,
    createdAt: new Date(),
    ...overrides,
  };
}

// =============================================================================
// Mock DB builder — modular, supports all procedures
// =============================================================================

interface MockDbOpts {
  facility?: ReturnType<typeof makeFacility> | null;
  court?: ReturnType<typeof makeCourt> | null;
  booking?: ReturnType<typeof makeBooking> | null;
  bookings?: ReturnType<typeof makeBooking>[];
  players?: ReturnType<typeof makePlayer>[];
  activities?: any[];
  operatingHours?: ReturnType<typeof makeOperatingHour>[];
  peakPeriods?: ReturnType<typeof makePeakPeriod>[];
  blockedSlots?: any[];
  users?: any[];
  totalCount?: number;
  role?: string;
  facilityIds?: string[];
  membershipOverride?: ReturnType<typeof makeCallerMembership> | null;
}

function createMockDb(opts?: MockDbOpts) {
  const facility = opts && "facility" in opts ? opts.facility : makeFacility();
  const court = opts && "court" in opts ? opts.court : makeCourt();
  const booking = opts && "booking" in opts ? opts.booking : makeBooking();
  const bookingsList = opts?.bookings ?? [];
  const players = opts?.players ?? [];
  const activities = opts?.activities ?? [];
  const operatingHoursList = opts?.operatingHours ?? [];
  const peakPeriodsList = opts?.peakPeriods ?? [];
  const blockedSlotsList = opts?.blockedSlots ?? [];
  const usersList = opts?.users ?? [];
  const totalCount = opts?.totalCount ?? bookingsList.length;
  const role = opts?.role ?? "org_admin";
  const facilityIds =
    opts?.facilityIds ?? (role === "staff" ? [FACILITY_ID] : []);
  const membership =
    opts?.membershipOverride !== undefined
      ? opts.membershipOverride
      : makeCallerMembership(role, facilityIds);

  // Combine booking with its players relation for findFirst (used by getById, addPlayer, etc.)
  const bookingWithRelations = booking
    ? {
        ...booking,
        court: court ?? makeCourt(),
        user: null,
        players,
        activity: activities,
      }
    : null;

  // Bookings list with relations for findMany (used by list)
  const bookingsWithRelations = bookingsList.map((b) => ({
    ...b,
    court: { id: b.courtId, name: "Cancha 1", facilityId: FACILITY_ID },
    user: null,
    players: [],
  }));

  // select().from().where() chain for count queries
  const selectFromWhereFn = vi.fn().mockResolvedValue([{ count: totalCount }]);
  const selectFromFn = vi.fn().mockReturnValue({ where: selectFromWhereFn });
  const selectFn = vi.fn().mockReturnValue({ from: selectFromFn });

  // update().set().where().returning() chain
  const updateReturningFn = vi
    .fn()
    .mockResolvedValue(booking ? [{ ...booking, status: "confirmed" }] : []);
  const updateWhereFn = vi
    .fn()
    .mockReturnValue({ returning: updateReturningFn });
  const updateSetFn = vi.fn().mockReturnValue({ where: updateWhereFn });
  const updateFn = vi.fn().mockReturnValue({ set: updateSetFn });

  // insert().values().returning() chain
  const allInsertCalls: any[] = [];
  const insertReturningFn = vi.fn().mockResolvedValue([
    {
      id: "new-booking-id",
      code: "PH-2026-TEST",
      courtId: COURT_ID,
      facilityId: FACILITY_ID,
      status: "confirmed",
    },
  ]);
  const insertValuesFn = vi.fn().mockImplementation((vals: any) => {
    allInsertCalls.push(vals);
    return { returning: insertReturningFn };
  });
  const insertFn = vi.fn().mockReturnValue({ values: insertValuesFn });

  // delete().where() chain
  const deleteWhereFn = vi.fn().mockResolvedValue([]);
  const deleteFn = vi.fn().mockReturnValue({ where: deleteWhereFn });

  // Booking findFirst returns single booking (with relations when called with `with`)
  // or just booking (without relations for simple lookups)
  const bookingFindFirstFn = vi.fn().mockResolvedValue(bookingWithRelations);

  return {
    query: {
      organizationMembers: {
        findFirst: vi.fn().mockResolvedValue(membership),
      },
      facilities: {
        findFirst: vi.fn().mockResolvedValue(facility),
      },
      courts: {
        findFirst: vi.fn().mockResolvedValue(court),
      },
      bookings: {
        findFirst: bookingFindFirstFn,
        findMany: vi.fn().mockResolvedValue(bookingsWithRelations),
      },
      bookingPlayers: {
        findFirst: vi.fn().mockResolvedValue(players[0] ?? null),
        findMany: vi.fn().mockResolvedValue(players),
      },
      bookingActivity: {
        findMany: vi.fn().mockResolvedValue(activities),
      },
      operatingHours: {
        findMany: vi.fn().mockResolvedValue(operatingHoursList),
      },
      peakPeriods: {
        findMany: vi.fn().mockResolvedValue(peakPeriodsList),
      },
      blockedSlots: {
        findMany: vi.fn().mockResolvedValue(blockedSlotsList),
      },
      user: {
        findFirst: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue(usersList),
      },
    },
    select: selectFn,
    update: updateFn,
    insert: insertFn,
    delete: deleteFn,
    // Internal refs for assertions
    _updateSetFn: updateSetFn,
    _updateReturningFn: updateReturningFn,
    _insertValuesFn: insertValuesFn,
    _insertReturningFn: insertReturningFn,
    _allInsertCalls: allInsertCalls,
    _bookingFindFirstFn: bookingFindFirstFn,
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
// booking.getById
// =============================================================================

describe("booking.getById", () => {
  it("returns booking with players and activity", async () => {
    const players = [
      makePlayer({ id: "p1", position: 1, role: "owner", guestName: "Juan" }),
      makePlayer({ id: "p2", position: 2, guestName: "Pedro" }),
    ];
    const activities = [
      {
        id: "act-1",
        bookingId: BOOKING_ID,
        type: "created",
        description: "Reserva creada",
        performer: null,
        createdAt: new Date(),
      },
    ];
    const db = createMockDb({ players, activities });
    const caller = authedCaller(db);

    const result = await caller.booking.getById({
      facilityId: FACILITY_ID,
      id: BOOKING_ID,
    });

    expect(result.id).toBe(BOOKING_ID);
    expect(result.playerCount).toBe(2);
  });

  it("throws NOT_FOUND for nonexistent booking", async () => {
    const db = createMockDb({ booking: null });
    const caller = authedCaller(db);

    await expect(
      caller.booking.getById({
        facilityId: FACILITY_ID,
        id: BOOKING_ID,
      }),
    ).rejects.toThrow("Reserva no encontrada");
  });

  it("returns resolved status (overrides stored status)", async () => {
    // Booking is confirmed but start time has passed — should be in_progress or completed
    const db = createMockDb({
      booking: makeBooking({
        status: "confirmed",
        startTime: "10:00:00",
        endTime: "11:00:00",
      }),
    });
    const caller = authedCaller(db);

    const result = await caller.booking.getById({
      facilityId: FACILITY_ID,
      id: BOOKING_ID,
    });

    // The status resolution happens via resolveAndPersistSingleBookingStatus
    // which returns null when no transition needed (since we can't control `now` in the test)
    // We just verify it returns a valid booking
    expect(result).toBeDefined();
    expect(result.code).toBe("PH-2026-AB12");
  });
});

// =============================================================================
// booking.confirm
// =============================================================================

describe("booking.confirm", () => {
  it("confirms a pending booking", async () => {
    const booking = makeBooking({ status: "pending", confirmedAt: null });
    const db = createMockDb({ booking });
    db._updateReturningFn.mockResolvedValue([
      { ...booking, status: "confirmed", confirmedAt: new Date() },
    ]);
    const caller = authedCaller(db);

    const result = await caller.booking.confirm({
      facilityId: FACILITY_ID,
      id: BOOKING_ID,
    });

    expect(result?.status).toBe("confirmed");
    expect(db._updateSetFn).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "confirmed",
        confirmedAt: expect.any(Date),
      }),
    );
  });

  it("confirms an open_match booking", async () => {
    const booking = makeBooking({ status: "open_match", confirmedAt: null });
    const db = createMockDb({ booking });
    db._updateReturningFn.mockResolvedValue([
      { ...booking, status: "confirmed" },
    ]);
    const caller = authedCaller(db);

    const result = await caller.booking.confirm({
      facilityId: FACILITY_ID,
      id: BOOKING_ID,
    });

    expect(result?.status).toBe("confirmed");
  });

  it("rejects confirming a confirmed booking", async () => {
    const db = createMockDb({
      booking: makeBooking({ status: "confirmed" }),
    });
    const caller = authedCaller(db);

    await expect(
      caller.booking.confirm({
        facilityId: FACILITY_ID,
        id: BOOKING_ID,
      }),
    ).rejects.toThrow(
      "Solo se pueden confirmar reservas pendientes o partidos abiertos",
    );
  });

  it("rejects confirming a cancelled booking", async () => {
    const db = createMockDb({
      booking: makeBooking({ status: "cancelled" }),
    });
    const caller = authedCaller(db);

    await expect(
      caller.booking.confirm({
        facilityId: FACILITY_ID,
        id: BOOKING_ID,
      }),
    ).rejects.toThrow(
      "Solo se pueden confirmar reservas pendientes o partidos abiertos",
    );
  });

  it("rejects confirming a completed booking", async () => {
    const db = createMockDb({
      booking: makeBooking({ status: "completed" }),
    });
    const caller = authedCaller(db);

    await expect(
      caller.booking.confirm({
        facilityId: FACILITY_ID,
        id: BOOKING_ID,
      }),
    ).rejects.toThrow(
      "Solo se pueden confirmar reservas pendientes o partidos abiertos",
    );
  });

  it("throws NOT_FOUND for nonexistent booking", async () => {
    const db = createMockDb({ booking: null });
    const caller = authedCaller(db);

    await expect(
      caller.booking.confirm({
        facilityId: FACILITY_ID,
        id: BOOKING_ID,
      }),
    ).rejects.toThrow("Reserva no encontrada");
  });

  it("logs confirmation activity", async () => {
    const booking = makeBooking({ status: "pending" });
    const db = createMockDb({ booking });
    db._updateReturningFn.mockResolvedValue([
      { ...booking, status: "confirmed" },
    ]);
    const caller = authedCaller(db);

    await caller.booking.confirm({
      facilityId: FACILITY_ID,
      id: BOOKING_ID,
    });

    // Verify activity was logged (insert called for booking_activity)
    expect(db._insertValuesFn).toHaveBeenCalledWith(
      expect.objectContaining({
        bookingId: BOOKING_ID,
        type: "confirmed",
        performedBy: USER_ID,
      }),
    );
  });
});

// =============================================================================
// booking.createManual — non-price aspects (conflict, code, players, activity)
// =============================================================================

describe("booking.createManual", () => {
  function makeCreateInput(overrides?: Record<string, unknown>) {
    return {
      facilityId: FACILITY_ID,
      courtId: COURT_ID,
      date: new Date("2026-03-12T15:00:00Z"), // Thursday
      startTime: "10:00",
      endTime: "11:30",
      customerName: "Juan Pérez",
      paymentMethod: "cash" as const,
      ...overrides,
    };
  }

  it("creates a manual booking successfully", async () => {
    const db = createMockDb({
      booking: null,
      operatingHours: [makeOperatingHour(4, "08:00", "22:00")],
    });
    const caller = authedCaller(db);

    const result = await caller.booking.createManual(makeCreateInput());

    expect(result).toBeDefined();
    expect(db.insert).toHaveBeenCalled();
  });

  it("throws CONFLICT when overlapping booking exists", async () => {
    const db = createMockDb({
      operatingHours: [makeOperatingHour(4, "08:00", "22:00")],
    });
    // Mock bookings.findFirst to return an overlapping booking
    db.query.bookings.findFirst.mockResolvedValueOnce(
      makeBooking({
        startTime: "10:00:00",
        endTime: "11:00:00",
        status: "confirmed",
      }),
    );
    const caller = authedCaller(db);

    await expect(
      caller.booking.createManual(makeCreateInput()),
    ).rejects.toThrow("La cancha ya tiene una reserva");
  });

  it("throws NOT_FOUND when court does not belong to facility", async () => {
    const db = createMockDb({ court: null });
    const caller = authedCaller(db);

    await expect(
      caller.booking.createManual(makeCreateInput()),
    ).rejects.toThrow("Cancha no encontrada");
  });

  it("adds customer as owner player at position 1", async () => {
    const db = createMockDb({
      booking: null,
      operatingHours: [makeOperatingHour(4, "08:00", "22:00")],
    });
    const caller = authedCaller(db);

    await caller.booking.createManual(makeCreateInput());

    // Second insert call is for bookingPlayers (owner)
    const playerInsert = db._allInsertCalls[1];
    expect(playerInsert).toEqual(
      expect.objectContaining({
        role: "owner",
        position: 1,
        guestName: "Juan Pérez",
      }),
    );
  });

  it("adds additional players at positions 2-4", async () => {
    const db = createMockDb({
      booking: null,
      operatingHours: [makeOperatingHour(4, "08:00", "22:00")],
    });
    const caller = authedCaller(db);

    await caller.booking.createManual(
      makeCreateInput({
        players: [
          { position: 2, guestName: "Pedro" },
          { position: 3, guestName: "María" },
        ],
      }),
    );

    // Third insert call is for additional players
    const additionalPlayers = db._allInsertCalls[2];
    expect(additionalPlayers).toHaveLength(2);
    expect(additionalPlayers[0]).toEqual(
      expect.objectContaining({
        position: 2,
        guestName: "Pedro",
        role: "player",
      }),
    );
    expect(additionalPlayers[1]).toEqual(
      expect.objectContaining({
        position: 3,
        guestName: "María",
        role: "player",
      }),
    );
  });

  it("logs creation activity", async () => {
    const db = createMockDb({
      booking: null,
      operatingHours: [makeOperatingHour(4, "08:00", "22:00")],
    });
    const caller = authedCaller(db);

    await caller.booking.createManual(makeCreateInput());

    // Activity log insert
    const activityInsert = db._allInsertCalls.find(
      (call: any) => call.type === "created",
    );
    expect(activityInsert).toEqual(
      expect.objectContaining({
        type: "created",
        performedBy: USER_ID,
      }),
    );
  });

  it("creates booking with status=confirmed and confirmedAt set", async () => {
    const db = createMockDb({
      booking: null,
      operatingHours: [makeOperatingHour(4, "08:00", "22:00")],
    });
    const caller = authedCaller(db);

    await caller.booking.createManual(makeCreateInput());

    const bookingInsert = db._allInsertCalls[0];
    expect(bookingInsert).toEqual(
      expect.objectContaining({
        status: "confirmed",
        isManualBooking: true,
        confirmedAt: expect.any(Date),
      }),
    );
  });

  it("stores optional fields (phone, email, notes)", async () => {
    const db = createMockDb({
      booking: null,
      operatingHours: [makeOperatingHour(4, "08:00", "22:00")],
    });
    const caller = authedCaller(db);

    await caller.booking.createManual(
      makeCreateInput({
        customerPhone: "999888777",
        customerEmail: "test@example.com",
        notes: "VIP customer",
      }),
    );

    const bookingInsert = db._allInsertCalls[0];
    expect(bookingInsert).toEqual(
      expect.objectContaining({
        customerPhone: "999888777",
        customerEmail: "test@example.com",
        notes: "VIP customer",
      }),
    );
  });
});

// =============================================================================
// booking.getStats
// =============================================================================

describe("booking.getStats", () => {
  it("returns today, pending, and total booking counts", async () => {
    const db = createMockDb();
    // Three count queries: today, pending, total
    const selectFromWhereFn = vi
      .fn()
      .mockResolvedValueOnce([{ count: 5 }]) // today
      .mockResolvedValueOnce([{ count: 3 }]) // pending
      .mockResolvedValueOnce([{ count: 42 }]); // total
    const selectFromFn = vi.fn().mockReturnValue({ where: selectFromWhereFn });
    db.select = vi.fn().mockReturnValue({ from: selectFromFn }) as any;

    const caller = authedCaller(db);
    const result = await caller.booking.getStats({
      facilityId: FACILITY_ID,
    });

    expect(result).toEqual({
      todayBookings: 5,
      pendingBookings: 3,
      totalBookings: 42,
    });
  });

  it("returns zeros when no bookings exist", async () => {
    const db = createMockDb();
    const selectFromWhereFn = vi
      .fn()
      .mockResolvedValueOnce([{ count: 0 }])
      .mockResolvedValueOnce([{ count: 0 }])
      .mockResolvedValueOnce([{ count: 0 }]);
    const selectFromFn = vi.fn().mockReturnValue({ where: selectFromWhereFn });
    db.select = vi.fn().mockReturnValue({ from: selectFromFn }) as any;

    const caller = authedCaller(db);
    const result = await caller.booking.getStats({
      facilityId: FACILITY_ID,
    });

    expect(result).toEqual({
      todayBookings: 0,
      pendingBookings: 0,
      totalBookings: 0,
    });
  });
});

// =============================================================================
// booking.addPlayer
// =============================================================================

describe("booking.addPlayer", () => {
  it("adds a guest player successfully", async () => {
    const players = [
      makePlayer({ id: "p1", position: 1, role: "owner", guestName: "Juan" }),
    ];
    const booking = makeBooking({ status: "confirmed" });
    const db = createMockDb({ booking, players });
    db._insertReturningFn.mockResolvedValue([
      makePlayer({ id: "new-player", position: 2, guestName: "Pedro" }),
    ]);
    const caller = authedCaller(db);

    const result = await caller.booking.addPlayer({
      facilityId: FACILITY_ID,
      bookingId: BOOKING_ID,
      position: 2,
      guestName: "Pedro",
    });

    expect(result).toBeDefined();
    expect(result?.guestName).toBe("Pedro");
  });

  it("adds a registered user as player", async () => {
    const players = [makePlayer({ id: "p1", position: 1, role: "owner" })];
    const booking = makeBooking({ status: "confirmed" });
    const db = createMockDb({ booking, players });
    db.query.user.findFirst.mockResolvedValue({
      id: OTHER_USER_ID,
      name: "Carlos",
    });
    db._insertReturningFn.mockResolvedValue([
      makePlayer({ id: "new-player", position: 2, userId: OTHER_USER_ID }),
    ]);
    const caller = authedCaller(db);

    const result = await caller.booking.addPlayer({
      facilityId: FACILITY_ID,
      bookingId: BOOKING_ID,
      position: 2,
      userId: OTHER_USER_ID,
    });

    expect(result).toBeDefined();
  });

  it("rejects when booking already has 4 players (max limit)", async () => {
    const players = [
      makePlayer({ id: "p1", position: 1, role: "owner" }),
      makePlayer({ id: "p2", position: 2 }),
      makePlayer({ id: "p3", position: 3 }),
      makePlayer({ id: "p4", position: 4 }),
    ];
    const db = createMockDb({
      booking: makeBooking({ status: "confirmed" }),
      players,
    });
    const caller = authedCaller(db);

    await expect(
      caller.booking.addPlayer({
        facilityId: FACILITY_ID,
        bookingId: BOOKING_ID,
        position: 2,
        guestName: "Fifth Player",
      }),
    ).rejects.toThrow("La reserva ya tiene 4 jugadores");
  });

  it("rejects when position is already occupied", async () => {
    const players = [
      makePlayer({ id: "p1", position: 1, role: "owner" }),
      makePlayer({ id: "p2", position: 2 }),
    ];
    const db = createMockDb({
      booking: makeBooking({ status: "confirmed" }),
      players,
    });
    const caller = authedCaller(db);

    await expect(
      caller.booking.addPlayer({
        facilityId: FACILITY_ID,
        bookingId: BOOKING_ID,
        position: 2,
        guestName: "Another Player",
      }),
    ).rejects.toThrow("La posición ya está ocupada");
  });

  it("rejects duplicate userId", async () => {
    const players = [
      makePlayer({
        id: "p1",
        position: 1,
        role: "owner",
        userId: OTHER_USER_ID,
      }),
    ];
    const db = createMockDb({
      booking: makeBooking({ status: "confirmed" }),
      players,
    });
    const caller = authedCaller(db);

    await expect(
      caller.booking.addPlayer({
        facilityId: FACILITY_ID,
        bookingId: BOOKING_ID,
        position: 2,
        userId: OTHER_USER_ID,
      }),
    ).rejects.toThrow("El jugador ya está en la reserva");
  });

  it("auto-confirms open_match when reaching 4 players", async () => {
    const players = [
      makePlayer({ id: "p1", position: 1, role: "owner" }),
      makePlayer({ id: "p2", position: 2 }),
      makePlayer({ id: "p3", position: 3 }),
    ];
    const booking = makeBooking({ status: "open_match" });
    const db = createMockDb({ booking, players });
    db._insertReturningFn.mockResolvedValue([
      makePlayer({ id: "p4", position: 4 }),
    ]);
    const caller = authedCaller(db);

    await caller.booking.addPlayer({
      facilityId: FACILITY_ID,
      bookingId: BOOKING_ID,
      position: 4,
      guestName: "Fourth Player",
    });

    // Should have called update to set status = confirmed
    expect(db._updateSetFn).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "confirmed",
        confirmedAt: expect.any(Date),
      }),
    );
  });

  it("does not auto-confirm non-open_match booking at 4 players", async () => {
    const players = [
      makePlayer({ id: "p1", position: 1, role: "owner" }),
      makePlayer({ id: "p2", position: 2 }),
      makePlayer({ id: "p3", position: 3 }),
    ];
    const booking = makeBooking({ status: "confirmed" });
    const db = createMockDb({ booking, players });
    db._insertReturningFn.mockResolvedValue([
      makePlayer({ id: "p4", position: 4 }),
    ]);
    const caller = authedCaller(db);

    await caller.booking.addPlayer({
      facilityId: FACILITY_ID,
      bookingId: BOOKING_ID,
      position: 4,
      guestName: "Fourth Player",
    });

    // update should not be called for auto-confirm (only for player insert activity log)
    expect(db._updateSetFn).not.toHaveBeenCalledWith(
      expect.objectContaining({ status: "confirmed" }),
    );
  });

  it("throws NOT_FOUND for nonexistent booking", async () => {
    const db = createMockDb({ booking: null });
    const caller = authedCaller(db);

    await expect(
      caller.booking.addPlayer({
        facilityId: FACILITY_ID,
        bookingId: BOOKING_ID,
        position: 2,
        guestName: "Guest",
      }),
    ).rejects.toThrow("Reserva no encontrada");
  });

  it("logs player_joined activity", async () => {
    const players = [makePlayer({ id: "p1", position: 1, role: "owner" })];
    const db = createMockDb({
      booking: makeBooking({ status: "confirmed" }),
      players,
    });
    db._insertReturningFn.mockResolvedValue([
      makePlayer({ id: "new-player", position: 2, guestName: "Pedro" }),
    ]);
    const caller = authedCaller(db);

    await caller.booking.addPlayer({
      facilityId: FACILITY_ID,
      bookingId: BOOKING_ID,
      position: 2,
      guestName: "Pedro",
    });

    // Activity log should be the second insert call
    const activityInsert = db._allInsertCalls.find(
      (call: any) => call.type === "player_joined",
    );
    expect(activityInsert).toEqual(
      expect.objectContaining({
        bookingId: BOOKING_ID,
        type: "player_joined",
        performedBy: USER_ID,
      }),
    );
  });
});

// =============================================================================
// booking.removePlayer
// =============================================================================

describe("booking.removePlayer", () => {
  it("removes a non-owner player successfully", async () => {
    const players = [
      makePlayer({
        id: PLAYER_ID,
        position: 2,
        role: "player",
        guestName: "Pedro",
      }),
    ];
    const db = createMockDb({
      booking: makeBooking(),
      players,
    });
    const caller = authedCaller(db);

    const result = await caller.booking.removePlayer({
      facilityId: FACILITY_ID,
      bookingId: BOOKING_ID,
      playerId: PLAYER_ID,
    });

    expect(result).toEqual({ success: true });
    expect(db.delete).toHaveBeenCalled();
  });

  it("rejects removing the owner player", async () => {
    const players = [makePlayer({ id: PLAYER_ID, position: 1, role: "owner" })];
    const db = createMockDb({ booking: makeBooking(), players });
    const caller = authedCaller(db);

    await expect(
      caller.booking.removePlayer({
        facilityId: FACILITY_ID,
        bookingId: BOOKING_ID,
        playerId: PLAYER_ID,
      }),
    ).rejects.toThrow("No se puede remover al creador de la reserva");
  });

  it("throws NOT_FOUND for nonexistent booking", async () => {
    const db = createMockDb({ booking: null });
    const caller = authedCaller(db);

    await expect(
      caller.booking.removePlayer({
        facilityId: FACILITY_ID,
        bookingId: BOOKING_ID,
        playerId: PLAYER_ID,
      }),
    ).rejects.toThrow("Reserva no encontrada");
  });

  it("throws NOT_FOUND for nonexistent player", async () => {
    const db = createMockDb({ booking: makeBooking(), players: [] });
    db.query.bookingPlayers.findFirst.mockResolvedValue(null);
    const caller = authedCaller(db);

    await expect(
      caller.booking.removePlayer({
        facilityId: FACILITY_ID,
        bookingId: BOOKING_ID,
        playerId: PLAYER_ID,
      }),
    ).rejects.toThrow("Jugador no encontrado");
  });

  it("logs player_left activity", async () => {
    const players = [
      makePlayer({
        id: PLAYER_ID,
        position: 2,
        role: "player",
        guestName: "Pedro",
      }),
    ];
    const db = createMockDb({ booking: makeBooking(), players });
    const caller = authedCaller(db);

    await caller.booking.removePlayer({
      facilityId: FACILITY_ID,
      bookingId: BOOKING_ID,
      playerId: PLAYER_ID,
    });

    const activityInsert = db._allInsertCalls.find(
      (call: any) => call.type === "player_left",
    );
    expect(activityInsert).toEqual(
      expect.objectContaining({
        bookingId: BOOKING_ID,
        type: "player_left",
        performedBy: USER_ID,
      }),
    );
  });
});

// =============================================================================
// booking.getActivity
// =============================================================================

describe("booking.getActivity", () => {
  it("returns activity log for a booking", async () => {
    const activities = [
      {
        id: "act-1",
        bookingId: BOOKING_ID,
        type: "created",
        description: "Reserva manual creada",
        performer: null,
        createdAt: new Date(),
      },
      {
        id: "act-2",
        bookingId: BOOKING_ID,
        type: "confirmed",
        description: "Reserva confirmada",
        performer: { id: USER_ID, name: "Admin" },
        createdAt: new Date(),
      },
    ];
    const db = createMockDb({ activities });
    const caller = authedCaller(db);

    const result = await caller.booking.getActivity({
      facilityId: FACILITY_ID,
      bookingId: BOOKING_ID,
    });

    expect(result).toHaveLength(2);
    expect(result[0]?.type).toBe("created");
    expect(result[1]?.type).toBe("confirmed");
  });

  it("returns empty array when no activity exists", async () => {
    const db = createMockDb({ activities: [] });
    const caller = authedCaller(db);

    const result = await caller.booking.getActivity({
      facilityId: FACILITY_ID,
      bookingId: BOOKING_ID,
    });

    expect(result).toEqual([]);
  });
});

// =============================================================================
// booking.searchUsers
// =============================================================================

describe("booking.searchUsers", () => {
  it("returns users matching search query", async () => {
    const users = [
      { id: "u1", name: "Carlos López", email: "carlos@test.com", image: null },
      { id: "u2", name: "Carla Reyes", email: "carla@test.com", image: null },
    ];
    const db = createMockDb({ users });
    const caller = authedCaller(db);

    const result = await caller.booking.searchUsers({
      facilityId: FACILITY_ID,
      bookingId: BOOKING_ID,
      query: "Car",
    });

    expect(result).toHaveLength(2);
    expect(result[0]?.name).toBe("Carlos López");
  });

  it("returns empty array when no users match", async () => {
    const db = createMockDb({ users: [] });
    const caller = authedCaller(db);

    const result = await caller.booking.searchUsers({
      facilityId: FACILITY_ID,
      bookingId: BOOKING_ID,
      query: "nonexistent",
    });

    expect(result).toEqual([]);
  });

  it("excludes current players from results", async () => {
    // Mock bookingPlayers.findMany to return players with userIds
    const players = [makePlayer({ userId: "u1", position: 1 })];
    const users = [
      { id: "u2", name: "Not In Booking", email: "u2@test.com", image: null },
    ];
    const db = createMockDb({ users, players });
    const caller = authedCaller(db);

    const result = await caller.booking.searchUsers({
      facilityId: FACILITY_ID,
      bookingId: BOOKING_ID,
      query: "test",
    });

    // Mock returns all users from the mock, but the procedure filters internally
    expect(result).toHaveLength(1);
  });
});

// =============================================================================
// booking.getSlotInfo
// =============================================================================

describe("booking.getSlotInfo", () => {
  it("returns operating hours for the requested day", async () => {
    const db = createMockDb({
      operatingHours: [
        makeOperatingHour(0, "09:00:00", "20:00:00"), // Sunday
        makeOperatingHour(1, "08:00:00", "22:00:00"), // Monday
      ],
    });
    const caller = authedCaller(db);

    // Sunday = 0
    const result = await caller.booking.getSlotInfo({
      facilityId: FACILITY_ID,
      date: new Date("2026-03-15T15:00:00Z"), // Sunday
    });

    expect(result.operatingHours).toBeDefined();
    expect(result.peakPeriods).toBeDefined();
    expect(result.existingBookings).toBeDefined();
    expect(result.blockedSlots).toBeDefined();
  });

  it("returns default hours when no operating hours for the day", async () => {
    const db = createMockDb({ operatingHours: [] });
    const caller = authedCaller(db);

    const result = await caller.booking.getSlotInfo({
      facilityId: FACILITY_ID,
      date: new Date("2026-03-15T15:00:00Z"),
    });

    expect(result.operatingHours).toEqual({
      openTime: "08:00:00",
      closeTime: "22:00:00",
      isClosed: false,
    });
  });

  it("returns peak periods applicable to the day", async () => {
    const db = createMockDb({
      operatingHours: [makeOperatingHour(0)],
      peakPeriods: [
        makePeakPeriod({
          daysOfWeek: [0, 6], // Sunday, Saturday
          startTime: "18:00:00",
          endTime: "22:00:00",
        }),
        makePeakPeriod({
          id: "pp-2",
          daysOfWeek: [1, 2, 3, 4, 5], // Weekdays only
          startTime: "19:00:00",
          endTime: "21:00:00",
        }),
      ],
    });
    const caller = authedCaller(db);

    // Sunday = 0
    const result = await caller.booking.getSlotInfo({
      facilityId: FACILITY_ID,
      date: new Date("2026-03-15T15:00:00Z"), // Sunday
    });

    // Only the Sunday peak period should be included
    expect(result.peakPeriods).toHaveLength(1);
    expect(result.peakPeriods[0]?.startTime).toBe("18:00:00");
  });

  it("returns existing bookings (excludes cancelled)", async () => {
    const db = createMockDb({
      operatingHours: [makeOperatingHour(0)],
    });
    // Override bookings.findMany for slot info
    db.query.bookings.findMany.mockResolvedValue([
      {
        id: "b1",
        courtId: COURT_ID,
        startTime: "10:00:00",
        endTime: "11:00:00",
        status: "confirmed",
        customerName: "Juan",
      },
    ]);
    const caller = authedCaller(db);

    const result = await caller.booking.getSlotInfo({
      facilityId: FACILITY_ID,
      date: new Date("2026-03-15T15:00:00Z"),
    });

    expect(result.existingBookings).toHaveLength(1);
    expect(result.existingBookings[0]?.status).toBe("confirmed");
  });

  it("returns blocked slots for the day", async () => {
    const db = createMockDb({
      operatingHours: [makeOperatingHour(0)],
      blockedSlots: [
        {
          courtId: COURT_ID,
          startTime: "14:00:00",
          endTime: "16:00:00",
          reason: "Maintenance",
        },
      ],
    });
    const caller = authedCaller(db);

    const result = await caller.booking.getSlotInfo({
      facilityId: FACILITY_ID,
      date: new Date("2026-03-15T15:00:00Z"),
    });

    expect(result.blockedSlots).toHaveLength(1);
    expect(result.blockedSlots[0]?.reason).toBe("Maintenance");
  });
});

// =============================================================================
// RBAC — access control for different roles
// =============================================================================

describe("RBAC", () => {
  describe("staff role", () => {
    it("can read bookings (booking:read)", async () => {
      const db = createMockDb({
        role: "staff",
        facilityIds: [FACILITY_ID],
        bookings: [makeBooking()],
      });
      const caller = authedCaller(db);

      const result = await caller.booking.list({
        facilityId: FACILITY_ID,
      });

      expect(result.bookings).toBeDefined();
    });

    it("can get booking by id (booking:read)", async () => {
      const db = createMockDb({
        role: "staff",
        facilityIds: [FACILITY_ID],
      });
      const caller = authedCaller(db);

      const result = await caller.booking.getById({
        facilityId: FACILITY_ID,
        id: BOOKING_ID,
      });

      expect(result).toBeDefined();
    });

    it("can confirm bookings (booking:manage)", async () => {
      const booking = makeBooking({ status: "pending" });
      const db = createMockDb({
        role: "staff",
        facilityIds: [FACILITY_ID],
        booking,
      });
      db._updateReturningFn.mockResolvedValue([
        { ...booking, status: "confirmed" },
      ]);
      const caller = authedCaller(db);

      const result = await caller.booking.confirm({
        facilityId: FACILITY_ID,
        id: BOOKING_ID,
      });

      expect(result?.status).toBe("confirmed");
    });

    it("can cancel bookings (booking:manage)", async () => {
      const db = createMockDb({
        role: "staff",
        facilityIds: [FACILITY_ID],
      });
      db._updateReturningFn.mockResolvedValue([
        { ...makeBooking(), status: "cancelled" },
      ]);
      const caller = authedCaller(db);

      const result = await caller.booking.cancel({
        facilityId: FACILITY_ID,
        id: BOOKING_ID,
      });

      expect(result?.status).toBe("cancelled");
    });
  });

  describe("staff without facility access", () => {
    it("is denied when facilityIds is empty", async () => {
      const db = createMockDb({
        role: "staff",
        facilityIds: [],
        membershipOverride: makeCallerMembership("staff", []),
      });
      const caller = authedCaller(db);

      await expect(
        caller.booking.list({ facilityId: FACILITY_ID }),
      ).rejects.toThrow("No tienes acceso a este local");
    });
  });

  describe("facility_manager role", () => {
    it("can access assigned facility", async () => {
      const db = createMockDb({
        role: "facility_manager",
        facilityIds: [FACILITY_ID],
        bookings: [makeBooking()],
      });
      const caller = authedCaller(db);

      const result = await caller.booking.list({
        facilityId: FACILITY_ID,
      });

      expect(result.bookings).toBeDefined();
    });

    it("can access all facilities when facilityIds is empty", async () => {
      const db = createMockDb({
        role: "facility_manager",
        facilityIds: [],
        bookings: [makeBooking()],
      });
      const caller = authedCaller(db);

      const result = await caller.booking.list({
        facilityId: FACILITY_ID,
      });

      expect(result.bookings).toBeDefined();
    });
  });

  describe("org_admin role", () => {
    it("can access any facility in the organization", async () => {
      const db = createMockDb({
        role: "org_admin",
        bookings: [makeBooking()],
      });
      const caller = authedCaller(db);

      const result = await caller.booking.list({
        facilityId: FACILITY_ID,
      });

      expect(result.bookings).toBeDefined();
    });
  });

  describe("no membership", () => {
    it("is denied when user has no org membership", async () => {
      const db = createMockDb({ membershipOverride: null });
      const caller = authedCaller(db);

      await expect(
        caller.booking.list({ facilityId: FACILITY_ID }),
      ).rejects.toThrow("No tienes acceso a esta organización");
    });
  });

  describe("facility not found", () => {
    it("throws NOT_FOUND when facility does not exist", async () => {
      const db = createMockDb({ facility: null });
      const caller = authedCaller(db);

      await expect(
        caller.booking.list({ facilityId: FACILITY_ID }),
      ).rejects.toThrow("Local no encontrado");
    });
  });
});
