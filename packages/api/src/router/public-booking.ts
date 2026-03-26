import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { addDays, startOfDay } from "date-fns";
import { and, desc, eq, gt, gte, lt, ne } from "drizzle-orm";
import { z } from "zod/v4";

import type { db as drizzleDb } from "@wifo/db/client";
import {
  blockedSlots,
  bookingPlayers,
  bookings,
  courts,
  facilities,
  operatingHours,
  peakPeriods,
} from "@wifo/db/schema";
import { generateOtpCode, sendOtp, whatsappConfig } from "@wifo/whatsapp";

import type {
  ScheduleConfig,
  SlotCourtPricing,
  SlotFacilityDefaults,
} from "../utils/schedule";
import { logBookingActivity } from "../lib/booking-activity";
import { resolveAndPersistBookingStatuses } from "../lib/booking-status-persist";
import { checkOtpSendRateLimit } from "../lib/otp-rate-limit";
import { storeOtpCode, verifyOtpCode } from "../lib/otp-store";
import {
  createVerificationToken,
  validateVerificationToken,
} from "../lib/verification-token";
import { publicProcedure } from "../trpc";
import {
  getLimaDayOfWeek,
  getRateForSlot,
  getTimeZoneWithMarkup,
  parseTimeToMinutes,
} from "../utils/schedule";
import { getAvailableSlots } from "../utils/slots";

// =============================================================================
// Input Schemas
// =============================================================================

const getFacilitySchema = z.object({
  slug: z.string().min(1),
});

const getAvailableSlotsSchema = z.object({
  slug: z.string().min(1),
  date: z.date(),
});

const calculatePriceSchema = z.object({
  facilityId: z.string().uuid(),
  courtId: z.string().uuid(),
  date: z.date(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
});

const sendOtpSchema = z.object({
  phone: z.string().regex(/^\d{8,15}$/, "Número de teléfono inválido"),
});

const verifyOtpSchema = z.object({
  phone: z.string().regex(/^\d{8,15}$/, "Número de teléfono inválido"),
  code: z.string().length(6, "El código debe tener 6 dígitos"),
});

const createBookingSchema = z
  .object({
    facilityId: z.string().uuid(),
    courtId: z.string().uuid(),
    date: z.date(),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
    customerName: z.string().min(1, "Nombre es requerido").max(100),
    verificationToken: z.string().min(1),
  })
  .refine((d) => d.startTime < d.endTime, {
    message: "La hora de inicio debe ser anterior a la hora de fin",
    path: ["startTime"],
  });

const getMyBookingsSchema = z.object({
  facilityId: z.string().uuid(),
  verificationToken: z.string().min(1),
});

const cancelBookingSchema = z.object({
  bookingId: z.string().uuid(),
  verificationToken: z.string().min(1),
  reason: z.string().max(500).optional(),
});

// =============================================================================
// Helpers
// =============================================================================

function calculateBookingPrice(
  startTime: string,
  endTime: string,
  dayOfWeek: number,
  dateStr: string,
  config: ScheduleConfig,
  courtPricing: SlotCourtPricing,
  facilityDefaults: SlotFacilityDefaults | null,
): {
  priceInCents: number;
  isPeakRate: boolean;
  slots: { time: string; zone: string; rateInCents: number }[];
} {
  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);

  let totalPrice = 0;
  let hasPeak = false;
  const slots: { time: string; zone: string; rateInCents: number }[] = [];

  for (let min = startMinutes; min < endMinutes; min += 30) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    const slotTime = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;

    const { zone } = getTimeZoneWithMarkup(
      slotTime,
      dayOfWeek,
      dateStr,
      config,
    );
    const rate = getRateForSlot(courtPricing, zone, facilityDefaults);

    if (zone === "peak") hasPeak = true;
    totalPrice += rate;
    slots.push({ time: slotTime, zone, rateInCents: rate });
  }

  return { priceInCents: totalPrice, isPeakRate: hasPeak, slots };
}

/**
 * Generate a unique booking code in format PH-YYYY-XXXX
 */
