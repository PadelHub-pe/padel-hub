import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";

import {
  courts,
  facilities,
  operatingHours,
  timeSlotTemplates,
} from "@wifo/db/schema";

import { verifyFacilityAccess } from "../lib/access-control";
import { protectedProcedure } from "../trpc";

// =============================================================================
// Input Schemas
// =============================================================================

const getProfileSchema = z.object({
  facilityId: z.string().uuid(),
});

const updateProfileSchema = z.object({
  facilityId: z.string().uuid(),
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

// Setup wizard schemas
const saveCourtsSchema = z.object({
  facilityId: z.string().uuid(),
  courts: z
    .array(
      z.object({
        name: z
          .string()
          .min(2, "El nombre de la cancha debe tener al menos 2 caracteres")
          .max(100),
        type: z.enum(["indoor", "outdoor"]),
      }),
    )
    .min(1, "Debe agregar al menos una cancha")
    .max(6, "Máximo 6 canchas"),
});

const operatingHourSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  openTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato de hora inválido"),
  closeTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato de hora inválido"),
  isClosed: z.boolean().default(false),
});

const saveScheduleSchema = z.object({
  facilityId: z.string().uuid(),
  operatingHours: z
    .array(operatingHourSchema)
    .length(7, "Debe especificar horarios para los 7 días"),
  defaultDurationMinutes: z.enum(["60", "90", "120"]).transform(Number),
  defaultPriceInCents: z
    .number()
    .min(100, "El precio debe ser mayor a S/ 1.00"),
});

const completeSetupSchema = z.object({
  facilityId: z.string().uuid(),
});

// =============================================================================
// Router
// =============================================================================

