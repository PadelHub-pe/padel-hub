import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { addDays, startOfDay } from "date-fns";
import { and, count, desc, eq, gte, ilike, lt, or } from "drizzle-orm";
import { z } from "zod/v4";

import { bookings, courts, CreateManualBookingSchema } from "@wifo/db/schema";

import { verifyFacilityAccess } from "../lib/access-control";
import { protectedProcedure } from "../trpc";

// =============================================================================
// Input Schemas
// =============================================================================

const listBookingsSchema = z.object({
  facilityId: z.string().uuid(),
  search: z.string().optional(),
  courtId: z.string().uuid().optional(),
  status: z
    .enum(["pending", "confirmed", "in_progress", "completed", "cancelled"])
    .optional(),
  date: z.date().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
});

const getByIdSchema = z.object({
  facilityId: z.string().uuid(),
  id: z.string().uuid(),
});

const confirmSchema = z.object({
  facilityId: z.string().uuid(),
  id: z.string().uuid(),
});

const cancelBookingSchema = z.object({
  facilityId: z.string().uuid(),
  id: z.string().uuid(),
  reason: z.string().max(500).optional(),
});

const updateStatusSchema = z.object({
  facilityId: z.string().uuid(),
  id: z.string().uuid(),
  status: z.enum(["pending", "confirmed", "in_progress", "completed", "cancelled"]),
});

const createManualSchema = CreateManualBookingSchema.extend({
  facilityId: z.string().uuid(),
});

const getStatsSchema = z.object({
  facilityId: z.string().uuid(),
});

// =============================================================================
// Helpers
// =============================================================================

/**
 * Generate a unique booking code in format PH-YYYY-XXXX
 */
