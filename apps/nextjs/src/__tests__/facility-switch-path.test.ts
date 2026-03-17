import { describe, expect, it } from "vitest";

import { getFacilitySwitchPath } from "../lib/facility-switch-path";

const BASE = "/org/padel-group-lima/facilities";
const CURRENT = "facility-1";
const NEW = "facility-2";

function switchPath(pathname: string) {
  return getFacilitySwitchPath(pathname, BASE, CURRENT, NEW);
}

describe("getFacilitySwitchPath", () => {
  describe("preservable top-level segments", () => {
    it("preserves /bookings", () => {
      expect(switchPath(`${BASE}/${CURRENT}/bookings`)).toBe(
        `${BASE}/${NEW}/bookings`,
      );
    });

    it("preserves /courts", () => {
      expect(switchPath(`${BASE}/${CURRENT}/courts`)).toBe(
        `${BASE}/${NEW}/courts`,
      );
    });

    it("preserves /schedule", () => {
      expect(switchPath(`${BASE}/${CURRENT}/schedule`)).toBe(
        `${BASE}/${NEW}/schedule`,
      );
    });

    it("preserves /pricing", () => {
      expect(switchPath(`${BASE}/${CURRENT}/pricing`)).toBe(
        `${BASE}/${NEW}/pricing`,
      );
    });

    it("preserves /settings", () => {
      expect(switchPath(`${BASE}/${CURRENT}/settings`)).toBe(
        `${BASE}/${NEW}/settings`,
      );
    });
  });

  describe("detail pages collapse to list pages", () => {
    it("collapses /courts/[courtId] to /courts", () => {
      expect(switchPath(`${BASE}/${CURRENT}/courts/court-abc`)).toBe(
        `${BASE}/${NEW}/courts`,
      );
    });

    it("collapses /bookings/[bookingId] to /bookings", () => {
      expect(switchPath(`${BASE}/${CURRENT}/bookings/booking-xyz`)).toBe(
        `${BASE}/${NEW}/bookings`,
      );
    });

    it("collapses /courts/[courtId]/edit to /courts", () => {
      expect(switchPath(`${BASE}/${CURRENT}/courts/court-abc/edit`)).toBe(
        `${BASE}/${NEW}/courts`,
      );
    });
  });

  describe("preservable sub-pages", () => {
    it("preserves /bookings/calendar fully", () => {
      expect(switchPath(`${BASE}/${CURRENT}/bookings/calendar`)).toBe(
        `${BASE}/${NEW}/bookings/calendar`,
      );
    });
  });

  describe("non-preservable pages go to facility root", () => {
    it("navigates from /setup to facility root", () => {
      expect(switchPath(`${BASE}/${CURRENT}/setup`)).toBe(`${BASE}/${NEW}`);
    });

    it("navigates from facility root to facility root", () => {
      expect(switchPath(`${BASE}/${CURRENT}`)).toBe(`${BASE}/${NEW}`);
    });

    it("navigates from unknown page to facility root", () => {
      expect(switchPath(`${BASE}/${CURRENT}/unknown-page`)).toBe(
        `${BASE}/${NEW}`,
      );
    });
  });

  describe("edge cases", () => {
    it("handles pathname that does not match current facility", () => {
      expect(
        getFacilitySwitchPath("/some/other/path", BASE, CURRENT, NEW),
      ).toBe(`${BASE}/${NEW}`);
    });

    it("handles trailing slash on facility root", () => {
      expect(switchPath(`${BASE}/${CURRENT}/`)).toBe(`${BASE}/${NEW}`);
    });
  });
});
