import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { addDays, startOfDay } from "date-fns";
import { and, count, eq, gte, lt } from "drizzle-orm";
import { z } from "zod/v4";

import { bookings, courts } from "@wifo/db/schema";

import { verifyFacilityAccess } from "../lib/access-control";
import { protectedProcedure } from "../trpc";

// =============================================================================
// Input Schemas
// =============================================================================

const facilityIdSchema = z.object({
  facilityId: z.string().uuid(),
});

const getByIdSchema = z.object({
  facilityId: z.string().uuid(),
  id: z.string().uuid(),
});

const createCourtSchema = z.object({
  facilityId: z.string().uuid(),
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(100),
  type: z.enum(["indoor", "outdoor"]),
  status: z.enum(["active", "maintenance", "inactive"]).default("active"),
  description: z.string().max(500).optional(),
  priceInCents: z.number().int().min(0).optional(),
  peakPriceInCents: z.number().int().min(0).optional(),
  imageUrl: z.string().url().optional(),
});

const updateCourtSchema = z.object({
  facilityId: z.string().uuid(),
  id: z.string().uuid(),
  data: z.object({
    name: z.string().min(2).max(100).optional(),
    type: z.enum(["indoor", "outdoor"]).optional(),
    status: z.enum(["active", "maintenance", "inactive"]).optional(),
    description: z.string().max(500).optional(),
    priceInCents: z.number().int().min(0).optional(),
    peakPriceInCents: z.number().int().min(0).optional(),
    imageUrl: z.string().url().optional(),
  }),
});

const updateStatusSchema = z.object({
  facilityId: z.string().uuid(),
  id: z.string().uuid(),
  status: z.enum(["active", "maintenance", "inactive"]),
});

const deleteCourtSchema = z.object({
  facilityId: z.string().uuid(),
  id: z.string().uuid(),
});

// =============================================================================
// Router
// =============================================================================

