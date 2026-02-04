import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { and, count, eq } from "drizzle-orm";
import { z } from "zod/v4";

import type { db as DbType } from "@wifo/db/client";
import { courts, ownerAccounts } from "@wifo/db/schema";

import { protectedProcedure } from "../trpc";

// =============================================================================
// Input Schemas
// =============================================================================

const createCourtSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(100),
  type: z.enum(["indoor", "outdoor"]),
  status: z.enum(["active", "maintenance", "inactive"]).default("active"),
  description: z.string().max(500).optional(),
  priceInCents: z.number().int().min(0).optional(),
  peakPriceInCents: z.number().int().min(0).optional(),
  imageUrl: z.string().url().optional(),
});

const updateCourtSchema = createCourtSchema.partial();

const updateStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["active", "maintenance", "inactive"]),
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

// =============================================================================
// Router
// =============================================================================

export const courtRouter = {
  /**
   * List all courts for the owner's facility with today's bookings count
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const { facilityId } = await getOwnerFacility(ctx);

    const courtsList = await ctx.db.query.courts.findMany({
      where: eq(courts.facilityId, facilityId),
      orderBy: (courts, { asc }) => [asc(courts.createdAt)],
    });

    // TODO: Add todayBookings count when bookings table exists
    // For now, return mock data
    return courtsList.map((court) => ({
      ...court,
      todayBookings: Math.floor(Math.random() * 15), // Mock data
    }));
  }),

  /**
   * Get aggregate stats for courts
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const { facilityId } = await getOwnerFacility(ctx);

    const courtsList = await ctx.db.query.courts.findMany({
      where: eq(courts.facilityId, facilityId),
    });

    const total = courtsList.length;
    const active = courtsList.filter((c) => c.status === "active").length;
    const maintenance = courtsList.filter((c) => c.status === "maintenance").length;
    const inactive = courtsList.filter((c) => c.status === "inactive").length;

    // TODO: Get real bookings count when bookings table exists
    const todayBookings = Math.floor(Math.random() * 30) + 10; // Mock data

    return {
      total,
      active,
      maintenance,
      inactive,
      todayBookings,
    };
  }),

  /**
   * Get a single court by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { facilityId } = await getOwnerFacility(ctx);

      const court = await ctx.db.query.courts.findFirst({
        where: and(eq(courts.id, input.id), eq(courts.facilityId, facilityId)),
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
    const { facilityId } = await getOwnerFacility(ctx);

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
        name: input.name,
        type: input.type,
        status: input.status,
        description: input.description ?? null,
        priceInCents: input.priceInCents ?? null,
        peakPriceInCents: input.peakPriceInCents ?? null,
        imageUrl: input.imageUrl ?? null,
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
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        data: updateCourtSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { facilityId } = await getOwnerFacility(ctx);

      // Verify court belongs to facility
      const existingCourt = await ctx.db.query.courts.findFirst({
        where: and(eq(courts.id, input.id), eq(courts.facilityId, facilityId)),
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
          ...input.data,
          description: input.data.description ?? existingCourt.description,
          priceInCents: input.data.priceInCents ?? existingCourt.priceInCents,
          peakPriceInCents: input.data.peakPriceInCents ?? existingCourt.peakPriceInCents,
          imageUrl: input.data.imageUrl ?? existingCourt.imageUrl,
        })
        .where(eq(courts.id, input.id))
        .returning();

      return updatedCourt;
    }),

  /**
   * Quick status toggle
   */
  updateStatus: protectedProcedure.input(updateStatusSchema).mutation(async ({ ctx, input }) => {
    const { facilityId } = await getOwnerFacility(ctx);

    // Verify court belongs to facility
    const existingCourt = await ctx.db.query.courts.findFirst({
      where: and(eq(courts.id, input.id), eq(courts.facilityId, facilityId)),
    });

    if (!existingCourt) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Cancha no encontrada",
      });
    }

    const [updatedCourt] = await ctx.db
      .update(courts)
      .set({ status: input.status })
      .where(eq(courts.id, input.id))
      .returning();

    return updatedCourt;
  }),

  /**
   * Delete a court
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { facilityId } = await getOwnerFacility(ctx);

      // Verify court belongs to facility
      const existingCourt = await ctx.db.query.courts.findFirst({
        where: and(eq(courts.id, input.id), eq(courts.facilityId, facilityId)),
      });

      if (!existingCourt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Cancha no encontrada",
        });
      }

      await ctx.db.delete(courts).where(eq(courts.id, input.id));

      return { success: true };
    }),
} satisfies TRPCRouterRecord;
