import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";

import {
  courts,
  facilities,
  operatingHours,
  ownerAccounts,
  timeSlotTemplates,
} from "@wifo/db/schema";

import { protectedProcedure } from "../trpc";

// =============================================================================
// Input Schemas
// =============================================================================

const registerSchema = z.object({
  contactName: z.string().min(2, "El nombre de contacto debe tener al menos 2 caracteres").max(100),
  phone: z.string().min(6, "El teléfono debe tener al menos 6 caracteres").max(20),
});

const facilityInfoSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres").max(200),
  description: z.string().optional(),
  address: z.string().min(5, "La dirección debe tener al menos 5 caracteres").max(500),
  district: z.string().min(2, "El distrito es requerido").max(100),
  city: z.string().min(2).max(100).default("Lima"),
  phone: z.string().min(6, "El teléfono debe tener al menos 6 caracteres").max(20),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  website: z.string().url("URL inválida").optional().or(z.literal("")),
  amenities: z.array(z.string()).default([]),
});

const photosSchema = z.object({
  photos: z.array(z.string().url()).default([]),
});

const courtSchema = z.object({
  name: z.string().min(2, "El nombre de la cancha debe tener al menos 2 caracteres").max(100),
  type: z.enum(["indoor", "outdoor"]),
});

const courtsSchema = z.object({
  courts: z.array(courtSchema).min(1, "Debe agregar al menos una cancha").max(6, "Máximo 6 canchas"),
});

const operatingHourSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  openTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato de hora inválido"),
  closeTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato de hora inválido"),
  isClosed: z.boolean().default(false),
});

const scheduleSchema = z.object({
  operatingHours: z.array(operatingHourSchema).length(7, "Debe especificar horarios para los 7 días"),
  defaultDurationMinutes: z.enum(["60", "90", "120"]).transform(Number),
  defaultPriceInCents: z.number().min(100, "El precio debe ser mayor a S/ 1.00"),
});

// =============================================================================
// Router
// =============================================================================