export const courtRouter = {
  /**
   * List all courts for a facility with today's bookings count
   */
  list: protectedProcedure.input(facilityIdSchema).query(async ({ ctx, input }) => {
    const { facilityId } = input;

    // Verify access with court:read permission
    await verifyFacilityAccess(ctx, facilityId, "court:read");

    // Get today's date range
    const today = startOfDay(new Date());
    const tomorrow = startOfDay(addDays(new Date(), 1));

    const courtsList = await ctx.db.query.courts.findMany({
      where: eq(courts.facilityId, facilityId),
      orderBy: (courts, { asc }) => [asc(courts.createdAt)],
    });

    // Get today's booking counts per court
    const bookingCounts = await ctx.db
      .select({
        courtId: bookings.courtId,
        count: count(),
      })
      .from(bookings)
      .where(
        and(
          eq(bookings.facilityId, facilityId),
          gte(bookings.date, today),
          lt(bookings.date, tomorrow),
        ),
      )
      .groupBy(bookings.courtId);

    // Create a map of court ID to booking count
    const countMap = new Map<string, number>();
    bookingCounts.forEach((bc) => {
      countMap.set(bc.courtId, bc.count);
    });

    return courtsList.map((court) => ({
      ...court,
      todayBookings: countMap.get(court.id) ?? 0,
    }));
  }),

  /**
   * Get aggregate stats for courts
   */
  getStats: protectedProcedure.input(facilityIdSchema).query(async ({ ctx, input }) => {
    const { facilityId } = input;

    // Verify access with court:read permission
    await verifyFacilityAccess(ctx, facilityId, "court:read");

    // Get today's date range
    const today = startOfDay(new Date());
    const tomorrow = startOfDay(addDays(new Date(), 1));

    const courtsList = await ctx.db.query.courts.findMany({
      where: eq(courts.facilityId, facilityId),
    });

    const total = courtsList.length;
    const active = courtsList.filter((c) => c.status === "active").length;
    const maintenance = courtsList.filter((c) => c.status === "maintenance").length;
    const inactive = courtsList.filter((c) => c.status === "inactive").length;

    // Get today's total bookings count
    const [bookingResult] = await ctx.db
      .select({ count: count() })
      .from(bookings)
      .where(
        and(
          eq(bookings.facilityId, facilityId),
          gte(bookings.date, today),
          lt(bookings.date, tomorrow),
        ),
      );

    return {
      total,
      active,
      maintenance,
      inactive,
      todayBookings: bookingResult?.count ?? 0,
    };
  }),

  /**
   * Get a single court by ID
   */
  getById: protectedProcedure.input(getByIdSchema).query(async ({ ctx, input }) => {
    const { facilityId, id } = input;

    // Verify access with court:read permission
    await verifyFacilityAccess(ctx, facilityId, "court:read");

    const court = await ctx.db.query.courts.findFirst({
      where: and(eq(courts.id, id), eq(courts.facilityId, facilityId)),
    });

    if (!court) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Cancha no encontrada",
      });
    }

    return court;
  }),

  /**
   * Create a new court
   */
  create: protectedProcedure.input(createCourtSchema).mutation(async ({ ctx, input }) => {
    const { facilityId, ...courtData } = input;

    // Verify access with court:write permission
    await verifyFacilityAccess(ctx, facilityId, "court:write");

    // Check court limit (max 10 per facility)
    const existingCourts = await ctx.db
      .select({ count: count() })
      .from(courts)
      .where(eq(courts.facilityId, facilityId));

    const courtCount = existingCourts[0]?.count ?? 0;
    if (courtCount >= 10) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Has alcanzado el límite de 10 canchas por local",
      });
    }

    const [court] = await ctx.db
      .insert(courts)
      .values({
        facilityId,
        name: courtData.name,
        type: courtData.type,
        status: courtData.status,
        description: courtData.description ?? null,
        priceInCents: courtData.priceInCents ?? null,
        peakPriceInCents: courtData.peakPriceInCents ?? null,
        imageUrl: courtData.imageUrl ?? null,
      })
      .returning();

    if (!court) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error al crear la cancha",
      });
    }

    return court;
  }),

  /**
   * Update a court
   */
  update: protectedProcedure.input(updateCourtSchema).mutation(async ({ ctx, input }) => {
    const { facilityId, id, data } = input;

    // Verify access with court:write permission
    await verifyFacilityAccess(ctx, facilityId, "court:write");

    // Verify court belongs to facility
    const existingCourt = await ctx.db.query.courts.findFirst({
      where: and(eq(courts.id, id), eq(courts.facilityId, facilityId)),
    });

    if (!existingCourt) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Cancha no encontrada",
      });
    }

    const [updatedCourt] = await ctx.db
      .update(courts)
      .set({
        ...data,
        description: data.description ?? existingCourt.description,
        priceInCents: data.priceInCents ?? existingCourt.priceInCents,
        peakPriceInCents: data.peakPriceInCents ?? existingCourt.peakPriceInCents,
        imageUrl: data.imageUrl ?? existingCourt.imageUrl,
      })
      .where(eq(courts.id, id))
      .returning();

    return updatedCourt;
  }),

  /**
   * Quick status toggle
   */
  updateStatus: protectedProcedure.input(updateStatusSchema).mutation(async ({ ctx, input }) => {
    const { facilityId, id, status } = input;

    // Verify access with court:write permission
    await verifyFacilityAccess(ctx, facilityId, "court:write");

    // Verify court belongs to facility
    const existingCourt = await ctx.db.query.courts.findFirst({
      where: and(eq(courts.id, id), eq(courts.facilityId, facilityId)),
    });

    if (!existingCourt) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Cancha no encontrada",
      });
    }

    const [updatedCourt] = await ctx.db
      .update(courts)
      .set({ status })
      .where(eq(courts.id, id))
      .returning();

    return updatedCourt;
  }),

  /**
   * Delete a court
   */
  delete: protectedProcedure.input(deleteCourtSchema).mutation(async ({ ctx, input }) => {
    const { facilityId, id } = input;

    // Verify access with court:write permission
    await verifyFacilityAccess(ctx, facilityId, "court:write");

    // Verify court belongs to facility
    const existingCourt = await ctx.db.query.courts.findFirst({
      where: and(eq(courts.id, id), eq(courts.facilityId, facilityId)),
    });

    if (!existingCourt) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Cancha no encontrada",
      });
    }

    await ctx.db.delete(courts).where(eq(courts.id, id));

    return { success: true };
  }),
} satisfies TRPCRouterRecord;
