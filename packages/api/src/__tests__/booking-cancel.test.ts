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
const BOOKING_ID = "40000000-0000-4000-8000-000000000050";

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

function makeBooking(
  overrides?: Record<string, unknown>,
): Record<string, unknown> {
  return {
    id: BOOKING_ID,
    facilityId: FACILITY_ID,
    courtId: "court-1",
    code: "PH-2026-ABCD",
    status: "confirmed",
    date: "2026-03-15",
    startTime: "10:00:00",
    endTime: "11:00:00",
    priceInCents: 5000,
    isPeakRate: false,
    customerName: "Juan",
    customerEmail: null,
    customerPhone: null,
    cancelledBy: null,
    cancellationReason: null,
    cancelledAt: null,
    confirmedAt: new Date(),
    createdAt: new Date(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Mock DB builder
// ---------------------------------------------------------------------------

interface MockDbOpts {
  booking?: Record<string, unknown> | null;
  role?: string;
}

function createMockDb(opts?: MockDbOpts) {
  const booking = opts && "booking" in opts ? opts.booking : makeBooking();
  const role = opts?.role ?? "org_admin";

  const updateReturningFn = vi
    .fn()
    .mockResolvedValue([booking ? { ...booking, status: "cancelled" } : null]);
  const updateWhereFn = vi
    .fn()
    .mockReturnValue({ returning: updateReturningFn });
  const updateSetFn = vi.fn().mockReturnValue({ where: updateWhereFn });

  const insertValuesFn = vi.fn().mockResolvedValue([]);

  return {
    query: {
      organizationMembers: {
        findFirst: vi.fn().mockResolvedValue(makeCallerMembership(role)),
      },
      facilities: {
        findFirst: vi
          .fn()
          .mockResolvedValue({ id: FACILITY_ID, organizationId: ORG_ID }),
      },
      bookings: {
        findFirst: vi.fn().mockResolvedValue(booking),
      },
    },
    update: vi.fn().mockReturnValue({ set: updateSetFn }),
    insert: vi.fn().mockReturnValue({ values: insertValuesFn }),
    _updateSetFn: updateSetFn,
    _updateReturningFn: updateReturningFn,
    _insertValuesFn: insertValuesFn,
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
// Tests: booking.cancel
// ===========================================================================

describe("booking.cancel", () => {
  it("cancels a confirmed booking with cancelled_by='owner'", async () => {
    const db = createMockDb({ booking: makeBooking({ status: "confirmed" }) });
    const caller = authedCaller(db);

    await caller.booking.cancel({
      facilityId: FACILITY_ID,
      id: BOOKING_ID,
    });

    expect(db._updateSetFn).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "cancelled",
        cancelledBy: "owner",
      }),
    );
  });

  it("cancels a pending booking", async () => {
    const db = createMockDb({ booking: makeBooking({ status: "pending" }) });
    const caller = authedCaller(db);

    await caller.booking.cancel({
      facilityId: FACILITY_ID,
      id: BOOKING_ID,
    });

    expect(db._updateSetFn).toHaveBeenCalledWith(
      expect.objectContaining({ status: "cancelled" }),
    );
  });

  it("cancels an in_progress booking", async () => {
    const db = createMockDb({
      booking: makeBooking({ status: "in_progress" }),
    });
    const caller = authedCaller(db);

    await caller.booking.cancel({
      facilityId: FACILITY_ID,
      id: BOOKING_ID,
    });

    expect(db._updateSetFn).toHaveBeenCalledWith(
      expect.objectContaining({ status: "cancelled" }),
    );
  });

  it("includes cancellation reason when provided", async () => {
    const db = createMockDb();
    const caller = authedCaller(db);

    await caller.booking.cancel({
      facilityId: FACILITY_ID,
      id: BOOKING_ID,
      reason: "Cliente no se presentó",
    });

    expect(db._updateSetFn).toHaveBeenCalledWith(
      expect.objectContaining({
        cancellationReason: "Cliente no se presentó",
      }),
    );
  });

  it("rejects cancelling an already-cancelled booking", async () => {
    const db = createMockDb({
      booking: makeBooking({ status: "cancelled" }),
    });
    const caller = authedCaller(db);

    await expect(
      caller.booking.cancel({
        facilityId: FACILITY_ID,
        id: BOOKING_ID,
      }),
    ).rejects.toThrow("La reserva ya está cancelada");
  });

  it("rejects cancelling a completed booking", async () => {
    const db = createMockDb({
      booking: makeBooking({ status: "completed" }),
    });
    const caller = authedCaller(db);

    await expect(
      caller.booking.cancel({
        facilityId: FACILITY_ID,
        id: BOOKING_ID,
      }),
    ).rejects.toThrow("No se puede cancelar una reserva completada");
  });

  it("throws NOT_FOUND for non-existent booking", async () => {
    const db = createMockDb({ booking: null });
    const caller = authedCaller(db);

    await expect(
      caller.booking.cancel({
        facilityId: FACILITY_ID,
        id: BOOKING_ID,
      }),
    ).rejects.toThrow("Reserva no encontrada");
  });

  it("logs cancellation activity", async () => {
    const db = createMockDb();
    const caller = authedCaller(db);

    await caller.booking.cancel({
      facilityId: FACILITY_ID,
      id: BOOKING_ID,
      reason: "Lluvia",
    });

    // Verify activity was logged (insert called for booking_activity)
    expect(db._insertValuesFn).toHaveBeenCalledWith(
      expect.objectContaining({
        bookingId: BOOKING_ID,
        type: "cancelled",
        performedBy: USER_ID,
      }),
    );
  });
});

// ===========================================================================
// Tests: booking.updateStatus — state machine validation
// ===========================================================================

describe("booking.updateStatus", () => {
  // ---- Valid transitions ----

  it("allows pending → confirmed", async () => {
    const booking = makeBooking({ status: "pending", confirmedAt: null });
    const db = createMockDb({ booking });
    db._updateReturningFn.mockResolvedValue([
      { ...booking, status: "confirmed" },
    ]);
    const caller = authedCaller(db);

    const result = await caller.booking.updateStatus({
      facilityId: FACILITY_ID,
      id: BOOKING_ID,
      status: "confirmed",
    });

    expect(result?.status).toBe("confirmed");
  });

  it("allows pending → cancelled", async () => {
    const booking = makeBooking({ status: "pending" });
    const db = createMockDb({ booking });
    db._updateReturningFn.mockResolvedValue([
      { ...booking, status: "cancelled" },
    ]);
    const caller = authedCaller(db);

    const result = await caller.booking.updateStatus({
      facilityId: FACILITY_ID,
      id: BOOKING_ID,
      status: "cancelled",
    });

    expect(result?.status).toBe("cancelled");
  });

  it("allows confirmed → in_progress", async () => {
    const booking = makeBooking({ status: "confirmed" });
    const db = createMockDb({ booking });
    db._updateReturningFn.mockResolvedValue([
      { ...booking, status: "in_progress" },
    ]);
    const caller = authedCaller(db);

    const result = await caller.booking.updateStatus({
      facilityId: FACILITY_ID,
      id: BOOKING_ID,
      status: "in_progress",
    });

    expect(result?.status).toBe("in_progress");
  });

  it("allows confirmed → cancelled", async () => {
    const booking = makeBooking({ status: "confirmed" });
    const db = createMockDb({ booking });
    db._updateReturningFn.mockResolvedValue([
      { ...booking, status: "cancelled" },
    ]);
    const caller = authedCaller(db);

    const result = await caller.booking.updateStatus({
      facilityId: FACILITY_ID,
      id: BOOKING_ID,
      status: "cancelled",
    });

    expect(result?.status).toBe("cancelled");
  });

  it("allows in_progress → completed", async () => {
    const booking = makeBooking({ status: "in_progress" });
    const db = createMockDb({ booking });
    db._updateReturningFn.mockResolvedValue([
      { ...booking, status: "completed" },
    ]);
    const caller = authedCaller(db);

    const result = await caller.booking.updateStatus({
      facilityId: FACILITY_ID,
      id: BOOKING_ID,
      status: "completed",
    });

    expect(result?.status).toBe("completed");
  });

  it("allows in_progress → cancelled", async () => {
    const booking = makeBooking({ status: "in_progress" });
    const db = createMockDb({ booking });
    db._updateReturningFn.mockResolvedValue([
      { ...booking, status: "cancelled" },
    ]);
    const caller = authedCaller(db);

    const result = await caller.booking.updateStatus({
      facilityId: FACILITY_ID,
      id: BOOKING_ID,
      status: "cancelled",
    });

    expect(result?.status).toBe("cancelled");
  });

  it("allows open_match → confirmed", async () => {
    const booking = makeBooking({ status: "open_match" });
    const db = createMockDb({ booking });
    db._updateReturningFn.mockResolvedValue([
      { ...booking, status: "confirmed" },
    ]);
    const caller = authedCaller(db);

    const result = await caller.booking.updateStatus({
      facilityId: FACILITY_ID,
      id: BOOKING_ID,
      status: "confirmed",
    });

    expect(result?.status).toBe("confirmed");
  });

  it("allows open_match → cancelled", async () => {
    const booking = makeBooking({ status: "open_match" });
    const db = createMockDb({ booking });
    db._updateReturningFn.mockResolvedValue([
      { ...booking, status: "cancelled" },
    ]);
    const caller = authedCaller(db);

    const result = await caller.booking.updateStatus({
      facilityId: FACILITY_ID,
      id: BOOKING_ID,
      status: "cancelled",
    });

    expect(result?.status).toBe("cancelled");
  });

  // ---- Invalid backward transitions ----

  it("rejects completed → confirmed (backward)", async () => {
    const db = createMockDb({
      booking: makeBooking({ status: "completed" }),
    });
    const caller = authedCaller(db);

    await expect(
      caller.booking.updateStatus({
        facilityId: FACILITY_ID,
        id: BOOKING_ID,
        status: "confirmed",
      }),
    ).rejects.toThrow("Transición de estado no permitida");
  });

  it("rejects completed → pending (backward)", async () => {
    const db = createMockDb({
      booking: makeBooking({ status: "completed" }),
    });
    const caller = authedCaller(db);

    await expect(
      caller.booking.updateStatus({
        facilityId: FACILITY_ID,
        id: BOOKING_ID,
        status: "pending",
      }),
    ).rejects.toThrow("Transición de estado no permitida");
  });

  it("rejects completed → in_progress (backward)", async () => {
    const db = createMockDb({
      booking: makeBooking({ status: "completed" }),
    });
    const caller = authedCaller(db);

    await expect(
      caller.booking.updateStatus({
        facilityId: FACILITY_ID,
        id: BOOKING_ID,
        status: "in_progress",
      }),
    ).rejects.toThrow("Transición de estado no permitida");
  });

  it("rejects cancelled → confirmed", async () => {
    const db = createMockDb({
      booking: makeBooking({ status: "cancelled" }),
    });
    const caller = authedCaller(db);

    await expect(
      caller.booking.updateStatus({
        facilityId: FACILITY_ID,
        id: BOOKING_ID,
        status: "confirmed",
      }),
    ).rejects.toThrow("Transición de estado no permitida");
  });

  it("rejects cancelled → pending", async () => {
    const db = createMockDb({
      booking: makeBooking({ status: "cancelled" }),
    });
    const caller = authedCaller(db);

    await expect(
      caller.booking.updateStatus({
        facilityId: FACILITY_ID,
        id: BOOKING_ID,
        status: "pending",
      }),
    ).rejects.toThrow("Transición de estado no permitida");
  });

  it("rejects in_progress → confirmed (backward)", async () => {
    const db = createMockDb({
      booking: makeBooking({ status: "in_progress" }),
    });
    const caller = authedCaller(db);

    await expect(
      caller.booking.updateStatus({
        facilityId: FACILITY_ID,
        id: BOOKING_ID,
        status: "confirmed",
      }),
    ).rejects.toThrow("Transición de estado no permitida");
  });

  it("rejects in_progress → pending (backward)", async () => {
    const db = createMockDb({
      booking: makeBooking({ status: "in_progress" }),
    });
    const caller = authedCaller(db);

    await expect(
      caller.booking.updateStatus({
        facilityId: FACILITY_ID,
        id: BOOKING_ID,
        status: "pending",
      }),
    ).rejects.toThrow("Transición de estado no permitida");
  });

  it("rejects confirmed → pending (backward)", async () => {
    const db = createMockDb({
      booking: makeBooking({ status: "confirmed" }),
    });
    const caller = authedCaller(db);

    await expect(
      caller.booking.updateStatus({
        facilityId: FACILITY_ID,
        id: BOOKING_ID,
        status: "pending",
      }),
    ).rejects.toThrow("Transición de estado no permitida");
  });

  it("rejects same-status transition (no-op)", async () => {
    const db = createMockDb({
      booking: makeBooking({ status: "confirmed" }),
    });
    const caller = authedCaller(db);

    await expect(
      caller.booking.updateStatus({
        facilityId: FACILITY_ID,
        id: BOOKING_ID,
        status: "confirmed",
      }),
    ).rejects.toThrow("Transición de estado no permitida");
  });

  // ---- Side effects ----

  it("sets cancelledBy='owner' when transitioning to cancelled", async () => {
    const booking = makeBooking({ status: "confirmed" });
    const db = createMockDb({ booking });
    db._updateReturningFn.mockResolvedValue([
      { ...booking, status: "cancelled" },
    ]);
    const caller = authedCaller(db);

    await caller.booking.updateStatus({
      facilityId: FACILITY_ID,
      id: BOOKING_ID,
      status: "cancelled",
    });

    expect(db._updateSetFn).toHaveBeenCalledWith(
      expect.objectContaining({
        cancelledBy: "owner",
      }),
    );
  });

  it("sets confirmedAt when transitioning to confirmed", async () => {
    const booking = makeBooking({ status: "pending", confirmedAt: null });
    const db = createMockDb({ booking });
    db._updateReturningFn.mockResolvedValue([
      { ...booking, status: "confirmed" },
    ]);
    const caller = authedCaller(db);

    await caller.booking.updateStatus({
      facilityId: FACILITY_ID,
      id: BOOKING_ID,
      status: "confirmed",
    });

    expect(db._updateSetFn).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "confirmed",
        confirmedAt: expect.any(Date),
      }),
    );
  });

  it("throws NOT_FOUND for non-existent booking", async () => {
    const db = createMockDb({ booking: null });
    const caller = authedCaller(db);

    await expect(
      caller.booking.updateStatus({
        facilityId: FACILITY_ID,
        id: BOOKING_ID,
        status: "confirmed",
      }),
    ).rejects.toThrow("Reserva no encontrada");
  });
});
