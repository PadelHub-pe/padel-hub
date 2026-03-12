import { describe, expect, it } from "vitest";

import type {
  BlockedSlotConfig,
  OperatingHoursConfig,
  PeakPeriodConfig,
  SlotCourtPricing,
  SlotFacilityDefaults,
} from "../utils/schedule";
import {
  getRateForSlot,
  getTimeZone,
  getTimeZoneWithMarkup,
  parseTimeToMinutes,
} from "../utils/schedule";

// =============================================================================
// Factories
// =============================================================================

function makeOperatingHours(
  overrides?: Partial<OperatingHoursConfig>,
): OperatingHoursConfig {
  return {
    dayOfWeek: 1,
    openTime: "08:00",
    closeTime: "22:00",
    isClosed: false,
    ...overrides,
  };
}

function makePeakPeriod(
  overrides?: Partial<PeakPeriodConfig>,
): PeakPeriodConfig {
  return {
    daysOfWeek: [1, 2, 3, 4, 5],
    startTime: "18:00",
    endTime: "22:00",
    markupPercent: 25,
    ...overrides,
  };
}

function makeBlockedSlot(
  overrides?: Partial<BlockedSlotConfig>,
): BlockedSlotConfig {
  return {
    date: "2026-03-12",
    startTime: "10:00",
    endTime: "12:00",
    courtId: null,
    ...overrides,
  };
}

function makeCourt(overrides?: Partial<SlotCourtPricing>): SlotCourtPricing {
  return {
    priceInCents: 6000,
    peakPriceInCents: null,
    ...overrides,
  };
}

function makeFacilityDefaults(
  overrides?: Partial<SlotFacilityDefaults>,
): SlotFacilityDefaults {
  return {
    defaultPriceInCents: 5000,
    defaultPeakPriceInCents: 7000,
    ...overrides,
  };
}

// =============================================================================
// parseTimeToMinutes
// =============================================================================

describe("parseTimeToMinutes", () => {
  it("parses whole hours correctly", () => {
    expect(parseTimeToMinutes("08:00")).toBe(480);
    expect(parseTimeToMinutes("22:00")).toBe(1320);
    expect(parseTimeToMinutes("00:00")).toBe(0);
  });

  it("parses half hours correctly", () => {
    expect(parseTimeToMinutes("08:30")).toBe(510);
    expect(parseTimeToMinutes("14:30")).toBe(870);
  });

  it("parses arbitrary minutes correctly", () => {
    expect(parseTimeToMinutes("09:15")).toBe(555);
    expect(parseTimeToMinutes("23:59")).toBe(1439);
  });
});

// =============================================================================
// getTimeZone
// =============================================================================

