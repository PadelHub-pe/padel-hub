import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { addDays, startOfDay } from "date-fns";
import { and, asc, eq, gte, inArray, lt } from "drizzle-orm";
import { z } from "zod/v4";

import {
  blockedSlots,
  bookings,
  courts,
  operatingHours,
  peakPeriods,
} from "@wifo/db/schema";

import { verifyFacilityAccess } from "../lib/access-control";
import { protectedProcedure } from "../trpc";
import { getLimaDayOfWeek } from "../utils/schedule";

// =============================================================================
// Input Schemas
// =============================================================================

const facilityIdSchema = z.object({
  facilityId: z.string().uuid(),
});

const dayConfigSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  openTime: z.string().regex(/^\d{2}:\d{2}$/),
  closeTime: z.string().regex(/^\d{2}:\d{2}$/),
  isClosed: z.boolean(),
});

const updateOperatingHoursSchema = z.object({
  facilityId: z.string().uuid(),
  hours: z.array(dayConfigSchema).length(7),
});

const createPeakPeriodSchema = z.object({
  facilityId: z.string().uuid(),
  name: z.string().min(1).max(100),
  daysOfWeek: z.array(z.number().min(0).max(6)).min(1),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  markupPercent: z.number().int().min(0).max(200),
});

const updatePeakPeriodSchema = z.object({
  facilityId: z.string().uuid(),
  id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  daysOfWeek: z.array(z.number().min(0).max(6)).min(1).optional(),
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  endTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  markupPercent: z.number().int().min(0).max(200).optional(),
});

const deletePeakPeriodSchema = z.object({
  facilityId: z.string().uuid(),
  id: z.string().uuid(),
});

const getBlockedSlotsSchema = z.object({
  facilityId: z.string().uuid(),
  date: z.date(),
});

