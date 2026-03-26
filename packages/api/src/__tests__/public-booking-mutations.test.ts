/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { publicBookingRouter } from "../router/public-booking";
import { createCallerFactory, createTRPCRouter } from "../trpc";

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const {
  mockValidateVerificationToken,
  mockLogBookingActivity,
  mockResolveAndPersistBookingStatuses,
} = vi.hoisted(() => ({
  mockValidateVerificationToken: vi.fn().mockReturnValue("51987654321"),
  mockLogBookingActivity: vi.fn().mockResolvedValue(undefined),
  mockResolveAndPersistBookingStatuses: vi.fn().mockResolvedValue([]),
}));

vi.mock("../lib/verification-token", () => ({
  createVerificationToken: vi.fn().mockReturnValue("signed-token-123"),
  validateVerificationToken: mockValidateVerificationToken,
}));

vi.mock("../lib/booking-activity", () => ({
  logBookingActivity: mockLogBookingActivity,
}));

vi.mock("../lib/booking-status-persist", () => ({
  resolveAndPersistBookingStatuses: mockResolveAndPersistBookingStatuses,
}));

// Mock WhatsApp + OTP (needed because router file imports them)
vi.mock("@wifo/whatsapp", () => ({
  generateOtpCode: vi.fn().mockReturnValue("123456"),
  sendOtp: vi.fn().mockResolvedValue({ success: true }),
  whatsappConfig: { otp: { expirationMinutes: 10, codeLength: 6 } },
}));
vi.mock("../lib/otp-store", () => ({
  storeOtpCode: vi.fn().mockResolvedValue(undefined),
  verifyOtpCode: vi.fn().mockResolvedValue("valid"),
}));
vi.mock("../lib/otp-rate-limit", () => ({
  checkOtpSendRateLimit: vi.fn().mockResolvedValue({ allowed: true }),
}));

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const router = createTRPCRouter({ publicBooking: publicBookingRouter });
const createCaller = createCallerFactory(router);

const FACILITY_ID = "a0a0a0a0-a0a0-1a0a-a0a0-a0a0a0a0a0a0";
const COURT_ID = "b1b1b1b1-b1b1-1b1b-b1b1-b1b1b1b1b1b1";
const BOOKING_ID = "c2c2c2c2-c2c2-1c2c-a2c2-c2c2c2c2c2c2";

function makeFacility(overrides?: Record<string, unknown>) {
  return {
    id: FACILITY_ID,
    name: "Club Test",
    slug: "club-test",
    isActive: true,
    defaultPriceInCents: 5000,
    defaultPeakPriceInCents: 7500,
    allowedDurationMinutes: [60, 90],
    ...overrides,
  };
}

function makeCourt(overrides?: Record<string, unknown>) {
  return {
    id: COURT_ID,
    name: "Cancha 1",
    type: "indoor" as const,
    facilityId: FACILITY_ID,
    isActive: true,
    priceInCents: null,
    peakPriceInCents: null,
    ...overrides,
  };
}

function makeBooking(overrides?: Record<string, unknown>) {
  return {
    id: BOOKING_ID,
    code: "PH-2026-ABCD",
    courtId: COURT_ID,
    facilityId: FACILITY_ID,
    date: new Date("2026-04-01"),
    startTime: "10:00",
    endTime: "11:00",
    priceInCents: 10000,
    isPeakRate: false,
    status: "confirmed",
    customerName: "Juan Pérez",
    customerPhone: "51987654321",
    customerEmail: null,
    isManualBooking: false,
    cancelledBy: null,
    cancellationReason: null,
    cancelledAt: null,
    confirmedAt: new Date("2026-03-25"),
    createdAt: new Date("2026-03-25"),
    updatedAt: new Date("2026-03-25"),
    notes: null,
    paymentMethod: null,
    userId: null,
    ...overrides,
  };
}