function generateBookingCode(): string {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PH-${year}-${random}`;
}

/**
 * Validate a verification token and extract the phone number.
 * Throws UNAUTHORIZED if invalid.
 */
function requireVerifiedPhone(token: string): string {
  const phone = validateVerificationToken(token);
  if (!phone) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message:
        "Verificación requerida. Por favor verifica tu número de teléfono.",
    });
  }
  return phone;
}

/** Format a Date to "YYYY-MM-DD" string. */
function toDateStr(date: Date): string {
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
}

// =============================================================================
// Shared: fetch schedule data for a facility + date
// =============================================================================

async function fetchScheduleData(
  db: typeof drizzleDb,
  facilityId: string,
  date: Date,
) {
  const dayStart = startOfDay(date);
  const dayEnd = startOfDay(addDays(date, 1));

  const [hoursList, periodsList, blockedSlotsList, bookingsList] =
    await Promise.all([
      db.query.operatingHours.findMany({
        where: eq(operatingHours.facilityId, facilityId),
      }),
      db.query.peakPeriods.findMany({
        where: and(
          eq(peakPeriods.facilityId, facilityId),
          eq(peakPeriods.isActive, true),
        ),
      }),
      db.query.blockedSlots.findMany({
        where: and(
          eq(blockedSlots.facilityId, facilityId),
          gte(blockedSlots.date, dayStart),
          lt(blockedSlots.date, dayEnd),
        ),
      }),
      db.query.bookings.findMany({
        where: and(
          eq(bookings.facilityId, facilityId),
          gte(bookings.date, dayStart),
          lt(bookings.date, dayEnd),
          ne(bookings.status, "cancelled"),
        ),
        columns: {
          courtId: true,
          startTime: true,
          endTime: true,
          status: true,
        },
      }),
    ]);

  const dateStr = toDateStr(date);

  const scheduleConfig: ScheduleConfig = {
    operatingHours: hoursList.map((h) => ({
      dayOfWeek: h.dayOfWeek,
      openTime: h.openTime.slice(0, 5),
      closeTime: h.closeTime.slice(0, 5),
      isClosed: h.isClosed,
    })),
    peakPeriods: periodsList.map((p) => ({
      daysOfWeek: p.daysOfWeek,
      startTime: p.startTime.slice(0, 5),
      endTime: p.endTime.slice(0, 5),
      markupPercent: p.markupPercent,
    })),
    blockedSlots: blockedSlotsList.map((b) => ({
      date: dateStr,
      startTime: b.startTime.slice(0, 5),
      endTime: b.endTime.slice(0, 5),
      courtId: b.courtId,
    })),
  };

  const existingBookings = bookingsList.map((b) => ({
    courtId: b.courtId,
    startTime: b.startTime.slice(0, 5),
    endTime: b.endTime.slice(0, 5),
    status: b.status,
  }));

  return { scheduleConfig, existingBookings, dateStr };
}

// =============================================================================
// Router
// =============================================================================

export const publicBookingRouter = {
  /**
   * Get facility info by slug (public).
   * Returns facility details + active courts for the booking page.
   */
  getFacility: publicProcedure
    .input(getFacilitySchema)
    .query(async ({ ctx, input }) => {
      const facility = await ctx.db.query.facilities.findFirst({
        where: and(
          eq(facilities.slug, input.slug),
          eq(facilities.isActive, true),
        ),
      });

      if (!facility) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Local no encontrado",
        });
      }

      const activeCourts = await ctx.db.query.courts.findMany({
        where: and(
          eq(courts.facilityId, facility.id),
          eq(courts.isActive, true),
        ),
        columns: {
          id: true,
          name: true,
          type: true,
        },
      });

      return {
        id: facility.id,
        name: facility.name,
        slug: facility.slug,
        description: facility.description,
        address: facility.address,
        district: facility.district,
        city: facility.city,
        phone: facility.phone,
        photos: facility.photos,
        amenities: facility.amenities,
        allowedDurationMinutes: facility.allowedDurationMinutes,
        courts: activeCourts,
      };
    }),

  /**
   * Get available booking slots for a facility on a given date (public).
   * Composes schedule utils + slot generation pure function.
   */
  getAvailableSlots: publicProcedure
    .input(getAvailableSlotsSchema)
    .query(async ({ ctx, input }) => {
      const facility = await ctx.db.query.facilities.findFirst({
        where: and(
          eq(facilities.slug, input.slug),
          eq(facilities.isActive, true),
        ),
      });

      if (!facility) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Local no encontrado",
        });
      }

      const activeCourts = await ctx.db.query.courts.findMany({
        where: and(
          eq(courts.facilityId, facility.id),
          eq(courts.isActive, true),
        ),
      });

      const dayOfWeek = getLimaDayOfWeek(input.date);
      const { scheduleConfig, existingBookings, dateStr } =
        await fetchScheduleData(ctx.db, facility.id, input.date);

      const slots = getAvailableSlots({
        date: dateStr,
        dayOfWeek,
        courts: activeCourts.map((c) => ({
          id: c.id,
          name: c.name,
          type: c.type,
          priceInCents: c.priceInCents ?? null,
          peakPriceInCents: c.peakPriceInCents ?? null,
        })),
        operatingHours: scheduleConfig.operatingHours,
        peakPeriods: scheduleConfig.peakPeriods,
        blockedSlots: scheduleConfig.blockedSlots,
        existingBookings,
        allowedDurations: facility.allowedDurationMinutes ?? [60, 90],
        facilityDefaults: {
          defaultPriceInCents: facility.defaultPriceInCents,
          defaultPeakPriceInCents: facility.defaultPeakPriceInCents,
        },
      });

      return {
        facilityId: facility.id,
        date: dateStr,
        slots,
      };
    }),

  /**
   * Calculate price for a specific court + time selection (public).
   * Used for price preview before booking.
   */
  calculatePrice: publicProcedure
    .input(calculatePriceSchema)
    .query(async ({ ctx, input }) => {
      const { facilityId, courtId, date, startTime, endTime } = input;

      const court = await ctx.db.query.courts.findFirst({
        where: and(eq(courts.id, courtId), eq(courts.facilityId, facilityId)),
      });

      if (!court) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Cancha no encontrada",
        });
      }

      const facility = await ctx.db.query.facilities.findFirst({
        where: eq(facilities.id, facilityId),
        columns: {
          defaultPriceInCents: true,
          defaultPeakPriceInCents: true,
        },
      });

      const dayOfWeek = getLimaDayOfWeek(date);
      const { scheduleConfig, dateStr } = await fetchScheduleData(
        ctx.db,
        facilityId,
        date,
      );

      const courtPricing: SlotCourtPricing = {
        priceInCents: court.priceInCents,
        peakPriceInCents: court.peakPriceInCents,
      };

      const facilityDefaults: SlotFacilityDefaults | null = facility
        ? {
            defaultPriceInCents: facility.defaultPriceInCents,
            defaultPeakPriceInCents: facility.defaultPeakPriceInCents,
          }
        : null;

      return calculateBookingPrice(
        startTime,
        endTime,
        dayOfWeek,
        dateStr,
        scheduleConfig,
        courtPricing,
        facilityDefaults,
      );
    }),

  /**
   * Send a WhatsApp OTP code for phone verification (public).
   * Rate-limited to 5 sends per phone per hour.
   */
  sendOtp: publicProcedure.input(sendOtpSchema).mutation(async ({ input }) => {
    const { phone } = input;

    // 1. Rate limit
    const rateLimit = await checkOtpSendRateLimit(phone);
    if (!rateLimit.allowed) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Demasiados intentos. Intenta de nuevo en ${rateLimit.retryAfterSeconds ?? 60} segundos.`,
      });
    }

    // 2. Generate and store code
    const code = generateOtpCode();
    await storeOtpCode(phone, code);

    // 3. Send via WhatsApp
    const result = await sendOtp({ phone, code });
    if (!result.success) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "No se pudo enviar el código. Intenta más tarde.",
      });
    }

    return {
      success: true as const,
      expiresInSeconds: whatsappConfig.otp.expirationMinutes * 60,
    };
  }),

  /**
   * Verify an OTP code and return a signed verification token (public).
   */
  verifyOtp: publicProcedure
    .input(verifyOtpSchema)
    .mutation(async ({ input }) => {
      const { phone, code } = input;

      const result = await verifyOtpCode(phone, code);

      switch (result) {
        case "expired":
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Código expirado o no encontrado. Solicita uno nuevo.",
          });
        case "max_attempts":
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "Demasiados intentos fallidos. Solicita un nuevo código.",
          });
        case "invalid":
          return { verified: false as const };
        case "valid": {
          const token = createVerificationToken(phone);
          return { verified: true as const, token };
        }
      }
    }),

  /**
   * Create a public booking (guest, no auth required).
   * Validates OTP verification token, checks for conflicts, calculates price.
   */
  createBooking: publicProcedure
    .input(createBookingSchema)
    .mutation(async ({ ctx, input }) => {
      const { facilityId, courtId, date, startTime, endTime, customerName } =
        input;

      // 1. Validate verification token → extract phone
      const customerPhone = requireVerifiedPhone(input.verificationToken);

      // 2. Verify facility exists and is active
      const facility = await ctx.db.query.facilities.findFirst({
        where: and(
          eq(facilities.id, facilityId),
          eq(facilities.isActive, true),
        ),
      });

      if (!facility) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Local no encontrado",
        });
      }

      // 3. Verify court belongs to facility
      const court = await ctx.db.query.courts.findFirst({
        where: and(eq(courts.id, courtId), eq(courts.facilityId, facilityId)),
      });

      if (!court) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Cancha no encontrada",
        });
      }

      // 4. Check for overlapping active bookings
      const dayStart = startOfDay(date);
      const dayEnd = startOfDay(addDays(date, 1));
      const overlapping = await ctx.db.query.bookings.findFirst({
        where: and(
          eq(bookings.courtId, courtId),
          gte(bookings.date, dayStart),
          lt(bookings.date, dayEnd),
          ne(bookings.status, "cancelled"),
          lt(bookings.startTime, endTime),
          gt(bookings.endTime, startTime),
        ),
      });

      if (overlapping) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `La cancha ya tiene una reserva de ${overlapping.startTime.slice(0, 5)} a ${overlapping.endTime.slice(0, 5)}`,
        });
      }

      // 5. Calculate price (server-side)
      const dayOfWeek = getLimaDayOfWeek(date);
      const { scheduleConfig, dateStr } = await fetchScheduleData(
        ctx.db,
        facilityId,
        date,
      );

      const courtPricing: SlotCourtPricing = {
        priceInCents: court.priceInCents,
        peakPriceInCents: court.peakPriceInCents,
      };

      const facilityDefaults: SlotFacilityDefaults = {
        defaultPriceInCents: facility.defaultPriceInCents,
        defaultPeakPriceInCents: facility.defaultPeakPriceInCents,
      };

      const { priceInCents, isPeakRate } = calculateBookingPrice(
        startTime,
        endTime,
        dayOfWeek,
        dateStr,
        scheduleConfig,
        courtPricing,
        facilityDefaults,
      );

      // 6. Generate unique booking code
      let code = generateBookingCode();
      let attempts = 0;
      while (attempts < 10) {
        const existing = await ctx.db.query.bookings.findFirst({
          where: eq(bookings.code, code),
        });
        if (!existing) break;
        code = generateBookingCode();
        attempts++;
      }

      // 7. Insert booking
      const [booking] = await ctx.db
        .insert(bookings)
        .values({
          code,
          courtId,
          facilityId,
          date,
          startTime,
          endTime,
          priceInCents,
          isPeakRate,
          customerName,
          customerPhone,
          isManualBooking: false,
          status: "confirmed",
          confirmedAt: new Date(),
        })
        .returning();

      if (booking) {
        // Add customer as owner player at position 1
        await ctx.db.insert(bookingPlayers).values({
          bookingId: booking.id,
          role: "owner",
          position: 1,
          guestName: customerName,
          guestPhone: customerPhone,
        });

        await logBookingActivity({
          db: ctx.db,
          bookingId: booking.id,
          type: "created",
          description: `Reserva online creada por ${customerName}`,
          performedBy: null,
        });
      }

      return booking;
    }),

  /**
   * Get bookings for a verified phone number (public).
   * Returns booking history for the "Mis Reservas" page.
   */
  getMyBookings: publicProcedure
    .input(getMyBookingsSchema)
    .query(async ({ ctx, input }) => {
      const { facilityId } = input;

      // 1. Validate verification token → extract phone
      const phone = requireVerifiedPhone(input.verificationToken);

      // 2. Fetch bookings by phone + facility
      const bookingsList = await ctx.db.query.bookings.findMany({
        where: and(
          eq(bookings.facilityId, facilityId),
          eq(bookings.customerPhone, phone),
        ),
        with: {
          court: {
            columns: { id: true, name: true, type: true },
          },
        },
        orderBy: [desc(bookings.date), desc(bookings.startTime)],
      });

      // 3. Auto-resolve statuses (confirmed → in_progress → completed)
      await resolveAndPersistBookingStatuses(ctx.db, bookingsList, new Date());

      return { bookings: bookingsList };
    }),

  /**
   * Cancel a public booking (guest cancellation).
   * Validates phone ownership via verification token.
   */
  cancelBooking: publicProcedure
    .input(cancelBookingSchema)
    .mutation(async ({ ctx, input }) => {
      const { bookingId, reason } = input;

      // 1. Validate verification token → extract phone
      const phone = requireVerifiedPhone(input.verificationToken);

      // 2. Fetch booking
      const booking = await ctx.db.query.bookings.findFirst({
        where: eq(bookings.id, bookingId),
      });

      if (!booking) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Reserva no encontrada",
        });
      }

      // 3. Verify phone ownership
      if (booking.customerPhone !== phone) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "No tienes permiso para cancelar esta reserva",
        });
      }

      // 4. Check status allows cancellation
      if (booking.status === "cancelled") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "La reserva ya está cancelada",
        });
      }

      if (booking.status === "completed") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No se puede cancelar una reserva completada",
        });
      }

      if (booking.status === "in_progress") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No se puede cancelar una reserva en curso",
        });
      }

      // 5. Cancel the booking
      const [updatedBooking] = await ctx.db
        .update(bookings)
        .set({
          status: "cancelled",
          cancelledBy: "user",
          cancellationReason: reason ?? null,
          cancelledAt: new Date(),
        })
        .where(eq(bookings.id, bookingId))
        .returning();

      await logBookingActivity({
        db: ctx.db,
        bookingId,
        type: "cancelled",
        description: reason
          ? `Reserva cancelada por jugador: ${reason}`
          : "Reserva cancelada por jugador",
        performedBy: null,
      });

      return updatedBooking;
    }),
} satisfies TRPCRouterRecord;
