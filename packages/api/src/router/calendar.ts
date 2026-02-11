import type { TRPCRouterRecord } from "@trpc/server";
import { addDays, startOfDay, startOfWeek } from "date-fns";
import { and, asc, count, eq, gte, lt, sum } from "drizzle-orm";
import { z } from "zod/v4";

import type { db as DbType } from "@wifo/db/client";
import { bookings, courts, operatingHours, timeSlotTemplates } from "@wifo/db/schema";

import { verifyFacilityAccess } from "../lib/access-control";
import { protectedProcedure } from "../trpc";

// =============================================================================
// Input Schemas
// =============================================================================

const getDayViewSchema = z.object({
  facilityId: z.string().uuid(),
  date: z.date(),
});

const getWeekViewSchema = z.object({
  facilityId: z.string().uuid(),
  weekStart: z.date(),
});

const getDayStatsSchema = z.object({
  facilityId: z.string().uuid(),
  date: z.date(),
});

// =============================================================================
// Helpers
// =============================================================================

/**
 * Get operating hours for a specific day of week
 */
function getOperatingHoursForDay(
  operatingHoursList: {
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
    isClosed: boolean;
  }[],
  dayOfWeek: number,
) {
  const hours = operatingHoursList.find((h) => h.dayOfWeek === dayOfWeek);
  return hours ?? { openTime: "08:00:00", closeTime: "22:00:00", isClosed: false };
}

/**
 * Calculate utilization percentage based on booked hours vs available hours
 */
function calculateUtilization(
  bookingsList: { startTime: string; endTime: string }[],
  courtCount: number,
  openTime: string,
  closeTime: string,
): number {
  if (courtCount === 0) return 0;

  // Parse times to minutes
  const parseTime = (time: string): number => {
    const [hours, minutes] = time.split(":").map(Number);
    return (hours ?? 0) * 60 + (minutes ?? 0);
  };

  const openMinutes = parseTime(openTime);
  const closeMinutes = parseTime(closeTime);
  const totalAvailableMinutes = (closeMinutes - openMinutes) * courtCount;

  if (totalAvailableMinutes <= 0) return 0;

  const bookedMinutes = bookingsList.reduce((acc, b) => {
    const start = parseTime(b.startTime);
    const end = parseTime(b.endTime);
    return acc + (end - start);
  }, 0);

  return Math.round((bookedMinutes / totalAvailableMinutes) * 100);
}

/**
 * Get peak periods from time slot templates for a given day
 */
async function getPeakPeriods(
  db: typeof DbType,
  facilityId: string,
  dayOfWeek: number,
): Promise<{ startTime: string; endTime: string }[]> {
  const templates = await db.query.timeSlotTemplates.findMany({
    where: and(
      eq(timeSlotTemplates.facilityId, facilityId),
      eq(timeSlotTemplates.dayOfWeek, dayOfWeek),
      eq(timeSlotTemplates.isActive, true),
    ),
    orderBy: [asc(timeSlotTemplates.startTime)],
  });

  return templates.map((t) => ({
    startTime: t.startTime,
    endTime: t.endTime,
  }));
}

// =============================================================================
// Router
// =============================================================================

