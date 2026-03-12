/* eslint-disable @typescript-eslint/no-unsafe-assignment -- vitest mock types (vi.fn, expect.objectContaining) are inherently `any` */
/* eslint-disable @typescript-eslint/no-explicit-any -- mock db/session types */
import { describe, expect, it, vi } from "vitest";

import { scheduleRouter } from "../router/schedule";
import { createCallerFactory, createTRPCRouter } from "../trpc";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FACILITY_ID = "20000000-0000-4000-8000-000000000001";
const PERIOD_ID = "20000000-0000-4000-8000-000000000010";
const USER_ID = "20000000-0000-4000-8000-000000000020";
const ORG_ID = "20000000-0000-4000-8000-000000000030";
const COURT_ID = "20000000-0000-4000-8000-000000000040";
const BLOCKED_SLOT_ID = "20000000-0000-4000-8000-000000000050";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const router = createTRPCRouter({ schedule: scheduleRouter });
const createCaller = createCallerFactory(router);

function makePeakPeriod(
  overrides?: Partial<{
    id: string;
    facilityId: string;
    name: string;
    daysOfWeek: number[];
    startTime: string;
    endTime: string;
    markupPercent: number;
    isActive: boolean;
  }>,
) {
  return {
    id: overrides?.id ?? PERIOD_ID,
    facilityId: overrides?.facilityId ?? FACILITY_ID,
    name: overrides?.name ?? "Hora Pico",
    daysOfWeek: overrides?.daysOfWeek ?? [1, 2, 3, 4, 5],
    startTime: overrides?.startTime ?? "18:00",
    endTime: overrides?.endTime ?? "21:00",
    markupPercent: overrides?.markupPercent ?? 25,
    isActive: overrides?.isActive ?? true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function makeOperatingHour(dayOfWeek: number, isClosed = false) {
  return {
    id: `oh-${dayOfWeek}`,
    facilityId: FACILITY_ID,
    dayOfWeek,
    openTime: "08:00",
    closeTime: "22:00",
    isClosed,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function makeCallerMembership() {
  return {
    id: "caller-mem",
    organizationId: ORG_ID,
    userId: USER_ID,
    role: "org_admin",
    facilityIds: [],
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

// ---------------------------------------------------------------------------
// Mock DB builder
// ---------------------------------------------------------------------------

interface MockDbOpts {
  existingPeriod?: ReturnType<typeof makePeakPeriod> | null;
  operatingHours?: ReturnType<typeof makeOperatingHour>[];
  updatedPeriod?: ReturnType<typeof makePeakPeriod> | null;
}

function createMockDb(opts?: MockDbOpts) {
  const callerMembership = makeCallerMembership();
  const existingPeriod =
    opts?.existingPeriod !== undefined ? opts.existingPeriod : makePeakPeriod();
  const operatingHours =
    opts?.operatingHours ??
    Array.from({ length: 7 }, (_, i) => makeOperatingHour(i));
  const updatedPeriod =
    opts?.updatedPeriod !== undefined ? opts.updatedPeriod : existingPeriod;

  // Track findFirst calls by table
  const peakPeriodsFindFirst = vi.fn().mockResolvedValue(existingPeriod);

  // db.update().set().where().returning() chain
  const updateReturningFn = vi.fn().mockResolvedValue([updatedPeriod]);
  const updateWhereFn = vi
    .fn()
    .mockReturnValue({ returning: updateReturningFn });
  const updateSetFn = vi.fn().mockReturnValue({ where: updateWhereFn });

  return {
    query: {
      organizationMembers: {
        findFirst: vi.fn().mockResolvedValue(callerMembership),
      },
      facilities: {
        findFirst: vi.fn().mockResolvedValue({
          id: FACILITY_ID,
          organizationId: ORG_ID,
        }),
      },
      peakPeriods: {
        findFirst: peakPeriodsFindFirst,
      },
      operatingHours: {
        findMany: vi.fn().mockResolvedValue(operatingHours),
      },
    },
    update: vi.fn().mockReturnValue({ set: updateSetFn }),
    _updateReturningFn: updateReturningFn,
    _peakPeriodsFindFirst: peakPeriodsFindFirst,
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
// Tests
// ===========================================================================

// ---------------------------------------------------------------------------
// Blocked Slots Mock DB builder
// ---------------------------------------------------------------------------

function makeBooking(
  overrides?: Partial<{
    id: string;
    code: string;
    courtId: string;
    startTime: string;
    endTime: string;
    customerName: string;
    status: string;
  }>,
) {
  return {
    id: overrides?.id ?? "booking-1",
    code: overrides?.code ?? "BK-001",
    facilityId: FACILITY_ID,
    courtId: overrides?.courtId ?? COURT_ID,
    date: new Date("2026-03-15"),
    startTime: overrides?.startTime ?? "10:00",
    endTime: overrides?.endTime ?? "11:00",
    customerName: overrides?.customerName ?? "Juan",
    status: overrides?.status ?? "confirmed",
    court: { name: "Cancha 1" },
  };
}

function makeBlockedSlot(
  overrides?: Partial<{
    id: string;
    courtId: string | null;
    reason: string;
    notes: string | null;
  }>,
) {
  const courtId =
    overrides && "courtId" in overrides ? overrides.courtId : COURT_ID;
  return {
    id: overrides?.id ?? BLOCKED_SLOT_ID,
    facilityId: FACILITY_ID,
    courtId,
    date: new Date("2026-03-15"),
    startTime: "10:00",
    endTime: "12:00",
    reason: overrides?.reason ?? "maintenance",
    notes: overrides?.notes ?? null,
    court: courtId === null ? null : { name: "Cancha 1" },
    creator: { name: "Admin" },
    createdAt: new Date(),
  };
}

interface BlockMockDbOpts {
  bookings?: ReturnType<typeof makeBooking>[];
  blockedSlots?: ReturnType<typeof makeBlockedSlot>[];
  existingSlot?: ReturnType<typeof makeBlockedSlot> | null;
  courts?: {
    id: string;
    facilityId: string;
    name: string;
    isActive: boolean;
  }[];
}

function createBlockMockDb(opts?: BlockMockDbOpts) {
  const callerMembership = makeCallerMembership();
  const existingSlot =
    opts?.existingSlot !== undefined ? opts.existingSlot : makeBlockedSlot();

  const insertReturningFn = vi.fn().mockResolvedValue([makeBlockedSlot()]);
  const insertValuesFn = vi
    .fn()
    .mockReturnValue({ returning: insertReturningFn });

  const deleteFn = vi.fn().mockReturnValue({
    where: vi.fn().mockResolvedValue(undefined),
  });

  return {
    query: {
      organizationMembers: {
        findFirst: vi.fn().mockResolvedValue(callerMembership),
      },
      facilities: {
        findFirst: vi.fn().mockResolvedValue({
          id: FACILITY_ID,
          organizationId: ORG_ID,
        }),
      },
      bookings: {
        findMany: vi.fn().mockResolvedValue(opts?.bookings ?? []),
      },
      blockedSlots: {
        findMany: vi.fn().mockResolvedValue(opts?.blockedSlots ?? []),
        findFirst: vi.fn().mockResolvedValue(existingSlot),
      },
      courts: {
        findFirst: vi.fn().mockResolvedValue(
          opts?.courts?.[0] ?? {
            id: COURT_ID,
            facilityId: FACILITY_ID,
            name: "Cancha 1",
            isActive: true,
          },
        ),
      },
    },
    insert: vi.fn().mockReturnValue({ values: insertValuesFn }),
    delete: deleteFn,
    _insertReturningFn: insertReturningFn,
  };
}

type BlockMockDb = ReturnType<typeof createBlockMockDb>;

function blockAuthedCaller(db: BlockMockDb) {
  return createCaller({
    db: db as any,
    session: { user: { id: USER_ID, email: "test@test.com" } } as any,
    authApi: {} as any,
  });
}

// ===========================================================================
// Tests: checkBlockConflicts
// ===========================================================================

describe("schedule.checkBlockConflicts", () => {
  it("returns empty when no conflicting bookings", async () => {
    const db = createBlockMockDb({ bookings: [] });
    const caller = blockAuthedCaller(db);

    const result = await caller.schedule.checkBlockConflicts({
      facilityId: FACILITY_ID,
      courtIds: [COURT_ID],
      date: new Date("2026-03-15"),
      startTime: "10:00",
      endTime: "12:00",
    });

    expect(result.count).toBe(0);
    expect(result.bookings).toHaveLength(0);
  });

  it("returns conflicting bookings", async () => {
    const conflicting = [
      makeBooking({ startTime: "10:00", endTime: "11:00" }),
      makeBooking({
        id: "booking-2",
        code: "BK-002",
        startTime: "11:00",
        endTime: "12:00",
      }),
    ];
    const db = createBlockMockDb({ bookings: conflicting });
    const caller = blockAuthedCaller(db);

    const result = await caller.schedule.checkBlockConflicts({
      facilityId: FACILITY_ID,
      courtIds: [COURT_ID],
      date: new Date("2026-03-15"),
      startTime: "10:00",
      endTime: "12:00",
    });

    expect(result.count).toBe(2);
    expect(result.bookings).toHaveLength(2);
    expect(result.bookings[0]?.code).toBe("BK-001");
  });
});

// ===========================================================================
// Tests: listBlockedSlots
// ===========================================================================

describe("schedule.listBlockedSlots", () => {
  it("returns all blocked slots for a facility", async () => {
    const slots = [
      makeBlockedSlot({ id: "slot-1" }),
      makeBlockedSlot({ id: "slot-2", courtId: null }),
    ];
    const db = createBlockMockDb({ blockedSlots: slots });
    const caller = blockAuthedCaller(db);

    const result = await caller.schedule.listBlockedSlots({
      facilityId: FACILITY_ID,
    });

    expect(result).toHaveLength(2);
    expect(result[0]?.id).toBe("slot-1");
    expect(result[1]?.courtId).toBeNull();
  });

  it("returns empty array when no blocked slots exist", async () => {
    const db = createBlockMockDb({ blockedSlots: [] });
    const caller = blockAuthedCaller(db);

    const result = await caller.schedule.listBlockedSlots({
      facilityId: FACILITY_ID,
    });

    expect(result).toHaveLength(0);
  });
});

// ===========================================================================
// Tests: blockTimeSlot
// ===========================================================================

describe("schedule.blockTimeSlot", () => {
  it("creates a blocked slot for a specific court", async () => {
    const db = createBlockMockDb();
    const caller = blockAuthedCaller(db);

    const result = await caller.schedule.blockTimeSlot({
      facilityId: FACILITY_ID,
      courtId: COURT_ID,
      date: new Date("2026-03-15"),
      startTime: "10:00",
      endTime: "12:00",
      reason: "maintenance",
      notes: "Reparación de red",
    });

    expect(result).toBeDefined();
    expect(db.insert).toHaveBeenCalled();
  });

  it("creates a blocked slot for all courts (null courtId)", async () => {
    const db = createBlockMockDb();
    const caller = blockAuthedCaller(db);

    const result = await caller.schedule.blockTimeSlot({
      facilityId: FACILITY_ID,
      courtId: null,
      date: new Date("2026-03-15"),
      startTime: "10:00",
      endTime: "12:00",
      reason: "weather",
    });

    expect(result).toBeDefined();
  });

  it("throws NOT_FOUND when court does not belong to facility", async () => {
    const db = createBlockMockDb();
    db.query.courts.findFirst.mockResolvedValue(null);
    const caller = blockAuthedCaller(db);

    await expect(
      caller.schedule.blockTimeSlot({
        facilityId: FACILITY_ID,
        courtId: COURT_ID,
        date: new Date("2026-03-15"),
        startTime: "10:00",
        endTime: "12:00",
        reason: "maintenance",
      }),
    ).rejects.toThrow("Cancha no encontrada en este local");
  });
});

// ===========================================================================
// Tests: deleteBlockedSlot
// ===========================================================================

describe("schedule.deleteBlockedSlot", () => {
  it("deletes a blocked slot", async () => {
    const db = createBlockMockDb();
    const caller = blockAuthedCaller(db);

    const result = await caller.schedule.deleteBlockedSlot({
      id: BLOCKED_SLOT_ID,
    });

    expect(result.success).toBe(true);
    expect(db.delete).toHaveBeenCalled();
  });

  it("throws NOT_FOUND when slot does not exist", async () => {
    const db = createBlockMockDb({ existingSlot: null });
    const caller = blockAuthedCaller(db);

    await expect(
      caller.schedule.deleteBlockedSlot({ id: BLOCKED_SLOT_ID }),
    ).rejects.toThrow("Bloqueo no encontrado");
  });
});

// ===========================================================================
// Tests: updatePeakPeriod
// ===========================================================================

describe("schedule.updatePeakPeriod", () => {
  it("updates a peak period with partial fields (name only)", async () => {
    const updated = makePeakPeriod({ name: "Noche" });
    const db = createMockDb({ updatedPeriod: updated });
    const caller = authedCaller(db);

    const result = await caller.schedule.updatePeakPeriod({
      facilityId: FACILITY_ID,
      id: PERIOD_ID,
      name: "Noche",
    });

    expect(result).toBeDefined();
    expect(result.name).toBe("Noche");
  });

  it("updates markup percent", async () => {
    const updated = makePeakPeriod({ markupPercent: 50 });
    const db = createMockDb({ updatedPeriod: updated });
    const caller = authedCaller(db);

    const result = await caller.schedule.updatePeakPeriod({
      facilityId: FACILITY_ID,
      id: PERIOD_ID,
      markupPercent: 50,
    });

    expect(result.markupPercent).toBe(50);
  });

  it("updates time range", async () => {
    const updated = makePeakPeriod({ startTime: "19:00", endTime: "22:00" });
    const db = createMockDb({ updatedPeriod: updated });
    const caller = authedCaller(db);

    const result = await caller.schedule.updatePeakPeriod({
      facilityId: FACILITY_ID,
      id: PERIOD_ID,
      startTime: "19:00",
      endTime: "22:00",
    });

    expect(result).toBeDefined();
  });

  it("updates days of week", async () => {
    const updated = makePeakPeriod({ daysOfWeek: [6, 0] });
    const db = createMockDb({ updatedPeriod: updated });
    const caller = authedCaller(db);

    const result = await caller.schedule.updatePeakPeriod({
      facilityId: FACILITY_ID,
      id: PERIOD_ID,
      daysOfWeek: [6, 0],
    });

    expect(result).toBeDefined();
  });

  it("throws NOT_FOUND when period does not exist", async () => {
    const db = createMockDb({ existingPeriod: null });
    const caller = authedCaller(db);

    await expect(
      caller.schedule.updatePeakPeriod({
        facilityId: FACILITY_ID,
        id: PERIOD_ID,
        name: "Noche",
      }),
    ).rejects.toThrow("Periodo pico no encontrado");
  });

  it("throws NOT_FOUND when period belongs to different facility", async () => {
    const otherPeriod = makePeakPeriod({
      facilityId: "99999999-0000-4000-8000-000000000099",
    });
    const db = createMockDb({ existingPeriod: otherPeriod });
    // findFirst with AND condition will match on id + facilityId, so mock returns null
    db.query.peakPeriods.findFirst.mockResolvedValue(null);
    const caller = authedCaller(db);

    await expect(
      caller.schedule.updatePeakPeriod({
        facilityId: FACILITY_ID,
        id: PERIOD_ID,
        name: "Noche",
      }),
    ).rejects.toThrow("Periodo pico no encontrado");
  });

  it("throws BAD_REQUEST when endTime <= startTime", async () => {
    const db = createMockDb();
    const caller = authedCaller(db);

    await expect(
      caller.schedule.updatePeakPeriod({
        facilityId: FACILITY_ID,
        id: PERIOD_ID,
        startTime: "20:00",
        endTime: "18:00",
      }),
    ).rejects.toThrow(
      "La hora de fin debe ser posterior a la hora de inicio del periodo pico",
    );
  });

  it("throws BAD_REQUEST when endTime equals startTime", async () => {
    const db = createMockDb();
    const caller = authedCaller(db);

    await expect(
      caller.schedule.updatePeakPeriod({
        facilityId: FACILITY_ID,
        id: PERIOD_ID,
        startTime: "18:00",
        endTime: "18:00",
      }),
    ).rejects.toThrow(
      "La hora de fin debe ser posterior a la hora de inicio del periodo pico",
    );
  });

  it("throws BAD_REQUEST when day is closed", async () => {
    const hours = Array.from({ length: 7 }, (_, i) =>
      makeOperatingHour(i, i === 0),
    );
    const db = createMockDb({ operatingHours: hours });
    const caller = authedCaller(db);

    await expect(
      caller.schedule.updatePeakPeriod({
        facilityId: FACILITY_ID,
        id: PERIOD_ID,
        daysOfWeek: [0], // Sunday is closed
      }),
    ).rejects.toThrow("el local está cerrado ese día");
  });

  it("throws BAD_REQUEST when peak period is outside operating hours", async () => {
    const hours = Array.from({ length: 7 }, (_, i) => ({
      ...makeOperatingHour(i),
      openTime: "10:00",
      closeTime: "20:00",
    }));
    const db = createMockDb({ operatingHours: hours });
    const caller = authedCaller(db);

    await expect(
      caller.schedule.updatePeakPeriod({
        facilityId: FACILITY_ID,
        id: PERIOD_ID,
        startTime: "09:00",
        endTime: "12:00",
      }),
    ).rejects.toThrow("debe estar dentro del horario de operación");
  });

  it("validates merged fields when only startTime is updated", async () => {
    // Existing period: 18:00-21:00, update startTime to 22:00 → endTime 21:00 < 22:00
    const existing = makePeakPeriod({ startTime: "18:00", endTime: "21:00" });
    const db = createMockDb({ existingPeriod: existing });
    const caller = authedCaller(db);

    await expect(
      caller.schedule.updatePeakPeriod({
        facilityId: FACILITY_ID,
        id: PERIOD_ID,
        startTime: "22:00",
      }),
    ).rejects.toThrow(
      "La hora de fin debe ser posterior a la hora de inicio del periodo pico",
    );
  });

  it("validates merged fields when only endTime is updated", async () => {
    // Existing period: 18:00-21:00, update endTime to 17:00 → 17:00 < 18:00
    const existing = makePeakPeriod({ startTime: "18:00", endTime: "21:00" });
    const db = createMockDb({ existingPeriod: existing });
    const caller = authedCaller(db);

    await expect(
      caller.schedule.updatePeakPeriod({
        facilityId: FACILITY_ID,
        id: PERIOD_ID,
        endTime: "17:00",
      }),
    ).rejects.toThrow(
      "La hora de fin debe ser posterior a la hora de inicio del periodo pico",
    );
  });

  it("uses existing days when daysOfWeek not provided", async () => {
    // Existing period has days [1,2,3,4,5], only updating name
    const existing = makePeakPeriod({ daysOfWeek: [1, 2, 3, 4, 5] });
    const updated = makePeakPeriod({
      daysOfWeek: [1, 2, 3, 4, 5],
      name: "Renamed",
    });
    const db = createMockDb({
      existingPeriod: existing,
      updatedPeriod: updated,
    });
    const caller = authedCaller(db);

    const result = await caller.schedule.updatePeakPeriod({
      facilityId: FACILITY_ID,
      id: PERIOD_ID,
      name: "Renamed",
    });

    expect(result.name).toBe("Renamed");
  });

  it("returns the updated peak period", async () => {
    const updated = makePeakPeriod({
      name: "Fin de Semana",
      daysOfWeek: [6, 0],
      startTime: "10:00",
      endTime: "14:00",
      markupPercent: 40,
    });
    const db = createMockDb({ updatedPeriod: updated });
    const caller = authedCaller(db);

    const result = await caller.schedule.updatePeakPeriod({
      facilityId: FACILITY_ID,
      id: PERIOD_ID,
      name: "Fin de Semana",
      daysOfWeek: [6, 0],
      startTime: "10:00",
      endTime: "14:00",
      markupPercent: 40,
    });

    expect(result).toEqual(
      expect.objectContaining({
        id: PERIOD_ID,
        name: "Fin de Semana",
        daysOfWeek: [6, 0],
        startTime: "10:00",
        endTime: "14:00",
        markupPercent: 40,
      }),
    );
  });
});
