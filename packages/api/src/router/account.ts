import type { TRPCRouterRecord } from "@trpc/server";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod/v4";

import { facilities, organizationMembers, user } from "@wifo/db/schema";

import { protectedProcedure } from "../trpc";

// =============================================================================
// Input Schemas
// =============================================================================

const updateMyProfileSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100),
});

// =============================================================================
// Router
// =============================================================================

export const accountRouter = {
  /**
   * Get current user's profile with organization membership info
   */
  getMyProfile: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    // Get user info
    const userRow = await ctx.db.query.user.findFirst({
      where: eq(user.id, userId),
      columns: { id: true, name: true, email: true, image: true },
    });

    if (!userRow) {
      throw new Error("User not found");
    }

    // Get organization membership with org details
    const membership = await ctx.db.query.organizationMembers.findFirst({
      where: eq(organizationMembers.userId, userId),
      with: {
        organization: {
          columns: { id: true, name: true, slug: true, logoUrl: true },
        },
      },
    });

    // Get facility names for assigned facilities
    let facilityNames: string[] = [];
    const facilityIds = membership?.facilityIds ?? [];
    if (facilityIds.length > 0) {
      const assignedFacilities = await ctx.db
        .select({ id: facilities.id, name: facilities.name })
        .from(facilities)
        .where(inArray(facilities.id, facilityIds));
      facilityNames = assignedFacilities.map((f) => f.name);
    }

    return {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      image: userRow.image,
      organization: membership
        ? {
            id: membership.organization.id,
            name: membership.organization.name,
            slug: membership.organization.slug,
            logoUrl: membership.organization.logoUrl,
          }
        : null,
      role: membership?.role ?? null,
      facilityIds,
      facilityNames,
    };
  }),

  /**
   * Update current user's profile (name only for now)
   */
  updateMyProfile: protectedProcedure
    .input(updateMyProfileSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      await ctx.db
        .update(user)
        .set({ name: input.name })
        .where(eq(user.id, userId));

      return { success: true };
    }),
} satisfies TRPCRouterRecord;
