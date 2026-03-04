/* eslint-disable @typescript-eslint/no-unsafe-assignment -- vitest mock types (vi.fn, expect.objectContaining) are inherently `any` */
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { inviteRouter } from "../router/invite";
import { createCallerFactory, createTRPCRouter } from "../trpc";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const router = createTRPCRouter({ invite: inviteRouter });
const createCaller = createCallerFactory(router);

/** Minimal org shape returned by the `with: { organization }` relation */
function makeOrg(overrides?: Partial<{ name: string; slug: string }>) {
  return {
    id: "org-1",
    name: overrides?.name ?? "Test Org",
    slug: overrides?.slug ?? "test-org",
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

/** Minimal invite row */
function makeInvite(
  overrides?: Partial<{
    id: string;
    token: string;
    email: string;
    role: string;
    status: string;
    expiresAt: Date;
    facilityIds: string[];
    organizationId: string;
  }>,
) {
  return {
    id: overrides?.id ?? "invite-1",
    organizationId: overrides?.organizationId ?? "org-1",
    email: overrides?.email ?? "new@example.com",
    role: overrides?.role ?? "org_admin",
    facilityIds: overrides?.facilityIds ?? [],
    status: overrides?.status ?? "pending",
    invitedBy: "inviter-1",
    token: overrides?.token ?? "valid-token",
    expiresAt: overrides?.expiresAt ?? new Date(Date.now() + 86400000), // +1 day
    acceptedAt: null,
    createdAt: new Date(),
    organization: makeOrg(),
  };
}

// ---------------------------------------------------------------------------
// Mock DB builder
// ---------------------------------------------------------------------------

interface MockDbOpts {
  inviteFindFirst?: Mock;
  userFindFirst?: Mock;
  accessRequestFindFirst?: Mock;
  memberFindFirst?: Mock;
  insertValues?: Mock;
  updateSet?: Mock;
  selectResult?: unknown[];
}

function createMockDb(opts?: MockDbOpts) {
  const updateWhereFn: Mock = vi.fn().mockResolvedValue(undefined);
  const updateSetFn: Mock =
    opts?.updateSet ?? vi.fn().mockReturnValue({ where: updateWhereFn });
  const insertValuesFn: Mock =
    opts?.insertValues ?? vi.fn().mockResolvedValue(undefined);

  // Chain for db.select().from().innerJoin().where()
  const selectResult = opts?.selectResult ?? [];
  const selectWhereFn: Mock = vi.fn().mockResolvedValue(selectResult);
  const selectInnerJoinFn: Mock = vi
    .fn()
    .mockReturnValue({ where: selectWhereFn });
  const selectFromFn: Mock = vi
    .fn()
    .mockReturnValue({ innerJoin: selectInnerJoinFn });

  return {
    query: {
      organizationInvites: {
        findFirst: opts?.inviteFindFirst ?? vi.fn().mockResolvedValue(null),
      },
      user: {
        findFirst: opts?.userFindFirst ?? vi.fn().mockResolvedValue(null),
      },
      accessRequests: {
        findFirst:
          opts?.accessRequestFindFirst ?? vi.fn().mockResolvedValue(null),
      },
      organizationMembers: {
        findFirst: opts?.memberFindFirst ?? vi.fn().mockResolvedValue(null),
      },
    },
    select: vi.fn().mockReturnValue({ from: selectFromFn }),
    insert: vi.fn().mockReturnValue({ values: insertValuesFn }),
    update: vi.fn().mockReturnValue({ set: updateSetFn }),
  };
}

// Typed shorthand for the mock db
type MockDb = ReturnType<typeof createMockDb>;

// ---------------------------------------------------------------------------
// Mock authApi
// ---------------------------------------------------------------------------
function createMockAuthApi() {
  return {
    signUpEmail: vi.fn().mockResolvedValue({
      user: { id: "new-user-1", email: "new@example.com", name: "New User" },
    }),
  };
}

// ---------------------------------------------------------------------------
// Caller helpers
// ---------------------------------------------------------------------------

function publicCaller(db: MockDb, authApi = createMockAuthApi()) {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  return createCaller({
    db: db as any,
    session: null,
    authApi: authApi as any,
  });
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

function authedCaller(
  db: MockDb,
  sessionUser: { id: string; email: string },
  authApi = createMockAuthApi(),
) {
  return createCaller({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    db: db as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    session: { user: sessionUser } as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    authApi: authApi as any,
  });
}

// ===========================================================================
// Tests
// ===========================================================================

describe("invite.validate", () => {
  it("returns invalid for non-existent token", async () => {
    const db = createMockDb();
    const caller = publicCaller(db);

    const result = await caller.invite.validate({ token: "nonexistent" });

    expect(result).toEqual({ valid: false, error: "invalid" });
  });

  it("returns used for already-accepted invite", async () => {
    const db = createMockDb({
      inviteFindFirst: vi
        .fn()
        .mockResolvedValue(makeInvite({ status: "accepted" })),
    });
    const caller = publicCaller(db);

    const result = await caller.invite.validate({ token: "used-token" });

    expect(result).toEqual({ valid: false, error: "used" });
  });

  it("returns expired for invite with status expired", async () => {
    const db = createMockDb({
      inviteFindFirst: vi
        .fn()
        .mockResolvedValue(makeInvite({ status: "expired" })),
    });
    const caller = publicCaller(db);

    const result = await caller.invite.validate({ token: "expired-token" });

    expect(result).toEqual({ valid: false, error: "expired" });
  });

  it("returns expired for invite past expiresAt", async () => {
    const db = createMockDb({
      inviteFindFirst: vi
        .fn()
        .mockResolvedValue(
          makeInvite({ expiresAt: new Date(Date.now() - 1000) }),
        ),
    });
    const caller = publicCaller(db);

    const result = await caller.invite.validate({ token: "past-token" });

    expect(result).toEqual({ valid: false, error: "expired" });
  });

  it("returns cancelled for cancelled invite", async () => {
    const db = createMockDb({
      inviteFindFirst: vi
        .fn()
        .mockResolvedValue(makeInvite({ status: "cancelled" })),
    });
    const caller = publicCaller(db);

    const result = await caller.invite.validate({ token: "cancelled-token" });

    expect(result).toEqual({ valid: false, error: "cancelled" });
  });

  it("returns valid with invite details for pending invite (no existing user, no access request)", async () => {
    const db = createMockDb({
      inviteFindFirst: vi.fn().mockResolvedValue(makeInvite()),
    });
    const caller = publicCaller(db);

    const result = await caller.invite.validate({ token: "valid-token" });

    expect(result).toEqual({
      valid: true,
      invite: {
        email: "new@example.com",
        role: "org_admin",
        roleLabel: "Administrador",
        organizationName: "Test Org",
        organizationSlug: "test-org",
        suggestedName: null,
      },
      emailHasAccount: false,
    });
  });

  it("returns emailHasAccount: true when email has existing user", async () => {
    const db = createMockDb({
      inviteFindFirst: vi.fn().mockResolvedValue(makeInvite()),
      userFindFirst: vi
        .fn()
        .mockResolvedValue({ id: "existing-user", email: "new@example.com" }),
    });
    const caller = publicCaller(db);

    const result = await caller.invite.validate({ token: "valid-token" });

    expect(result).toMatchObject({
      valid: true,
      emailHasAccount: true,
    });
  });

  it("returns suggestedName from access request", async () => {
    const db = createMockDb({
      inviteFindFirst: vi.fn().mockResolvedValue(makeInvite()),
      accessRequestFindFirst: vi.fn().mockResolvedValue({ name: "Juan Pérez" }),
    });
    const caller = publicCaller(db);

    const result = await caller.invite.validate({ token: "valid-token" });

    expect(result).toMatchObject({
      valid: true,
      invite: expect.objectContaining({ suggestedName: "Juan Pérez" }),
    });
  });

  it("returns correct roleLabel for each role", async () => {
    for (const [role, label] of [
      ["org_admin", "Administrador"],
      ["facility_manager", "Gerente de sede"],
      ["staff", "Staff"],
    ] as const) {
      const db = createMockDb({
        inviteFindFirst: vi.fn().mockResolvedValue(makeInvite({ role })),
      });
      const caller = publicCaller(db);
      const result = await caller.invite.validate({ token: "t" });
      expect(result).toMatchObject({
        valid: true,
        invite: expect.objectContaining({ roleLabel: label }),
      });
    }
  });
});

// ===========================================================================

describe("invite.accept", () => {
  let db: MockDb;
  let authApi: ReturnType<typeof createMockAuthApi>;

  beforeEach(() => {
    authApi = createMockAuthApi();
    db = createMockDb({
      inviteFindFirst: vi.fn().mockResolvedValue(makeInvite()),
    });
  });

  it("creates user, membership, and marks invite accepted", async () => {
    const caller = publicCaller(db, authApi);

    const result = await caller.invite.accept({
      token: "valid-token",
      name: "New User",
      password: "securepassword",
    });

    expect(result).toEqual({
      success: true,
      email: "new@example.com",
      organizationSlug: "test-org",
    });

    // Verify user created via authApi
    expect(authApi.signUpEmail).toHaveBeenCalledWith({
      body: {
        email: "new@example.com",
        password: "securepassword",
        name: "New User",
      },
    });

    // Verify membership inserted
    expect(db.insert).toHaveBeenCalled();

    // Verify invite marked accepted
    expect(db.update).toHaveBeenCalled();
  });

  it("throws NOT_FOUND for non-existent/used token", async () => {
    const db = createMockDb(); // findFirst returns null
    const caller = publicCaller(db, authApi);

    await expect(
      caller.invite.accept({
        token: "bad",
        name: "User",
        password: "password123",
      }),
    ).rejects.toThrow("Invitación no válida o ya fue utilizada.");
  });

  it("throws BAD_REQUEST for expired token", async () => {
    const db = createMockDb({
      inviteFindFirst: vi
        .fn()
        .mockResolvedValue(
          makeInvite({ expiresAt: new Date(Date.now() - 1000) }),
        ),
    });
    const caller = publicCaller(db, authApi);

    await expect(
      caller.invite.accept({
        token: "expired",
        name: "User",
        password: "password123",
      }),
    ).rejects.toThrow("Esta invitación ha expirado.");
  });

  it("throws CONFLICT when email already has an account", async () => {
    const db = createMockDb({
      inviteFindFirst: vi.fn().mockResolvedValue(makeInvite()),
      userFindFirst: vi
        .fn()
        .mockResolvedValue({ id: "existing", email: "new@example.com" }),
    });
    const caller = publicCaller(db, authApi);

    await expect(
      caller.invite.accept({
        token: "valid",
        name: "User",
        password: "password123",
      }),
    ).rejects.toThrow(
      "Ya existe una cuenta con este email. Inicia sesión y acepta la invitación.",
    );
  });

  it("carries role and facilityIds from invite to membership", async () => {
    const invite = makeInvite({
      role: "facility_manager",
      facilityIds: ["fac-1", "fac-2"],
    });
    const db = createMockDb({
      inviteFindFirst: vi.fn().mockResolvedValue(invite),
    });
    const insertValuesFn = vi.fn().mockResolvedValue(undefined);
    db.insert = vi.fn().mockReturnValue({ values: insertValuesFn });

    const caller = publicCaller(db, authApi);

    await caller.invite.accept({
      token: "valid-token",
      name: "Manager",
      password: "password123",
    });

    expect(insertValuesFn).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: "org-1",
        userId: "new-user-1",
        role: "facility_manager",
        facilityIds: ["fac-1", "fac-2"],
      }),
    );
  });
});

