/* eslint-disable @typescript-eslint/no-unsafe-assignment -- vitest mock types (vi.fn, expect.objectContaining) are inherently `any` */
/* eslint-disable @typescript-eslint/no-explicit-any -- mock DB/context types don't match real types */
import { describe, expect, it, vi } from "vitest";

import { accountRouter } from "../router/account";
import { createCallerFactory, createTRPCRouter } from "../trpc";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const USER_ID = "00000000-0000-1000-a000-000000000001";
const ORG_ID = "00000000-0000-1000-a000-000000000010";
const SESSION_USER = { id: USER_ID, email: "test@example.com" };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const router = createTRPCRouter({ account: accountRouter });
const createCaller = createCallerFactory(router);

function makeCaller(db: any) {
  return createCaller({
    db,
    session: { user: SESSION_USER } as any,
    authApi: {} as any,
  });
}

function makeUser(overrides?: Record<string, unknown>) {
  return {
    id: USER_ID,
    name: "Test User",
    email: "test@example.com",
    image: null,
    phone: null,
    ...overrides,
  };
}

function makeMembership(overrides?: Record<string, unknown>) {
  return {
    id: "mem-1",
    organizationId: ORG_ID,
    userId: USER_ID,
    role: "org_admin",
    facilityIds: [],
    organization: {
      id: ORG_ID,
      name: "Test Org",
      slug: "test-org",
      logoUrl: null,
    },
    ...overrides,
  };
}

function createMockDb(opts: {
  user?: Record<string, unknown> | null;
  membership?: Record<string, unknown> | null;
  accounts?: { providerId: string }[];
  facilities?: { id: string; name: string }[];
}) {
  const selectFrom = vi.fn().mockReturnValue({
    where: vi.fn().mockResolvedValue(opts.facilities ?? []),
  });

  return {
    query: {
      user: {
        findFirst: vi.fn().mockResolvedValue(opts.user ?? null),
      },
      organizationMembers: {
        findFirst: vi.fn().mockResolvedValue(opts.membership ?? null),
      },
      account: {
        findMany: vi.fn().mockResolvedValue(opts.accounts ?? []),
      },
    },
    select: vi.fn().mockReturnValue({ from: selectFrom }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    }),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("account.getMyProfile", () => {
  it("returns phone from user record", async () => {
    const db = createMockDb({
      user: makeUser({ phone: "+51 999 888 777" }),
      membership: makeMembership(),
      accounts: [{ providerId: "credential" }],
    });
    const caller = makeCaller(db);

    const result = await caller.account.getMyProfile();

    expect(result.phone).toBe("+51 999 888 777");
  });

  it("returns null phone when not set", async () => {
    const db = createMockDb({
      user: makeUser({ phone: null }),
      membership: makeMembership(),
      accounts: [],
    });
    const caller = makeCaller(db);

    const result = await caller.account.getMyProfile();

    expect(result.phone).toBeNull();
  });

  it('returns authProvider "credential" for email/password users', async () => {
    const db = createMockDb({
      user: makeUser(),
      membership: makeMembership(),
      accounts: [{ providerId: "credential" }],
    });
    const caller = makeCaller(db);

    const result = await caller.account.getMyProfile();

    expect(result.authProvider).toBe("credential");
  });

  it('returns authProvider "google" for Google OAuth users', async () => {
    const db = createMockDb({
      user: makeUser(),
      membership: makeMembership(),
      accounts: [{ providerId: "google" }],
    });
    const caller = makeCaller(db);

    const result = await caller.account.getMyProfile();

    expect(result.authProvider).toBe("google");
  });

  it("returns first authProvider when user has multiple", async () => {
    const db = createMockDb({
      user: makeUser(),
      membership: makeMembership(),
      accounts: [{ providerId: "google" }, { providerId: "credential" }],
    });
    const caller = makeCaller(db);

    const result = await caller.account.getMyProfile();

    // Should return the first provider found
    expect(result.authProvider).toBe("google");
  });

  it("returns null authProvider when no accounts exist", async () => {
    const db = createMockDb({
      user: makeUser(),
      membership: makeMembership(),
      accounts: [],
    });
    const caller = makeCaller(db);

    const result = await caller.account.getMyProfile();

    expect(result.authProvider).toBeNull();
  });

  it("still returns existing fields (name, email, image, org, role)", async () => {
    const db = createMockDb({
      user: makeUser({
        name: "Luis",
        email: "luis@test.com",
        image: "img.jpg",
      }),
      membership: makeMembership({ role: "facility_manager" }),
      accounts: [{ providerId: "credential" }],
    });
    const caller = makeCaller(db);

    const result = await caller.account.getMyProfile();

    expect(result.name).toBe("Luis");
    expect(result.email).toBe("luis@test.com");
    expect(result.image).toBe("img.jpg");
    expect(result.role).toBe("facility_manager");
    expect(result.organization).toEqual(
      expect.objectContaining({ name: "Test Org" }),
    );
  });
});

describe("account.updateMyProfile", () => {
  it("updates phone when provided", async () => {
    const db = createMockDb({ user: makeUser(), accounts: [] });
    const caller = makeCaller(db);

    const result = await caller.account.updateMyProfile({
      name: "Updated Name",
      phone: "+51 999 888 777",
    });

    expect(result.success).toBe(true);
    expect(db.update).toHaveBeenCalled();
  });

  it("clears phone when null is passed", async () => {
    const db = createMockDb({ user: makeUser(), accounts: [] });
    const caller = makeCaller(db);

    const result = await caller.account.updateMyProfile({
      name: "Updated Name",
      phone: null,
    });

    expect(result.success).toBe(true);
    expect(db.update).toHaveBeenCalled();
  });

  it("works without phone field (backward compatible)", async () => {
    const db = createMockDb({ user: makeUser(), accounts: [] });
    const caller = makeCaller(db);

    const result = await caller.account.updateMyProfile({
      name: "Updated Name",
    });

    expect(result.success).toBe(true);
    expect(db.update).toHaveBeenCalled();
  });

  it("validates name is at least 2 characters", async () => {
    const db = createMockDb({ user: makeUser(), accounts: [] });
    const caller = makeCaller(db);

    await expect(
      caller.account.updateMyProfile({ name: "A" }),
    ).rejects.toThrow();
  });
});

/* eslint-enable @typescript-eslint/no-unsafe-assignment */
/* eslint-enable @typescript-eslint/no-explicit-any */
