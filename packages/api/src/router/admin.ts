import { randomBytes } from "crypto";
import { TRPCError } from "@trpc/server";
import { and, count, eq, ilike, or, sql } from "drizzle-orm";
import { z } from "zod/v4";

import {
  accessRequests,
  facilities,
  organizationInvites,
  organizations,
  user,
} from "@wifo/db/schema";
import { sendAccessRequestApproval } from "@wifo/email";

import { insertDefaultOperatingHours } from "../lib/default-operating-hours";
import {
  generateUniqueFacilitySlug,
  generateUniqueOrgSlug,
} from "../lib/slugify";
import { adminProcedure, createTRPCRouter } from "../trpc";

export const adminRouter = createTRPCRouter({
  /**
   * Platform overview stats
   */
  getStats: adminProcedure.query(async ({ ctx }) => {
    const [orgsResult] = await ctx.db
      .select({ count: count() })
      .from(organizations);
    const [facilitiesResult] = await ctx.db
      .select({ count: count() })
      .from(facilities);
    const [usersResult] = await ctx.db.select({ count: count() }).from(user);
    const [pendingResult] = await ctx.db
      .select({ count: count() })
      .from(accessRequests)
      .where(eq(accessRequests.status, "pending"));

    return {
      totalOrganizations: orgsResult?.count ?? 0,
      totalFacilities: facilitiesResult?.count ?? 0,
      totalUsers: usersResult?.count ?? 0,
      pendingRequests: pendingResult?.count ?? 0,
    };
  }),

  /**
   * List access requests with filtering and pagination
   */
  listAccessRequests: adminProcedure
    .input(
      z.object({
        status: z.enum(["pending", "approved", "rejected"]).optional(),
        search: z.string().max(100).optional(),
        limit: z.number().int().min(1).max(100).default(50),
        offset: z.number().int().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];

      if (input.status) {
        conditions.push(eq(accessRequests.status, input.status));
      }

      if (input.search) {
        const pattern = `%${input.search}%`;
        conditions.push(
          or(
            ilike(accessRequests.email, pattern),
            ilike(accessRequests.name, pattern),
            ilike(accessRequests.facilityName, pattern),
          ),
        );
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const [items, [totalResult]] = await Promise.all([
        ctx.db.query.accessRequests.findMany({
          where,
          orderBy: (ar, { desc }) => [desc(ar.createdAt)],
          limit: input.limit,
          offset: input.offset,
          with: {
            reviewer: true,
          },
        }),
        ctx.db.select({ count: count() }).from(accessRequests).where(where),
      ]);

      return {
        items: items.map((item) => ({
          ...item,
          reviewerName: item.reviewer?.name ?? null,
        })),
        total: totalResult?.count ?? 0,
      };
    }),

  /**
   * Approve an access request:
   * 1. Create org
   * 2. Create facility shell
   * 3. Create invite
   * 4. Mark approved
   */
  approveAccessRequest: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        organizationName: z.string().min(2).max(200),
        facilityName: z.string().min(2).max(200),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const result = await ctx.db.transaction(async (tx) => {
        // Fetch and lock the access request inside the transaction
        const request = await tx.query.accessRequests.findFirst({
          where: eq(accessRequests.id, input.id),
        });

        if (!request) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Solicitud no encontrada",
          });
        }

        if (request.status !== "pending") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Solo se pueden aprobar solicitudes pendientes",
          });
        }

        // Mark approved first to prevent double-approval race condition
        await tx
          .update(accessRequests)
          .set({
            status: "approved",
            reviewedAt: new Date(),
            reviewedBy: ctx.session.user.id,
          })
          .where(
            and(
              eq(accessRequests.id, input.id),
              eq(accessRequests.status, "pending"),
            ),
          );

        // Generate unique slug for organization
        const slug = await generateUniqueOrgSlug(tx, input.organizationName);

        // 1. Create organization
        const [org] = await tx
          .insert(organizations)
          .values({
            name: input.organizationName,
            slug,
            contactEmail: request.email,
            contactPhone: request.phone,
            isActive: true,
          })
          .returning();

        if (!org) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Error al crear organización",
          });
        }

        // 2. Create facility shell (inactive, needs setup)
        const facilitySlug = await generateUniqueFacilitySlug(
          tx,
          org.id,
          input.facilityName,
        );
        const [facility] = await tx
          .insert(facilities)
          .values({
            organizationId: org.id,
            name: input.facilityName,
            slug: facilitySlug,
            address: "Por configurar",
            district: request.district ?? "Lima",
            city: "Lima",
            phone: request.phone ?? "",
            email: request.email,
            isActive: false,
          })
          .returning();

        // Insert default operating hours (Mon-Sun 07:00-22:00)
        if (facility) {
          await insertDefaultOperatingHours(tx, facility.id);
        }

        // 3. Create invite (org_admin, 7 days)
        await tx.insert(organizationInvites).values({
          organizationId: org.id,
          email: request.email,
          role: "org_admin",
          facilityIds: [],
          status: "pending",
          invitedBy: ctx.session.user.id,
          token,
          expiresAt,
        });

        return { orgSlug: slug, email: request.email };
      });

      // Send email outside transaction to avoid long-running TX
      const emailResult = await sendAccessRequestApproval({
        email: result.email,
        organizationName: input.organizationName,
        inviteToken: token,
      });

      if (!emailResult.success) {
        console.error(
          `[admin] Failed to send approval email to ${result.email}: ${emailResult.error}`,
        );
      }

      return { orgSlug: result.orgSlug, inviteToken: token };
    }),

  /**
   * Reject an access request with optional notes
   */
  rejectAccessRequest: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        notes: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const request = await ctx.db.query.accessRequests.findFirst({
        where: eq(accessRequests.id, input.id),
      });

      if (!request) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Solicitud no encontrada",
        });
      }

      if (request.status !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Solo se pueden rechazar solicitudes pendientes",
        });
      }

      await ctx.db
        .update(accessRequests)
        .set({
          status: "rejected",
          reviewedAt: new Date(),
          reviewedBy: ctx.session.user.id,
          notes: input.notes ?? null,
        })
        .where(eq(accessRequests.id, input.id));

      return { success: true };
    }),

  /**
   * List all organizations with member/facility counts
   */
  listOrganizations: adminProcedure
    .input(
      z.object({
        search: z.string().max(100).optional(),
        limit: z.number().int().min(1).max(100).default(50),
        offset: z.number().int().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];

      if (input.search) {
        const pattern = `%${input.search}%`;
        conditions.push(
          or(
            ilike(organizations.name, pattern),
            ilike(organizations.slug, pattern),
            ilike(organizations.contactEmail, pattern),
          ),
        );
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const orgs = await ctx.db
        .select({
          id: organizations.id,
          name: organizations.name,
          slug: organizations.slug,
          contactEmail: organizations.contactEmail,
          isActive: organizations.isActive,
          createdAt: organizations.createdAt,
          memberCount: sql<number>`(
            SELECT count(*)::int FROM organization_members
            WHERE organization_members.organization_id = ${organizations.id}
          )`,
          facilityCount: sql<number>`(
            SELECT count(*)::int FROM facilities
            WHERE facilities.organization_id = ${organizations.id}
          )`,
        })
        .from(organizations)
        .where(where)
        .orderBy(organizations.createdAt)
        .limit(input.limit)
        .offset(input.offset);

      const [totalResult] = await ctx.db
        .select({ count: count() })
        .from(organizations)
        .where(where);

      return {
        items: orgs,
        total: totalResult?.count ?? 0,
      };
    }),
});