// ===========================================================================

describe("invite.acceptExisting", () => {
  const existingUser = { id: "user-1", email: "new@example.com" };

  it("creates membership and marks invite accepted for matching user", async () => {
    const insertValuesFn = vi.fn().mockResolvedValue(undefined);
    const updateWhereFn = vi.fn().mockResolvedValue(undefined);
    const updateSetFn = vi.fn().mockReturnValue({ where: updateWhereFn });
    const db = createMockDb({
      inviteFindFirst: vi.fn().mockResolvedValue(makeInvite()),
    });
    db.insert = vi.fn().mockReturnValue({ values: insertValuesFn });
    db.update = vi.fn().mockReturnValue({ set: updateSetFn });

    const caller = authedCaller(db, existingUser);

    const result = await caller.invite.acceptExisting({ token: "valid-token" });

    expect(result).toEqual({
      success: true,
      organizationSlug: "test-org",
    });
    expect(insertValuesFn).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: "org-1",
        userId: "user-1",
        role: "org_admin",
        facilityIds: [],
      }),
    );
    expect(updateSetFn).toHaveBeenCalledWith(
      expect.objectContaining({ status: "accepted" }),
    );
  });

  it("throws FORBIDDEN when email does not match invite", async () => {
    const db = createMockDb({
      inviteFindFirst: vi
        .fn()
        .mockResolvedValue(makeInvite({ email: "other@example.com" })),
    });
    const caller = authedCaller(db, existingUser);

    await expect(caller.invite.acceptExisting({ token: "t" })).rejects.toThrow(
      "Esta invitación fue enviada a otro email. Inicia sesión con el email correcto.",
    );
  });

  it("marks invite accepted without creating membership if already a member", async () => {
    const updateWhereFn = vi.fn().mockResolvedValue(undefined);
    const updateSetFn = vi.fn().mockReturnValue({ where: updateWhereFn });
    const db = createMockDb({
      inviteFindFirst: vi.fn().mockResolvedValue(makeInvite()),
      memberFindFirst: vi.fn().mockResolvedValue({
        id: "member-1",
        organizationId: "org-1",
        userId: "user-1",
      }),
    });
    db.update = vi.fn().mockReturnValue({ set: updateSetFn });

    const caller = authedCaller(db, existingUser);

    const result = await caller.invite.acceptExisting({ token: "valid-token" });

    expect(result).toEqual({
      success: true,
      organizationSlug: "test-org",
    });
    // Should NOT insert a new membership
    expect(db.insert).not.toHaveBeenCalled();
    // Should still mark invite accepted
    expect(updateSetFn).toHaveBeenCalledWith(
      expect.objectContaining({ status: "accepted" }),
    );
  });

  it("throws NOT_FOUND for invalid/used token", async () => {
    const db = createMockDb(); // findFirst returns null
    const caller = authedCaller(db, existingUser);

    await expect(
      caller.invite.acceptExisting({ token: "bad" }),
    ).rejects.toThrow("Invitación no válida o ya fue utilizada.");
  });

  it("throws BAD_REQUEST for expired token", async () => {
    const db = createMockDb({
      inviteFindFirst: vi
        .fn()
        .mockResolvedValue(
          makeInvite({ expiresAt: new Date(Date.now() - 1000) }),
        ),
    });
    const caller = authedCaller(db, existingUser);

    await expect(
      caller.invite.acceptExisting({ token: "expired" }),
    ).rejects.toThrow("Esta invitación ha expirado.");
  });

  it("throws UNAUTHORIZED when not authenticated", async () => {
    const db = createMockDb({
      inviteFindFirst: vi.fn().mockResolvedValue(makeInvite()),
    });
    const caller = publicCaller(db);

    await expect(
      caller.invite.acceptExisting({ token: "valid-token" }),
    ).rejects.toThrow("UNAUTHORIZED");
  });
});

