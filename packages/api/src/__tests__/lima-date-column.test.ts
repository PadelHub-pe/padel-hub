import { describe, expect, it } from "vitest";

import {
  formatLimaDate,
  formatLimaDateParam,
  parseLimaDateParam,
} from "../lib/datetime";

// Mirror of the limaDate column type defined in @wifo/db schema.ts.
// We can't import it from there (it's not exported), so we re-implement the
// same math here and assert it round-trips with our datetime helpers — which
// is the contract that production reads/writes rely on.

const LIMA_OFFSET_MS = 5 * 60 * 60 * 1000;

function fromDriver(value: string): Date {
  return new Date(`${value}T05:00:00.000Z`);
}

function toDriver(value: Date): string {
  const limaMs = value.getTime() - LIMA_OFFSET_MS;
  return new Date(limaMs).toISOString().slice(0, 10);
}

describe("limaDate Drizzle column round-trip", () => {
  describe("fromDriver — DB string → JS Date", () => {
    it("turns 'YYYY-MM-DD' into Lima 00:00 as a real UTC instant", () => {
      const result = fromDriver("2026-04-30");
      expect(result.toISOString()).toBe("2026-04-30T05:00:00.000Z");
    });

    it("formats back to the same calendar day with formatLimaDate", () => {
      const result = fromDriver("2026-04-30");
      expect(formatLimaDate(result, "yyyy-MM-dd")).toBe("2026-04-30");
    });

    it("matches what parseLimaDateParam produces — drop-in compatible", () => {
      const fromDb = fromDriver("2026-04-30");
      const fromUrl = parseLimaDateParam("2026-04-30");
      expect(fromDb.toISOString()).toBe(fromUrl.toISOString());
    });
  });

  describe("toDriver — JS Date → DB string", () => {
    it("extracts the Lima calendar day from a real instant", () => {
      // 09:30 PET on 2026-04-30 = 14:30 UTC
      expect(toDriver(new Date("2026-04-30T14:30:00Z"))).toBe("2026-04-30");
    });

    it("uses the Lima day even when the UTC day has already advanced", () => {
      // 23:00 PET on 2026-04-29 = 04:00 UTC on 2026-04-30
      expect(toDriver(new Date("2026-04-30T04:00:00Z"))).toBe("2026-04-29");
    });

    it("uses the Lima day even when the UTC day is still on the prior day", () => {
      // 00:00 PET on 2026-04-30 = 05:00 UTC on 2026-04-30
      expect(toDriver(new Date("2026-04-30T05:00:00Z"))).toBe("2026-04-30");
    });

    it("round-trips with formatLimaDateParam", () => {
      const date = new Date("2026-04-30T14:30:00Z");
      expect(toDriver(date)).toBe(formatLimaDateParam(date));
    });
  });

  describe("regression — the exact bug the user reported", () => {
    it("a booking for 'Jueves 30 de abril' read back is still Thursday in Lima", () => {
      // Simulating: user booked April 30, server stored "2026-04-30" in date column.
      const fromDb = fromDriver("2026-04-30");
      // Dashboard format
      expect(formatLimaDate(fromDb, "EEEE")).toBe("jueves");
      expect(formatLimaDate(fromDb, "yyyy-MM-dd")).toBe("2026-04-30");
    });
  });
});
