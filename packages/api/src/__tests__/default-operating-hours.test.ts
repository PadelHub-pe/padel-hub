/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any -- mock DB/context types */
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
const FACILITY_ID = "00000000-0000-1000-a000-00000000f001";
const USER_ADMIN = {
  id: "00000000-0000-1000-a000-000000000101",
  name: "Admin",
  email: "admin@test.com",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const router = createTRPCRouter({ org: orgRouter });
const createCaller = createCallerFactory(router);

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

function makeMembership(role: "org_admin" | "facility_manager" | "staff") {
  return {
    id: "mem-1",
    organizationId: ORG_ID,
    userId: USER_ADMIN.id,
    role,
    facilityIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    organization: makeOrg(),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("org.createFacility – default operating hours", () => {
  it("inserts 7 operating hours rows after facility creation", async () => {
    const insertedOperatingHours: any[] = [];

    const insertValuesFn = vi.fn().mockImplementation((values: any) => {
      // Track what's being inserted
      if (Array.isArray(values) && values.length === 7) {
        insertedOperatingHours.push(...values);
      }
      return { returning: vi.fn().mockResolvedValue([]) };
    });

    const insertReturningFn = vi
      .fn()
      .mockResolvedValue([{ id: FACILITY_ID, name: "Test Facility" }]);
    const facilityInsertValuesFn = vi.fn().mockReturnValue({
      returning: insertReturningFn,
    });

    let insertCallCount = 0;
    const mockDb = {
      query: {
        organizationMembers: {
          findFirst: vi.fn().mockResolvedValue(makeMembership("org_admin")),
        },
      },
      insert: vi.fn().mockImplementation(() => {
        insertCallCount++;
        if (insertCallCount === 1) {
          // First insert = facilities
          return { values: facilityInsertValuesFn };
        }
        // Second insert = operatingHours
        return { values: insertValuesFn };
      }),
    };

    const caller = createCaller({
      db: mockDb as any,
      session: { user: USER_ADMIN } as any,
      authApi: {} as any,
    });

    const result = await caller.org.createFacility({
      organizationId: ORG_ID,
      name: "Test Facility",
      address: "Av. Test 123",
      district: "Miraflores",
      phone: "999888777",
    });

    expect(result).toEqual({ id: FACILITY_ID, name: "Test Facility" });

    // Verify insert was called twice (facility + operating hours)
    expect(mockDb.insert).toHaveBeenCalledTimes(2);

    // Verify operating hours were inserted with correct values
    expect(insertValuesFn).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          facilityId: FACILITY_ID,
          dayOfWeek: 0,
          openTime: "07:00",
          closeTime: "22:00",
          isClosed: false,
        }),
      ]),
    );

    // Verify all 7 days are present
    const hoursArg = insertValuesFn.mock.calls[0]?.[0] as any[];
    expect(hoursArg).toHaveLength(7);

    // Verify each day has correct defaults
    for (let day = 0; day < 7; day++) {
      const dayRow = hoursArg.find((r: any) => r.dayOfWeek === day);
      expect(dayRow).toEqual({
        facilityId: FACILITY_ID,
        dayOfWeek: day,
        openTime: "07:00",
        closeTime: "22:00",
        isClosed: false,
      });
    }
  });

  it("non-admin cannot create facility (no operating hours inserted)", async () => {
    const mockDb = {
      query: {
        organizationMembers: {
          findFirst: vi
            .fn()
            .mockResolvedValue(makeMembership("facility_manager")),
        },
      },
      insert: vi.fn(),
    };

    const caller = createCaller({
      db: mockDb as any,
      session: { user: USER_ADMIN } as any,
      authApi: {} as any,
    });

    await expect(
      caller.org.createFacility({
        organizationId: ORG_ID,
        name: "Test Facility",
        address: "Av. Test 123",
        district: "Miraflores",
        phone: "999888777",
      }),
    ).rejects.toThrow("Solo los administradores pueden crear locales");

    // insert should not have been called at all
    expect(mockDb.insert).not.toHaveBeenCalled();
  });
});
