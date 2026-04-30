import type { TRPCRouterRecord } from "@trpc/server";
import { and, asc, count, eq, gte, lt, ne, sum } from "drizzle-orm";
import { z } from "zod/v4";

import {
  blockedSlots,
  bookings,
  courts,
  operatingHours,
  peakPeriods,
} from "@wifo/db/schema";

import { verifyFacilityAccess } from "../lib/access-control";
import { resolveAndPersistBookingStatuses } from "../lib/booking-status-persist";
import {
  addLimaDays,
  formatLimaDateParam,
  nowUtc,
  startOfLimaMonth,
  startOfLimaWeek,
} from "../lib/datetime";
import { protectedProcedure } from "../trpc";
import { getLimaDayOfWeek } from "../utils/schedule";

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

const getMonthBookingDatesSchema = z.object({
  facilityId: z.string().uuid(),
  month: z.date(),
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
  return (
    hours ?? { openTime: "08:00:00", closeTime: "22:00:00", isClosed: false }
  );
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
 * Sort courts: active first (by name), then maintenance (by name).
 * Inactive courts are filtered out.
 */
function sortAndFilterCourts<T extends { status: string; name: string }>(
  courtsList: T[],
): T[] {
  return courtsList
    .filter((c) => c.status !== "inactive")
    .sort((a, b) => {
      if (a.status === b.status) return a.name.localeCompare(b.name);
      if (a.status === "active") return -1;
      if (b.status === "active") return 1;
      return a.name.localeCompare(b.name);
    });
}

// =============================================================================
// Router
// =============================================================================

export const calendarRouter = {
  /**
   * Get day view data for calendar
   */
  getDayView: protectedProcedure
    .input(getDayViewSchema)
    .query(async ({ ctx, input }) => {
      const { facilityId, date } = input;

      // Verify access with schedule:read permission
      await verifyFacilityAccess(ctx, facilityId, "schedule:read");

      // Get the day boundaries (Lima TZ) — bookings.date is a string
      const dayStart = formatLimaDateParam(date);
      const dayEnd = formatLimaDateParam(addLimaDays(date, 1));
      const dayOfWeek = getLimaDayOfWeek(date);

      // Fetch data in parallel
      const [
        courtsList,
        operatingHoursList,
        bookingsList,
        peakPeriodsList,
        blockedSlotsList,
      ] = await Promise.all([
        ctx.db.query.courts.findMany({
          where: eq(courts.facilityId, facilityId),
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
            players: true,
          },
          orderBy: [asc(bookings.startTime)],
        }),
        ctx.db.query.peakPeriods.findMany({
          where: eq(peakPeriods.facilityId, facilityId),
        }),
        ctx.db.query.blockedSlots.findMany({
          where: and(
            eq(blockedSlots.facilityId, facilityId),
            gte(blockedSlots.date, dayStart),
            lt(blockedSlots.date, dayEnd),
          ),
        }),
      ]);

      // Resolve booking statuses on access
      const now = nowUtc();
      const statusMap = await resolveAndPersistBookingStatuses(
        ctx.db,
        bookingsList,
        now,
      );

      // Filter peak periods: active and matching dayOfWeek
      const filteredPeakPeriods = peakPeriodsList.filter(
        (pp) => pp.isActive && pp.daysOfWeek.includes(dayOfWeek),
      );

      // Sort and filter courts
      const sortedCourts = sortAndFilterCourts(courtsList);

      // Get operating hours for this day
      const dayOperatingHours = getOperatingHoursForDay(
        operatingHoursList,
        dayOfWeek,
      );

      // Calculate stats (exclude cancelled bookings)
      const activeBookings = bookingsList.filter(
        (b) => (statusMap.get(b.id) ?? b.status) !== "cancelled",
      );
      const totalRevenue = activeBookings.reduce(
        (sum, b) => sum + b.priceInCents,
        0,
      );
      const utilization = calculateUtilization(
        activeBookings,
        sortedCourts.length,
        dayOperatingHours.openTime,
        dayOperatingHours.closeTime,
      );

      return {
        date: dayStart,
        courts: sortedCourts.map((c) => ({
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
          status: statusMap.get(b.id) ?? b.status,
          customerName: b.customerName,
          playerCount: b.players.length,
          user: b.user
            ? {
                name: b.user.name,
                email: b.user.email,
              }
            : null,
        })),
        peakPeriods: filteredPeakPeriods.map((pp) => ({
          name: pp.name,
          startTime: pp.startTime,
          endTime: pp.endTime,
          markupPercent: pp.markupPercent,
        })),
        blockedSlots: blockedSlotsList.map((bs) => ({
          id: bs.id,
          courtId: bs.courtId,
          startTime: bs.startTime,
          endTime: bs.endTime,
          reason: bs.reason,
          notes: bs.notes,
        })),
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
  getWeekView: protectedProcedure
    .input(getWeekViewSchema)
    .query(async ({ ctx, input }) => {
      const { facilityId, weekStart } = input;

      // Verify access with schedule:read permission
      await verifyFacilityAccess(ctx, facilityId, "schedule:read");

      // Ensure weekStart is a Monday in Lima TZ
      const mondayStartDate = startOfLimaWeek(weekStart);
      const mondayStart = formatLimaDateParam(mondayStartDate);
      const weekEnd = formatLimaDateParam(addLimaDays(mondayStartDate, 7));

      // Fetch data in parallel
      const [courtsList, operatingHoursList, bookingsList, blockedSlotsList] =
        await Promise.all([
          ctx.db.query.courts.findMany({
            where: eq(courts.facilityId, facilityId),
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
              players: true,
            },
            orderBy: [asc(bookings.date), asc(bookings.startTime)],
          }),
          ctx.db.query.blockedSlots.findMany({
            where: and(
              eq(blockedSlots.facilityId, facilityId),
              gte(blockedSlots.date, mondayStart),
              lt(blockedSlots.date, weekEnd),
            ),
          }),
        ]);

      // Resolve booking statuses on access
      const now = nowUtc();
      const statusMap = await resolveAndPersistBookingStatuses(
        ctx.db,
        bookingsList,
        now,
      );

      // Sort and filter courts
      const sortedCourts = sortAndFilterCourts(courtsList);

      // Build days array — string YYYY-MM-DD per day; comparisons are string-equality
      const days = Array.from({ length: 7 }, (_, i) => {
        const dayDateStr = formatLimaDateParam(addLimaDays(mondayStartDate, i));
        // Mon=1, Tue=2, ..., Sat=6, Sun=0 — derived from index since we start on Monday
        const dayOfWeek = (i + 1) % 7;
        const dayOperatingHours = getOperatingHoursForDay(
          operatingHoursList,
          dayOfWeek,
        );

        const dayBookings = bookingsList.filter((b) => b.date === dayDateStr);

        const activeBookings = dayBookings.filter(
          (b) => (statusMap.get(b.id) ?? b.status) !== "cancelled",
        );
        const dayRevenue = activeBookings.reduce(
          (sum, b) => sum + b.priceInCents,
          0,
        );

        return {
          date: dayDateStr,
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
      const activeBookings = bookingsList.filter(
        (b) => (statusMap.get(b.id) ?? b.status) !== "cancelled",
      );
      const totalRevenue = activeBookings.reduce(
        (sum, b) => sum + b.priceInCents,
        0,
      );

      // Average utilization across all days
      const utilizationSum = days.reduce((acc, day) => {
        if (day.operatingHours.isClosed) return acc;
        const dayBookings = bookingsList.filter(
          (b) =>
            b.date === day.date &&
            (statusMap.get(b.id) ?? b.status) !== "cancelled",
        );
        return (
          acc +
          calculateUtilization(
            dayBookings,
            sortedCourts.length,
            day.operatingHours.openTime,
            day.operatingHours.closeTime,
          )
        );
      }, 0);

      const openDays = days.filter((d) => !d.operatingHours.isClosed).length;
      const avgUtilization =
        openDays > 0 ? Math.round(utilizationSum / openDays) : 0;

      return {
        weekStart: mondayStart,
        courts: sortedCourts.map((c) => ({
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
          status: statusMap.get(b.id) ?? b.status,
          customerName: b.customerName,
          playerCount: b.players.length,
          user: b.user
            ? {
                name: b.user.name,
                email: b.user.email,
              }
            : null,
        })),
        blockedSlots: blockedSlotsList.map((bs) => ({
          id: bs.id,
          courtId: bs.courtId,
          startTime: bs.startTime,
          endTime: bs.endTime,
          reason: bs.reason,
          notes: bs.notes,
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
  getDayStats: protectedProcedure
    .input(getDayStatsSchema)
    .query(async ({ ctx, input }) => {
      const { facilityId, date } = input;

      // Verify access with schedule:read permission
      await verifyFacilityAccess(ctx, facilityId, "schedule:read");

      const dayStart = formatLimaDateParam(date);
      const dayEnd = formatLimaDateParam(addLimaDays(date, 1));
      const dayOfWeek = getLimaDayOfWeek(date);

      const [courtsList, operatingHoursList, statsResult] = await Promise.all([
        ctx.db.query.courts.findMany({
          where: and(
            eq(courts.facilityId, facilityId),
            eq(courts.isActive, true),
          ),
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
              ne(bookings.status, "cancelled"),
            ),
          ),
      ]);

      const dayOperatingHours = getOperatingHoursForDay(
        operatingHoursList,
        dayOfWeek,
      );

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

      const filteredBookings = activeBookings.filter(
        (b) => b.status !== "cancelled",
      );
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

  /**
   * Get dates in a month that have bookings (for mini calendar dots)
   */
  getMonthBookingDates: protectedProcedure
    .input(getMonthBookingDatesSchema)
    .query(async ({ ctx, input }) => {
      const { facilityId, month } = input;

      await verifyFacilityAccess(ctx, facilityId, "schedule:read");

      // Calendar-day strings; adding 32 days from any month start always lands
      // inside the next calendar month — `startOfLimaMonth` then snaps back.
      const monthStartDate = startOfLimaMonth(month);
      const monthStart = formatLimaDateParam(monthStartDate);
      const monthEnd = formatLimaDateParam(
        startOfLimaMonth(addLimaDays(monthStartDate, 32)),
      );

      const rows = await ctx.db
        .selectDistinct({ date: bookings.date })
        .from(bookings)
        .where(
          and(
            eq(bookings.facilityId, facilityId),
            gte(bookings.date, monthStart),
            lt(bookings.date, monthEnd),
            ne(bookings.status, "cancelled"),
          ),
        );

      return {
        dates: rows.map((r) => r.date),
      };
    }),
} satisfies TRPCRouterRecord;
