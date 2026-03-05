/* eslint-disable @typescript-eslint/no-unsafe-assignment -- vitest mock types (vi.fn, expect.objectContaining) are inherently `any` */
/* eslint-disable @typescript-eslint/no-explicit-any -- mock db/session types */
import type { Mock } from "vitest";
import { describe, expect, it, vi } from "vitest";

import { orgRouter } from "../router/org";
import { createCallerFactory, createTRPCRouter } from "../trpc";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ORG_ID = "10000000-0000-4000-8000-000000000001";
const ADMIN_USER_ID = "10000000-0000-4000-8000-000000000010";
const TARGET_MEMBER_ID = "10000000-0000-4000-8000-000000000020";
const TARGET_USER_ID = "10000000-0000-4000-8000-000000000030";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const router = createTRPCRouter({ org: orgRouter });
const createCaller = createCallerFactory(router);

function makeMember(
  overrides?: Partial<{ id: string; userId: string; role: string }>,
) {
  return {
    id: overrides?.id ?? TARGET_MEMBER_ID,
    organizationId: ORG_ID,
    userId: overrides?.userId ?? TARGET_USER_ID,
    role: overrides?.role ?? "org_admin",
    facilityIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function makeCallerMembership() {
  return {
    ...makeMember({
      id: "caller-mem",
      userId: ADMIN_USER_ID,
      role: "org_admin",
    }),
    organization: {
      id: ORG_ID,
      name: "Test Org",
      slug: "test-org",
      logoUrl: null,
      contactEmail: null,
      contactPhone: null,
      description: null,
      billingEnabled: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };
}

// ---------------------------------------------------------------------------
// Mock DB builder
// ---------------------------------------------------------------------------

interface MockDbOpts {
  callerMembership?: ReturnType<typeof makeCallerMembership> | null;
  targetMember?: ReturnType<typeof makeMember> | null;
  adminCount?: number;
}

function createMockDb(opts?: MockDbOpts) {
  const callerMembership = opts?.callerMembership ?? makeCallerMembership();
  const targetMember = opts?.targetMember ?? makeMember();
  const adminCount = opts?.adminCount ?? 1;

  // db.select().from().where() chain for count query
  const selectWhereFn: Mock = vi.fn().mockResolvedValue([{ adminCount }]);
  const selectFromFn: Mock = vi.fn().mockReturnValue({ where: selectWhereFn });

  // db.update().set().where().returning() chain
  const updateReturningFn: Mock = vi
    .fn()
    .mockResolvedValue([{ ...targetMember }]);
  const updateWhereFn: Mock = vi
    .fn()
    .mockReturnValue({ returning: updateReturningFn });
  const updateSetFn: Mock = vi.fn().mockReturnValue({ where: updateWhereFn });

  // db.delete().where() chain
  const deleteWhereFn: Mock = vi.fn().mockResolvedValue(undefined);

  // Track which findFirst call is which
  let memberFindFirstCallCount = 0;

  return {
    query: {
      organizationMembers: {
        findFirst: vi.fn().mockImplementation(() => {
          memberFindFirstCallCount++;
          // First call = verifyOrgMembership (caller), second call = target lookup
          if (memberFindFirstCallCount === 1) return callerMembership;
          return targetMember;
        }),
      },
    },
    select: vi.fn().mockReturnValue({ from: selectFromFn }),
    update: vi.fn().mockReturnValue({ set: updateSetFn }),
    delete: vi.fn().mockReturnValue({ where: deleteWhereFn }),
    // Expose internals for assertions
    _selectWhereFn: selectWhereFn,
    _deleteWhereFn: deleteWhereFn,
    _updateReturningFn: updateReturningFn,
  };
}

type MockDb = ReturnType<typeof createMockDb>;

function authedCaller(db: MockDb) {
  return createCaller({
    db: db as any,
    session: { user: { id: ADMIN_USER_ID, email: "admin@test.com" } } as any,
    authApi: {} as any,
  });
}

// ===========================================================================
// Tests
// ===========================================================================

describe("last admin protection", () => {
  describe("removeMember", () => {
    it("blocks removal of the sole org_admin", async () => {
      const db = createMockDb({
        targetMember: makeMember({ role: "org_admin" }),
        adminCount: 1,
      });
      const caller = authedCaller(db);

      await expect(
        caller.org.removeMember({
          organizationId: ORG_ID,
          memberId: TARGET_MEMBER_ID,
        }),
      ).rejects.toThrow("No se puede dejar la organización sin administrador");
    });

    it("allows removal when 2+ org_admins exist", async () => {
      const db = createMockDb({
        targetMember: makeMember({ role: "org_admin" }),
        adminCount: 2,
      });
      const caller = authedCaller(db);

      const result = await caller.org.removeMember({
        organizationId: ORG_ID,
        memberId: TARGET_MEMBER_ID,
      });

      expect(result).toEqual({ success: true });
    });

    it("allows removal of non-admin roles regardless of admin count", async () => {
      const db = createMockDb({
        targetMember: makeMember({ role: "facility_manager" }),
        adminCount: 1,
      });
      const caller = authedCaller(db);

      const result = await caller.org.removeMember({
        organizationId: ORG_ID,
        memberId: TARGET_MEMBER_ID,
      });

      expect(result).toEqual({ success: true });
    });
  });

  describe("updateMember", () => {
    it("blocks demotion of the sole org_admin", async () => {
      const db = createMockDb({
        targetMember: makeMember({ role: "org_admin" }),
        adminCount: 1,
      });
      const caller = authedCaller(db);

      await expect(
        caller.org.updateMember({
          organizationId: ORG_ID,
          memberId: TARGET_MEMBER_ID,
          role: "facility_manager",
        }),
      ).rejects.toThrow("No se puede dejar la organización sin administrador");
    });

    it("blocks demotion of the sole org_admin to staff", async () => {
      const db = createMockDb({
        targetMember: makeMember({ role: "org_admin" }),
        adminCount: 1,
      });
      const caller = authedCaller(db);

      await expect(
        caller.org.updateMember({
          organizationId: ORG_ID,
          memberId: TARGET_MEMBER_ID,
          role: "staff",
        }),
      ).rejects.toThrow("No se puede dejar la organización sin administrador");
    });

    it("allows demotion when 2+ org_admins exist", async () => {
      const db = createMockDb({
        targetMember: makeMember({ role: "org_admin" }),
        adminCount: 2,
      });
      const caller = authedCaller(db);

      const result = await caller.org.updateMember({
        organizationId: ORG_ID,
        memberId: TARGET_MEMBER_ID,
        role: "facility_manager",
      });

      expect(result).toBeDefined();
    });

    it("allows role change for non-admin without checking admin count", async () => {
      const db = createMockDb({
        targetMember: makeMember({ role: "facility_manager" }),
        adminCount: 1,
      });
      const caller = authedCaller(db);

      const result = await caller.org.updateMember({
        organizationId: ORG_ID,
        memberId: TARGET_MEMBER_ID,
        role: "staff",
      });

      expect(result).toBeDefined();
      // Should not have called select (admin count query)
      expect(db.select).not.toHaveBeenCalled();
    });

    it("skips check when keeping org_admin role", async () => {
      const db = createMockDb({
        targetMember: makeMember({ role: "org_admin" }),
        adminCount: 1,
      });
      const caller = authedCaller(db);

      const result = await caller.org.updateMember({
        organizationId: ORG_ID,
        memberId: TARGET_MEMBER_ID,
        role: "org_admin",
        facilityIds: [],
      });

      expect(result).toBeDefined();
      // Should not have called select (admin count query) since role stays the same
      expect(db.select).not.toHaveBeenCalled();
    });
  });
});
