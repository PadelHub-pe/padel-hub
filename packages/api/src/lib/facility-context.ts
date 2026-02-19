import { addDays, startOfDay } from "date-fns";
import { and, asc, eq, gte, lt } from "drizzle-orm";

import type { db as DbType } from "@wifo/db/client";
import {
  blockedSlots,
  bookings,
  courts,
  facilities,
  operatingHours,
  peakPeriods,
} from "@wifo/db/schema";

// =============================================================================
// Types
// =============================================================================

interface DbContext {
  db: typeof DbType;
}

// =============================================================================
// Facility Data Fetching Utilities
// =============================================================================

/**
 * Get facility with its courts
 * Commonly used for court selection, booking creation, etc.
 */
export async function getFacilityWithCourts(
  ctx: DbContext,
  facilityId: string,
) {
  const facility = await ctx.db.query.facilities.findFirst({
    where: eq(facilities.id, facilityId),
    with: {
      courts: {
        where: eq(courts.isActive, true),
        orderBy: [asc(courts.name)],
      },
    },
  });

  return facility;
}

/**
 * Get facility with operating hours
 * Returns all 7 days with defaults for missing days
 */
export async function getFacilityWithOperatingHours(
  ctx: DbContext,
  facilityId: string,
) {
  const [facility, hours] = await Promise.all([
    ctx.db.query.facilities.findFirst({
      where: eq(facilities.id, facilityId),
    }),
    ctx.db.query.operatingHours.findMany({
      where: eq(operatingHours.facilityId, facilityId),
      orderBy: [asc(operatingHours.dayOfWeek)],
    }),
  ]);

  // Build full 7-day array with defaults
  const operatingHoursMap = Array.from({ length: 7 }, (_, dayOfWeek) => {
    const existing = hours.find((h) => h.dayOfWeek === dayOfWeek);
    if (existing) {
      return {
        dayOfWeek,
        openTime: existing.openTime.substring(0, 5),
        closeTime: existing.closeTime.substring(0, 5),
        isClosed: existing.isClosed,
      };
    }
    return {
      dayOfWeek,
      openTime: "08:00",
      closeTime: "22:00",
      isClosed: false,
    };
  });

  return {
    facility,
    operatingHours: operatingHoursMap,
  };
}

/**
 * Get all data needed for calendar/schedule view on a specific date
 * Fetches courts, operating hours, peak periods, bookings, and blocked slots
 */
export async function getFacilityForCalendar(
  ctx: DbContext,
  facilityId: string,
  date: Date,
) {
  const dayStart = startOfDay(date);
  const dayEnd = addDays(dayStart, 1);
  const dayOfWeek = date.getDay(); // 0 = Sunday

  // Fetch all data in parallel
  const [
    courtsList,
    operatingHoursList,
    peakPeriodsList,
    bookingsList,
    blockedSlotsList,
  ] = await Promise.all([
    ctx.db.query.courts.findMany({
      where: and(eq(courts.facilityId, facilityId), eq(courts.isActive, true)),
      orderBy: [asc(courts.name)],
    }),
    ctx.db.query.operatingHours.findMany({
      where: eq(operatingHours.facilityId, facilityId),
    }),
    ctx.db.query.peakPeriods.findMany({
      where: and(
        eq(peakPeriods.facilityId, facilityId),
        eq(peakPeriods.isActive, true),
      ),
    }),
    ctx.db.query.bookings.findMany({
      where: and(
        eq(bookings.facilityId, facilityId),
        gte(bookings.date, dayStart),
        lt(bookings.date, dayEnd),
      ),
      with: {
        court: true,
        user: true,
      },
      orderBy: [asc(bookings.startTime)],
    }),
    ctx.db.query.blockedSlots.findMany({
      where: and(
        eq(blockedSlots.facilityId, facilityId),
        gte(blockedSlots.date, dayStart),
        lt(blockedSlots.date, dayEnd),
      ),
      with: {
        court: true,
      },
      orderBy: [asc(blockedSlots.startTime)],
    }),
  ]);

  // Get operating hours for this specific day
  const dayHours = operatingHoursList.find((h) => h.dayOfWeek === dayOfWeek);
  const todayOperatingHours = dayHours
    ? {
        openTime: dayHours.openTime.substring(0, 5),
        closeTime: dayHours.closeTime.substring(0, 5),
        isClosed: dayHours.isClosed,
      }
    : { openTime: "08:00", closeTime: "22:00", isClosed: false };

  // Filter peak periods that apply to this day
  const todayPeakPeriods = peakPeriodsList
    .filter((p) => p.daysOfWeek.includes(dayOfWeek))
    .map((p) => ({
      id: p.id,
      name: p.name,
      startTime: p.startTime.substring(0, 5),
      endTime: p.endTime.substring(0, 5),
      markupPercent: p.markupPercent,
    }));

  return {
    date: dayStart,
    courts: courtsList.map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      status: c.status,
      priceInCents: c.priceInCents,
      peakPriceInCents: c.peakPriceInCents,
    })),
    operatingHours: todayOperatingHours,
    peakPeriods: todayPeakPeriods,
    bookings: bookingsList.map((b) => ({
      id: b.id,
      code: b.code,
      courtId: b.courtId,
      courtName: b.court?.name ?? null, // eslint-disable-line @typescript-eslint/no-unnecessary-condition
      startTime: b.startTime.substring(0, 5),
      endTime: b.endTime.substring(0, 5),
      status: b.status,
      customerName: b.customerName ?? b.user?.name ?? null,
      customerPhone: b.customerPhone,
      isPeakRate: b.isPeakRate,
      priceInCents: b.priceInCents,
      isManualBooking: b.isManualBooking,
    })),
    blockedSlots: blockedSlotsList.map((s) => ({
      id: s.id,
      courtId: s.courtId,
      courtName: s.court?.name ?? null,
      startTime: s.startTime.substring(0, 5),
      endTime: s.endTime.substring(0, 5),
      reason: s.reason,
      notes: s.notes,
    })),
  };
}

/**
 * Get booking statistics for a facility
 * Used for dashboard cards
 */
export async function getFacilityBookingStats(
  ctx: DbContext,
  facilityId: string,
) {
  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);

  const [todayBookings, pendingBookings, totalCourts] = await Promise.all([
    ctx.db.query.bookings.findMany({
      where: and(
        eq(bookings.facilityId, facilityId),
        gte(bookings.date, today),
        lt(bookings.date, tomorrow),
      ),
    }),
    ctx.db.query.bookings.findMany({
      where: and(
        eq(bookings.facilityId, facilityId),
        eq(bookings.status, "pending"),
      ),
    }),
    ctx.db.query.courts.findMany({
      where: and(eq(courts.facilityId, facilityId), eq(courts.isActive, true)),
    }),
  ]);

  // Calculate today's revenue
  const todayRevenue = todayBookings
    .filter((b) => b.status !== "cancelled")
    .reduce((sum, b) => sum + b.priceInCents, 0);

  return {
    todayBookingsCount: todayBookings.filter((b) => b.status !== "cancelled")
      .length,
    pendingBookingsCount: pendingBookings.length,
    todayRevenueInCents: todayRevenue,
    totalCourts: totalCourts.length,
  };
}
