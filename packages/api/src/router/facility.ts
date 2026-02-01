import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod/v4";

import { protectedProcedure } from "../trpc";

// Mock data for MVP - will be replaced with real database queries
const mockFacilityProfile = {
  id: "1",
  name: "Padel Club Miraflores",
  phone: "+51 1 234 5678",
  email: "info@padelclubmiraflores.pe",
  website: "https://padelclubmiraflores.pe",
  description:
    "Premium padel facility in the heart of Miraflores with 4 professional courts, cafe, and pro shop. Perfect for players of all levels.",
  address: {
    street: "Av. José Pardo 620",
    district: "Miraflores",
    city: "Lima",
  },
  amenities: ["parking", "indoor", "cafe", "showers", "lockers", "wifi"],
  photos: [] as string[],
};

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
  getProfile: protectedProcedure.query(() => {
    return mockFacilityProfile;
  }),

  updateProfile: protectedProcedure
    .input(updateProfileSchema)
    .mutation(({ input }) => {
      // For MVP, just log the update and return success
      console.log("[FACILITY] Profile update received:", input);

      // In production, this would update the database
      // await ctx.db.update(facilities).set(input).where(eq(facilities.id, facilityId))

      return { success: true };
    }),
} satisfies TRPCRouterRecord;