export const calendarRouter = {
  /**
   * Get day view data for calendar
   */
  getDayView: protectedProcedure.input(getDayViewSchema).query(async ({ ctx, input }) => {
    const { facilityId, date } = input;

    // Verify access with schedule:read permission
    await verifyFacilityAccess(ctx, facilityId, "schedule:read");

    // Get the day boundaries
    const dayStart = startOfDay(date);
    const dayEnd = startOfDay(addDays(date, 1));
    const dayOfWeek = date.getDay(); // 0 = Sunday

    // Fetch data in parallel
    const [courtsList, operatingHoursList, bookingsList] = await Promise.all([
      ctx.db.query.courts.findMany({
        where: and(eq(courts.facilityId, facilityId), eq(courts.isActive, true)),
        orderBy: [asc(courts.name)],
      }),
      ctx.db.query.operatingHours.findMany({
        where: eq(operatingHours.facilityId, facilityId),
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
    ]);

    // Get operating hours for this day
    const dayOperatingHours = getOperatingHoursForDay(operatingHoursList, dayOfWeek);

    // Get peak periods
    const peakPeriods = await getPeakPeriods(ctx.db, facilityId, dayOfWeek);

    // Calculate stats (exclude cancelled bookings)
    const activeBookings = bookingsList.filter((b) => b.status !== "cancelled");
    const totalRevenue = activeBookings.reduce((sum, b) => sum + b.priceInCents, 0);
    const utilization = calculateUtilization(
      activeBookings,
      courtsList.length,
      dayOperatingHours.openTime,
      dayOperatingHours.closeTime,
    );

    return {
      date: dayStart,
      courts: courtsList.map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        status: c.status,
      })),
      operatingHours: {
        openTime: dayOperatingHours.openTime,
        closeTime: dayOperatingHours.closeTime,
        isClosed: dayOperatingHours.isClosed,
      },
      bookings: bookingsList.map((b) => ({
        id: b.id,
        code: b.code,
        courtId: b.courtId,
        date: b.date,
        startTime: b.startTime,
        endTime: b.endTime,
        priceInCents: b.priceInCents,
        isPeakRate: b.isPeakRate,
        status: b.status,
        customerName: b.customerName,
        user: b.user
          ? {
              name: b.user.name,
              email: b.user.email,
            }
          : null,
      })),
      peakPeriods,
      stats: {
        totalBookings: activeBookings.length,
        revenueInCents: totalRevenue,
        utilizationPercent: utilization,
      },
    };
  }),

  /**
   * Get week view data for calendar
   */
  getWeekView: protectedProcedure.input(getWeekViewSchema).query(async ({ ctx, input }) => {
    const { facilityId, weekStart } = input;

    // Verify access with schedule:read permission
    await verifyFacilityAccess(ctx, facilityId, "schedule:read");

    // Ensure weekStart is a Monday
    const mondayStart = startOfWeek(weekStart, { weekStartsOn: 1 });
    const weekEnd = addDays(mondayStart, 7);

    // Fetch data in parallel
    const [courtsList, operatingHoursList, bookingsList] = await Promise.all([
      ctx.db.query.courts.findMany({
        where: and(eq(courts.facilityId, facilityId), eq(courts.isActive, true)),
        orderBy: [asc(courts.name)],
      }),
      ctx.db.query.operatingHours.findMany({
        where: eq(operatingHours.facilityId, facilityId),
      }),
      ctx.db.query.bookings.findMany({
        where: and(
          eq(bookings.facilityId, facilityId),
          gte(bookings.date, mondayStart),
          lt(bookings.date, weekEnd),
        ),
        with: {
          court: true,
          user: true,
        },
        orderBy: [asc(bookings.date), asc(bookings.startTime)],
      }),
    ]);

    // Build days array
    const days = Array.from({ length: 7 }, (_, i) => {
      const dayDate = addDays(mondayStart, i);
      const dayOfWeek = dayDate.getDay();
      const dayOperatingHours = getOperatingHoursForDay(operatingHoursList, dayOfWeek);

      const dayBookings = bookingsList.filter((b) => {
        const bookingDate = startOfDay(b.date);
        return bookingDate.getTime() === startOfDay(dayDate).getTime();
      });

      const activeBookings = dayBookings.filter((b) => b.status !== "cancelled");
      const dayRevenue = activeBookings.reduce((sum, b) => sum + b.priceInCents, 0);

      return {
        date: dayDate,
        dayOfWeek,
        operatingHours: {
          openTime: dayOperatingHours.openTime,
          closeTime: dayOperatingHours.closeTime,
          isClosed: dayOperatingHours.isClosed,
        },
        bookingCount: activeBookings.length,
        revenueInCents: dayRevenue,
      };
    });

    // Calculate weekly stats
    const activeBookings = bookingsList.filter((b) => b.status !== "cancelled");
    const totalRevenue = activeBookings.reduce((sum, b) => sum + b.priceInCents, 0);

    // Average utilization across all days
    const utilizationSum = days.reduce((acc, day) => {
      if (day.operatingHours.isClosed) return acc;
      const dayBookings = bookingsList.filter(
        (b) =>
          startOfDay(b.date).getTime() === startOfDay(day.date).getTime() &&
          b.status !== "cancelled",
      );
      return (
        acc +
        calculateUtilization(
          dayBookings,
          courtsList.length,
          day.operatingHours.openTime,
          day.operatingHours.closeTime,
        )
      );
    }, 0);

    const openDays = days.filter((d) => !d.operatingHours.isClosed).length;
    const avgUtilization = openDays > 0 ? Math.round(utilizationSum / openDays) : 0;

    return {
      weekStart: mondayStart,
      courts: courtsList.map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        status: c.status,
      })),
      days,
      bookings: bookingsList.map((b) => ({
        id: b.id,
        code: b.code,
        courtId: b.courtId,
        date: b.date,
        startTime: b.startTime,
        endTime: b.endTime,
        priceInCents: b.priceInCents,
        isPeakRate: b.isPeakRate,
        status: b.status,
        customerName: b.customerName,
        user: b.user
          ? {
              name: b.user.name,
              email: b.user.email,
            }
          : null,
      })),
      stats: {
        totalBookings: activeBookings.length,
        revenueInCents: totalRevenue,
        avgUtilizationPercent: avgUtilization,
      },
    };
  }),

  /**
   * Get lightweight stats for a single day (for quick refresh)
   */
  getDayStats: protectedProcedure.input(getDayStatsSchema).query(async ({ ctx, input }) => {
    const { facilityId, date } = input;

    // Verify access with schedule:read permission
    await verifyFacilityAccess(ctx, facilityId, "schedule:read");

    const dayStart = startOfDay(date);
    const dayEnd = startOfDay(addDays(date, 1));
    const dayOfWeek = date.getDay();

    const [courtsList, operatingHoursList, statsResult] = await Promise.all([
      ctx.db.query.courts.findMany({
        where: and(eq(courts.facilityId, facilityId), eq(courts.isActive, true)),
      }),
      ctx.db.query.operatingHours.findMany({
        where: eq(operatingHours.facilityId, facilityId),
      }),
      ctx.db
        .select({
          count: count(),
          totalRevenue: sum(bookings.priceInCents),
        })
        .from(bookings)
        .where(
          and(
            eq(bookings.facilityId, facilityId),
            gte(bookings.date, dayStart),
            lt(bookings.date, dayEnd),
          ),
        ),
    ]);

    const dayOperatingHours = getOperatingHoursForDay(operatingHoursList, dayOfWeek);

    // Get active bookings for utilization calculation
    const activeBookings = await ctx.db.query.bookings.findMany({
      where: and(
        eq(bookings.facilityId, facilityId),
        gte(bookings.date, dayStart),
        lt(bookings.date, dayEnd),
      ),
      columns: {
        startTime: true,
        endTime: true,
        status: true,
      },
    });

    const filteredBookings = activeBookings.filter((b) => b.status !== "cancelled");
    const utilization = calculateUtilization(
      filteredBookings,
      courtsList.length,
      dayOperatingHours.openTime,
      dayOperatingHours.closeTime,
    );

    return {
      bookingCount: filteredBookings.length,
      revenueInCents: Number(statsResult[0]?.totalRevenue ?? 0),
      utilizationPercent: utilization,
    };
  }),
} satisfies TRPCRouterRecord;
