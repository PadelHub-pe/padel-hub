import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { addDays, startOfDay } from "date-fns";
import { and, count, desc, eq, gte, ilike, lt, or } from "drizzle-orm";
import { z } from "zod/v4";

import type { db as DbType } from "@wifo/db/client";
import {
  bookings,
  courts,
  CreateManualBookingSchema,
  ownerAccounts,
} from "@wifo/db/schema";

import { protectedProcedure } from "../trpc";

// =============================================================================
// Input Schemas
// =============================================================================

const listBookingsSchema = z.object({
  search: z.string().optional(),
  courtId: z.string().uuid().optional(),
  status: z
    .enum(["pending", "confirmed", "in_progress", "completed", "cancelled"])
    .optional(),
  date: z.date().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
});

const cancelBookingSchema = z.object({
  id: z.string().uuid(),
  reason: z.string().max(500).optional(),
});

// =============================================================================
// Helpers
// =============================================================================

async function getOwnerFacility(ctx: {
  db: typeof DbType;
  session: { user: { id: string } };
}) {
  const userId = ctx.session.user.id;

  const ownerAccount = await ctx.db.query.ownerAccounts.findFirst({
    where: eq(ownerAccounts.userId, userId),
    with: {
      facilities: {
        limit: 1,
      },
    },
  });

  if (!ownerAccount?.facilities[0]) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "No se encontró el local",
    });
  }

  return {
    ownerId: ownerAccount.id,
    facilityId: ownerAccount.facilities[0].id,
  };
}

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
   * List all bookings for the owner's facility with pagination and filters
   */
  list: protectedProcedure.input(listBookingsSchema).query(async ({ ctx, input }) => {
    const { facilityId } = await getOwnerFacility(ctx);
    const { search, courtId, status, date, page, limit } = input;
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [eq(bookings.facilityId, facilityId)];

    if (courtId) {
      conditions.push(eq(bookings.courtId, courtId));
    }

    if (status) {
      conditions.push(eq(bookings.status, status));
    }

    if (date) {
      // Filter by date (same day) using date-fns
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
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { facilityId } = await getOwnerFacility(ctx);

      const booking = await ctx.db.query.bookings.findFirst({
        where: and(eq(bookings.id, input.id), eq(bookings.facilityId, facilityId)),
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
  confirm: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { facilityId } = await getOwnerFacility(ctx);

      const booking = await ctx.db.query.bookings.findFirst({
        where: and(eq(bookings.id, input.id), eq(bookings.facilityId, facilityId)),
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
        .where(eq(bookings.id, input.id))
        .returning();

      return updatedBooking;
    }),

  /**
   * Cancel a booking
   */
  cancel: protectedProcedure.input(cancelBookingSchema).mutation(async ({ ctx, input }) => {
    const { facilityId } = await getOwnerFacility(ctx);

    const booking = await ctx.db.query.bookings.findFirst({
      where: and(eq(bookings.id, input.id), eq(bookings.facilityId, facilityId)),
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
        cancellationReason: input.reason ?? null,
        cancelledAt: new Date(),
      })
      .where(eq(bookings.id, input.id))
      .returning();

    return updatedBooking;
  }),

  /**
   * Update booking status
   */
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: z.enum(["pending", "confirmed", "in_progress", "completed", "cancelled"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { facilityId } = await getOwnerFacility(ctx);

      const booking = await ctx.db.query.bookings.findFirst({
        where: and(eq(bookings.id, input.id), eq(bookings.facilityId, facilityId)),
      });

      if (!booking) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Reserva no encontrada",
        });
      }

      const updateData: Record<string, unknown> = { status: input.status };

      if (input.status === "confirmed" && !booking.confirmedAt) {
        updateData.confirmedAt = new Date();
      }

      if (input.status === "cancelled") {
        updateData.cancelledBy = "owner";
        updateData.cancelledAt = new Date();
      }

      const [updatedBooking] = await ctx.db
        .update(bookings)
        .set(updateData)
        .where(eq(bookings.id, input.id))
        .returning();

      return updatedBooking;
    }),

  /**
   * Create a manual booking (walk-in)
   */
  createManual: protectedProcedure
    .input(CreateManualBookingSchema)
    .mutation(async ({ ctx, input }) => {
      const { facilityId } = await getOwnerFacility(ctx);

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
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const { facilityId } = await getOwnerFacility(ctx);

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

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