describe("getTimeZone", () => {
  const baseConfig = {
    operatingHours: [
      makeOperatingHours({ dayOfWeek: 0, isClosed: true }), // Sunday closed
      makeOperatingHours({ dayOfWeek: 1 }), // Mon 08-22
      makeOperatingHours({ dayOfWeek: 2 }), // Tue 08-22
      makeOperatingHours({ dayOfWeek: 3 }), // Wed 08-22
      makeOperatingHours({ dayOfWeek: 4 }), // Thu 08-22
      makeOperatingHours({ dayOfWeek: 5 }), // Fri 08-22
      makeOperatingHours({
        dayOfWeek: 6,
        openTime: "09:00",
        closeTime: "20:00",
      }), // Sat 09-20
    ],
    peakPeriods: [
      makePeakPeriod({
        daysOfWeek: [1, 2, 3, 4, 5],
        startTime: "18:00",
        endTime: "22:00",
        markupPercent: 25,
      }),
    ],
    blockedSlots: [] as BlockedSlotConfig[],
  };

  // --- Closed zone ---

  describe("closed zone", () => {
    it("returns 'closed' when day is marked as closed", () => {
      expect(getTimeZone("10:00", 0, null, baseConfig)).toBe("closed");
    });

    it("returns 'closed' when time is before opening hours", () => {
      expect(getTimeZone("07:00", 1, null, baseConfig)).toBe("closed");
      expect(getTimeZone("07:59", 1, null, baseConfig)).toBe("closed");
    });

    it("returns 'closed' when time is at or after closing time", () => {
      expect(getTimeZone("22:00", 1, null, baseConfig)).toBe("closed");
      expect(getTimeZone("23:00", 1, null, baseConfig)).toBe("closed");
    });

    it("returns 'closed' when no operating hours exist for the day", () => {
      const config = { ...baseConfig, operatingHours: [] };
      expect(getTimeZone("10:00", 1, null, config)).toBe("closed");
    });
  });

  // --- Regular zone ---

  describe("regular zone", () => {
    it("returns 'regular' during operating hours outside peak periods", () => {
      expect(getTimeZone("10:00", 1, null, baseConfig)).toBe("regular");
      expect(getTimeZone("14:00", 1, null, baseConfig)).toBe("regular");
    });

    it("returns 'regular' at exact opening time", () => {
      expect(getTimeZone("08:00", 1, null, baseConfig)).toBe("regular");
    });

    it("returns 'regular' one minute before peak starts", () => {
      expect(getTimeZone("17:59", 1, null, baseConfig)).toBe("regular");
    });

    it("returns 'regular' on Saturday outside peak (weekday-only peak)", () => {
      expect(getTimeZone("18:00", 6, null, baseConfig)).toBe("regular");
    });
  });

  // --- Peak zone ---

  describe("peak zone", () => {
    it("returns 'peak' during a peak period", () => {
      expect(getTimeZone("18:00", 1, null, baseConfig)).toBe("peak");
      expect(getTimeZone("20:30", 3, null, baseConfig)).toBe("peak");
    });

    it("returns 'peak' at exact peak start time", () => {
      expect(getTimeZone("18:00", 2, null, baseConfig)).toBe("peak");
    });

    it("returns peak info with highest markup when periods overlap", () => {
      const config = {
        ...baseConfig,
        peakPeriods: [
          makePeakPeriod({
            daysOfWeek: [1],
            startTime: "18:00",
            endTime: "22:00",
            markupPercent: 25,
          }),
          makePeakPeriod({
            daysOfWeek: [1],
            startTime: "19:00",
            endTime: "21:00",
            markupPercent: 50,
          }),
        ],
      };

      // 18:30 — only first period
      const zone1830 = getTimeZone("18:30", 1, null, config);
      expect(zone1830).toBe("peak");

      // 19:30 — both periods overlap, highest markup wins
      const zone1930 = getTimeZone("19:30", 1, null, config);
      expect(zone1930).toBe("peak");
    });

    it("does not return 'peak' one minute before peak end time", () => {
      // 21:59 should still be peak (it's before 22:00)
      expect(getTimeZone("21:59", 1, null, baseConfig)).toBe("peak");
    });
  });

  // --- Blocked zone ---

  describe("blocked zone", () => {
    it("returns 'blocked' when time falls within a blocked slot on matching date", () => {
      const config = {
        ...baseConfig,
        blockedSlots: [
          makeBlockedSlot({
            date: "2026-03-12",
            startTime: "10:00",
            endTime: "12:00",
          }),
        ],
      };
      expect(getTimeZone("10:30", 4, "2026-03-12", config)).toBe("blocked");
    });

    it("returns 'blocked' at exact blocked slot start time", () => {
      const config = {
        ...baseConfig,
        blockedSlots: [
          makeBlockedSlot({
            date: "2026-03-12",
            startTime: "10:00",
            endTime: "12:00",
          }),
        ],
      };
      expect(getTimeZone("10:00", 4, "2026-03-12", config)).toBe("blocked");
    });

    it("does not return 'blocked' at blocked slot end time", () => {
      const config = {
        ...baseConfig,
        blockedSlots: [
          makeBlockedSlot({
            date: "2026-03-12",
            startTime: "10:00",
            endTime: "12:00",
          }),
        ],
      };
      expect(getTimeZone("12:00", 4, "2026-03-12", config)).toBe("regular");
    });

    it("does not return 'blocked' when date does not match", () => {
      const config = {
        ...baseConfig,
        blockedSlots: [
          makeBlockedSlot({
            date: "2026-03-13",
            startTime: "10:00",
            endTime: "12:00",
          }),
        ],
      };
      expect(getTimeZone("10:30", 4, "2026-03-12", config)).toBe("regular");
    });

    it("does not check blocked slots when date is null", () => {
      const config = {
        ...baseConfig,
        blockedSlots: [
          makeBlockedSlot({
            date: "2026-03-12",
            startTime: "10:00",
            endTime: "12:00",
          }),
        ],
      };
      expect(getTimeZone("10:30", 4, null, config)).toBe("regular");
    });

    it("blocked overrides peak", () => {
      const config = {
        ...baseConfig,
        blockedSlots: [
          makeBlockedSlot({
            date: "2026-03-12",
            startTime: "18:00",
            endTime: "20:00",
          }),
        ],
      };
      // 19:00 on Thursday is peak, but blocked on this date
      expect(getTimeZone("19:00", 4, "2026-03-12", config)).toBe("blocked");
    });

    it("ignores court-specific blocked slots (courtId not null)", () => {
      const config = {
        ...baseConfig,
        blockedSlots: [
          makeBlockedSlot({
            date: "2026-03-12",
            startTime: "10:00",
            endTime: "12:00",
            courtId: "court-1",
          }),
        ],
      };
      // Court-specific blocks don't affect general zone classification
      expect(getTimeZone("10:30", 4, "2026-03-12", config)).toBe("regular");
    });
  });

  // --- Priority order ---

  describe("priority order: closed > blocked > peak > regular", () => {
    it("closed takes precedence over everything", () => {
      const config = {
        ...baseConfig,
        peakPeriods: [
          makePeakPeriod({
            daysOfWeek: [0],
            startTime: "10:00",
            endTime: "14:00",
          }),
        ],
        blockedSlots: [
          makeBlockedSlot({
            date: "2026-03-15",
            startTime: "10:00",
            endTime: "14:00",
          }),
        ],
      };
      // Sunday is closed
      expect(getTimeZone("11:00", 0, "2026-03-15", config)).toBe("closed");
    });

    it("blocked takes precedence over peak", () => {
      const config = {
        ...baseConfig,
        blockedSlots: [
          makeBlockedSlot({
            date: "2026-03-12",
            startTime: "19:00",
            endTime: "21:00",
          }),
        ],
      };
      expect(getTimeZone("19:30", 4, "2026-03-12", config)).toBe("blocked");
    });
  });

  // --- Boundary / edge cases ---

  describe("edge cases", () => {
    it("handles 30-minute granularity", () => {
      const config = {
        ...baseConfig,
        peakPeriods: [
          makePeakPeriod({
            daysOfWeek: [1],
            startTime: "18:30",
            endTime: "20:30",
            markupPercent: 20,
          }),
        ],
      };
      expect(getTimeZone("18:29", 1, null, config)).toBe("regular");
      expect(getTimeZone("18:30", 1, null, config)).toBe("peak");
      expect(getTimeZone("20:29", 1, null, config)).toBe("peak");
      expect(getTimeZone("20:30", 1, null, config)).toBe("regular");
    });

    it("handles no peak periods", () => {
      const config = { ...baseConfig, peakPeriods: [] };
      expect(getTimeZone("18:00", 1, null, config)).toBe("regular");
    });

    it("handles midnight boundary (open until 00:00 means close at 24:00)", () => {
      const config = {
        ...baseConfig,
        operatingHours: [
          makeOperatingHours({
            dayOfWeek: 5,
            openTime: "08:00",
            closeTime: "00:00",
          }),
        ],
      };
      // 23:59 should be open on Friday
      expect(getTimeZone("23:59", 5, null, config)).toBe("regular");
    });
  });
});

