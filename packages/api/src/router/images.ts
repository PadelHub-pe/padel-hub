import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod/v4";

import {
  courts,
  facilities,
  organizationMembers,
  organizations,
  user,
} from "@wifo/db/schema";
import {
  deleteImage,
  ENTITY_TYPES,
  getImageDetails,
  LIMITS,
  requestUploadUrl,
} from "@wifo/images";

import { verifyFacilityAccess } from "../lib/access-control";
import { protectedProcedure } from "../trpc";

// =============================================================================
// Input Schemas
// =============================================================================

const entityTypeSchema = z.enum(ENTITY_TYPES);

const entityInputSchema = z.object({
  entityType: entityTypeSchema,
  entityId: z.string(),
});

const confirmUploadSchema = z.object({
  entityType: entityTypeSchema,
  entityId: z.string(),
  imageId: z.string(),
  position: z.number().int().min(0).optional(),
});

const deleteInputSchema = z.object({
  entityType: entityTypeSchema,
  entityId: z.string(),
  imageId: z.string(),
});

const reorderSchema = z.object({
  entityType: entityTypeSchema,
  entityId: z.string(),
  imageIds: z.array(z.string()),
});

// =============================================================================
// Access Control Helpers
// =============================================================================

/**
 * Verify the current user has write access to the given entity.
 * Throws TRPCError on failure.
 */
async function verifyEntityWriteAccess(
  ctx: {
    db: Parameters<typeof verifyFacilityAccess>[0]["db"];
    session: { user: { id: string } };
  },
  entityType: (typeof ENTITY_TYPES)[number],
  entityId: string,
) {
  switch (entityType) {
    case "facility": {
      await verifyFacilityAccess(ctx, entityId, "facility:write");
      break;
    }

    case "court": {
      const court = await ctx.db.query.courts.findFirst({
        where: eq(courts.id, entityId),
        columns: { facilityId: true },
      });
      if (!court) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Cancha no encontrada",
        });
      }
      await verifyFacilityAccess(ctx, court.facilityId, "court:write");
      break;
    }

    case "organization": {
      const membership = await ctx.db.query.organizationMembers.findFirst({
        where: and(
          eq(organizationMembers.organizationId, entityId),
          eq(organizationMembers.userId, ctx.session.user.id),
        ),
      });
      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "No tienes acceso a esta organización",
        });
      }
      if (membership.role !== "org_admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Solo los administradores pueden modificar la organización",
        });
      }
      break;
    }

    case "user": {
      if (entityId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Solo puedes modificar tu propio perfil",
        });
      }
      break;
    }
  }
}

// =============================================================================
// DB Helpers
// =============================================================================

/**
 * Get the current photo IDs for an entity.
 * Returns an array for gallery entities (facility) and a single-element
 * array (or empty) for single-image entities.
 */
async function getCurrentImages(
  db: Parameters<typeof verifyFacilityAccess>[0]["db"],
  entityType: (typeof ENTITY_TYPES)[number],
  entityId: string,
): Promise<string[]> {
  switch (entityType) {
    case "facility": {
      const facility = await db.query.facilities.findFirst({
        where: eq(facilities.id, entityId),
        columns: { photos: true },
      });
      return facility?.photos ?? [];
    }
    case "court": {
      const court = await db.query.courts.findFirst({
        where: eq(courts.id, entityId),
        columns: { imageUrl: true },
      });
      return court?.imageUrl ? [court.imageUrl] : [];
    }
    case "organization": {
      const org = await db.query.organizations.findFirst({
        where: eq(organizations.id, entityId),
        columns: { logoUrl: true },
      });
      return org?.logoUrl ? [org.logoUrl] : [];
    }
    case "user": {
      const u = await db.query.user.findFirst({
        where: eq(user.id, entityId),
        columns: { image: true },
      });
      return u?.image ? [u.image] : [];
    }
  }
}

/**
 * Store image ID(s) in the appropriate entity column.
 */
