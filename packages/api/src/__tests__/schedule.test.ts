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
