import type { TRPCRouterRecord } from "@trpc/server";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod/v4";

import { courts, operatingHours, peakPeriods } from "@wifo/db/schema";

import { verifyFacilityAccess } from "../lib/access-control";
import { protectedProcedure } from "../trpc";

// =============================================================================
// Input Schemas
// =============================================================================

const facilityIdSchema = z.object({
  facilityId: z.string().uuid(),
});

const calculateRevenueSchema = z.object({
  facilityId: z.string().uuid(),
  occupancyPercent: z.number().min(1).max(100).default(70),
});

// =============================================================================
// Helpers
// =============================================================================

function parseTimeToHours(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h ?? 0) + (m ?? 0) / 60;
}

function isPeakHour(
  hour: number,
  dayOfWeek: number,
  periods: { daysOfWeek: number[]; startTime: string; endTime: string }[],
): boolean {
  for (const p of periods) {
    if (!p.daysOfWeek.includes(dayOfWeek)) continue;
    const start = parseTimeToHours(p.startTime);
    const end = parseTimeToHours(p.endTime);
    if (hour >= start && hour < end) return true;
  }
  return false;
}

/**
 * Get the peak markup % for a given hour/day. Returns the highest
 * applicable markup, or 0 if outside all peak periods.
 */
function getPeakMarkup(
  hour: number,
  dayOfWeek: number,
  periods: {
    daysOfWeek: number[];
    startTime: string;
    endTime: string;
    markupPercent: number;
  }[],
): number {
  let maxMarkup = 0;
  for (const p of periods) {
    if (!p.daysOfWeek.includes(dayOfWeek)) continue;
    const start = parseTimeToHours(p.startTime);
    const end = parseTimeToHours(p.endTime);
    if (hour >= start && hour < end && p.markupPercent > maxMarkup) {
      maxMarkup = p.markupPercent;
    }
  }
  return maxMarkup;
}

function getDefaultHours(dayOfWeek: number) {
  return { dayOfWeek, openTime: "08:00", closeTime: "22:00", isClosed: false };
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  /* eslint-disable @typescript-eslint/no-non-null-assertion */
  return sorted.length % 2 !== 0
    ? sorted[mid]!
    : (sorted[mid - 1]! + sorted[mid]!) / 2;
  /* eslint-enable @typescript-eslint/no-non-null-assertion */
}

// =============================================================================
// Router
// =============================================================================