async function storeImages(
  db: Parameters<typeof verifyFacilityAccess>[0]["db"],
  entityType: (typeof ENTITY_TYPES)[number],
  entityId: string,
  imageIds: string[],
) {
  switch (entityType) {
    case "facility": {
      await db
        .update(facilities)
        .set({ photos: imageIds })
        .where(eq(facilities.id, entityId));
      break;
    }
    case "court": {
      await db
        .update(courts)
        .set({ imageUrl: imageIds[0] ?? null })
        .where(eq(courts.id, entityId));
      break;
    }
    case "organization": {
      await db
        .update(organizations)
        .set({ logoUrl: imageIds[0] ?? null })
        .where(eq(organizations.id, entityId));
      break;
    }
    case "user": {
      await db
        .update(user)
        .set({ image: imageIds[0] ?? null })
        .where(eq(user.id, entityId));
      break;
    }
  }
}

// =============================================================================
// Router
// =============================================================================

export const imagesRouter = {
  /**
   * Get a one-time upload URL from Cloudflare for direct browser upload.
   */
  getUploadUrl: protectedProcedure
    .input(entityInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { entityType, entityId } = input;

      await verifyEntityWriteAccess(ctx, entityType, entityId);

      // Check max photos limit
      const current = await getCurrentImages(ctx.db, entityType, entityId);
      const maxPhotos = LIMITS.maxPhotos[entityType];
      if (current.length >= maxPhotos) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Has alcanzado el límite de ${String(maxPhotos)} ${maxPhotos === 1 ? "imagen" : "imágenes"}`,
        });
      }

      const result = await requestUploadUrl({
        entityType,
        entityId,
        uploadedBy: ctx.session.user.id,
      });

      return result;
    }),

  /**
   * Confirm an upload: validate the image exists in Cloudflare,
   * then store its ID in the entity's DB column.
   */
  confirmUpload: protectedProcedure
    .input(confirmUploadSchema)
    .mutation(async ({ ctx, input }) => {
      const { entityType, entityId, imageId, position } = input;

      await verifyEntityWriteAccess(ctx, entityType, entityId);

      // Validate image exists in Cloudflare
      await getImageDetails(imageId);

      const current = await getCurrentImages(ctx.db, entityType, entityId);
      const maxPhotos = LIMITS.maxPhotos[entityType];

      if (maxPhotos === 1) {
        // Single-image mode: replace existing (delete old from Cloudflare)
        const oldImageId = current[0];
        if (oldImageId && !oldImageId.startsWith("http")) {
          void deleteImage(oldImageId);
        }
        await storeImages(ctx.db, entityType, entityId, [imageId]);
      } else {
        // Gallery mode: append or insert at position
        if (current.length >= maxPhotos) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Has alcanzado el límite de ${String(maxPhotos)} imágenes`,
          });
        }
        const updated = [...current];
        if (position !== undefined && position <= updated.length) {
          updated.splice(position, 0, imageId);
        } else {
          updated.push(imageId);
        }
        await storeImages(ctx.db, entityType, entityId, updated);
      }

      return { success: true, imageId };
    }),

  /**
   * Delete an image: remove from DB column and delete from Cloudflare.
   */
  delete: protectedProcedure
    .input(deleteInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { entityType, entityId, imageId } = input;

      await verifyEntityWriteAccess(ctx, entityType, entityId);

      const current = await getCurrentImages(ctx.db, entityType, entityId);

      if (!current.includes(imageId)) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Imagen no encontrada",
        });
      }

      // Remove from DB
      const updated = current.filter((id) => id !== imageId);
      await storeImages(ctx.db, entityType, entityId, updated);

      // Delete from Cloudflare (fire-and-forget, non-throwing)
      if (!imageId.startsWith("http")) {
        void deleteImage(imageId);
      }

      return { success: true };
    }),

  /**
   * Reorder images for gallery-mode entities (e.g., facility photos).
   */
  reorder: protectedProcedure
    .input(reorderSchema)
    .mutation(async ({ ctx, input }) => {
      const { entityType, entityId, imageIds } = input;

      await verifyEntityWriteAccess(ctx, entityType, entityId);

      const maxPhotos = LIMITS.maxPhotos[entityType];
      if (maxPhotos === 1) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No se puede reordenar una sola imagen",
        });
      }

      // Validate the provided IDs match the current set
      const current = await getCurrentImages(ctx.db, entityType, entityId);
      const currentSet = new Set(current);
      const inputSet = new Set(imageIds);

      if (
        currentSet.size !== inputSet.size ||
        [...currentSet].some((id) => !inputSet.has(id))
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Las imágenes proporcionadas no coinciden con las existentes",
        });
      }

      await storeImages(ctx.db, entityType, entityId, imageIds);

      return { success: true };
    }),
} satisfies TRPCRouterRecord;
