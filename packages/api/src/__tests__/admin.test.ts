/* eslint-disable @typescript-eslint/no-unsafe-assignment -- vitest mock types (vi.fn, expect.objectContaining) are inherently `any` */
/* eslint-disable @typescript-eslint/no-explicit-any -- mock db/session types */
/* eslint-disable @typescript-eslint/no-non-null-assertion -- test assertions on known-length arrays */
/* eslint-disable @typescript-eslint/no-unsafe-member-access -- mock db chain calls */
/* eslint-disable @typescript-eslint/no-unsafe-return -- mock transaction return */
/* eslint-disable @typescript-eslint/no-unsafe-call -- mock transaction callback */
/* eslint-disable @typescript-eslint/require-await -- mock transaction uses async signature */
import { describe, expect, it, vi } from "vitest";

import { adminRouter } from "../router/admin";
import { createCallerFactory, createTRPCRouter } from "../trpc";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const USER_ID = "a0000000-0000-4000-8000-000000000001";
const REQUEST_ID = "a0000000-0000-4000-8000-000000000010";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const router = createTRPCRouter({ admin: adminRouter });
const createCaller = createCallerFactory(router);

function makeAccessRequest(overrides?: Record<string, unknown>) {
  return {
    id: REQUEST_ID,
    email: "test@example.com",
    name: "Test User",
    phone: null,
    facilityName: null,
    district: null,
    courtCount: null,
    type: "owner" as const,
    status: "pending" as const,
    reviewedAt: null,
    reviewedBy: null,
    notes: null,
    createdAt: new Date(),
    ...overrides,
  };
}

function makeMockDb(overrides?: Record<string, unknown>) {
  return {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    query: {
      accessRequests: {
        findMany: vi.fn().mockResolvedValue([]),
        findFirst: vi.fn().mockResolvedValue(null),
      },
      platformAdmins: {
        findFirst: vi.fn().mockResolvedValue({ userId: USER_ID }),
      },
    },
    ...overrides,
  };
}

function makeCaller(db: any) {
  return createCaller({
    db,
    session: { user: { id: USER_ID } } as any,
    authApi: {} as any,
  });
}

// ---------------------------------------------------------------------------
// Tests: listAccessRequests with type filter
// ---------------------------------------------------------------------------

describe("admin.listAccessRequests", () => {
  it("returns items without type filter", async () => {
    const items = [
      makeAccessRequest({ type: "owner", reviewer: null }),
      makeAccessRequest({
        id: "a0000000-0000-4000-8000-000000000011",
        type: "player",
        email: "player@example.com",
        reviewer: null,
      }),
    ];

    const db = makeMockDb();
    db.query.accessRequests.findMany.mockResolvedValue(items);
    // Mock count query: db.select().from().where() returns [{ count: 2 }]
    db.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ count: 2 }]),
      }),
    });

    const caller = makeCaller(db);
    const result = await caller.admin.listAccessRequests({});

    expect(result.items).toHaveLength(2);
    expect(result.items[0]!.type).toBe("owner");
    expect(result.items[1]!.type).toBe("player");
  });

  it("passes type filter to query when provided", async () => {
    const items = [makeAccessRequest({ type: "player", reviewer: null })];

    const db = makeMockDb();
    db.query.accessRequests.findMany.mockResolvedValue(items);
    db.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ count: 1 }]),
      }),
    });

    const caller = makeCaller(db);
    const result = await caller.admin.listAccessRequests({ type: "player" });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.type).toBe("player");
  });

  it("accepts owner type filter", async () => {
    const db = makeMockDb();
    db.query.accessRequests.findMany.mockResolvedValue([]);
    db.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ count: 0 }]),
      }),
    });

    const caller = makeCaller(db);
    const result = await caller.admin.listAccessRequests({ type: "owner" });

    expect(result.items).toHaveLength(0);
  });

  it("rejects invalid type value", async () => {
    const db = makeMockDb();
    const caller = makeCaller(db);

    await expect(
      caller.admin.listAccessRequests({ type: "invalid" as any }),
    ).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Tests: approveAccessRequest blocks player type
// ---------------------------------------------------------------------------

describe("admin.approveAccessRequest", () => {
  it("rejects approval of player-type requests", async () => {
    const db = makeMockDb();
    db.query.accessRequests.findFirst.mockResolvedValue(
      makeAccessRequest({ type: "player" }),
    );
    // Mock transaction to run the callback directly
    (db as any).transaction = vi.fn().mockImplementation(async (fn: any) => {
      const tx = {
        ...db,
        query: db.query,
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([]),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
      };
      tx.query.accessRequests.findFirst = vi
        .fn()
        .mockResolvedValue(makeAccessRequest({ type: "player" }));
      return fn(tx);
    });

    const caller = makeCaller(db);

    await expect(
      caller.admin.approveAccessRequest({
        id: REQUEST_ID,
        organizationName: "Test Org",
        facilityName: "Test Facility",
      }),
    ).rejects.toThrow("Las solicitudes de jugadores no requieren aprobación");
  });
});

// ---------------------------------------------------------------------------
// Tests: rejectAccessRequest blocks player type
// ---------------------------------------------------------------------------

describe("admin.rejectAccessRequest", () => {
  it("rejects rejection of player-type requests", async () => {
    const db = makeMockDb();
    db.query.accessRequests.findFirst.mockResolvedValue(
      makeAccessRequest({ type: "player" }),
    );

    const caller = makeCaller(db);

    await expect(
      caller.admin.rejectAccessRequest({ id: REQUEST_ID }),
    ).rejects.toThrow("Las solicitudes de jugadores no requieren aprobación");
  });
});