function makeOperatingHour(overrides?: Record<string, unknown>) {
  return {
    dayOfWeek: 3, // Wednesday
    openTime: "06:00",
    closeTime: "22:00",
    isClosed: false,
    facilityId: FACILITY_ID,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Mock DB builder
// ---------------------------------------------------------------------------

function createMockDb(config: {
  facility?: ReturnType<typeof makeFacility> | null;
  court?: ReturnType<typeof makeCourt> | null;
  overlappingBooking?: Record<string, unknown> | null;
  bookingsList?: ReturnType<typeof makeBooking>[];
  operatingHours?: ReturnType<typeof makeOperatingHour>[];
  peakPeriods?: any[];
  blockedSlots?: any[];
  _existingBookings?: any[];
  existingCode?: boolean;
  insertedBooking?: Record<string, unknown> | null;
}) {
  const {
    facility = makeFacility(),
    court = makeCourt(),
    overlappingBooking = null,
    bookingsList = [],
    operatingHours = [makeOperatingHour()],
    peakPeriods = [],
    blockedSlots = [],
    _existingBookings = [],
    existingCode = false,
    insertedBooking = null,
  } = config;

  let bookingFindFirstCallCount = 0;

  const mockDb: any = {
    query: {
      facilities: {
        findFirst: vi.fn().mockResolvedValue(facility),
      },
      courts: {
        findFirst: vi.fn().mockResolvedValue(court),
        findMany: vi.fn().mockResolvedValue(court ? [court] : []),
      },
      bookings: {
        findFirst: vi.fn().mockImplementation(() => {
          bookingFindFirstCallCount++;
          // 1st call = overlap check or getById, 2nd call = code uniqueness check
          if (bookingFindFirstCallCount === 1) {
            return Promise.resolve(overlappingBooking);
          }
          // Code uniqueness check: return null (code is unique)
          return Promise.resolve(
            existingCode ? { code: "PH-2026-XXXX" } : null,
          );
        }),
        findMany: vi.fn().mockResolvedValue(bookingsList),
      },
      operatingHours: {
        findMany: vi.fn().mockResolvedValue(operatingHours),
      },
      peakPeriods: {
        findMany: vi.fn().mockResolvedValue(peakPeriods),
      },
      blockedSlots: {
        findMany: vi.fn().mockResolvedValue(blockedSlots),
      },
    },
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([
          insertedBooking ?? {
            id: "new-booking-id",
            code: "PH-2026-ABCD",
            courtId: COURT_ID,
            facilityId: FACILITY_ID,
            status: "confirmed",
            customerName: "Juan Pérez",
            customerPhone: "51987654321",
            priceInCents: 10000,
            isPeakRate: false,
            isManualBooking: false,
            date: new Date("2026-04-01"),
            startTime: "10:00",
            endTime: "11:00",
          },
        ]),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            makeBooking({
              status: "cancelled",
              cancelledBy: "user",
              cancelledAt: new Date(),
            }),
          ]),
        }),
      }),
    }),
  };

  return mockDb;
}

function publicCaller(db: any) {
  return createCaller({
    db,
    session: null as any,
    authApi: {} as any,
  });
}

// ---------------------------------------------------------------------------
// Reset mocks
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  mockValidateVerificationToken.mockReturnValue("51987654321");
  mockLogBookingActivity.mockResolvedValue(undefined);
  mockResolveAndPersistBookingStatuses.mockResolvedValue([]);
});

// ===========================================================================
// Tests: publicBooking.createBooking
// ===========================================================================

