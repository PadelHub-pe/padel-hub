import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";

import type { db as DbType } from "@wifo/db/client";
import type { orgRoleEnum } from "@wifo/db/schema";
import { facilities, organizationMembers } from "@wifo/db/schema";

// =============================================================================
// Types
// =============================================================================

/**
 * Organization roles from the database enum
 */
export type OrgRole = (typeof orgRoleEnum.enumValues)[number];

/**
 * Granular permissions for facility access control
 */
export type Permission =
  | "facility:read"
  | "facility:write"
  | "booking:read"
  | "booking:write"
  | "booking:manage" // confirm, cancel, update status
  | "court:read"
  | "court:write"
  | "schedule:read"
  | "schedule:write"
  | "pricing:write"
  | "settings:read"
  | "settings:write";

/**
 * Context type for access control functions
 * Matches the protectedProcedure context
 */
export interface ProtectedContext {
  db: typeof DbType;
  session: {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
    };
  };
}

/**
 * Result of facility access verification
 */
export interface FacilityAccessResult {
  facility: typeof facilities.$inferSelect;
  membership: typeof organizationMembers.$inferSelect;
  hasPermission: boolean;
}

// =============================================================================
// Role-Permission Mapping
// =============================================================================

/**
 * Maps each role to its allowed permissions
 *
 * org_admin: Full access to all facilities in the organization
 * facility_manager: Full access to assigned facilities only
 * staff: View + manage bookings only (daily operations)
 */
const ROLE_PERMISSIONS: Record<OrgRole, Permission[] | "*"> = {
  org_admin: "*", // All permissions
  facility_manager: [
    "facility:read",
    "facility:write",
    "booking:read",
    "booking:write",
    "booking:manage",
    "court:read",
    "court:write",
    "schedule:read",
    "schedule:write",
    "pricing:write",
    "settings:read",
    "settings:write",
  ],
  staff: [
    "facility:read",
    "booking:read",
    "booking:write",
    "booking:manage",
    "court:read",
    "schedule:read",
  ],
};

// =============================================================================
// Permission Helpers
// =============================================================================

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: OrgRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  if (permissions === "*") return true;
  return permissions.includes(permission);
}

/**
 * Check if a user can access a specific facility based on their membership
 *
 * - org_admin: can access ALL facilities in the org
 * - facility_manager/staff: can only access facilities in their facilityIds array
 *   (empty array means no access for staff, all access for managers)
 */
export function canAccessFacility(
  membership: typeof organizationMembers.$inferSelect,
  facilityId: string,
): boolean {
  // org_admin can access all facilities
  if (membership.role === "org_admin") {
    return true;
  }

  // facility_manager with empty facilityIds can access all facilities
  if (
    membership.role === "facility_manager" &&
    (!membership.facilityIds || membership.facilityIds.length === 0)
  ) {
    return true;
  }

  // staff with empty facilityIds cannot access any facility
  if (
    membership.role === "staff" &&
    (!membership.facilityIds || membership.facilityIds.length === 0)
  ) {
    return false;
  }

  // Check if facilityId is in the user's assigned facilities
  return membership.facilityIds?.includes(facilityId) ?? false;
}

// =============================================================================
// Main Access Control Function
// =============================================================================

/**
 * Verify user has access to a facility via organization membership
 *
 * This is the main access control function used by all facility-scoped procedures.
 * It verifies:
 * 1. Facility exists
 * 2. Facility belongs to an organization
 * 3. User is a member of that organization
 * 4. User can access this specific facility (based on role + facilityIds)
 * 5. User has the required permission (if specified)
 *
 * @throws TRPCError with appropriate code and Spanish message on failure
 */
export async function verifyFacilityAccess(
  ctx: ProtectedContext,
  facilityId: string,
  requiredPermission?: Permission,
): Promise<FacilityAccessResult> {
  // 1. Get the facility
  const facility = await ctx.db.query.facilities.findFirst({
    where: eq(facilities.id, facilityId),
  });

  if (!facility) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Local no encontrado",
    });
  }

  // 2. Verify facility belongs to an organization
  if (!facility.organizationId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Este local no pertenece a ninguna organización",
    });
  }

  // 3. Get user's organization membership
  const membership = await ctx.db.query.organizationMembers.findFirst({
    where: and(
      eq(organizationMembers.organizationId, facility.organizationId),
      eq(organizationMembers.userId, ctx.session.user.id),
    ),
  });

  if (!membership) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "No tienes acceso a esta organización",
    });
  }

  // 4. Verify user can access this specific facility
  if (!canAccessFacility(membership, facilityId)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "No tienes acceso a este local",
    });
  }

  // 5. Check permission if required
  const permissionGranted = requiredPermission
    ? hasPermission(membership.role, requiredPermission)
    : true;

  if (requiredPermission && !permissionGranted) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "No tienes permisos para realizar esta acción",
    });
  }

  return {
    facility,
    membership,
    hasPermission: permissionGranted,
  };
}

/**
 * Require a specific permission, throwing if not granted
 * Use after verifyFacilityAccess when you need to check multiple permissions
 */
export function requirePermission(
  membership: typeof organizationMembers.$inferSelect,
  permission: Permission,
): void {
  if (!hasPermission(membership.role, permission)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "No tienes permisos para realizar esta acción",
    });
  }
}