export const pricingRouter = {
  /**
   * Get pricing overview: courts, operating hours, peak periods, computed stats
   */
  getOverview: protectedProcedure
    .input(facilityIdSchema)
    .query(async ({ ctx, input }) => {
      const { facilityId } = input;

      await verifyFacilityAccess(ctx, facilityId, "schedule:read");

      const [courtsList, hoursList, periodsList] = await Promise.all([
        ctx.db.query.courts.findMany({
          where: and(
            eq(courts.facilityId, facilityId),
            eq(courts.isActive, true),
          ),
          orderBy: [asc(courts.createdAt)],
        }),
        ctx.db.query.operatingHours.findMany({
          where: eq(operatingHours.facilityId, facilityId),
          orderBy: [asc(operatingHours.dayOfWeek)],
        }),
        ctx.db.query.peakPeriods.findMany({
          where: and(
            eq(peakPeriods.facilityId, facilityId),
            eq(peakPeriods.isActive, true),
          ),
          orderBy: [asc(peakPeriods.createdAt)],
        }),
      ]);

      // Build full 7-day operating hours
      const hoursMap = Array.from({ length: 7 }, (_, dayOfWeek) => {
        const existing = hoursList.find((h) => h.dayOfWeek === dayOfWeek);
        if (existing) {
          return {
            dayOfWeek,
            openTime: existing.openTime.substring(0, 5),
            closeTime: existing.closeTime.substring(0, 5),
            isClosed: existing.isClosed,
          };
        }
        return getDefaultHours(dayOfWeek);
      });

      const formattedPeriods = periodsList.map((p) => ({
        id: p.id,
        name: p.name,
        daysOfWeek: p.daysOfWeek,
        startTime: p.startTime.substring(0, 5),
        endTime: p.endTime.substring(0, 5),
        markupPercent: p.markupPercent,
      }));

      // Compute stats: peak price is derived from regular + markup
      const regularPrices = courtsList
        .map((c) => c.priceInCents)
        .filter((p): p is number => p !== null && p > 0);

      const medianRegular = median(regularPrices);

      // Average markup from active peak periods
      const avgMarkup =
        formattedPeriods.length > 0
          ? Math.round(
              formattedPeriods.reduce((sum, p) => sum + p.markupPercent, 0) /
                formattedPeriods.length,
            )
          : 0;

      // Peak price = regular price * (1 + markup%)
      const medianPeak = Math.round(medianRegular * (1 + avgMarkup / 100));

      // Calculate regular vs peak hours breakdown
      let regularHours = 0;
      let peakHoursTotal = 0;

      for (const day of hoursMap) {
        if (day.isClosed) continue;
        const open = parseTimeToHours(day.openTime);
        const close = parseTimeToHours(day.closeTime);
        for (let h = open; h < close; h++) {
          if (isPeakHour(h, day.dayOfWeek, formattedPeriods)) {
            peakHoursTotal++;
          } else {
            regularHours++;
          }
        }
      }

      const totalHours = regularHours + peakHoursTotal;
      const regularPercent =
        totalHours > 0 ? Math.round((regularHours / totalHours) * 100) : 100;
      const peakPercent =
        totalHours > 0 ? Math.round((peakHoursTotal / totalHours) * 100) : 0;

      return {
        courts: courtsList.map((c) => ({
          id: c.id,
          name: c.name,
          type: c.type,
          status: c.status,
          priceInCents: c.priceInCents,
          peakPriceInCents: c.peakPriceInCents,
          isActive: c.isActive,
        })),
        operatingHours: hoursMap,
        peakPeriods: formattedPeriods,
        stats: {
          medianRegularCents: medianRegular,
          medianPeakCents: medianPeak,
          avgMarkupPercent: avgMarkup,
          regularHoursPercent: regularPercent,
          peakHoursPercent: peakPercent,
          totalWeeklyHours: totalHours,
        },
      };
    }),

  /**
   * Calculate estimated weekly revenue for a given occupancy %
   */
  calculateRevenue: protectedProcedure
    .input(calculateRevenueSchema)
    .query(async ({ ctx, input }) => {
      const { facilityId, occupancyPercent } = input;

      await verifyFacilityAccess(ctx, facilityId, "schedule:read");

      const [courtsList, hoursList, periodsList] = await Promise.all([
        ctx.db.query.courts.findMany({
          where: and(
            eq(courts.facilityId, facilityId),
            eq(courts.isActive, true),
          ),
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
      ]);

      const hoursMap = Array.from({ length: 7 }, (_, dayOfWeek) => {
        const existing = hoursList.find((h) => h.dayOfWeek === dayOfWeek);
        if (existing) {
          return {
            dayOfWeek,
            openTime: existing.openTime.substring(0, 5),
            closeTime: existing.closeTime.substring(0, 5),
            isClosed: existing.isClosed,
          };
        }
        return getDefaultHours(dayOfWeek);
      });

      const formattedPeriods = periodsList.map((p) => ({
        daysOfWeek: p.daysOfWeek,
        startTime: p.startTime.substring(0, 5),
        endTime: p.endTime.substring(0, 5),
        markupPercent: p.markupPercent,
      }));

      const occupancy = occupancyPercent / 100;

      // Sum revenue per court per day
      // Peak rate = regular rate * (1 + markup%)
      let regularRevenue = 0;
      let peakRevenue = 0;
      let peakMarkupBonus = 0;

      for (const court of courtsList) {
        const regularRate = court.priceInCents ?? 0;

        for (const day of hoursMap) {
          if (day.isClosed) continue;
          const open = parseTimeToHours(day.openTime);
          const close = parseTimeToHours(day.closeTime);

          for (let h = open; h < close; h++) {
            const markup = getPeakMarkup(h, day.dayOfWeek, formattedPeriods);
            if (markup > 0) {
              const peakRate = regularRate * (1 + markup / 100);
              peakRevenue += peakRate * occupancy;
              peakMarkupBonus += (peakRate - regularRate) * occupancy;
            } else {
              regularRevenue += regularRate * occupancy;
            }
          }
        }
      }

      return {
        totalWeekly: Math.round(regularRevenue + peakRevenue),
        regularRevenue: Math.round(regularRevenue),
        peakRevenue: Math.round(peakRevenue),
        peakMarkupBonus: Math.max(0, peakMarkupBonus),
        courtCount: courtsList.length,
        occupancyPercent,
      };
    }),
} satisfies TRPCRouterRecord;