export const ownerRouter = {
  /**
   * Register a new owner account after Better Auth signup
   */
  register: protectedProcedure.input(registerSchema).mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.id;

    // Check if owner account already exists
    const existingOwner = await ctx.db.query.ownerAccounts.findFirst({
      where: eq(ownerAccounts.userId, userId),
    });

    if (existingOwner) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Ya tienes una cuenta de propietario registrada",
      });
    }

    // Create owner account
    const [ownerAccount] = await ctx.db
      .insert(ownerAccounts)
      .values({
        userId,
        contactName: input.contactName,
        phone: input.phone,
      })
      .returning();

    if (!ownerAccount) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error al crear la cuenta de propietario",
      });
    }
    return { ownerId: ownerAccount.id };
  }),

  /**
   * Get the current user's onboarding status
   */
  getOnboardingStatus: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const ownerAccount = await ctx.db.query.ownerAccounts.findFirst({
      where: eq(ownerAccounts.userId, userId),
      with: {
        facilities: {
          limit: 1,
        },
      },
    });

    if (!ownerAccount) {
      return {
        hasOwnerAccount: false,
        onboardingCompletedAt: null,
        facilityId: null,
      };
    }

    return {
      hasOwnerAccount: true,
      onboardingCompletedAt: ownerAccount.onboardingCompletedAt,
      facilityId: ownerAccount.facilities[0]?.id ?? null,
    };
  }),

  /**
   * Step 1: Save facility basic information
   */
  saveFacilityInfo: protectedProcedure.input(facilityInfoSchema).mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.id;

    // Get owner account
    const ownerAccount = await ctx.db.query.ownerAccounts.findFirst({
      where: eq(ownerAccounts.userId, userId),
      with: {
        facilities: {
          limit: 1,
        },
      },
    });

    if (!ownerAccount) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No se encontró la cuenta de propietario",
      });
    }

    // Check if facility already exists (update) or create new
    const existingFacility = ownerAccount.facilities[0];

    if (existingFacility) {
      // Update existing facility
      await ctx.db
        .update(facilities)
        .set({
          name: input.name,
          description: input.description ?? null,
          address: input.address,
          district: input.district,
          city: input.city,
          phone: input.phone,
          email: input.email ?? null,
          website: input.website ?? null,
          amenities: input.amenities,
        })
        .where(eq(facilities.id, existingFacility.id));

      return { facilityId: existingFacility.id };
    }

    // Create new facility
    const slug = input.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const [facility] = await ctx.db
      .insert(facilities)
      .values({
        ownerId: ownerAccount.id,
        name: input.name,
        slug,
        description: input.description ?? null,
        address: input.address,
        district: input.district,
        city: input.city,
        phone: input.phone,
        email: input.email ?? null,
        website: input.website ?? null,
        amenities: input.amenities,
      })
      .returning();

    if (!facility) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error al crear el local",
      });
    }
    return { facilityId: facility.id };
  }),

  /**
   * Step 2: Save facility photos (optional)
   */
  savePhotos: protectedProcedure.input(photosSchema).mutation(async ({ ctx, input }) => {
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
        message: "No se encontró el local. Complete el paso 1 primero.",
      });
    }

    await ctx.db
      .update(facilities)
      .set({ photos: input.photos })
      .where(eq(facilities.id, ownerAccount.facilities[0].id));

    return { success: true };
  }),

  /**
   * Step 3: Save courts
   */
  saveCourts: protectedProcedure.input(courtsSchema).mutation(async ({ ctx, input }) => {
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
        message: "No se encontró el local. Complete el paso 1 primero.",
      });
    }

    const facilityId = ownerAccount.facilities[0].id;

    // Delete existing courts for this facility
    await ctx.db.delete(courts).where(eq(courts.facilityId, facilityId));

    // Insert new courts
    const createdCourts = await ctx.db
      .insert(courts)
      .values(
        input.courts.map((court) => ({
          facilityId,
          name: court.name,
          type: court.type,
        }))
      )
      .returning();

    return { courtIds: createdCourts.map((c) => c.id) };
  }),

  /**
   * Step 4: Save operating hours and pricing
   */
  saveSchedule: protectedProcedure.input(scheduleSchema).mutation(async ({ ctx, input }) => {
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
        message: "No se encontró el local. Complete el paso 1 primero.",
      });
    }

    const facilityId = ownerAccount.facilities[0].id;

    // Delete existing operating hours
    await ctx.db.delete(operatingHours).where(eq(operatingHours.facilityId, facilityId));

    // Insert new operating hours
    await ctx.db.insert(operatingHours).values(
      input.operatingHours.map((oh) => ({
        facilityId,
        dayOfWeek: oh.dayOfWeek,
        openTime: oh.openTime,
        closeTime: oh.closeTime,
        isClosed: oh.isClosed,
      }))
    );

    // Delete existing time slot templates
    await ctx.db.delete(timeSlotTemplates).where(eq(timeSlotTemplates.facilityId, facilityId));

    // Create default time slot templates for each day (applies to all courts)
    // For simplicity in MVP, create one template per day for the entire operating period
    const templates = input.operatingHours
      .filter((oh) => !oh.isClosed)
      .map((oh) => ({
        facilityId,
        courtId: null,
        dayOfWeek: oh.dayOfWeek,
        startTime: oh.openTime,
        endTime: oh.closeTime,
        durationMinutes: input.defaultDurationMinutes,
        priceInCents: input.defaultPriceInCents,
      }));

    if (templates.length > 0) {
      await ctx.db.insert(timeSlotTemplates).values(templates);
    }

    return { success: true };
  }),

  /**
   * Complete onboarding - mark as done and activate facility
   */
  completeOnboarding: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const ownerAccount = await ctx.db.query.ownerAccounts.findFirst({
      where: eq(ownerAccounts.userId, userId),
      with: {
        facilities: {
          limit: 1,
          with: {
            courts: true,
            operatingHours: true,
          },
        },
      },
    });

    if (!ownerAccount) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No se encontró la cuenta de propietario",
      });
    }

    const facility = ownerAccount.facilities[0];
    if (!facility) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Debe completar la información del local primero",
      });
    }

    if (facility.courts.length === 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Debe agregar al menos una cancha",
      });
    }

    if (facility.operatingHours.length === 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Debe configurar los horarios de operación",
      });
    }

    // Mark onboarding as complete and activate facility
    await Promise.all([
      ctx.db
        .update(ownerAccounts)
        .set({ onboardingCompletedAt: new Date() })
        .where(eq(ownerAccounts.id, ownerAccount.id)),
      ctx.db
        .update(facilities)
        .set({ isActive: true })
        .where(eq(facilities.id, facility.id)),
    ]);

    return { success: true, facilityId: facility.id };
  }),

  /**
   * Get facility data for the current owner (used by dashboard)
   */
  getFacility: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const ownerAccount = await ctx.db.query.ownerAccounts.findFirst({
      where: eq(ownerAccounts.userId, userId),
      with: {
        facilities: {
          limit: 1,
          with: {
            courts: true,
            operatingHours: true,
          },
        },
      },
    });

    if (!ownerAccount?.facilities[0]) {
      return null;
    }

    return ownerAccount.facilities[0];
  }),
} satisfies TRPCRouterRecord;
