import { randomUUID } from "crypto";
import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { addDays, startOfDay, startOfMonth } from "date-fns";
import { and, count, eq, gte, inArray, lt, ne, sum } from "drizzle-orm";
import { z } from "zod/v4";

import type { db as DbType } from "@wifo/db/client";
import {
  bookings,
  facilities,
  organizationInvites,
  organizationMembers,
  organizations,
} from "@wifo/db/schema";
import { sendOrganizationInvite } from "@wifo/email";

import { insertDefaultOperatingHours } from "../lib/default-operating-hours";
import { protectedProcedure } from "../trpc";

// =============================================================================
// Input Schemas
// =============================================================================

const getFacilitiesSchema = z.object({
  organizationId: z.string().uuid(),
  search: z.string().optional(),
  status: z.enum(["all", "active", "inactive"]).default("all"),
  district: z.string().optional(),
  sortBy: z
    .enum(["name", "bookings", "revenue", "utilization"])
    .default("name"),
});

const updateFacilityStatusSchema = z.object({
  facilityId: z.string().uuid(),
  isActive: z.boolean(),
});

const createFacilitySchema = z.object({
  organizationId: z.string().uuid(),
  name: z
    .string()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(200),
  address: z
    .string()
    .min(5, "La dirección debe tener al menos 5 caracteres")
    .max(500),
  district: z.string().min(2, "El distrito es requerido").max(100),
  phone: z
    .string()
    .min(6, "El teléfono debe tener al menos 6 caracteres")
    .max(20),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

const updateOrgProfileSchema = z.object({
  organizationId: z.string().uuid(),
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(200),
  description: z
    .string()
    .max(500, "Máximo 500 caracteres")
    .optional()
    .or(z.literal("")),
  contactEmail: z.string().email("Email inválido").optional().or(z.literal("")),
  contactPhone: z.string().max(20).optional().or(z.literal("")),
});

const inviteMemberSchema = z.object({
  organizationId: z.string().uuid(),
  email: z.string().email("Email inválido"),
  role: z.enum(["org_admin", "facility_manager", "staff"]),
  facilityIds: z.array(z.string().uuid()).optional(),
});

const updateMemberSchema = z.object({
  organizationId: z.string().uuid(),
  memberId: z.string().uuid(),
  role: z.enum(["org_admin", "facility_manager", "staff"]),
  facilityIds: z.array(z.string().uuid()).optional(),
});

// =============================================================================
// Helpers
// =============================================================================

/**
 * Verify user is a member of the organization and return their role
 */
async function verifyOrgMembership(
  ctx: { db: typeof DbType; session: { user: { id: string } } },
  organizationId: string,
) {
  const membership = await ctx.db.query.organizationMembers.findFirst({
    where: and(
      eq(organizationMembers.organizationId, organizationId),
      eq(organizationMembers.userId, ctx.session.user.id),
    ),
    with: {
      organization: true,
    },
  });

  if (!membership) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "No tienes acceso a esta organización",
    });
  }

  return membership;
}

/**
 * Throws FORBIDDEN if the target is the last org_admin in the organization.
 * Counts only active members (not pending invites).
 */
async function validateNotLastAdmin(
  db: typeof DbType,
  organizationId: string,
  targetRole: string,
) {
  if (targetRole !== "org_admin") return;

  const [result] = await db
    .select({ adminCount: count() })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.organizationId, organizationId),
        eq(organizationMembers.role, "org_admin"),
      ),
    );

  if (!result || result.adminCount <= 1) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "No se puede dejar la organización sin administrador",
    });
  }
}

// =============================================================================
// Router
// =============================================================================