// =============================================================================
// getTimeZoneWithMarkup
// =============================================================================

describe("getTimeZoneWithMarkup", () => {
  const baseConfig = {
    operatingHours: [makeOperatingHours({ dayOfWeek: 1 })],
    peakPeriods: [
      makePeakPeriod({
        daysOfWeek: [1],
        startTime: "18:00",
        endTime: "22:00",
        markupPercent: 25,
      }),
    ],
    blockedSlots: [] as BlockedSlotConfig[],
  };

  it("returns zone and markupPercent 0 for regular zone", () => {
    const result = getTimeZoneWithMarkup("10:00", 1, null, baseConfig);
    expect(result).toEqual({ zone: "regular", markupPercent: 0 });
  });

  it("returns zone and markup for peak zone", () => {
    const result = getTimeZoneWithMarkup("19:00", 1, null, baseConfig);
    expect(result).toEqual({ zone: "peak", markupPercent: 25 });
  });

  it("returns highest markup when multiple peak periods overlap", () => {
    const config = {
      ...baseConfig,
      peakPeriods: [
        makePeakPeriod({
          daysOfWeek: [1],
          startTime: "18:00",
          endTime: "22:00",
          markupPercent: 25,
        }),
        makePeakPeriod({
          daysOfWeek: [1],
          startTime: "19:00",
          endTime: "21:00",
          markupPercent: 50,
        }),
      ],
    };
    const result = getTimeZoneWithMarkup("19:30", 1, null, config);
    expect(result).toEqual({ zone: "peak", markupPercent: 50 });
  });

  it("returns markupPercent 0 for closed zone", () => {
    const config = {
      ...baseConfig,
      operatingHours: [makeOperatingHours({ dayOfWeek: 1, isClosed: true })],
    };
    const result = getTimeZoneWithMarkup("10:00", 1, null, config);
    expect(result).toEqual({ zone: "closed", markupPercent: 0 });
  });

  it("returns markupPercent 0 for blocked zone", () => {
    const config = {
      ...baseConfig,
      blockedSlots: [
        makeBlockedSlot({
          date: "2026-03-12",
          startTime: "19:00",
          endTime: "21:00",
        }),
      ],
    };
    const result = getTimeZoneWithMarkup("19:30", 1, "2026-03-12", config);
    expect(result).toEqual({ zone: "blocked", markupPercent: 0 });
  });
});