const blockTimeSlotSchema = z.object({
  facilityId: z.string().uuid(),
  courtId: z.string().uuid().optional().nullable(),
  date: z.date(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  reason: z.enum([
    "maintenance",
    "private_event",
    "tournament",
    "weather",
    "other",
  ]),
  notes: z.string().max(500).optional(),
});

const deleteBlockedSlotSchema = z.object({
  id: z.string().uuid(),
});

const checkBlockConflictsSchema = z.object({
  facilityId: z.string().uuid(),
  courtIds: z.array(z.string().uuid()).min(1),
  date: z.date(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
});

const getDayOverviewSchema = z.object({
  facilityId: z.string().uuid(),
  date: z.date(),
});

// =============================================================================
// Helpers
// =============================================================================

/**
 * Get default operating hours for days not yet configured
 */
function getDefaultOperatingHours(dayOfWeek: number) {
  return {
    dayOfWeek,
    openTime: "08:00",
    closeTime: "22:00",
    isClosed: false,
  };
}

// =============================================================================
// Router
// =============================================================================

export const scheduleRouter = {
  /**
   * Get operating hours for all 7 days of the week
   */
  getOperatingHours: protectedProcedure
    .input(facilityIdSchema)
    .query(async ({ ctx, input }) => {
      const { facilityId } = input;

      await verifyFacilityAccess(ctx, facilityId, "schedule:read");

      const hours = await ctx.db.query.operatingHours.findMany({
        where: eq(operatingHours.facilityId, facilityId),
        orderBy: [asc(operatingHours.dayOfWeek)],
      });

      // Build full 7-day array, using defaults for missing days
      const result = Array.from({ length: 7 }, (_, dayOfWeek) => {
        const existing = hours.find((h) => h.dayOfWeek === dayOfWeek);
        if (existing) {
          return {
            dayOfWeek,
            openTime: existing.openTime.substring(0, 5),
            closeTime: existing.closeTime.substring(0, 5),
            isClosed: existing.isClosed,
          };
        }
        return getDefaultOperatingHours(dayOfWeek);
      });

      return result;
    }),

  /**
   * Update operating hours for all 7 days
   */
  updateOperatingHours: protectedProcedure
    .input(updateOperatingHoursSchema)
    .mutation(async ({ ctx, input }) => {
      const { facilityId, hours } = input;

      await verifyFacilityAccess(ctx, facilityId, "schedule:write");

      // Delete existing hours and insert new ones
      await ctx.db
        .delete(operatingHours)
        .where(eq(operatingHours.facilityId, facilityId));

      await ctx.db.insert(operatingHours).values(
        hours.map((h) => ({
          facilityId,
          dayOfWeek: h.dayOfWeek,
          openTime: h.openTime,
          closeTime: h.closeTime,
          isClosed: h.isClosed,
        })),
      );

      return { success: true };
    }),

  /**
   * Get active peak periods for a facility
   */
  getPeakPeriods: protectedProcedure
    .input(facilityIdSchema)
    .query(async ({ ctx, input }) => {
      const { facilityId } = input;

      await verifyFacilityAccess(ctx, facilityId, "schedule:read");

      const periods = await ctx.db.query.peakPeriods.findMany({
        where: and(
          eq(peakPeriods.facilityId, facilityId),
          eq(peakPeriods.isActive, true),
        ),
        orderBy: [asc(peakPeriods.createdAt)],
      });

      return periods.map((p) => ({
        id: p.id,
        name: p.name,
        daysOfWeek: p.daysOfWeek,
        startTime: p.startTime.substring(0, 5),
        endTime: p.endTime.substring(0, 5),
        markupPercent: p.markupPercent,
      }));
    }),

  /**
   * Create a new peak period
   */
  createPeakPeriod: protectedProcedure
    .input(createPeakPeriodSchema)
    .mutation(async ({ ctx, input }) => {
      const {
        facilityId,
        name,
        daysOfWeek,
        startTime,
        endTime,
        markupPercent,
      } = input;

      await verifyFacilityAccess(ctx, facilityId, "schedule:write");

      if (endTime <= startTime) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "La hora de fin debe ser posterior a la hora de inicio del periodo pico",
        });
      }

      // Validate peak period falls within operating hours for each selected day
      const facilityHours = await ctx.db.query.operatingHours.findMany({
        where: eq(operatingHours.facilityId, facilityId),
      });

      for (const day of daysOfWeek) {
        const dayHours = facilityHours.find((h) => h.dayOfWeek === day);
        const dayLabel = [
          "Domingo",
          "Lunes",
          "Martes",
          "Miércoles",
          "Jueves",
          "Viernes",
          "Sábado",
        ][day];

        if (!dayHours || dayHours.isClosed) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `No se puede crear periodo pico para ${dayLabel}: el local está cerrado ese día`,
          });
        }

        const opOpen = dayHours.openTime.substring(0, 5);
        const opClose = dayHours.closeTime.substring(0, 5);

        if (startTime < opOpen || endTime > opClose) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `El periodo pico debe estar dentro del horario de operación de ${dayLabel} (${opOpen} - ${opClose})`,
          });
        }
      }

      const [created] = await ctx.db
        .insert(peakPeriods)
        .values({
          facilityId,
          name,
          daysOfWeek,
          startTime,
          endTime,
          markupPercent,
        })
        .returning();

      return created;
    }),

  /**
   * Update a peak period (partial fields)
   */
  updatePeakPeriod: protectedProcedure
    .input(updatePeakPeriodSchema)
    .mutation(async ({ ctx, input }) => {
      const { facilityId, id, ...fields } = input;

      await verifyFacilityAccess(ctx, facilityId, "schedule:write");

      // Verify the period exists and belongs to this facility
      const existing = await ctx.db.query.peakPeriods.findFirst({
        where: and(
          eq(peakPeriods.id, id),
          eq(peakPeriods.facilityId, facilityId),
        ),
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Periodo pico no encontrado",
        });
      }

      // Merge provided fields with existing values for validation
      const mergedStartTime =
        fields.startTime ?? existing.startTime.substring(0, 5);
      const mergedEndTime = fields.endTime ?? existing.endTime.substring(0, 5);
      const mergedDaysOfWeek = fields.daysOfWeek ?? existing.daysOfWeek;

      if (mergedEndTime <= mergedStartTime) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "La hora de fin debe ser posterior a la hora de inicio del periodo pico",
        });
      }

      // Validate peak period falls within operating hours for each selected day
      const facilityHours = await ctx.db.query.operatingHours.findMany({
        where: eq(operatingHours.facilityId, facilityId),
      });

      for (const day of mergedDaysOfWeek) {
        const dayHours = facilityHours.find((h) => h.dayOfWeek === day);
        const dayLabel = [
          "Domingo",
          "Lunes",
          "Martes",
          "Miércoles",
          "Jueves",
          "Viernes",
          "Sábado",
        ][day];

        if (!dayHours || dayHours.isClosed) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `No se puede crear periodo pico para ${dayLabel}: el local está cerrado ese día`,
          });
        }

        const opOpen = dayHours.openTime.substring(0, 5);
        const opClose = dayHours.closeTime.substring(0, 5);

        if (mergedStartTime < opOpen || mergedEndTime > opClose) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `El periodo pico debe estar dentro del horario de operación de ${dayLabel} (${opOpen} - ${opClose})`,
          });
        }
      }

      // Build update object with only provided fields
      const updateData: Record<string, unknown> = {};
      if (fields.name !== undefined) updateData.name = fields.name;
      if (fields.daysOfWeek !== undefined)
        updateData.daysOfWeek = fields.daysOfWeek;
      if (fields.startTime !== undefined)
        updateData.startTime = fields.startTime;
      if (fields.endTime !== undefined) updateData.endTime = fields.endTime;
      if (fields.markupPercent !== undefined)
        updateData.markupPercent = fields.markupPercent;

      const [updated] = await ctx.db
        .update(peakPeriods)
        .set(updateData)
        .where(eq(peakPeriods.id, id))
        .returning();

      // Should never happen since we verified existence above
      if (!updated) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error al actualizar el periodo pico",
        });
      }

      return updated;
    }),

  /**
   * Delete a peak period
   */
  deletePeakPeriod: protectedProcedure
    .input(deletePeakPeriodSchema)
    .mutation(async ({ ctx, input }) => {
      const { facilityId, id } = input;

      await verifyFacilityAccess(ctx, facilityId, "schedule:write");

      // Get the peak period to verify it exists and belongs to this facility
      const period = await ctx.db.query.peakPeriods.findFirst({
        where: and(
          eq(peakPeriods.id, id),
          eq(peakPeriods.facilityId, facilityId),
        ),
      });

      if (!period) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Periodo pico no encontrado",
        });
      }

      await ctx.db.delete(peakPeriods).where(eq(peakPeriods.id, id));

      return { success: true };
    }),

  /**
   * Get blocked slots for a specific date
   */
  getBlockedSlots: protectedProcedure
    .input(getBlockedSlotsSchema)
    .query(async ({ ctx, input }) => {
      const { facilityId, date } = input;

      await verifyFacilityAccess(ctx, facilityId, "schedule:read");

      const dayStart = startOfDay(date);
      const dayEnd = addDays(dayStart, 1);

      const slots = await ctx.db.query.blockedSlots.findMany({
        where: and(
          eq(blockedSlots.facilityId, facilityId),
          gte(blockedSlots.date, dayStart),
          lt(blockedSlots.date, dayEnd),
        ),
        with: {
          court: true,
          creator: true,
        },
        orderBy: [asc(blockedSlots.startTime)],
      });

      return slots.map((s) => ({
        id: s.id,
        courtId: s.courtId,
        courtName: s.court?.name ?? null,
        date: s.date,
        startTime: s.startTime.substring(0, 5),
        endTime: s.endTime.substring(0, 5),
        reason: s.reason,
        notes: s.notes,
        createdBy: s.creator?.name ?? null,
      }));
    }),

  /**
   * List all blocked slots for a facility (upcoming and recent)
   */
  listBlockedSlots: protectedProcedure
    .input(facilityIdSchema)
    .query(async ({ ctx, input }) => {
      const { facilityId } = input;

      await verifyFacilityAccess(ctx, facilityId, "schedule:read");

      const slots = await ctx.db.query.blockedSlots.findMany({
        where: eq(blockedSlots.facilityId, facilityId),
        with: {
          court: true,
          creator: true,
        },
        orderBy: [asc(blockedSlots.date), asc(blockedSlots.startTime)],
      });

      return slots.map((s) => ({
        id: s.id,
        courtId: s.courtId,
        courtName: s.court?.name ?? null,
        date: s.date,
        startTime: s.startTime.substring(0, 5),
        endTime: s.endTime.substring(0, 5),
        reason: s.reason,
        notes: s.notes,
        createdBy: s.creator?.name ?? null,
        createdAt: s.createdAt,
      }));
    }),

  /**
   * Check for booking conflicts before blocking a time slot
   */
  checkBlockConflicts: protectedProcedure
    .input(checkBlockConflictsSchema)
    .query(async ({ ctx, input }) => {
      const { facilityId, courtIds, date, startTime, endTime } = input;

      await verifyFacilityAccess(ctx, facilityId, "schedule:read");

      const dayStart = startOfDay(date);
      const dayEnd = addDays(dayStart, 1);

      // Find active bookings that overlap with the proposed block
      const conflicting = await ctx.db.query.bookings.findMany({
        where: and(
          eq(bookings.facilityId, facilityId),
          inArray(bookings.courtId, courtIds),
          gte(bookings.date, dayStart),
          lt(bookings.date, dayEnd),
          inArray(bookings.status, ["pending", "confirmed"]),
          // Overlap: booking.start < block.end AND booking.end > block.start
          lt(bookings.startTime, endTime),
          gte(bookings.endTime, startTime),
        ),
        with: {
          court: true,
        },
        orderBy: [asc(bookings.startTime)],
      });

      return {
        count: conflicting.length,
        bookings: conflicting.map((b) => ({
          id: b.id,
          code: b.code,
          courtName: b.court.name,
          startTime: b.startTime.substring(0, 5),
          endTime: b.endTime.substring(0, 5),
          customerName: b.customerName,
          status: b.status,
        })),
      };
    }),

  /**
   * Block a time slot
   */
  blockTimeSlot: protectedProcedure
    .input(blockTimeSlotSchema)
    .mutation(async ({ ctx, input }) => {
      const { facilityId, courtId, date, startTime, endTime, reason, notes } =
        input;

      await verifyFacilityAccess(ctx, facilityId, "schedule:write");

      // If courtId is provided, verify it belongs to the facility
      if (courtId) {
        const court = await ctx.db.query.courts.findFirst({
          where: and(eq(courts.id, courtId), eq(courts.facilityId, facilityId)),
        });

        if (!court) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Cancha no encontrada en este local",
          });
        }
      }

      const [created] = await ctx.db
        .insert(blockedSlots)
        .values({
          facilityId,
          courtId: courtId ?? null,
          date: startOfDay(date),
          startTime,
          endTime,
          reason,
          notes,
          createdBy: ctx.session.user.id,
        })
        .returning();

      return created;
    }),

  /**
   * Delete a blocked slot
   */
  deleteBlockedSlot: protectedProcedure
    .input(deleteBlockedSlotSchema)
    .mutation(async ({ ctx, input }) => {
      const { id } = input;

      // Get the blocked slot to verify access
      const slot = await ctx.db.query.blockedSlots.findFirst({
        where: eq(blockedSlots.id, id),
      });

      if (!slot) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bloqueo no encontrado",
        });
      }

      await verifyFacilityAccess(ctx, slot.facilityId, "schedule:write");

      await ctx.db.delete(blockedSlots).where(eq(blockedSlots.id, id));

      return { success: true };
    }),

  /**
   * Get full day overview (courts, hours, bookings, blocks, peaks)
   */
  getDayOverview: protectedProcedure
    .input(getDayOverviewSchema)
    .query(async ({ ctx, input }) => {
      const { facilityId, date } = input;

      await verifyFacilityAccess(ctx, facilityId, "schedule:read");

      const dayStart = startOfDay(date);
      const dayEnd = addDays(dayStart, 1);
      const dayOfWeek = getLimaDayOfWeek(date);

      // Fetch all data in parallel
      const [
        courtsList,
        operatingHoursList,
        peakPeriodsList,
        bookingsList,
        blockedSlotsList,
      ] = await Promise.all([
        ctx.db.query.courts.findMany({
          where: and(
            eq(courts.facilityId, facilityId),
            eq(courts.isActive, true),
          ),
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

      // Get operating hours for this day
      const dayHours = operatingHoursList.find(
        (h) => h.dayOfWeek === dayOfWeek,
      );
      const operatingHoursResult = dayHours
        ? {
            openTime: dayHours.openTime.substring(0, 5),
            closeTime: dayHours.closeTime.substring(0, 5),
            isClosed: dayHours.isClosed,
          }
        : { openTime: "08:00", closeTime: "22:00", isClosed: false };

      // Filter peak periods that apply to this day
      const applicablePeakPeriods = peakPeriodsList
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
        })),
        operatingHours: operatingHoursResult,
        peakPeriods: applicablePeakPeriods,
        bookings: bookingsList.map((b) => ({
          id: b.id,
          code: b.code,
          courtId: b.courtId,
          startTime: b.startTime.substring(0, 5),
          endTime: b.endTime.substring(0, 5),
          status: b.status,
          customerName: b.customerName ?? b.user?.name ?? null,
          isPeakRate: b.isPeakRate,
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
    }),
} satisfies TRPCRouterRecord;
