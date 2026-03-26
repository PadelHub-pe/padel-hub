import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { addDays, startOfDay } from "date-fns";
import { and, eq, gte, lt, ne } from "drizzle-orm";
import { z } from "zod/v4";

import type { db as drizzleDb } from "@wifo/db/client";
import {
  blockedSlots,
  bookings,
  courts,
  facilities,
  operatingHours,
  peakPeriods,
} from "@wifo/db/schema";

import type {
  ScheduleConfig,
  SlotCourtPricing,
  SlotFacilityDefaults,
} from "../utils/schedule";
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
} satisfies TRPCRouterRecord;