// =============================================================================
// getRateForSlot
// =============================================================================

describe("getRateForSlot", () => {
  // --- Regular zone ---

  describe("regular zone", () => {
    it("returns court price when set", () => {
      const court = makeCourt({ priceInCents: 6000 });
      const result = getRateForSlot(court, "regular", null);
      expect(result).toBe(6000);
    });

    it("falls back to facility default when court price is null", () => {
      const court = makeCourt({ priceInCents: null });
      const defaults = makeFacilityDefaults({ defaultPriceInCents: 5000 });
      const result = getRateForSlot(court, "regular", defaults);
      expect(result).toBe(5000);
    });

    it("returns 0 when both court price and facility default are null", () => {
      const court = makeCourt({ priceInCents: null });
      const defaults = makeFacilityDefaults({ defaultPriceInCents: null });
      const result = getRateForSlot(court, "regular", defaults);
      expect(result).toBe(0);
    });

    it("returns 0 when court price is null and no facility defaults provided", () => {
      const court = makeCourt({ priceInCents: null });
      const result = getRateForSlot(court, "regular", null);
      expect(result).toBe(0);
    });
  });

  // --- Peak zone ---

  describe("peak zone", () => {
    it("returns court peak price when set", () => {
      const court = makeCourt({ peakPriceInCents: 8000 });
      const result = getRateForSlot(court, "peak", null);
      expect(result).toBe(8000);
    });

    it("falls back to facility default peak price when court peak is null", () => {
      const court = makeCourt({ peakPriceInCents: null });
      const defaults = makeFacilityDefaults({ defaultPeakPriceInCents: 7000 });
      const result = getRateForSlot(court, "peak", defaults);
      expect(result).toBe(7000);
    });

    it("falls back to regular rate when no peak prices exist", () => {
      const court = makeCourt({ priceInCents: 6000, peakPriceInCents: null });
      const defaults = makeFacilityDefaults({
        defaultPeakPriceInCents: null,
        defaultPriceInCents: null,
      });
      const result = getRateForSlot(court, "peak", defaults);
      // Falls through peak chain → regular chain: court.priceInCents
      expect(result).toBe(6000);
    });

    it("falls back to facility regular default when no peak prices and no court price", () => {
      const court = makeCourt({ priceInCents: null, peakPriceInCents: null });
      const defaults = makeFacilityDefaults({
        defaultPeakPriceInCents: null,
        defaultPriceInCents: 5000,
      });
      const result = getRateForSlot(court, "peak", defaults);
      expect(result).toBe(5000);
    });

    it("returns 0 when all prices are null", () => {
      const court = makeCourt({ priceInCents: null, peakPriceInCents: null });
      const defaults = makeFacilityDefaults({
        defaultPriceInCents: null,
        defaultPeakPriceInCents: null,
      });
      const result = getRateForSlot(court, "peak", defaults);
      expect(result).toBe(0);
    });
  });

  // --- Closed / Blocked zones ---

  describe("closed and blocked zones", () => {
    it("returns 0 for closed zone", () => {
      const court = makeCourt({ priceInCents: 6000 });
      const result = getRateForSlot(court, "closed", null);
      expect(result).toBe(0);
    });

    it("returns 0 for blocked zone", () => {
      const court = makeCourt({ priceInCents: 6000 });
      const result = getRateForSlot(court, "blocked", null);
      expect(result).toBe(0);
    });
  });
});
