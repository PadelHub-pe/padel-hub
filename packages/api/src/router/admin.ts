import { TRPCError } from "@trpc/server";
import {
  accessRequests,
  facilities,
  organizations,
  organizationInvites,
  organizationMembers,
  user,
} from "@wifo/db/schema";
import { and, count, eq, ilike, or, sql } from "drizzle-orm";
import { randomBytes } from "crypto";
import { z } from "zod/v4";

import { adminProcedure, createTRPCRouter } from "../trpc";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

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
    const [usersResult] = await ctx.db
      .select({ count: count() })
      .from(user);
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
        search: z.string().optional(),
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
        contactName: z.string().min(2),
        phone: z.string().min(6),
        organizationName: z.string().min(2),
        facilityName: z.string().min(2),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const request = await ctx.db.query.accessRequests.findFirst({
        where: eq(accessRequests.id, input.id),
      });

      if (!request) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Solicitud no encontrada" });
      }

      if (request.status !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Solo se pueden aprobar solicitudes pendientes",
        });
      }

      // Generate unique slug from org name
      let slug = slugify(input.organizationName);
      let attempt = 0;
      while (true) {
        const candidate = attempt === 0 ? slug : `${slug}-${attempt}`;
        const existing = await ctx.db.query.organizations.findFirst({
          where: eq(organizations.slug, candidate),
        });
        if (!existing) {
          slug = candidate;
          break;
        }
        attempt++;
      }

      // 1. Create organization
      const [org] = await ctx.db
        .insert(organizations)
        .values({
          name: input.organizationName,
          slug,
          contactEmail: request.email,
          contactPhone: input.phone,
          isActive: true,
        })
        .returning();

      if (!org) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Error al crear organización" });
      }

      // 2. Create facility shell (inactive, needs setup)
      await ctx.db.insert(facilities).values({
        organizationId: org.id,
        name: input.facilityName,
        address: "Por configurar",
        district: "Lima",
        city: "Lima",
        phone: input.phone,
        email: request.email,
        isActive: false,
      });

      // 3. Create invite (org_admin, 7 days)
      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await ctx.db.insert(organizationInvites).values({
        organizationId: org.id,
        email: request.email,
        role: "org_admin",
        facilityIds: [],
        status: "pending",
        invitedBy: ctx.session.user.id,
        token,
        expiresAt,
      });

      // 4. Mark access request as approved + persist contact info
      await ctx.db
        .update(accessRequests)
        .set({
          status: "approved",
          name: input.contactName,
          phone: input.phone,
          reviewedAt: new Date(),
          reviewedBy: ctx.session.user.id,
        })
        .where(eq(accessRequests.id, input.id));

      return { orgSlug: slug, inviteToken: token };
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
        throw new TRPCError({ code: "NOT_FOUND", message: "Solicitud no encontrada" });
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
        search: z.string().optional(),
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