export const orgRouter = {
  /**
   * Get all organizations the current user belongs to
   */
  getMyOrganizations: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const memberships = await ctx.db.query.organizationMembers.findMany({
      where: eq(organizationMembers.userId, userId),
      with: {
        organization: true,
      },
    });

    return memberships
      .filter((m) => m.organization.isActive)
      .map((m) => ({
        id: m.organization.id,
        name: m.organization.name,
        slug: m.organization.slug,
        logoUrl: m.organization.logoUrl,
        role: m.role,
      }));
  }),

  /**
   * Get facilities for an organization with stats
   */
  getFacilities: protectedProcedure
    .input(getFacilitiesSchema)
    .query(async ({ ctx, input }) => {
      const { organizationId, search, status, district } = input;

      // Verify membership
      const membership = await verifyOrgMembership(ctx, organizationId);

      // Build conditions for facilities query
      const conditions = [eq(facilities.organizationId, organizationId)];

      if (status === "active") {
        conditions.push(eq(facilities.isActive, true));
      } else if (status === "inactive") {
        conditions.push(eq(facilities.isActive, false));
      }

      if (district) {
        conditions.push(eq(facilities.district, district));
      }

      // If not org_admin, filter by allowed facilities
      if (
        membership.role !== "org_admin" &&
        membership.facilityIds &&
        membership.facilityIds.length > 0
      ) {
        conditions.push(inArray(facilities.id, membership.facilityIds));
      }

      // Get facilities with courts
      const facilitiesList = await ctx.db.query.facilities.findMany({
        where: and(...conditions),
        with: {
          courts: true,
        },
        orderBy: (f, { asc }) => [asc(f.name)],
      });

      // Filter by search if provided
      let filteredFacilities = facilitiesList;
      if (search) {
        const searchLower = search.toLowerCase();
        filteredFacilities = facilitiesList.filter(
          (f) =>
            f.name.toLowerCase().includes(searchLower) ||
            f.district.toLowerCase().includes(searchLower),
        );
      }

      // Get today's date range
      const today = startOfDay(new Date());
      const tomorrow = addDays(today, 1);

      // Get this month's date range
      const monthStart = startOfMonth(new Date());

      // Calculate stats for each facility
      const facilitiesWithStats = await Promise.all(
        filteredFacilities.map(async (facility) => {
          // Today's bookings count
          const [todayResult] = await ctx.db
            .select({ count: count() })
            .from(bookings)
            .where(
              and(
                eq(bookings.facilityId, facility.id),
                gte(bookings.date, today),
                lt(bookings.date, tomorrow),
                ne(bookings.status, "cancelled"),
              ),
            );

          // This month's revenue
          const [monthResult] = await ctx.db
            .select({ total: sum(bookings.priceInCents) })
            .from(bookings)
            .where(
              and(
                eq(bookings.facilityId, facility.id),
                gte(bookings.date, monthStart),
                ne(bookings.status, "cancelled"),
              ),
            );

          // Calculate utilization (simplified: today's booked hours / total available hours)
          // Assuming 12 hours of operation per day per court
          const activeCourts = facility.courts.filter((c) => c.isActive).length;
          const totalAvailableHours = activeCourts * 12; // 12 hours per court
          const todayBookings = todayResult?.count ?? 0;
          const averageBookingHours = 1.5; // 90 min average
          const bookedHours = todayBookings * averageBookingHours;
          const utilization =
            totalAvailableHours > 0
              ? Math.round((bookedHours / totalAvailableHours) * 100)
              : 0;

          // Count indoor/outdoor courts
          const indoorCount = facility.courts.filter(
            (c) => c.type === "indoor",
          ).length;
          const outdoorCount = facility.courts.filter(
            (c) => c.type === "outdoor",
          ).length;

          return {
            id: facility.id,
            name: facility.name,
            address: facility.address,
            district: facility.district,
            phone: facility.phone,
            isActive: facility.isActive,
            isSetupComplete: facility.onboardingCompletedAt !== null,
            photos: facility.photos ?? [],
            courtCount: facility.courts.length,
            indoorCount,
            outdoorCount,
            todayBookings: todayResult?.count ?? 0,
            monthRevenue: Number(monthResult?.total ?? 0),
            utilization,
          };
        }),
      );

      return facilitiesWithStats;
    }),

  /**
   * Get aggregated stats for an organization
   */
  getStats: protectedProcedure
    .input(z.object({ organizationId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { organizationId } = input;

      // Verify membership
      await verifyOrgMembership(ctx, organizationId);

      // Get all facility IDs for this org
      const orgFacilities = await ctx.db.query.facilities.findMany({
        where: eq(facilities.organizationId, organizationId),
        columns: { id: true, isActive: true },
        with: {
          courts: {
            columns: { id: true },
          },
        },
      });

      const facilityIds = orgFacilities.map((f) => f.id);
      const totalFacilities = orgFacilities.length;
      const activeFacilities = orgFacilities.filter((f) => f.isActive).length;
      const totalCourts = orgFacilities.reduce(
        (sum, f) => sum + f.courts.length,
        0,
      );

      if (facilityIds.length === 0) {
        return {
          totalFacilities: 0,
          activeFacilities: 0,
          totalCourts: 0,
          monthBookings: 0,
          monthRevenue: 0,
          monthBookingsTrend: 0,
          monthRevenueTrend: 0,
        };
      }

      // Get this month's date range
      const today = new Date();
      const monthStart = startOfMonth(today);
      const lastMonthStart = startOfMonth(addDays(monthStart, -1));

      // This month's bookings and revenue
      const [currentMonthResult] = await ctx.db
        .select({
          count: count(),
          revenue: sum(bookings.priceInCents),
        })
        .from(bookings)
        .where(
          and(
            inArray(bookings.facilityId, facilityIds),
            gte(bookings.date, monthStart),
            ne(bookings.status, "cancelled"),
          ),
        );

      // Last month's bookings and revenue (for trend calculation)
      const [lastMonthResult] = await ctx.db
        .select({
          count: count(),
          revenue: sum(bookings.priceInCents),
        })
        .from(bookings)
        .where(
          and(
            inArray(bookings.facilityId, facilityIds),
            gte(bookings.date, lastMonthStart),
            lt(bookings.date, monthStart),
            ne(bookings.status, "cancelled"),
          ),
        );

      const currentBookings = currentMonthResult?.count ?? 0;
      const currentRevenue = Number(currentMonthResult?.revenue ?? 0);
      const lastBookings = lastMonthResult?.count ?? 0;
      const lastRevenue = Number(lastMonthResult?.revenue ?? 0);

      // Calculate trends
      const bookingsTrend =
        lastBookings > 0
          ? Math.round(
              ((currentBookings - lastBookings) / lastBookings) * 100 * 10,
            ) / 10
          : 0;
      const revenueTrend =
        lastRevenue > 0
          ? Math.round(
              ((currentRevenue - lastRevenue) / lastRevenue) * 100 * 10,
            ) / 10
          : 0;

      return {
        totalFacilities,
        activeFacilities,
        totalCourts,
        monthBookings: currentBookings,
        monthRevenue: currentRevenue,
        monthBookingsTrend: bookingsTrend,
        monthRevenueTrend: revenueTrend,
      };
    }),

  /**
   * Update facility active status
   */
  updateFacilityStatus: protectedProcedure
    .input(updateFacilityStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const { facilityId, isActive } = input;

      // Get facility to check organization
      const facility = await ctx.db.query.facilities.findFirst({
        where: eq(facilities.id, facilityId),
      });

      if (!facility) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Local no encontrado",
        });
      }

      if (!facility.organizationId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Este local no pertenece a ninguna organización",
        });
      }

      // Verify user has admin access to the organization
      const membership = await verifyOrgMembership(
        ctx,
        facility.organizationId,
      );

      if (membership.role !== "org_admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Solo los administradores pueden cambiar el estado del local",
        });
      }

      // Update facility status
      const [updated] = await ctx.db
        .update(facilities)
        .set({ isActive })
        .where(eq(facilities.id, facilityId))
        .returning();

      return updated;
    }),

  /**
   * Get managers for facilities in an organization (for avatar display)
   */
  getFacilityManagers: protectedProcedure
    .input(z.object({ organizationId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { organizationId } = input;

      // Verify membership
      await verifyOrgMembership(ctx, organizationId);

      // Get all members who are facility managers
      const managers = await ctx.db.query.organizationMembers.findMany({
        where: and(
          eq(organizationMembers.organizationId, organizationId),
          eq(organizationMembers.role, "facility_manager"),
        ),
        with: {
          user: true,
        },
      });

      return managers.map((m) => ({
        id: m.userId,
        name: m.user.name,
        email: m.user.email,
        image: m.user.image,
        facilityIds: m.facilityIds ?? [],
      }));
    }),

  /**
   * Get unique districts for filtering
   */
  getDistricts: protectedProcedure
    .input(z.object({ organizationId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { organizationId } = input;

      // Verify membership
      await verifyOrgMembership(ctx, organizationId);

      const result = await ctx.db
        .selectDistinct({ district: facilities.district })
        .from(facilities)
        .where(eq(facilities.organizationId, organizationId))
        .orderBy(facilities.district);

      return result.map((r) => r.district);
    }),

  /**
   * Create a new facility with minimal fields (Quick Create)
   * Only org_admin can create facilities
   */
  createFacility: protectedProcedure
    .input(createFacilitySchema)
    .mutation(async ({ ctx, input }) => {
      const {
        organizationId,
        name,
        address,
        district,
        phone,
        email,
        latitude,
        longitude,
      } = input;

      // Verify user is org_admin
      const membership = await verifyOrgMembership(ctx, organizationId);

      if (membership.role !== "org_admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Solo los administradores pueden crear locales",
        });
      }

      // Create facility with minimal fields
      const [facility] = await ctx.db
        .insert(facilities)
        .values({
          organizationId,
          name,
          address,
          district,
          city: "Lima", // Default city for MVP
          phone,
          email: email ?? null,
          latitude: latitude?.toString() ?? null,
          longitude: longitude?.toString() ?? null,
          isActive: false, // Inactive until setup is complete
        })
        .returning();

      if (!facility) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error al crear el local",
        });
      }

      // Insert default operating hours (Mon-Sun 07:00-22:00)
      await insertDefaultOperatingHours(ctx.db, facility.id);

      return {
        id: facility.id,
        name: facility.name,
      };
    }),

  // ===========================================================================
  // Organization Settings Procedures
  // ===========================================================================

  getOrgProfile: protectedProcedure
    .input(z.object({ organizationId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const membership = await verifyOrgMembership(ctx, input.organizationId);

      if (membership.role !== "org_admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Solo los administradores pueden ver la configuración",
        });
      }

      const org = await ctx.db.query.organizations.findFirst({
        where: eq(organizations.id, input.organizationId),
      });

      if (!org) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organización no encontrada",
        });
      }

      return org;
    }),

  updateOrgProfile: protectedProcedure
    .input(updateOrgProfileSchema)
    .mutation(async ({ ctx, input }) => {
      const { organizationId, name, description, contactEmail, contactPhone } =
        input;

      const membership = await verifyOrgMembership(ctx, organizationId);

      if (membership.role !== "org_admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Solo los administradores pueden editar la organización",
        });
      }

      const [updated] = await ctx.db
        .update(organizations)
        .set({
          name,
          description: description ?? null,
          contactEmail: contactEmail ?? null,
          contactPhone: contactPhone ?? null,
        })
        .where(eq(organizations.id, organizationId))
        .returning();

      return updated;
    }),

  getTeamMembers: protectedProcedure
    .input(z.object({ organizationId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { organizationId } = input;

      const membership = await verifyOrgMembership(ctx, organizationId);

      if (membership.role === "staff") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "No tienes permisos para ver el equipo",
        });
      }

      const isManager = membership.role === "facility_manager";
      const callerFacilityIds = membership.facilityIds ?? [];

      // Get members with user info
      const members = await ctx.db.query.organizationMembers.findMany({
        where: eq(organizationMembers.organizationId, organizationId),
        with: { user: true },
      });

      // Get pending invites
      const invites = await ctx.db.query.organizationInvites.findMany({
        where: and(
          eq(organizationInvites.organizationId, organizationId),
          eq(organizationInvites.status, "pending"),
        ),
      });

      // Get facilities for name mapping
      const orgFacilities = await ctx.db.query.facilities.findMany({
        where: eq(facilities.organizationId, organizationId),
        columns: { id: true, name: true },
      });

      const facilityMap = new Map(orgFacilities.map((f) => [f.id, f.name]));

      /**
       * For facility_manager: filter to only members/invites with overlapping facilities.
       * org_admin members are always visible (they manage all facilities).
       * facility_manager with empty facilityIds = all-facilities access → visible.
       */
      function isVisibleToManager(
        memberFacilityIds: string[],
        memberRole: string,
      ): boolean {
        if (memberRole === "org_admin") return true;
        if (memberRole === "facility_manager" && memberFacilityIds.length === 0)
          return true;
        return memberFacilityIds.some((id) => callerFacilityIds.includes(id));
      }

      const memberList = members.map((m) => ({
        id: m.id,
        type: "member" as const,
        name: m.user.name,
        email: m.user.email,
        image: m.user.image,
        role: m.role,
        facilityIds: m.facilityIds ?? [],
        facilityNames: (m.facilityIds ?? [])
          .map((id) => facilityMap.get(id))
          .filter(Boolean) as string[],
        isCurrentUser: m.userId === ctx.session.user.id,
        createdAt: m.createdAt,
      }));

      const inviteList = invites.map((inv) => ({
        id: inv.id,
        type: "invite" as const,
        name: inv.email,
        email: inv.email,
        image: null,
        role: inv.role,
        facilityIds: inv.facilityIds ?? [],
        facilityNames: (inv.facilityIds ?? [])
          .map((id) => facilityMap.get(id))
          .filter(Boolean) as string[],
        isCurrentUser: false,
        createdAt: inv.createdAt,
        expiresAt: inv.expiresAt,
      }));

      // Apply facility scoping for managers
      const filteredMembers = isManager
        ? memberList.filter((m) => isVisibleToManager(m.facilityIds, m.role))
        : memberList;
      const filteredInvites = isManager
        ? inviteList.filter((inv) =>
            isVisibleToManager(inv.facilityIds, inv.role),
          )
        : inviteList;

      return {
        members: [...filteredMembers, ...filteredInvites],
        facilities: isManager
          ? orgFacilities.filter((f) => callerFacilityIds.includes(f.id))
          : orgFacilities,
      };
    }),

  inviteMember: protectedProcedure
    .input(inviteMemberSchema)
    .mutation(async ({ ctx, input }) => {
      const { organizationId, email, role, facilityIds } = input;

      const membership = await verifyOrgMembership(ctx, organizationId);

      // Role-based invite restrictions
      if (membership.role === "staff") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "No tienes permisos para invitar miembros",
        });
      }

      if (membership.role === "facility_manager") {
        // Facility managers can only invite staff
        if (role !== "staff") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Solo puedes invitar miembros con rol de staff",
          });
        }

        // facilityIds must be provided and be a subset of manager's own facilityIds
        const managerFacilityIds = membership.facilityIds ?? [];
        const requestedFacilityIds = facilityIds ?? [];

        if (requestedFacilityIds.length === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Debes asignar al menos un local",
          });
        }

        const isSubset = requestedFacilityIds.every((id) =>
          managerFacilityIds.includes(id),
        );
        if (!isSubset) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Solo puedes asignar locales a los que tienes acceso",
          });
        }
      }

      // Check no existing member with same email
      const existingMembers = await ctx.db.query.organizationMembers.findMany({
        where: eq(organizationMembers.organizationId, organizationId),
        with: { user: true },
      });

      if (existingMembers.some((m) => m.user.email === email)) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Este email ya es miembro de la organización",
        });
      }

      // Check no pending invite with same email
      const existingInvite = await ctx.db.query.organizationInvites.findFirst({
        where: and(
          eq(organizationInvites.organizationId, organizationId),
          eq(organizationInvites.email, email),
          eq(organizationInvites.status, "pending"),
        ),
      });

      if (existingInvite) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Ya existe una invitación pendiente para este email",
        });
      }

      const token = randomUUID().replace(/-/g, "");

      const [invite] = await ctx.db
        .insert(organizationInvites)
        .values({
          organizationId,
          email,
          role,
          facilityIds: facilityIds ?? [],
          invitedBy: ctx.session.user.id,
          token,
          expiresAt: addDays(new Date(), 7),
        })
        .returning();

      // Get facility names for scoped roles
      let facilityNames: string[] | undefined;
      if (facilityIds && facilityIds.length > 0) {
        const orgFacilities = await ctx.db.query.facilities.findMany({
          where: and(
            eq(facilities.organizationId, organizationId),
            inArray(facilities.id, facilityIds),
          ),
          columns: { name: true },
        });
        facilityNames = orgFacilities.map((f) => f.name);
      }

      await sendOrganizationInvite({
        inviteeEmail: email,
        organizationName: membership.organization.name,
        inviterName: ctx.session.user.name,
        role,
        facilityNames,
        inviteToken: token,
      });

      return invite;
    }),

  updateMember: protectedProcedure
    .input(updateMemberSchema)
    .mutation(async ({ ctx, input }) => {
      const { organizationId, memberId, role, facilityIds } = input;

      const membership = await verifyOrgMembership(ctx, organizationId);

      if (membership.role !== "org_admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Solo los administradores pueden editar miembros",
        });
      }

      // Get the member to check it's not self-edit
      const target = await ctx.db.query.organizationMembers.findFirst({
        where: and(
          eq(organizationMembers.id, memberId),
          eq(organizationMembers.organizationId, organizationId),
        ),
      });

      if (!target) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Miembro no encontrado",
        });
      }

      if (target.userId === ctx.session.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No puedes editar tu propio rol",
        });
      }

      // Block demotion of the last org_admin
      if (target.role === "org_admin" && role !== "org_admin") {
        await validateNotLastAdmin(ctx.db, organizationId, target.role);
      }

      const [updated] = await ctx.db
        .update(organizationMembers)
        .set({ role, facilityIds: facilityIds ?? [] })
        .where(eq(organizationMembers.id, memberId))
        .returning();

      return updated;
    }),

  removeMember: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
        memberId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { organizationId, memberId } = input;

      const membership = await verifyOrgMembership(ctx, organizationId);

      if (membership.role !== "org_admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Solo los administradores pueden eliminar miembros",
        });
      }

      const target = await ctx.db.query.organizationMembers.findFirst({
        where: and(
          eq(organizationMembers.id, memberId),
          eq(organizationMembers.organizationId, organizationId),
        ),
      });

      if (!target) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Miembro no encontrado",
        });
      }

      if (target.userId === ctx.session.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No puedes eliminarte a ti mismo",
        });
      }

      // Block removal of the last org_admin
      await validateNotLastAdmin(ctx.db, organizationId, target.role);

      await ctx.db
        .delete(organizationMembers)
        .where(eq(organizationMembers.id, memberId));

      return { success: true };
    }),

  cancelInvite: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
        inviteId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { organizationId, inviteId } = input;

      const membership = await verifyOrgMembership(ctx, organizationId);

      if (membership.role !== "org_admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Solo los administradores pueden cancelar invitaciones",
        });
      }

      const invite = await ctx.db.query.organizationInvites.findFirst({
        where: and(
          eq(organizationInvites.id, inviteId),
          eq(organizationInvites.organizationId, organizationId),
        ),
      });

      if (!invite) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invitación no encontrada",
        });
      }

      await ctx.db
        .update(organizationInvites)
        .set({ status: "cancelled" })
        .where(eq(organizationInvites.id, inviteId));

      return { success: true };
    }),

  resendInvite: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
        inviteId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { organizationId, inviteId } = input;

      const membership = await verifyOrgMembership(ctx, organizationId);

      if (membership.role !== "org_admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Solo los administradores pueden reenviar invitaciones",
        });
      }

      const invite = await ctx.db.query.organizationInvites.findFirst({
        where: and(
          eq(organizationInvites.id, inviteId),
          eq(organizationInvites.organizationId, organizationId),
        ),
      });

      if (!invite) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invitación no encontrada",
        });
      }

      const newToken = randomUUID().replace(/-/g, "");

      const [updated] = await ctx.db
        .update(organizationInvites)
        .set({
          token: newToken,
          expiresAt: addDays(new Date(), 7),
        })
        .where(eq(organizationInvites.id, inviteId))
        .returning();

      // Get org name for email
      const org = await ctx.db.query.organizations.findFirst({
        where: eq(organizations.id, organizationId),
        columns: { name: true },
      });

      // Get facility names for scoped roles
      let facilityNames: string[] | undefined;
      if (invite.facilityIds && invite.facilityIds.length > 0) {
        const orgFacilities = await ctx.db.query.facilities.findMany({
          where: and(
            eq(facilities.organizationId, organizationId),
            inArray(facilities.id, invite.facilityIds),
          ),
          columns: { name: true },
        });
        facilityNames = orgFacilities.map((f) => f.name);
      }

      await sendOrganizationInvite({
        inviteeEmail: invite.email,
        organizationName: org?.name ?? "Tu organización",
        inviterName: ctx.session.user.name,
        role: invite.role,
        facilityNames,
        inviteToken: newToken,
      });

      return updated;
    }),
} satisfies TRPCRouterRecord;