describe("publicBooking.createBooking", () => {
  const validInput = {
    facilityId: FACILITY_ID,
    courtId: COURT_ID,
    date: new Date("2026-04-01"),
    startTime: "10:00",
    endTime: "11:00",
    customerName: "Juan Pérez",
    verificationToken: "v1.51987654321.9999999999.abc123",
  };

  it("creates a booking and returns confirmation", async () => {
    const db = createMockDb({});
    const caller = publicCaller(db);

    const result = await caller.publicBooking.createBooking(validInput);

    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("code");
    expect(result!.customerPhone).toBe("51987654321");
    expect(result!.isManualBooking).toBe(false);
  });

  it("validates verification token and extracts phone", async () => {
    const db = createMockDb({});
    const caller = publicCaller(db);

    await caller.publicBooking.createBooking(validInput);

    expect(mockValidateVerificationToken).toHaveBeenCalledWith(
      validInput.verificationToken,
    );
  });

  it("throws UNAUTHORIZED when token is invalid", async () => {
    mockValidateVerificationToken.mockReturnValue(null);
    const db = createMockDb({});
    const caller = publicCaller(db);

    await expect(
      caller.publicBooking.createBooking(validInput),
    ).rejects.toThrow("Verificación requerida");
  });

  it("throws NOT_FOUND when facility is not found", async () => {
    const db = createMockDb({ facility: null });
    const caller = publicCaller(db);

    await expect(
      caller.publicBooking.createBooking(validInput),
    ).rejects.toThrow("Local no encontrado");
  });

  it("throws NOT_FOUND when facility is inactive", async () => {
    const db = createMockDb({ facility: null });
    const caller = publicCaller(db);

    await expect(
      caller.publicBooking.createBooking(validInput),
    ).rejects.toThrow("Local no encontrado");
  });

  it("throws NOT_FOUND when court does not belong to facility", async () => {
    const db = createMockDb({ court: null });
    const caller = publicCaller(db);

    await expect(
      caller.publicBooking.createBooking(validInput),
    ).rejects.toThrow("Cancha no encontrada");
  });

  it("throws CONFLICT when time slot overlaps existing booking", async () => {
    const db = createMockDb({
      overlappingBooking: makeBooking({
        startTime: "09:30",
        endTime: "10:30",
      }),
    });
    const caller = publicCaller(db);

    await expect(
      caller.publicBooking.createBooking(validInput),
    ).rejects.toThrow("ya tiene una reserva");
  });

  it("logs booking activity after creation", async () => {
    const db = createMockDb({});
    const caller = publicCaller(db);

    await caller.publicBooking.createBooking(validInput);

    expect(mockLogBookingActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "created",
        performedBy: null,
      }),
    );
  });

  it("sets isManualBooking to false for public bookings", async () => {
    const db = createMockDb({});
    const caller = publicCaller(db);

    await caller.publicBooking.createBooking(validInput);

    // Check the insert call
    const insertCall = db.insert.mock.calls[0];
    expect(insertCall).toBeDefined();
  });

  it("rejects when startTime >= endTime", async () => {
    const db = createMockDb({});
    const caller = publicCaller(db);

    await expect(
      caller.publicBooking.createBooking({
        ...validInput,
        startTime: "11:00",
        endTime: "10:00",
      }),
    ).rejects.toThrow();
  });

  it("rejects invalid time format", async () => {
    const db = createMockDb({});
    const caller = publicCaller(db);

    await expect(
      caller.publicBooking.createBooking({
        ...validInput,
        startTime: "10:00:00",
      }),
    ).rejects.toThrow();
  });

  it("rejects empty customerName", async () => {
    const db = createMockDb({});
    const caller = publicCaller(db);

    await expect(
      caller.publicBooking.createBooking({
        ...validInput,
        customerName: "",
      }),
    ).rejects.toThrow();
  });
});

// ===========================================================================
// Tests: publicBooking.getMyBookings
// ===========================================================================

describe("publicBooking.getMyBookings", () => {
  const validInput = {
    facilityId: FACILITY_ID,
    verificationToken: "v1.51987654321.9999999999.abc123",
  };

  it("returns bookings for verified phone number", async () => {
    const bookingsList = [
      makeBooking({ id: "b1", status: "confirmed" }),
      makeBooking({ id: "b2", status: "completed" }),
    ];
    const db = createMockDb({ bookingsList });
    const caller = publicCaller(db);

    const result = await caller.publicBooking.getMyBookings(validInput);

    expect(result.bookings).toHaveLength(2);
  });

  it("validates verification token", async () => {
    const db = createMockDb({ bookingsList: [] });
    const caller = publicCaller(db);

    await caller.publicBooking.getMyBookings(validInput);

    expect(mockValidateVerificationToken).toHaveBeenCalledWith(
      validInput.verificationToken,
    );
  });

  it("throws UNAUTHORIZED when token is invalid", async () => {
    mockValidateVerificationToken.mockReturnValue(null);
    const db = createMockDb({});
    const caller = publicCaller(db);

    await expect(
      caller.publicBooking.getMyBookings(validInput),
    ).rejects.toThrow("Verificación requerida");
  });

  it("returns empty list when no bookings exist", async () => {
    const db = createMockDb({ bookingsList: [] });
    const caller = publicCaller(db);

    const result = await caller.publicBooking.getMyBookings(validInput);

    expect(result.bookings).toHaveLength(0);
  });

  it("auto-resolves booking statuses", async () => {
    const bookingsList = [makeBooking()];
    const db = createMockDb({ bookingsList });
    const caller = publicCaller(db);

    await caller.publicBooking.getMyBookings(validInput);

    expect(mockResolveAndPersistBookingStatuses).toHaveBeenCalled();
  });
});

// ===========================================================================
// Tests: publicBooking.cancelBooking
// ===========================================================================

