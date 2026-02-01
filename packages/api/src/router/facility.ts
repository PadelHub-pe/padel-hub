import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";

import { facilities, ownerAccounts } from "@wifo/db/schema";

import { protectedProcedure } from "../trpc";

const updateProfileSchema = z.object({
  name: z.string().min(3).max(100),
  phone: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  description: z.string().optional(),
  address: z.object({
    street: z.string().min(1),
    district: z.string().min(1),
    city: z.string().min(1),
  }),
  amenities: z.array(z.string()),
});

export const facilityRouter = {
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const ownerAccount = await ctx.db.query.ownerAccounts.findFirst({
      where: eq(ownerAccounts.userId, userId),
      with: {
        facilities: {
          limit: 1,
        },
      },
    });

    const facility = ownerAccount?.facilities[0];

    if (!facility) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No se encontró el local",
      });
    }

    return {
      id: facility.id,
      name: facility.name,
      phone: facility.phone,
      email: facility.email ?? "",
      website: facility.website ?? "",
      description: facility.description ?? "",
      address: {
        street: facility.address,
        district: facility.district,
        city: facility.city,
      },
      amenities: facility.amenities ?? [],
      photos: facility.photos ?? [],
    };
  }),

  updateProfile: protectedProcedure
    .input(updateProfileSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const ownerAccount = await ctx.db.query.ownerAccounts.findFirst({
        where: eq(ownerAccounts.userId, userId),
        with: {
          facilities: {
            limit: 1,
          },
        },
      });

      const facility = ownerAccount?.facilities[0];

      if (!facility) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No se encontró el local",
        });
      }

      await ctx.db
        .update(facilities)
        .set({
          name: input.name,
          phone: input.phone,
          email: input.email ?? null,
          website: input.website ?? null,
          description: input.description ?? null,
          address: input.address.street,
          district: input.address.district,
          city: input.address.city,
          amenities: input.amenities,
        })
        .where(eq(facilities.id, facility.id));

      return { success: true };
    }),
} satisfies TRPCRouterRecord;