// ===========================================================================

describe("invite.getPendingInvites", () => {
  const sessionUser = { id: "user-1", email: "user@example.com" };

  it("returns pending invites for authenticated user", async () => {
    const futureDate = new Date(Date.now() + 86400000);
    const db = createMockDb({
      selectResult: [
        {
          id: "inv-1",
          token: "token-1",
          role: "org_admin",
          expiresAt: futureDate,
          organizationName: "Org A",
          organizationSlug: "org-a",
        },
        {
          id: "inv-2",
          token: "token-2",
          role: "staff",
          expiresAt: futureDate,
          organizationName: "Org B",
          organizationSlug: "org-b",
        },
      ],
    });
    const caller = authedCaller(db, sessionUser);

    const result = await caller.invite.getPendingInvites();

    expect(result).toEqual([
      {
        id: "inv-1",
        token: "token-1",
        role: "org_admin",
        roleLabel: "Administrador",
        expiresAt: futureDate,
        organizationName: "Org A",
        organizationSlug: "org-a",
      },
      {
        id: "inv-2",
        token: "token-2",
        role: "staff",
        roleLabel: "Staff",
        expiresAt: futureDate,
        organizationName: "Org B",
        organizationSlug: "org-b",
      },
    ]);
  });

  it("returns empty array when no pending invites", async () => {
    const db = createMockDb({ selectResult: [] });
    const caller = authedCaller(db, sessionUser);

    const result = await caller.invite.getPendingInvites();

    expect(result).toEqual([]);
  });

  it("filters out expired invites (past expiresAt)", async () => {
    const db = createMockDb({
      selectResult: [
        {
          id: "inv-expired",
          token: "token-exp",
          role: "org_admin",
          expiresAt: new Date(Date.now() - 1000),
          organizationName: "Expired Org",
          organizationSlug: "expired-org",
        },
      ],
    });
    const caller = authedCaller(db, sessionUser);

    const result = await caller.invite.getPendingInvites();

    expect(result).toEqual([]);
  });

  it("throws UNAUTHORIZED when not authenticated", async () => {
    const db = createMockDb();
    const caller = publicCaller(db);

    await expect(caller.invite.getPendingInvites()).rejects.toThrow(
      "UNAUTHORIZED",
    );
  });
});
