import type { TRPCRouterRecord } from "@trpc/server";
import {
  addDays,
  startOfDay,
  startOfMonth,
  subDays,
  subMonths,
} from "date-fns";
import { and, asc, count, eq, gte, lt, ne, sum } from "drizzle-orm";
import { z } from "zod/v4";

import { bookings } from "@wifo/db/schema";

import { verifyFacilityAccess } from "../lib/access-control";
import { protectedProcedure } from "../trpc";

// =============================================================================
// Input Schemas
// =============================================================================

const facilityInput = z.object({
  facilityId: z.string().uuid(),
});

// =============================================================================
// Helpers
// =============================================================================

function computeChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function formatTime(time: string): string {
  // time comes as "HH:MM:SS" or "HH:MM", normalize to "HH:MM"
  return time.slice(0, 5);
}

// =============================================================================
// Router
// =============================================================================

export const dashboardRouter = {
  /**
   * Get dashboard stats with real booking data.
   * Returns today's bookings, today's revenue, pending count, and monthly revenue
   * with day-over-day / month-over-month change percentages.
   */
  getStats: protectedProcedure
    .input(facilityInput)
    .query(async ({ ctx, input }) => {
      const { facilityId } = input;

      await verifyFacilityAccess(ctx, facilityId, "booking:read");

      const now = new Date();
      const today = startOfDay(now);
      const tomorrow = addDays(today, 1);
      const yesterday = subDays(today, 1);
      const thisMonthStart = startOfMonth(now);
      const lastMonthStart = startOfMonth(subMonths(now, 1));

      // --- Today's bookings count (non-cancelled) ---
      const [todayCountResult] = await ctx.db
        .select({ count: count() })
        .from(bookings)
        .where(
          and(
            eq(bookings.facilityId, facilityId),
            gte(bookings.date, today),
            lt(bookings.date, tomorrow),
            ne(bookings.status, "cancelled"),
          ),
        );

      // --- Today's revenue (non-cancelled) ---
      const [todayRevenueResult] = await ctx.db
        .select({ total: sum(bookings.priceInCents) })
        .from(bookings)
        .where(
          and(
            eq(bookings.facilityId, facilityId),
            gte(bookings.date, today),
            lt(bookings.date, tomorrow),
            ne(bookings.status, "cancelled"),
          ),
        );

      // --- Yesterday's bookings count (for change %) ---
      const [yesterdayCountResult] = await ctx.db
        .select({ count: count() })
        .from(bookings)
        .where(
          and(
            eq(bookings.facilityId, facilityId),
            gte(bookings.date, yesterday),
            lt(bookings.date, today),
            ne(bookings.status, "cancelled"),
          ),
        );

      // --- Yesterday's revenue (for change %) ---
      const [yesterdayRevenueResult] = await ctx.db
        .select({ total: sum(bookings.priceInCents) })
        .from(bookings)
        .where(
          and(
            eq(bookings.facilityId, facilityId),
            gte(bookings.date, yesterday),
            lt(bookings.date, today),
            ne(bookings.status, "cancelled"),
          ),
        );

      // --- Pending bookings count ---
      const [pendingResult] = await ctx.db
        .select({ count: count() })
        .from(bookings)
        .where(
          and(
            eq(bookings.facilityId, facilityId),
            eq(bookings.status, "pending"),
          ),
        );

      // --- This month's revenue (non-cancelled) ---
      const [monthRevenueResult] = await ctx.db
        .select({ total: sum(bookings.priceInCents) })
        .from(bookings)
        .where(
          and(
            eq(bookings.facilityId, facilityId),
            gte(bookings.date, thisMonthStart),
            lt(bookings.date, tomorrow),
            ne(bookings.status, "cancelled"),
          ),
        );

      // --- Last month's revenue (for change %) ---
      const [lastMonthRevenueResult] = await ctx.db
        .select({ total: sum(bookings.priceInCents) })
        .from(bookings)
        .where(
          and(
            eq(bookings.facilityId, facilityId),
            gte(bookings.date, lastMonthStart),
            lt(bookings.date, thisMonthStart),
            ne(bookings.status, "cancelled"),
          ),
        );

      const todayBookingsCount = todayCountResult?.count ?? 0;
      const todayRevenueTotal = Number(todayRevenueResult?.total ?? 0);
      const yesterdayBookingsCount = yesterdayCountResult?.count ?? 0;
      const yesterdayRevenueTotal = Number(yesterdayRevenueResult?.total ?? 0);
      const pendingCount = pendingResult?.count ?? 0;
      const monthRevenueTotal = Number(monthRevenueResult?.total ?? 0);
      const lastMonthRevenueTotal = Number(lastMonthRevenueResult?.total ?? 0);

      return {
        todayBookings: {
          value: todayBookingsCount,
          change: computeChange(todayBookingsCount, yesterdayBookingsCount),
          label: "Reservas Hoy",
        },
        todayRevenue: {
          value: Math.round(todayRevenueTotal / 100),
          change: computeChange(todayRevenueTotal, yesterdayRevenueTotal),
          label: "Ingresos Hoy",
        },
        pendingBookings: {
          value: pendingCount,
          change: 0, // no day-over-day for pending — it's a snapshot
          label: "Pendientes",
        },
        monthlyRevenue: {
          value: Math.round(monthRevenueTotal / 100),
          change: computeChange(monthRevenueTotal, lastMonthRevenueTotal),
          label: "Ingresos Mensual",
        },
      };
    }),

  /**
   * Get today's schedule — real bookings for the facility, sorted by time.
   */
  getTodaySchedule: protectedProcedure
    .input(facilityInput)
    .query(async ({ ctx, input }) => {
      const { facilityId } = input;

      await verifyFacilityAccess(ctx, facilityId, "booking:read");

      const now = new Date();
      const today = startOfDay(now);
      const tomorrow = addDays(today, 1);

      // Fetch today's non-cancelled bookings with court + user relations
      const todayBookings = await ctx.db.query.bookings.findMany({
        where: and(
          eq(bookings.facilityId, facilityId),
          gte(bookings.date, today),
          lt(bookings.date, tomorrow),
          ne(bookings.status, "cancelled"),
        ),
        with: {
          court: true,
          user: true,
        },
        orderBy: [asc(bookings.startTime)],
      });

      return todayBookings.map((booking) => {
        const customerName =
          booking.customerName ?? booking.user?.name ?? "Sin nombre";
        const customerEmail =
          booking.customerEmail ?? booking.user?.email ?? "";

        return {
          id: booking.id,
          time: `${formatTime(booking.startTime)} - ${formatTime(booking.endTime)}`,
          court: booking.court.name,
          customer: {
            name: customerName,
            email: customerEmail,
          },
          amount: Math.round(booking.priceInCents / 100),
          status: booking.status as
            | "confirmed"
            | "pending"
            | "in_progress"
            | "completed"
            | "open_match",
        };
      });
    }),
} satisfies TRPCRouterRecord;
