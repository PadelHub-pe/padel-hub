import { TRPCError } from "@trpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  FacilityAccessResult,
  Permission,
  ProtectedContext,
} from "../lib/access-control";
import {
  canAccessFacility,
  hasPermission,
  requirePermission,
  verifyFacilityAccess,
} from "../lib/access-control";

// =============================================================================
// Test Helpers
// =============================================================================

const ORG_ID = "org-1";
const FACILITY_A = "facility-a";
const FACILITY_B = "facility-b";
const FACILITY_C = "facility-c";
const USER_ID = "user-1";

function makeMembership(
  role: "org_admin" | "facility_manager" | "staff",
  facilityIds: string[] = [],
) {
  return {
    id: "mem-1",
    organizationId: ORG_ID,
    userId: USER_ID,
    role,
    facilityIds,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Parameters<typeof canAccessFacility>[0];
}

function makeFacility(id: string, organizationId: string | null = ORG_ID) {
  return {
    id,
    organizationId,
    name: "Test Facility",
    slug: null,
    description: null,
    address: "Test Address",
    district: "Miraflores",
    city: "Lima",
    phone: "+51999999999",
    email: null,
    website: null,
    latitude: null,
    longitude: null,
    amenities: [],
    photos: [],
    isActive: true,
    onboardingCompletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as FacilityAccessResult["facility"];
}

function makeMockCtx(overrides?: {
  facility?: FacilityAccessResult["facility"] | null;
  membership?: ReturnType<typeof makeMembership> | null;
}): ProtectedContext {
  const facility =
    overrides?.facility !== undefined
      ? overrides.facility
      : makeFacility(FACILITY_A);
  const membership =
    overrides?.membership !== undefined
      ? overrides.membership
      : makeMembership("org_admin");

  return {
    db: {
      query: {
        facilities: {
          findFirst: vi.fn().mockResolvedValue(facility),
        },
        organizationMembers: {
          findFirst: vi.fn().mockResolvedValue(membership),
        },
      },
    },
    session: {
      user: { id: USER_ID, name: "Test User", email: "test@test.com" },
    },
  } as unknown as ProtectedContext;
}

// =============================================================================
// Assertion helper for TRPCError
// =============================================================================

async function expectTRPCError(
  promise: Promise<unknown>,
  code: string,
  message: string,
) {
  try {
    await promise;
    expect.fail("Expected TRPCError to be thrown");
  } catch (err) {
    expect(err).toBeInstanceOf(TRPCError);
    const trpcErr = err as TRPCError;
    expect(trpcErr.code).toBe(code);
    expect(trpcErr.message).toBe(message);
  }
}

// =============================================================================
// All permission types for exhaustive testing
// =============================================================================

const ALL_PERMISSIONS: Permission[] = [
  "facility:read",
  "facility:write",
  "booking:read",
  "booking:write",
  "booking:manage",
  "court:read",
  "court:write",
  "schedule:read",
  "schedule:write",
  "settings:read",
  "settings:write",
];

const STAFF_PERMISSIONS: Permission[] = [
  "facility:read",
  "booking:read",
  "booking:write",
  "booking:manage",
  "court:read",
  "schedule:read",
];

const STAFF_DENIED_PERMISSIONS: Permission[] = ALL_PERMISSIONS.filter(
  (p) => !STAFF_PERMISSIONS.includes(p),
);

// =============================================================================
// hasPermission
// =============================================================================

describe("hasPermission", () => {
  describe("org_admin", () => {
    it.each(ALL_PERMISSIONS)("grants '%s'", (permission) => {
      expect(hasPermission("org_admin", permission)).toBe(true);
    });
  });

  describe("facility_manager", () => {
    it.each(ALL_PERMISSIONS)("grants '%s'", (permission) => {
      expect(hasPermission("facility_manager", permission)).toBe(true);
    });
  });

  describe("staff", () => {
    it.each(STAFF_PERMISSIONS)("grants '%s'", (permission) => {
      expect(hasPermission("staff", permission)).toBe(true);
    });

    it.each(STAFF_DENIED_PERMISSIONS)("denies '%s'", (permission) => {
      expect(hasPermission("staff", permission)).toBe(false);
    });
  });
});

// =============================================================================
// canAccessFacility
// =============================================================================

describe("canAccessFacility", () => {
  describe("org_admin", () => {
    it("can access any facility regardless of facilityIds", () => {
      const membership = makeMembership("org_admin", []);
      expect(canAccessFacility(membership, FACILITY_A)).toBe(true);
      expect(canAccessFacility(membership, FACILITY_B)).toBe(true);
      expect(canAccessFacility(membership, FACILITY_C)).toBe(true);
    });

    it("can access any facility even with specific facilityIds", () => {
      const membership = makeMembership("org_admin", [FACILITY_A]);
      expect(canAccessFacility(membership, FACILITY_B)).toBe(true);
    });
  });

  describe("facility_manager", () => {
    it("with empty facilityIds → access to ALL facilities", () => {
      const membership = makeMembership("facility_manager", []);
      expect(canAccessFacility(membership, FACILITY_A)).toBe(true);
      expect(canAccessFacility(membership, FACILITY_B)).toBe(true);
    });

    it("with specific facilityIds → access only to assigned facilities", () => {
      const membership = makeMembership("facility_manager", [
        FACILITY_A,
        FACILITY_B,
      ]);
      expect(canAccessFacility(membership, FACILITY_A)).toBe(true);
      expect(canAccessFacility(membership, FACILITY_B)).toBe(true);
      expect(canAccessFacility(membership, FACILITY_C)).toBe(false);
    });
  });

  describe("staff", () => {
    it("with empty facilityIds → NO access to any facility", () => {
      const membership = makeMembership("staff", []);
      expect(canAccessFacility(membership, FACILITY_A)).toBe(false);
      expect(canAccessFacility(membership, FACILITY_B)).toBe(false);
    });

    it("with specific facilityIds → access only to assigned facilities", () => {
      const membership = makeMembership("staff", [FACILITY_A]);
      expect(canAccessFacility(membership, FACILITY_A)).toBe(true);
      expect(canAccessFacility(membership, FACILITY_B)).toBe(false);
    });
  });
});

// =============================================================================
// requirePermission
// =============================================================================

describe("requirePermission", () => {
  it("does not throw when role has the permission", () => {
    const membership = makeMembership("org_admin");
    expect(() => requirePermission(membership, "settings:write")).not.toThrow();
  });

  it("throws FORBIDDEN when staff lacks write permission", () => {
    const membership = makeMembership("staff");
    expect(() => requirePermission(membership, "settings:write")).toThrow(
      TRPCError,
    );
    expect(() => requirePermission(membership, "settings:write")).toThrow(
      "No tienes permisos para realizar esta acción",
    );
  });

  it("does not throw for staff with allowed permissions", () => {
    const membership = makeMembership("staff");
    expect(() => requirePermission(membership, "booking:read")).not.toThrow();
    expect(() => requirePermission(membership, "booking:manage")).not.toThrow();
  });
});

// =============================================================================
// verifyFacilityAccess
// =============================================================================

describe("verifyFacilityAccess", () => {
  describe("facility existence", () => {
    it("throws NOT_FOUND when facility does not exist", async () => {
      const ctx = makeMockCtx({ facility: null });
      await expectTRPCError(
        verifyFacilityAccess(ctx, FACILITY_A),
        "NOT_FOUND",
        "Local no encontrado",
      );
    });

    it("throws BAD_REQUEST when facility has no organizationId", async () => {
      const ctx = makeMockCtx({
        facility: makeFacility(FACILITY_A, null),
      });
      await expectTRPCError(
        verifyFacilityAccess(ctx, FACILITY_A),
        "BAD_REQUEST",
        "Este local no pertenece a ninguna organización",
      );
    });
  });

  describe("organization membership", () => {
    it("throws FORBIDDEN when user is not a member of the org", async () => {
      const ctx = makeMockCtx({ membership: null });
      await expectTRPCError(
        verifyFacilityAccess(ctx, FACILITY_A),
        "FORBIDDEN",
        "No tienes acceso a esta organización",
      );
    });
  });

  describe("facility-level access", () => {
    it("throws FORBIDDEN when staff has no facility access", async () => {
      const ctx = makeMockCtx({
        membership: makeMembership("staff", []),
      });
      await expectTRPCError(
        verifyFacilityAccess(ctx, FACILITY_A),
        "FORBIDDEN",
        "No tienes acceso a este local",
      );
    });

    it("throws FORBIDDEN when manager has different facility assigned", async () => {
      const ctx = makeMockCtx({
        membership: makeMembership("facility_manager", [FACILITY_B]),
      });
      await expectTRPCError(
        verifyFacilityAccess(ctx, FACILITY_A),
        "FORBIDDEN",
        "No tienes acceso a este local",
      );
    });
  });

  describe("permission checks", () => {
    it("org_admin passes any permission check", async () => {
      const ctx = makeMockCtx({ membership: makeMembership("org_admin") });
      const result = await verifyFacilityAccess(
        ctx,
        FACILITY_A,
        "settings:write",
      );
      expect(result.hasPermission).toBe(true);
    });

    it("facility_manager passes all permission checks", async () => {
      const ctx = makeMockCtx({
        membership: makeMembership("facility_manager", []),
      });
      const result = await verifyFacilityAccess(
        ctx,
        FACILITY_A,
        "settings:write",
      );
      expect(result.hasPermission).toBe(true);
    });

    it("staff passes allowed permission checks", async () => {
      const ctx = makeMockCtx({
        membership: makeMembership("staff", [FACILITY_A]),
      });
      const result = await verifyFacilityAccess(
        ctx,
        FACILITY_A,
        "booking:read",
      );
      expect(result.hasPermission).toBe(true);
    });

    it("staff is denied write permissions", async () => {
      const ctx = makeMockCtx({
        membership: makeMembership("staff", [FACILITY_A]),
      });
      await expectTRPCError(
        verifyFacilityAccess(ctx, FACILITY_A, "settings:write"),
        "FORBIDDEN",
        "No tienes permisos para realizar esta acción",
      );
    });

    it("returns hasPermission true when no permission is required", async () => {
      const ctx = makeMockCtx({
        membership: makeMembership("staff", [FACILITY_A]),
      });
      const result = await verifyFacilityAccess(ctx, FACILITY_A);
      expect(result.hasPermission).toBe(true);
    });
  });

  describe("successful access returns correct data", () => {
    it("returns facility, membership, and hasPermission", async () => {
      const facility = makeFacility(FACILITY_A);
      const membership = makeMembership("org_admin");
      const ctx = makeMockCtx({ facility, membership });

      const result = await verifyFacilityAccess(
        ctx,
        FACILITY_A,
        "facility:write",
      );
      expect(result.facility).toBe(facility);
      expect(result.membership).toBe(membership);
      expect(result.hasPermission).toBe(true);
    });
  });
});

// =============================================================================
// Full Role Matrix: verifyFacilityAccess × every permission
// =============================================================================

describe("full RBAC matrix", () => {
  describe.each<{
    role: "org_admin" | "facility_manager" | "staff";
    facilityIds: string[];
    targetFacility: string;
    expectAccess: boolean;
    grantedPermissions: Permission[];
  }>([
    {
      role: "org_admin",
      facilityIds: [],
      targetFacility: FACILITY_A,
      expectAccess: true,
      grantedPermissions: ALL_PERMISSIONS,
    },
    {
      role: "facility_manager",
      facilityIds: [],
      targetFacility: FACILITY_A,
      expectAccess: true,
      grantedPermissions: ALL_PERMISSIONS,
    },
    {
      role: "facility_manager",
      facilityIds: [FACILITY_A],
      targetFacility: FACILITY_A,
      expectAccess: true,
      grantedPermissions: ALL_PERMISSIONS,
    },
    {
      role: "facility_manager",
      facilityIds: [FACILITY_B],
      targetFacility: FACILITY_A,
      expectAccess: false,
      grantedPermissions: [],
    },
    {
      role: "staff",
      facilityIds: [FACILITY_A],
      targetFacility: FACILITY_A,
      expectAccess: true,
      grantedPermissions: STAFF_PERMISSIONS,
    },
    {
      role: "staff",
      facilityIds: [],
      targetFacility: FACILITY_A,
      expectAccess: false,
      grantedPermissions: [],
    },
    {
      role: "staff",
      facilityIds: [FACILITY_B],
      targetFacility: FACILITY_A,
      expectAccess: false,
      grantedPermissions: [],
    },
  ])(
    "$role (facilityIds=$facilityIds, target=$targetFacility)",
    ({
      role,
      facilityIds,
      targetFacility,
      expectAccess,
      grantedPermissions,
    }) => {
      let ctx: ProtectedContext;

      beforeEach(() => {
        ctx = makeMockCtx({
          membership: makeMembership(role, facilityIds),
        });
      });

      if (!expectAccess) {
        it("denies facility access", async () => {
          await expect(
            verifyFacilityAccess(ctx, targetFacility),
          ).rejects.toThrow(TRPCError);
        });
      } else {
        it("grants facility access", async () => {
          const result = await verifyFacilityAccess(ctx, targetFacility);
          expect(result.hasPermission).toBe(true);
        });

        for (const permission of grantedPermissions) {
          it(`grants '${permission}'`, async () => {
            const result = await verifyFacilityAccess(
              ctx,
              targetFacility,
              permission,
            );
            expect(result.hasPermission).toBe(true);
          });
        }

        const deniedPermissions = ALL_PERMISSIONS.filter(
          (p) => !grantedPermissions.includes(p),
        );
        for (const permission of deniedPermissions) {
          it(`denies '${permission}'`, async () => {
            await expectTRPCError(
              verifyFacilityAccess(ctx, targetFacility, permission),
              "FORBIDDEN",
              "No tienes permisos para realizar esta acción",
            );
          });
        }
      }
    },
  );
});
