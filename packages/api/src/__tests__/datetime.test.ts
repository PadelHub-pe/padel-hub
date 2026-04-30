import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  addLimaDays,
  buildLimaDateTime,
  endOfLimaDay,
  formatLimaDate,
  formatLimaDateParam,
  formatLimaDateTime,
  LIMA_TZ,
  limaNow,
  parseLimaDateParam,
  startOfLimaDay,
  startOfLimaMonth,
  startOfLimaWeek,
} from "../lib/datetime";

// All assertions assume the helpers ignore the host TZ and always use
// LIMA_TZ. The vitest setup file pins process.env.TZ = "UTC" so these
// tests catch regressions where a helper accidentally goes back to host-local.

describe("datetime helpers", () => {
  describe("LIMA_TZ", () => {
    it("is the IANA name for Lima", () => {
      expect(LIMA_TZ).toBe("America/Lima");
    });
  });

  describe("limaNow", () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it("returns a Date whose getDate matches the Lima wall clock", () => {
      // 2026-04-30T03:00:00Z = 22:00 PET on 2026-04-29
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-04-30T03:00:00Z"));
      const now = limaNow();
      expect(now.getFullYear()).toBe(2026);
      expect(now.getMonth()).toBe(3); // April (0-indexed)
      expect(now.getDate()).toBe(29);
      expect(now.getHours()).toBe(22);
    });
  });

  describe("startOfLimaDay", () => {
    it("returns 00:00 PET (= 05:00 UTC) for an instant later in the day", () => {
      // 2026-04-29T14:30:00Z = 09:30 PET on 2026-04-29
      const result = startOfLimaDay(new Date("2026-04-29T14:30:00Z"));
      expect(result.toISOString()).toBe("2026-04-29T05:00:00.000Z");
    });

    it("returns the previous Lima day when called near UTC midnight", () => {
      // 2026-04-30T03:00:00Z = 22:00 PET on 2026-04-29
      const result = startOfLimaDay(new Date("2026-04-30T03:00:00Z"));
      expect(result.toISOString()).toBe("2026-04-29T05:00:00.000Z");
    });

    it("returns the next Lima day after the boundary", () => {
      // 2026-04-30T05:00:00Z = 00:00 PET on 2026-04-30
      const result = startOfLimaDay(new Date("2026-04-30T05:00:00Z"));
      expect(result.toISOString()).toBe("2026-04-30T05:00:00.000Z");
    });
  });

  describe("endOfLimaDay", () => {
    it("returns the start of the next Lima day (exclusive upper bound)", () => {
      const result = endOfLimaDay(new Date("2026-04-29T14:30:00Z"));
      expect(result.toISOString()).toBe("2026-04-30T05:00:00.000Z");
    });
  });

  describe("startOfLimaMonth", () => {
    it("returns 00:00 PET on the 1st of the Lima-local month", () => {
      // 2026-04-30T03:00:00Z = 22:00 PET on 2026-04-29 — still April in Lima
      const result = startOfLimaMonth(new Date("2026-04-30T03:00:00Z"));
      expect(result.toISOString()).toBe("2026-04-01T05:00:00.000Z");
    });

    it("crosses month correctly when Lima has already advanced past UTC", () => {
      // 2026-05-01T05:00:00Z = 00:00 PET on 2026-05-01
      const result = startOfLimaMonth(new Date("2026-05-01T06:00:00Z"));
      expect(result.toISOString()).toBe("2026-05-01T05:00:00.000Z");
    });
  });

  describe("startOfLimaWeek", () => {
    it("snaps to the Monday of the Lima-local week", () => {
      // 2026-04-29 is a Wednesday in Lima. Monday is 2026-04-27.
      const result = startOfLimaWeek(new Date("2026-04-29T14:30:00Z"));
      expect(result.toISOString()).toBe("2026-04-27T05:00:00.000Z");
    });

    it("for a Sunday, returns the previous Monday", () => {
      // 2026-05-03 (Sunday in Lima) → Monday 2026-04-27
      const result = startOfLimaWeek(new Date("2026-05-03T14:30:00Z"));
      expect(result.toISOString()).toBe("2026-04-27T05:00:00.000Z");
    });

    it("for a Monday, returns that Monday", () => {
      // 2026-04-27 (Monday in Lima)
      const result = startOfLimaWeek(new Date("2026-04-27T14:30:00Z"));
      expect(result.toISOString()).toBe("2026-04-27T05:00:00.000Z");
    });
  });

  describe("addLimaDays", () => {
    it("adds days in Lima calendar terms", () => {
      const result = addLimaDays(new Date("2026-04-29T14:30:00Z"), 1);
      expect(formatLimaDateParam(result)).toBe("2026-04-30");
    });

    it("supports negative offsets", () => {
      const result = addLimaDays(new Date("2026-04-29T14:30:00Z"), -2);
      expect(formatLimaDateParam(result)).toBe("2026-04-27");
    });
  });

  describe("parseLimaDateParam", () => {
    it("turns YYYY-MM-DD into Lima-local midnight as a real instant", () => {
      const result = parseLimaDateParam("2026-04-30");
      expect(result.toISOString()).toBe("2026-04-30T05:00:00.000Z");
    });

    it("throws on malformed input", () => {
      expect(() => parseLimaDateParam("2026-4-30")).toThrow(
        /expected YYYY-MM-DD/,
      );
      expect(() => parseLimaDateParam("not-a-date")).toThrow();
      expect(() => parseLimaDateParam("")).toThrow();
    });
  });

  describe("formatLimaDate / formatLimaDateParam / formatLimaDateTime", () => {
    it("formats a Wednesday morning in Spanish", () => {
      // 09:30 PET on 2026-04-29 (Wed)
      const d = new Date("2026-04-29T14:30:00Z");
      expect(formatLimaDate(d, "EEEE, d 'de' MMMM 'de' yyyy")).toBe(
        "miércoles, 29 de abril de 2026",
      );
    });

    it("crosses the day correctly when host TZ is UTC and Lima is still on the prior day", () => {
      // 2026-04-30T04:59:59Z = 23:59:59 PET on 2026-04-29
      expect(
        formatLimaDate(new Date("2026-04-30T04:59:59Z"), "yyyy-MM-dd"),
      ).toBe("2026-04-29");
      expect(
        formatLimaDate(new Date("2026-04-30T05:00:00Z"), "yyyy-MM-dd"),
      ).toBe("2026-04-30");
    });

    it("formatLimaDateParam returns YYYY-MM-DD in Lima TZ", () => {
      expect(formatLimaDateParam(new Date("2026-04-30T04:59:59Z"))).toBe(
        "2026-04-29",
      );
    });

    it("formatLimaDateTime defaults to a human-friendly format", () => {
      // 09:30 PET on 2026-04-29
      expect(formatLimaDateTime(new Date("2026-04-29T14:30:00Z"))).toBe(
        "29 de abril 2026, 09:30",
      );
    });
  });

  describe("buildLimaDateTime", () => {
    it("constructs a real instant for a Lima wall-clock day + HH:MM", () => {
      const date = parseLimaDateParam("2026-04-29");
      const result = buildLimaDateTime(date, "06:00");
      expect(result.toISOString()).toBe("2026-04-29T11:00:00.000Z"); // 06:00 PET = 11:00 UTC
    });

    it("accepts HH:MM:SS as well (as stored by Postgres time columns)", () => {
      const date = parseLimaDateParam("2026-04-29");
      const result = buildLimaDateTime(date, "06:00:00");
      expect(result.toISOString()).toBe("2026-04-29T11:00:00.000Z");
    });

    it("uses the Lima calendar day of `date` even when `date` is a different UTC day", () => {
      // 2026-04-30T03:00:00Z = 22:00 PET on 2026-04-29 → Lima day is the 29th
      const result = buildLimaDateTime(
        new Date("2026-04-30T03:00:00Z"),
        "23:30",
      );
      expect(result.toISOString()).toBe("2026-04-30T04:30:00.000Z"); // 23:30 PET on 29th = 04:30 UTC on 30th
    });

    it("throws on malformed time input", () => {
      const date = parseLimaDateParam("2026-04-29");
      expect(() => buildLimaDateTime(date, "6:00")).toThrow();
      expect(() => buildLimaDateTime(date, "not-a-time")).toThrow();
    });
  });

  describe("host TZ independence", () => {
    const originalTz = process.env.TZ;
    beforeEach(() => {
      // Temporarily change host TZ — helpers must still produce Lima results.
      process.env.TZ = "America/New_York";
    });
    afterEach(() => {
      process.env.TZ = originalTz;
    });

    it("startOfLimaDay still returns Lima boundary regardless of host TZ", () => {
      // The TZ env change doesn't actually retune the running V8 process, but it
      // documents the intent. The deeper guarantee is that helpers always pass
      // LIMA_TZ to date-fns-tz — they never rely on host TZ.
      const result = startOfLimaDay(new Date("2026-04-29T14:30:00Z"));
      expect(result.toISOString()).toBe("2026-04-29T05:00:00.000Z");
    });

    it("formatLimaDate ignores host TZ", () => {
      expect(
        formatLimaDate(new Date("2026-04-29T14:30:00Z"), "yyyy-MM-dd"),
      ).toBe("2026-04-29");
    });
  });
});