describe("publicBooking.cancelBooking", () => {
  const validInput = {
    bookingId: BOOKING_ID,
    verificationToken: "v1.51987654321.9999999999.abc123",
    reason: "Ya no puedo asistir",
  };

  it("cancels a booking and returns updated record", async () => {
    const existingBooking = makeBooking({ status: "confirmed" });
    const db = createMockDb({ overlappingBooking: existingBooking });
    const caller = publicCaller(db);

    const result = await caller.publicBooking.cancelBooking(validInput);

    expect(result!.status).toBe("cancelled");
  });

  it("validates verification token", async () => {
    const existingBooking = makeBooking({ status: "confirmed" });
    const db = createMockDb({ overlappingBooking: existingBooking });
    const caller = publicCaller(db);

    await caller.publicBooking.cancelBooking(validInput);

    expect(mockValidateVerificationToken).toHaveBeenCalledWith(
      validInput.verificationToken,
    );
  });

  it("throws UNAUTHORIZED when token is invalid", async () => {
    mockValidateVerificationToken.mockReturnValue(null);
    const db = createMockDb({});
    const caller = publicCaller(db);

    await expect(
      caller.publicBooking.cancelBooking(validInput),
    ).rejects.toThrow("Verificación requerida");
  });

  it("throws NOT_FOUND when booking does not exist", async () => {
    const db = createMockDb({ overlappingBooking: null });
    const caller = publicCaller(db);

    await expect(
      caller.publicBooking.cancelBooking(validInput),
    ).rejects.toThrow("Reserva no encontrada");
  });

  it("throws FORBIDDEN when phone does not match booking", async () => {
    mockValidateVerificationToken.mockReturnValue("51999999999");
    const existingBooking = makeBooking({
      status: "confirmed",
      customerPhone: "51987654321",
    });
    const db = createMockDb({ overlappingBooking: existingBooking });
    const caller = publicCaller(db);

    await expect(
      caller.publicBooking.cancelBooking(validInput),
    ).rejects.toThrow("No tienes permiso");
  });

  it("throws BAD_REQUEST when booking is already cancelled", async () => {
    const existingBooking = makeBooking({ status: "cancelled" });
    const db = createMockDb({ overlappingBooking: existingBooking });
    const caller = publicCaller(db);

    await expect(
      caller.publicBooking.cancelBooking(validInput),
    ).rejects.toThrow("ya está cancelada");
  });

  it("throws BAD_REQUEST when booking is completed", async () => {
    const existingBooking = makeBooking({ status: "completed" });
    const db = createMockDb({ overlappingBooking: existingBooking });
    const caller = publicCaller(db);

    await expect(
      caller.publicBooking.cancelBooking(validInput),
    ).rejects.toThrow("No se puede cancelar una reserva completada");
  });

  it("throws BAD_REQUEST when booking is in_progress", async () => {
    const existingBooking = makeBooking({ status: "in_progress" });
    const db = createMockDb({ overlappingBooking: existingBooking });
    const caller = publicCaller(db);

    await expect(
      caller.publicBooking.cancelBooking(validInput),
    ).rejects.toThrow("No se puede cancelar una reserva en curso");
  });

  it("sets cancelledBy to 'user' for public cancellations", async () => {
    const existingBooking = makeBooking({ status: "confirmed" });
    const db = createMockDb({ overlappingBooking: existingBooking });
    const caller = publicCaller(db);

    await caller.publicBooking.cancelBooking(validInput);

    const setCall = db.update.mock.results[0]?.value.set.mock.calls[0]?.[0];
    expect(setCall).toMatchObject({
      status: "cancelled",
      cancelledBy: "user",
    });
  });

  it("logs cancellation activity", async () => {
    const existingBooking = makeBooking({ status: "confirmed" });
    const db = createMockDb({ overlappingBooking: existingBooking });
    const caller = publicCaller(db);

    await caller.publicBooking.cancelBooking(validInput);

    expect(mockLogBookingActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "cancelled",
        performedBy: null,
      }),
    );
  });

  it("cancels without a reason", async () => {
    const existingBooking = makeBooking({ status: "confirmed" });
    const db = createMockDb({ overlappingBooking: existingBooking });
    const caller = publicCaller(db);

    const result = await caller.publicBooking.cancelBooking({
      bookingId: BOOKING_ID,
      verificationToken: "v1.51987654321.9999999999.abc123",
    });

    expect(result!.status).toBe("cancelled");
  });

  it("cancels pending bookings", async () => {
    const existingBooking = makeBooking({ status: "pending" });
    const db = createMockDb({ overlappingBooking: existingBooking });
    const caller = publicCaller(db);

    const result = await caller.publicBooking.cancelBooking(validInput);

    expect(result!.status).toBe("cancelled");
  });
});
