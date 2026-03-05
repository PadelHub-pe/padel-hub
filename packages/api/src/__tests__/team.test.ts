/* eslint-disable @typescript-eslint/no-unsafe-assignment -- vitest mock types (vi.fn, expect.objectContaining) are inherently `any` */
/* eslint-disable @typescript-eslint/no-explicit-any -- mock DB/context types don't match real types */
import { describe, expect, it, vi } from "vitest";

import { orgRouter } from "../router/org";
import { createCallerFactory, createTRPCRouter } from "../trpc";

// Mock email sending
vi.mock("@wifo/email", () => ({
  sendOrganizationInvite: vi.fn().mockResolvedValue(undefined),
}));

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ORG_ID = "00000000-0000-1000-a000-000000000001";
const FACILITY_A = "00000000-0000-1000-a000-00000000000a";
const FACILITY_B = "00000000-0000-1000-a000-00000000000b";
const FACILITY_C = "00000000-0000-1000-a000-00000000000c";
const USER_ADMIN = {
  id: "00000000-0000-1000-a000-000000000101",
  name: "Admin",
  email: "admin@test.com",
};
const USER_MANAGER = {
  id: "00000000-0000-1000-a000-000000000102",
  name: "Manager",
  email: "manager@test.com",
};
const USER_STAFF = {
  id: "00000000-0000-1000-a000-000000000103",
  name: "Staff",
  email: "staff@test.com",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const router = createTRPCRouter({ org: orgRouter });
const createCaller = createCallerFactory(router);

/** Derive a valid UUID for a membership from a user UUID. */
function memId(userId: string): string {
  return userId.replace(/^.{8}/, "20000000");
}

function makeOrg() {
  return {
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
  };
}

function makeMembership(
  userId: string,
  role: "org_admin" | "facility_manager" | "staff",
  facilityIds: string[] = [],
  overrides?: Partial<{ id: string }>,
) {
  return {
    id: overrides?.id ?? memId(userId),
    organizationId: ORG_ID,
    userId,
    role,
    facilityIds,
    createdAt: new Date(),
    updatedAt: new Date(),
    organization: makeOrg(),
  };
}

function makeMemberWithUser(
  userId: string,
  role: "org_admin" | "facility_manager" | "staff",
  facilityIds: string[] = [],
  email?: string,
) {
  return {
    ...makeMembership(userId, role, facilityIds),
    user: {
      id: userId,
      name: `User ${userId}`,
      email: email ?? `${userId}@test.com`,
      image: null,
    },
  };
}

function makeInvite(
  email: string,
  role: "org_admin" | "facility_manager" | "staff",
  facilityIds: string[] = [],
  overrides?: Partial<{ id: string; status: string }>,
) {
  return {
    id: overrides?.id ?? `invite-${email}`,
    organizationId: ORG_ID,
    email,
    role,
    facilityIds,
    status: overrides?.status ?? "pending",
    invitedBy: USER_ADMIN.id,
    token: "tok-123",
    expiresAt: new Date(Date.now() + 86400000),
    acceptedAt: null,
    createdAt: new Date(),
  };
}

// ---------------------------------------------------------------------------
// Mock DB builder
// ---------------------------------------------------------------------------

interface MockDbOpts {
  callerMembership: ReturnType<typeof makeMembership>;
  allMembers?: ReturnType<typeof makeMemberWithUser>[];
  pendingInvites?: ReturnType<typeof makeInvite>[];
  existingMemberEmails?: string[];
  existingPendingInviteEmail?: string | null;
  facilities?: { id: string; name: string }[];
}

function createMockDb(opts: MockDbOpts) {
  const insertReturningFn = vi.fn().mockResolvedValue([
    {
      id: "new-invite-1",
      organizationId: ORG_ID,
      email: "invited@test.com",
      role: "staff",
      facilityIds: [],
      status: "pending",
      createdAt: new Date(),
    },
  ]);
  const insertValuesFn = vi
    .fn()
    .mockReturnValue({ returning: insertReturningFn });

  return {
    query: {
      organizationMembers: {
        findFirst: vi.fn().mockResolvedValue(opts.callerMembership),
        findMany: vi.fn().mockResolvedValue(opts.allMembers ?? []),
      },
      organizationInvites: {
        findFirst: vi
          .fn()
          .mockResolvedValue(
            opts.existingPendingInviteEmail
              ? makeInvite(opts.existingPendingInviteEmail, "staff")
              : null,
          ),
        findMany: vi.fn().mockResolvedValue(opts.pendingInvites ?? []),
      },
      facilities: {
        findMany: vi.fn().mockResolvedValue(
          opts.facilities ?? [
            { id: FACILITY_A, name: "Facility A" },
            { id: FACILITY_B, name: "Facility B" },
            { id: FACILITY_C, name: "Facility C" },
          ],
        ),
      },
    },
    insert: vi.fn().mockReturnValue({ values: insertValuesFn }),
  };
}

function authedCaller(
  db: ReturnType<typeof createMockDb>,
  sessionUser: { id: string; name: string; email: string },
) {
  return createCaller({
    db: db as any,
    session: { user: sessionUser } as any,
    authApi: {} as any,
  });
}

// ===========================================================================
// Tests: inviteMember scoping for facility_manager
// ===========================================================================

describe("org.inviteMember – facility_manager scoping", () => {
  it("allows facility_manager to invite staff with subset facilityIds", async () => {
    const db = createMockDb({
      callerMembership: makeMembership(USER_MANAGER.id, "facility_manager", [
        FACILITY_A,
        FACILITY_B,
      ]),
      allMembers: [],
    });
    const caller = authedCaller(db, USER_MANAGER);

    const result = await caller.org.inviteMember({
      organizationId: ORG_ID,
      email: "newstaff@test.com",
      role: "staff",
      facilityIds: [FACILITY_A],
    });

    expect(result).toEqual(expect.objectContaining({ id: "new-invite-1" }));
  });

  it("blocks facility_manager from inviting org_admin", async () => {
    const db = createMockDb({
      callerMembership: makeMembership(USER_MANAGER.id, "facility_manager", [
        FACILITY_A,
      ]),
    });
    const caller = authedCaller(db, USER_MANAGER);

    await expect(
      caller.org.inviteMember({
        organizationId: ORG_ID,
        email: "newadmin@test.com",
        role: "org_admin",
      }),
    ).rejects.toThrow("Solo puedes invitar miembros con rol de staff");
  });

  it("blocks facility_manager from inviting facility_manager", async () => {
    const db = createMockDb({
      callerMembership: makeMembership(USER_MANAGER.id, "facility_manager", [
        FACILITY_A,
      ]),
    });
    const caller = authedCaller(db, USER_MANAGER);

    await expect(
      caller.org.inviteMember({
        organizationId: ORG_ID,
        email: "newmgr@test.com",
        role: "facility_manager",
        facilityIds: [FACILITY_A],
      }),
    ).rejects.toThrow("Solo puedes invitar miembros con rol de staff");
  });

  it("blocks facility_manager when facilityIds is not a subset of their own", async () => {
    const db = createMockDb({
      callerMembership: makeMembership(USER_MANAGER.id, "facility_manager", [
        FACILITY_A,
      ]),
      allMembers: [],
    });
    const caller = authedCaller(db, USER_MANAGER);

    await expect(
      caller.org.inviteMember({
        organizationId: ORG_ID,
        email: "newstaff@test.com",
        role: "staff",
        facilityIds: [FACILITY_A, FACILITY_C],
      }),
    ).rejects.toThrow("Solo puedes asignar locales a los que tienes acceso");
  });

  it("blocks facility_manager when no facilityIds provided", async () => {
    const db = createMockDb({
      callerMembership: makeMembership(USER_MANAGER.id, "facility_manager", [
        FACILITY_A,
      ]),
    });
    const caller = authedCaller(db, USER_MANAGER);

    await expect(
      caller.org.inviteMember({
        organizationId: ORG_ID,
        email: "newstaff@test.com",
        role: "staff",
        facilityIds: [],
      }),
    ).rejects.toThrow("Debes asignar al menos un local");
  });

  it("blocks staff from inviting anyone", async () => {
    const db = createMockDb({
      callerMembership: makeMembership(USER_STAFF.id, "staff", [FACILITY_A]),
    });
    const caller = authedCaller(db, USER_STAFF);

    await expect(
      caller.org.inviteMember({
        organizationId: ORG_ID,
        email: "anyone@test.com",
        role: "staff",
        facilityIds: [FACILITY_A],
      }),
    ).rejects.toThrow("No tienes permisos para invitar miembros");
  });

  it("org_admin can still invite any role", async () => {
    const db = createMockDb({
      callerMembership: makeMembership(USER_ADMIN.id, "org_admin"),
      allMembers: [],
    });
    const caller = authedCaller(db, USER_ADMIN);

    const result = await caller.org.inviteMember({
      organizationId: ORG_ID,
      email: "newadmin@test.com",
      role: "org_admin",
    });

    expect(result).toBeDefined();
  });
});

// ===========================================================================
// Tests: getTeamMembers scoping for facility_manager
// ===========================================================================

describe("org.getTeamMembers – facility_manager scoping", () => {
  const adminMember = makeMemberWithUser(
    USER_ADMIN.id,
    "org_admin",
    [],
    USER_ADMIN.email,
  );
  const managerAB = makeMemberWithUser(
    USER_MANAGER.id,
    "facility_manager",
    [FACILITY_A, FACILITY_B],
    USER_MANAGER.email,
  );
  const staffA = makeMemberWithUser(
    "00000000-0000-1000-a000-000000000201",
    "staff",
    [FACILITY_A],
    "staff-a@test.com",
  );
  const staffC = makeMemberWithUser(
    "00000000-0000-1000-a000-000000000202",
    "staff",
    [FACILITY_C],
    "staff-c@test.com",
  );
  const managerAll = makeMemberWithUser(
    "00000000-0000-1000-a000-000000000203",
    "facility_manager",
    [],
    "mgr-all@test.com",
  );

  it("facility_manager sees only members with overlapping facilities", async () => {
    const db = createMockDb({
      callerMembership: makeMembership(USER_MANAGER.id, "facility_manager", [
        FACILITY_A,
        FACILITY_B,
      ]),
      allMembers: [adminMember, managerAB, staffA, staffC, managerAll],
      pendingInvites: [],
    });
    const caller = authedCaller(db, USER_MANAGER);

    const result = await caller.org.getTeamMembers({
      organizationId: ORG_ID,
    });

    const emails = result.members.map((m) => m.email);
    // Should see: org_admin (always visible), self (facility_manager AB), staffA (facility A overlap), managerAll (all-facilities manager)
    expect(emails).toContain(USER_ADMIN.email);
    expect(emails).toContain(USER_MANAGER.email);
    expect(emails).toContain("staff-a@test.com");
    expect(emails).toContain("mgr-all@test.com");
    // Should NOT see staffC (only facility C, no overlap)
    expect(emails).not.toContain("staff-c@test.com");
  });

  it("facility_manager sees only invites with overlapping facilities", async () => {
    const inviteA = makeInvite("inv-a@test.com", "staff", [FACILITY_A]);
    const inviteC = makeInvite("inv-c@test.com", "staff", [FACILITY_C]);
    const inviteAdmin = makeInvite("inv-admin@test.com", "org_admin", []);

    const db = createMockDb({
      callerMembership: makeMembership(USER_MANAGER.id, "facility_manager", [
        FACILITY_A,
      ]),
      allMembers: [managerAB],
      pendingInvites: [inviteA, inviteC, inviteAdmin],
    });
    const caller = authedCaller(db, USER_MANAGER);

    const result = await caller.org.getTeamMembers({
      organizationId: ORG_ID,
    });

    const inviteEmails = result.members
      .filter((m) => m.type === "invite")
      .map((m) => m.email);
    expect(inviteEmails).toContain("inv-a@test.com");
    expect(inviteEmails).toContain("inv-admin@test.com");
    expect(inviteEmails).not.toContain("inv-c@test.com");
  });

  it("facility_manager only sees their scoped facilities in the response", async () => {
    const db = createMockDb({
      callerMembership: makeMembership(USER_MANAGER.id, "facility_manager", [
        FACILITY_A,
      ]),
      allMembers: [managerAB],
      pendingInvites: [],
      facilities: [
        { id: FACILITY_A, name: "Facility A" },
        { id: FACILITY_B, name: "Facility B" },
        { id: FACILITY_C, name: "Facility C" },
      ],
    });
    const caller = authedCaller(db, USER_MANAGER);

    const result = await caller.org.getTeamMembers({
      organizationId: ORG_ID,
    });

    expect(result.facilities).toHaveLength(1);
    expect(result.facilities[0]).toEqual(
      expect.objectContaining({ id: FACILITY_A }),
    );
  });

  it("org_admin sees all members and facilities", async () => {
    const db = createMockDb({
      callerMembership: makeMembership(USER_ADMIN.id, "org_admin"),
      allMembers: [adminMember, managerAB, staffA, staffC],
      pendingInvites: [],
    });
    const caller = authedCaller(db, USER_ADMIN);

    const result = await caller.org.getTeamMembers({
      organizationId: ORG_ID,
    });

    expect(result.members).toHaveLength(4);
    expect(result.facilities).toHaveLength(3);
  });

  it("staff cannot view team members", async () => {
    const db = createMockDb({
      callerMembership: makeMembership(USER_STAFF.id, "staff", [FACILITY_A]),
    });
    const caller = authedCaller(db, USER_STAFF);

    await expect(
      caller.org.getTeamMembers({ organizationId: ORG_ID }),
    ).rejects.toThrow("No tienes permisos para ver el equipo");
  });
});

// ===========================================================================
// Tests: inviteMember – duplicate prevention
// ===========================================================================

describe("org.inviteMember – duplicate prevention", () => {
  it("blocks invite when email is already a member", async () => {
    const db = createMockDb({
      callerMembership: makeMembership(USER_ADMIN.id, "org_admin"),
      allMembers: [
        makeMemberWithUser(
          "00000000-0000-1000-a000-000000000301",
          "staff",
          [FACILITY_A],
          "existing@test.com",
        ),
      ],
    });
    const caller = authedCaller(db, USER_ADMIN);

    await expect(
      caller.org.inviteMember({
        organizationId: ORG_ID,
        email: "existing@test.com",
        role: "staff",
      }),
    ).rejects.toThrow("Este email ya es miembro de la organización");
  });

  it("blocks invite when email has pending invite", async () => {
    const db = createMockDb({
      callerMembership: makeMembership(USER_ADMIN.id, "org_admin"),
      allMembers: [],
      existingPendingInviteEmail: "pending@test.com",
    });
    const caller = authedCaller(db, USER_ADMIN);

    await expect(
      caller.org.inviteMember({
        organizationId: ORG_ID,
        email: "pending@test.com",
        role: "staff",
      }),
    ).rejects.toThrow("Ya existe una invitación pendiente para este email");
  });

  it("allows invite when no existing member or invite", async () => {
    const db = createMockDb({
      callerMembership: makeMembership(USER_ADMIN.id, "org_admin"),
      allMembers: [],
    });
    const caller = authedCaller(db, USER_ADMIN);

    const result = await caller.org.inviteMember({
      organizationId: ORG_ID,
      email: "brand-new@test.com",
      role: "staff",
    });

    expect(result).toEqual(expect.objectContaining({ id: "new-invite-1" }));
  });
});

// ===========================================================================
// Mock DB builder for updateMember / removeMember
// ===========================================================================

interface MemberActionMockOpts {
  callerMembership: ReturnType<typeof makeMembership>;
  targetMember?: ReturnType<typeof makeMembership> | null;
  adminCount?: number;
}

function createMemberActionMockDb(opts: MemberActionMockOpts) {
  let findFirstCallCount = 0;

  const selectWhereFn = vi
    .fn()
    .mockResolvedValue([{ adminCount: opts.adminCount ?? 1 }]);
  const selectFromFn = vi.fn().mockReturnValue({ where: selectWhereFn });

  const targetMember = opts.targetMember ?? null;
  const updateReturningFn = vi.fn().mockResolvedValue([targetMember]);
  const updateWhereFn = vi
    .fn()
    .mockReturnValue({ returning: updateReturningFn });
  const updateSetFn = vi.fn().mockReturnValue({ where: updateWhereFn });

  const deleteWhereFn = vi.fn().mockResolvedValue(undefined);

  return {
    query: {
      organizationMembers: {
        findFirst: vi.fn().mockImplementation(() => {
          findFirstCallCount++;
          if (findFirstCallCount === 1) return opts.callerMembership;
          return targetMember;
        }),
      },
    },
    select: vi.fn().mockReturnValue({ from: selectFromFn }),
    update: vi.fn().mockReturnValue({ set: updateSetFn }),
    delete: vi.fn().mockReturnValue({ where: deleteWhereFn }),
  };
}

function memberActionCaller(
  db: ReturnType<typeof createMemberActionMockDb>,
  sessionUser: { id: string; name: string; email: string },
) {
  return createCaller({
    db: db as any,
    session: { user: sessionUser } as any,
    authApi: {} as any,
  });
}

// ===========================================================================
// Tests: updateMember – self-edit prevention
// ===========================================================================

describe("org.updateMember – self-edit prevention", () => {
  it("blocks editing own role", async () => {
    const db = createMemberActionMockDb({
      callerMembership: makeMembership(USER_ADMIN.id, "org_admin"),
      targetMember: makeMembership(USER_ADMIN.id, "org_admin"),
    });
    const caller = memberActionCaller(db, USER_ADMIN);

    await expect(
      caller.org.updateMember({
        organizationId: ORG_ID,
        memberId: memId(USER_ADMIN.id),
        role: "facility_manager",
      }),
    ).rejects.toThrow("No puedes editar tu propio rol");
  });
});

// ===========================================================================
// Tests: removeMember – self-remove prevention
// ===========================================================================

describe("org.removeMember – self-remove prevention", () => {
  it("blocks removing self", async () => {
    const db = createMemberActionMockDb({
      callerMembership: makeMembership(USER_ADMIN.id, "org_admin"),
      targetMember: makeMembership(USER_ADMIN.id, "org_admin"),
    });
    const caller = memberActionCaller(db, USER_ADMIN);

    await expect(
      caller.org.removeMember({
        organizationId: ORG_ID,
        memberId: memId(USER_ADMIN.id),
      }),
    ).rejects.toThrow("No puedes eliminarte a ti mismo");
  });
});

// ===========================================================================
// Tests: updateMember – permission checks
// ===========================================================================

describe("org.updateMember – permission checks", () => {
  it("blocks non-admin from editing members", async () => {
    const db = createMemberActionMockDb({
      callerMembership: makeMembership(USER_MANAGER.id, "facility_manager", [
        FACILITY_A,
      ]),
    });
    const caller = memberActionCaller(db, USER_MANAGER);

    await expect(
      caller.org.updateMember({
        organizationId: ORG_ID,
        memberId: "20000000-0000-1000-a000-000000000999",
        role: "staff",
      }),
    ).rejects.toThrow("Solo los administradores pueden editar miembros");
  });
});

// ===========================================================================
// Tests: removeMember – permission checks
// ===========================================================================

describe("org.removeMember – permission checks", () => {
  it("blocks non-admin from removing members", async () => {
    const db = createMemberActionMockDb({
      callerMembership: makeMembership(USER_MANAGER.id, "facility_manager", [
        FACILITY_A,
      ]),
    });
    const caller = memberActionCaller(db, USER_MANAGER);

    await expect(
      caller.org.removeMember({
        organizationId: ORG_ID,
        memberId: "20000000-0000-1000-a000-000000000999",
      }),
    ).rejects.toThrow("Solo los administradores pueden eliminar miembros");
  });
});

// ===========================================================================
// Tests: last admin protection
// ===========================================================================

const OTHER_USER_ID = "00000000-0000-1000-a000-000000000401";

describe("org.removeMember – last admin protection", () => {
  it("blocks removal of sole org_admin", async () => {
    const db = createMemberActionMockDb({
      callerMembership: makeMembership(USER_ADMIN.id, "org_admin"),
      targetMember: makeMembership(OTHER_USER_ID, "org_admin"),
      adminCount: 1,
    });
    const caller = memberActionCaller(db, USER_ADMIN);

    await expect(
      caller.org.removeMember({
        organizationId: ORG_ID,
        memberId: memId(OTHER_USER_ID),
      }),
    ).rejects.toThrow("No se puede dejar la organización sin administrador");
  });

  it("allows removal when 2+ org_admins exist", async () => {
    const db = createMemberActionMockDb({
      callerMembership: makeMembership(USER_ADMIN.id, "org_admin"),
      targetMember: makeMembership(OTHER_USER_ID, "org_admin"),
      adminCount: 2,
    });
    const caller = memberActionCaller(db, USER_ADMIN);

    const result = await caller.org.removeMember({
      organizationId: ORG_ID,
      memberId: memId(OTHER_USER_ID),
    });

    expect(result).toEqual({ success: true });
  });

  it("allows removal of non-admin regardless of admin count", async () => {
    const db = createMemberActionMockDb({
      callerMembership: makeMembership(USER_ADMIN.id, "org_admin"),
      targetMember: makeMembership(OTHER_USER_ID, "facility_manager", [
        FACILITY_A,
      ]),
      adminCount: 1,
    });
    const caller = memberActionCaller(db, USER_ADMIN);

    const result = await caller.org.removeMember({
      organizationId: ORG_ID,
      memberId: memId(OTHER_USER_ID),
    });

    expect(result).toEqual({ success: true });
  });
});

describe("org.updateMember – last admin protection", () => {
  it("blocks demotion of sole org_admin to facility_manager", async () => {
    const db = createMemberActionMockDb({
      callerMembership: makeMembership(USER_ADMIN.id, "org_admin"),
      targetMember: makeMembership(OTHER_USER_ID, "org_admin"),
      adminCount: 1,
    });
    const caller = memberActionCaller(db, USER_ADMIN);

    await expect(
      caller.org.updateMember({
        organizationId: ORG_ID,
        memberId: memId(OTHER_USER_ID),
        role: "facility_manager",
      }),
    ).rejects.toThrow("No se puede dejar la organización sin administrador");
  });

  it("blocks demotion of sole org_admin to staff", async () => {
    const db = createMemberActionMockDb({
      callerMembership: makeMembership(USER_ADMIN.id, "org_admin"),
      targetMember: makeMembership(OTHER_USER_ID, "org_admin"),
      adminCount: 1,
    });
    const caller = memberActionCaller(db, USER_ADMIN);

    await expect(
      caller.org.updateMember({
        organizationId: ORG_ID,
        memberId: memId(OTHER_USER_ID),
        role: "staff",
      }),
    ).rejects.toThrow("No se puede dejar la organización sin administrador");
  });

  it("allows demotion when 2+ org_admins exist", async () => {
    const db = createMemberActionMockDb({
      callerMembership: makeMembership(USER_ADMIN.id, "org_admin"),
      targetMember: makeMembership(OTHER_USER_ID, "org_admin"),
      adminCount: 2,
    });
    const caller = memberActionCaller(db, USER_ADMIN);

    const result = await caller.org.updateMember({
      organizationId: ORG_ID,
      memberId: memId(OTHER_USER_ID),
      role: "facility_manager",
    });

    expect(result).toBeDefined();
  });

  it("skips admin count check when role stays org_admin", async () => {
    const db = createMemberActionMockDb({
      callerMembership: makeMembership(USER_ADMIN.id, "org_admin"),
      targetMember: makeMembership(OTHER_USER_ID, "org_admin"),
      adminCount: 1,
    });
    const caller = memberActionCaller(db, USER_ADMIN);

    const result = await caller.org.updateMember({
      organizationId: ORG_ID,
      memberId: memId(OTHER_USER_ID),
      role: "org_admin",
      facilityIds: [],
    });

    expect(result).toBeDefined();
    // Should not have called select (admin count query)
    expect(db.select).not.toHaveBeenCalled();
  });

  it("skips admin count check when changing non-admin role", async () => {
    const db = createMemberActionMockDb({
      callerMembership: makeMembership(USER_ADMIN.id, "org_admin"),
      targetMember: makeMembership(OTHER_USER_ID, "facility_manager", [
        FACILITY_A,
      ]),
      adminCount: 1,
    });
    const caller = memberActionCaller(db, USER_ADMIN);

    const result = await caller.org.updateMember({
      organizationId: ORG_ID,
      memberId: memId(OTHER_USER_ID),
      role: "staff",
    });

    expect(result).toBeDefined();
    expect(db.select).not.toHaveBeenCalled();
  });
});
/* eslint-enable @typescript-eslint/no-unsafe-assignment */
/* eslint-enable @typescript-eslint/no-explicit-any */