export const facilityRouter = {
  /**
   * Get facility profile
   */
  getProfile: protectedProcedure
    .input(getProfileSchema)
    .query(async ({ ctx, input }) => {
      const { facilityId } = input;

      // Verify access with facility:read permission
      const { facility } = await verifyFacilityAccess(
        ctx,
        facilityId,
        "facility:read",
      );

      // Get court counts by type
      const facilityCourts = await ctx.db.query.courts.findMany({
        where: eq(courts.facilityId, facilityId),
        columns: { id: true, type: true },
      });

      const courtCount = facilityCourts.length;
      const indoorCount = facilityCourts.filter(
        (c) => c.type === "indoor",
      ).length;
      const outdoorCount = facilityCourts.filter(
        (c) => c.type === "outdoor",
      ).length;

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
        isActive: facility.isActive,
        onboardingCompletedAt: facility.onboardingCompletedAt,
        courtCount,
        indoorCount,
        outdoorCount,
      };
    }),

  /**
   * Update facility profile
   */
  updateProfile: protectedProcedure
    .input(updateProfileSchema)
    .mutation(async ({ ctx, input }) => {
      const { facilityId, ...profileData } = input;

      // Verify access with facility:write permission
      await verifyFacilityAccess(ctx, facilityId, "facility:write");

      await ctx.db
        .update(facilities)
        .set({
          name: profileData.name,
          phone: profileData.phone,
          email: profileData.email ?? null,
          website: profileData.website ?? null,
          description: profileData.description ?? null,
          address: profileData.address.street,
          district: profileData.address.district,
          city: profileData.address.city,
          amenities: profileData.amenities,
        })
        .where(eq(facilities.id, facilityId));

      return { success: true };
    }),

  // ==========================================================================
  // Setup Wizard Procedures
  // ==========================================================================

  /**
   * Get facility setup status
   * Returns completion state for each setup step
   */
  getSetupStatus: protectedProcedure
    .input(z.object({ facilityId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { facilityId } = input;

      // Verify access
      const { facility } = await verifyFacilityAccess(
        ctx,
        facilityId,
        "facility:read",
      );

      // Get courts with pricing info
      const facilityCourts = await ctx.db.query.courts.findMany({
        where: eq(courts.facilityId, facilityId),
        columns: { id: true, priceInCents: true },
      });

      // Get operating hours count
      const facilityHours = await ctx.db.query.operatingHours.findMany({
        where: eq(operatingHours.facilityId, facilityId),
        columns: { id: true },
      });

      const hasCourts = facilityCourts.length > 0;
      const hasSchedule = facilityHours.length > 0;
      const hasPricing =
        hasCourts &&
        facilityCourts.every(
          (c) => c.priceInCents !== null && c.priceInCents > 0,
        );
      const hasPhotos = (facility.photos ?? []).length > 0;
      const hasAmenities = (facility.amenities ?? []).length > 0;
      const isComplete = facility.onboardingCompletedAt !== null;

      // P0 steps: courts, schedule, pricing
      const completedSteps =
        (hasCourts ? 1 : 0) + (hasSchedule ? 1 : 0) + (hasPricing ? 1 : 0);
      const totalSteps = 3;
      const canActivate = hasCourts && hasSchedule && hasPricing;

      return {
        isComplete,
        onboardingCompletedAt: facility.onboardingCompletedAt,
        hasCourts,
        hasSchedule,
        hasPricing,
        hasPhotos,
        hasAmenities,
        completedSteps,
        totalSteps,
        canActivate,
        steps: {
          courts: {
            completed: hasCourts,
            count: facilityCourts.length,
          },
          schedule: {
            completed: hasSchedule,
            count: facilityHours.length,
          },
        },
      };
    }),

  /**
   * Save courts during setup
   * Replaces existing courts with new ones
   */
  saveCourts: protectedProcedure
    .input(saveCourtsSchema)
    .mutation(async ({ ctx, input }) => {
      const { facilityId, courts: courtList } = input;

      // Verify access with court:write permission
      await verifyFacilityAccess(ctx, facilityId, "court:write");

      // Delete existing courts for this facility
      await ctx.db.delete(courts).where(eq(courts.facilityId, facilityId));

      // Insert new courts
      const createdCourts = await ctx.db
        .insert(courts)
        .values(
          courtList.map((court) => ({
            facilityId,
            name: court.name,
            type: court.type,
          })),
        )
        .returning();

      return { courtIds: createdCourts.map((c) => c.id) };
    }),

  /**
   * Save operating hours and default pricing during setup
   */
  saveSchedule: protectedProcedure
    .input(saveScheduleSchema)
    .mutation(async ({ ctx, input }) => {
      const {
        facilityId,
        operatingHours: hours,
        defaultDurationMinutes,
        defaultPriceInCents,
      } = input;

      // Verify access with schedule:write permission
      await verifyFacilityAccess(ctx, facilityId, "schedule:write");

      // Delete existing operating hours
      await ctx.db
        .delete(operatingHours)
        .where(eq(operatingHours.facilityId, facilityId));

      // Insert new operating hours
      await ctx.db.insert(operatingHours).values(
        hours.map((oh) => ({
          facilityId,
          dayOfWeek: oh.dayOfWeek,
          openTime: oh.openTime,
          closeTime: oh.closeTime,
          isClosed: oh.isClosed,
        })),
      );

      // Delete existing time slot templates
      await ctx.db
        .delete(timeSlotTemplates)
        .where(eq(timeSlotTemplates.facilityId, facilityId));

      // Create default time slot templates for each open day
      const templates = hours
        .filter((oh) => !oh.isClosed)
        .map((oh) => ({
          facilityId,
          courtId: null,
          dayOfWeek: oh.dayOfWeek,
          startTime: oh.openTime,
          endTime: oh.closeTime,
          durationMinutes: defaultDurationMinutes,
          priceInCents: defaultPriceInCents,
        }));

      if (templates.length > 0) {
        await ctx.db.insert(timeSlotTemplates).values(templates);
      }

      return { success: true };
    }),

  /**
   * Complete facility setup
   * Marks the facility as ready and activates it
   */
  completeSetup: protectedProcedure
    .input(completeSetupSchema)
    .mutation(async ({ ctx, input }) => {
      const { facilityId } = input;

      // Verify access with facility:write permission
      const { facility } = await verifyFacilityAccess(
        ctx,
        facilityId,
        "facility:write",
      );

      // Check that courts exist
      const facilityCourts = await ctx.db.query.courts.findMany({
        where: eq(courts.facilityId, facilityId),
        columns: { id: true },
      });

      if (facilityCourts.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Debe agregar al menos una cancha antes de completar la configuración",
        });
      }

      // Check that operating hours exist
      const facilityHours = await ctx.db.query.operatingHours.findMany({
        where: eq(operatingHours.facilityId, facilityId),
        columns: { id: true },
      });

      if (facilityHours.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Debe configurar los horarios de operación antes de completar la configuración",
        });
      }

      // Mark facility as complete and active
      await ctx.db
        .update(facilities)
        .set({
          onboardingCompletedAt: new Date(),
          isActive: true,
        })
        .where(eq(facilities.id, facilityId));

      return { success: true, facilityId: facility.id };
    }),
} satisfies TRPCRouterRecord;