function generateBookingCode(): string {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PH-${year}-${random}`;
}

// =============================================================================
// Router
// =============================================================================

export const bookingRouter = {
  /**
   * List all bookings for a facility with pagination and filters
   */
  list: protectedProcedure.input(listBookingsSchema).query(async ({ ctx, input }) => {
    const { facilityId, search, courtId, status, date, page, limit } = input;
    const offset = (page - 1) * limit;

    // Verify access with booking:read permission
    await verifyFacilityAccess(ctx, facilityId, "booking:read");

    // Build where conditions
    const conditions = [eq(bookings.facilityId, facilityId)];

    if (courtId) {
      conditions.push(eq(bookings.courtId, courtId));
    }

    if (status) {
      conditions.push(eq(bookings.status, status));
    }

    if (date) {
      const dayStart = startOfDay(date);
      const dayEnd = startOfDay(addDays(date, 1));
      conditions.push(gte(bookings.date, dayStart));
      conditions.push(lt(bookings.date, dayEnd));
    }

    if (search) {
      const searchPattern = `%${search}%`;
      const searchCondition = or(
        ilike(bookings.code, searchPattern),
        ilike(bookings.customerName, searchPattern),
        ilike(bookings.customerEmail, searchPattern),
        ilike(bookings.customerPhone, searchPattern),
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    const whereClause = and(...conditions);

    // Get total count
    const [totalResult] = await ctx.db
      .select({ count: count() })
      .from(bookings)
      .where(whereClause);
    const total = totalResult?.count ?? 0;

    // Get bookings with court info
    const bookingsList = await ctx.db.query.bookings.findMany({
      where: whereClause,
      with: {
        court: true,
        user: true,
      },
      orderBy: [desc(bookings.date), desc(bookings.createdAt)],
      limit,
      offset,
    });

    return {
      bookings: bookingsList,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }),

  /**
   * Get a single booking by ID
   */
  getById: protectedProcedure.input(getByIdSchema).query(async ({ ctx, input }) => {
    const { facilityId, id } = input;

    // Verify access with booking:read permission
    await verifyFacilityAccess(ctx, facilityId, "booking:read");

    const booking = await ctx.db.query.bookings.findFirst({
      where: and(eq(bookings.id, id), eq(bookings.facilityId, facilityId)),
      with: {
        court: true,
        user: true,
      },
    });

    if (!booking) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Reserva no encontrada",
      });
    }

    return booking;
  }),

  /**
   * Confirm a pending booking
   */
  confirm: protectedProcedure.input(confirmSchema).mutation(async ({ ctx, input }) => {
    const { facilityId, id } = input;

    // Verify access with booking:manage permission
    await verifyFacilityAccess(ctx, facilityId, "booking:manage");

    const booking = await ctx.db.query.bookings.findFirst({
      where: and(eq(bookings.id, id), eq(bookings.facilityId, facilityId)),
    });

    if (!booking) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Reserva no encontrada",
      });
    }

    if (booking.status !== "pending") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Solo se pueden confirmar reservas pendientes",
      });
    }

    const [updatedBooking] = await ctx.db
      .update(bookings)
      .set({
        status: "confirmed",
        confirmedAt: new Date(),
      })
      .where(eq(bookings.id, id))
      .returning();

    return updatedBooking;
  }),

  /**
   * Cancel a booking
   */
  cancel: protectedProcedure.input(cancelBookingSchema).mutation(async ({ ctx, input }) => {
    const { facilityId, id, reason } = input;

    // Verify access with booking:manage permission
    await verifyFacilityAccess(ctx, facilityId, "booking:manage");

    const booking = await ctx.db.query.bookings.findFirst({
      where: and(eq(bookings.id, id), eq(bookings.facilityId, facilityId)),
    });

    if (!booking) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Reserva no encontrada",
      });
    }

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

    const [updatedBooking] = await ctx.db
      .update(bookings)
      .set({
        status: "cancelled",
        cancelledBy: "owner",
        cancellationReason: reason ?? null,
        cancelledAt: new Date(),
      })
      .where(eq(bookings.id, id))
      .returning();

    return updatedBooking;
  }),

  /**
   * Update booking status
   */
  updateStatus: protectedProcedure.input(updateStatusSchema).mutation(async ({ ctx, input }) => {
    const { facilityId, id, status } = input;

    // Verify access with booking:manage permission
    await verifyFacilityAccess(ctx, facilityId, "booking:manage");

    const booking = await ctx.db.query.bookings.findFirst({
      where: and(eq(bookings.id, id), eq(bookings.facilityId, facilityId)),
    });

    if (!booking) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Reserva no encontrada",
      });
    }

    const updateData: Record<string, unknown> = { status };

    if (status === "confirmed" && !booking.confirmedAt) {
      updateData.confirmedAt = new Date();
    }

    if (status === "cancelled") {
      updateData.cancelledBy = "owner";
      updateData.cancelledAt = new Date();
    }

    const [updatedBooking] = await ctx.db
      .update(bookings)
      .set(updateData)
      .where(eq(bookings.id, id))
      .returning();

    return updatedBooking;
  }),

  /**
   * Create a manual booking (walk-in)
   */
  createManual: protectedProcedure.input(createManualSchema).mutation(async ({ ctx, input }) => {
    const { facilityId } = input;

    // Verify access with booking:write permission
    await verifyFacilityAccess(ctx, facilityId, "booking:write");

    // Verify court belongs to facility
    const court = await ctx.db.query.courts.findFirst({
      where: and(eq(courts.id, input.courtId), eq(courts.facilityId, facilityId)),
    });

    if (!court) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Cancha no encontrada",
      });
    }

    // Generate unique booking code
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

    const [booking] = await ctx.db
      .insert(bookings)
      .values({
        code,
        courtId: input.courtId,
        facilityId,
        date: input.date,
        startTime: input.startTime,
        endTime: input.endTime,
        priceInCents: input.priceInCents,
        isPeakRate: input.isPeakRate,
        paymentMethod: input.paymentMethod ?? null,
        customerName: input.customerName,
        customerPhone: input.customerPhone ?? null,
        customerEmail: input.customerEmail ?? null,
        notes: input.notes ?? null,
        isManualBooking: true,
        status: "confirmed",
        confirmedAt: new Date(),
      })
      .returning();

    return booking;
  }),

  /**
   * Get booking stats for dashboard
   */
  getStats: protectedProcedure.input(getStatsSchema).query(async ({ ctx, input }) => {
    const { facilityId } = input;

    // Verify access with booking:read permission
    await verifyFacilityAccess(ctx, facilityId, "booking:read");

    // Get today's date range
    const today = startOfDay(new Date());
    const tomorrow = addDays(today, 1);

    // Today's bookings count
    const [todayResult] = await ctx.db
      .select({ count: count() })
      .from(bookings)
      .where(
        and(
          eq(bookings.facilityId, facilityId),
          gte(bookings.date, today),
          lt(bookings.date, tomorrow),
        ),
      );

    // Pending bookings count
    const [pendingResult] = await ctx.db
      .select({ count: count() })
      .from(bookings)
      .where(and(eq(bookings.facilityId, facilityId), eq(bookings.status, "pending")));

    // Total bookings
    const [totalResult] = await ctx.db
      .select({ count: count() })
      .from(bookings)
      .where(eq(bookings.facilityId, facilityId));

    return {
      todayBookings: todayResult?.count ?? 0,
      pendingBookings: pendingResult?.count ?? 0,
      totalBookings: totalResult?.count ?? 0,
    };
  }),
} satisfies TRPCRouterRecord;
