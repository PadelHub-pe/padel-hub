/* eslint-disable @typescript-eslint/no-non-null-assertion -- test assertions after length checks */
import { describe, expect, it } from "vitest";

import type {
  BlockedSlotConfig,
  OperatingHoursConfig,
  PeakPeriodConfig,
  SlotFacilityDefaults,
} from "../utils/schedule";
import type {
  AvailableSlot,
  CourtInfo,
  ExistingBooking,
  SlotGenerationConfig,
} from "../utils/slots";
import { getAvailableSlots } from "../utils/slots";

// =============================================================================
// Factories
// =============================================================================

function makeCourt(overrides?: Partial<CourtInfo>): CourtInfo {
  return {
    id: "court-1",
    name: "Cancha 1",
    type: "indoor",
    priceInCents: 5000,
    peakPriceInCents: null,
    ...overrides,
  };
}

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

function makeFacilityDefaults(
  overrides?: Partial<SlotFacilityDefaults>,
): SlotFacilityDefaults {
  return {
    defaultPriceInCents: 5000,
    defaultPeakPriceInCents: 7000,
    ...overrides,
  };
}

function makeBooking(overrides?: Partial<ExistingBooking>): ExistingBooking {
  return {
    courtId: "court-1",
    startTime: "10:00",
    endTime: "11:00",
    status: "confirmed",
    ...overrides,
  };
}

/** Base config for a Monday (dayOfWeek=1), open 08:00-22:00, no blocks/bookings */
function makeConfig(
  overrides?: Partial<SlotGenerationConfig>,
): SlotGenerationConfig {
  return {
    date: "2026-03-09",
    dayOfWeek: 1,
    courts: [makeCourt()],
    operatingHours: [makeOperatingHours({ dayOfWeek: 1 })],
    peakPeriods: [],
    blockedSlots: [],
    existingBookings: [],
    allowedDurations: [60],
    facilityDefaults: makeFacilityDefaults(),
    ...overrides,
  };
}

// Helper to find a specific slot
function findSlot(
  slots: AvailableSlot[],
  courtId: string,
  startTime: string,
  durationMinutes: number,
): AvailableSlot | undefined {
  return slots.find(
    (s) =>
      s.courtId === courtId &&
      s.startTime === startTime &&
      s.durationMinutes === durationMinutes,
  );
}

// =============================================================================
// Tests
// =============================================================================

describe("getAvailableSlots", () => {
  // --- Basic slot generation ---

  describe("basic slot generation", () => {
    it("returns slots for a single court with 60-min duration", () => {
      const slots = getAvailableSlots(makeConfig());

      // Open 08:00-22:00, 60-min slots every 30 min
      // Last valid start is 21:00 (ends at 22:00)
      // Start times: 08:00, 08:30, 09:00, ... 21:00 = 27 slots
      expect(slots.length).toBe(27);
      expect(slots[0]).toMatchObject({
        courtId: "court-1",
        courtName: "Cancha 1",
        courtType: "indoor",
        startTime: "08:00",
        endTime: "09:00",
        durationMinutes: 60,
      });
    });

    it("generates 30-minute start time increments", () => {
      const slots = getAvailableSlots(makeConfig());
      const startTimes = slots.map((s) => s.startTime);

      expect(startTimes[0]).toBe("08:00");
      expect(startTimes[1]).toBe("08:30");
      expect(startTimes[2]).toBe("09:00");
    });

    it("returns empty array when no courts provided", () => {
      const slots = getAvailableSlots(makeConfig({ courts: [] }));
      expect(slots).toEqual([]);
    });

    it("returns empty array when no allowed durations", () => {
      const slots = getAvailableSlots(makeConfig({ allowedDurations: [] }));
      expect(slots).toEqual([]);
    });
  });

  // --- Operating hours ---

  describe("operating hours", () => {
    it("returns empty when day is closed", () => {
      const slots = getAvailableSlots(
        makeConfig({
          operatingHours: [
            makeOperatingHours({ dayOfWeek: 1, isClosed: true }),
          ],
        }),
      );
      expect(slots).toEqual([]);
    });

    it("returns empty when no operating hours for the day", () => {
      const slots = getAvailableSlots(
        makeConfig({
          dayOfWeek: 0,
          operatingHours: [makeOperatingHours({ dayOfWeek: 1 })],
        }),
      );
      expect(slots).toEqual([]);
    });

    it("does not return slots that extend past close time", () => {
      const slots = getAvailableSlots(
        makeConfig({
          operatingHours: [
            makeOperatingHours({
              dayOfWeek: 1,
              openTime: "08:00",
              closeTime: "09:00",
            }),
          ],
          allowedDurations: [60],
        }),
      );

      // Only one slot: 08:00-09:00
      expect(slots).toHaveLength(1);
      expect(slots[0]!.startTime).toBe("08:00");
      expect(slots[0]!.endTime).toBe("09:00");
    });

    it("handles midnight close time (00:00 = 24:00)", () => {
      const slots = getAvailableSlots(
        makeConfig({
          operatingHours: [
            makeOperatingHours({
              dayOfWeek: 1,
              openTime: "22:00",
              closeTime: "00:00",
            }),
          ],
          allowedDurations: [60],
        }),
      );

      // Open 22:00-24:00: slots at 22:00, 22:30, 23:00
      expect(slots).toHaveLength(3);
      expect(slots[0]!.startTime).toBe("22:00");
      expect(slots[2]!.startTime).toBe("23:00");
      expect(slots[2]!.endTime).toBe("00:00");
    });
  });

  // --- Allowed durations ---

  describe("allowed durations", () => {
    it("returns slots for multiple durations", () => {
      const config = makeConfig({
        operatingHours: [
          makeOperatingHours({
            dayOfWeek: 1,
            openTime: "08:00",
            closeTime: "10:00",
          }),
        ],
        allowedDurations: [60, 90],
      });
      const slots = getAvailableSlots(config);

      // 60-min slots: 08:00, 08:30, 09:00 = 3
      // 90-min slots: 08:00, 08:30 = 2
      expect(slots).toHaveLength(5);

      // Both durations at 08:00
      expect(findSlot(slots, "court-1", "08:00", 60)).toBeDefined();
      expect(findSlot(slots, "court-1", "08:00", 90)).toBeDefined();

      // 90-min doesn't fit at 09:00 (would end at 10:30)
      expect(findSlot(slots, "court-1", "09:00", 90)).toBeUndefined();
    });

    it("does not return 120-min slot that exceeds close time", () => {
      const config = makeConfig({
        operatingHours: [
          makeOperatingHours({
            dayOfWeek: 1,
            openTime: "08:00",
            closeTime: "09:30",
          }),
        ],
        allowedDurations: [120],
      });
      const slots = getAvailableSlots(config);
      expect(slots).toEqual([]);
    });
  });

  // --- Booking overlap ---

  describe("booking overlap", () => {
    it("filters out slots that overlap with an existing booking", () => {
      const config = makeConfig({
        existingBookings: [
          makeBooking({ startTime: "10:00", endTime: "11:00" }),
        ],
        allowedDurations: [60],
      });
      const slots = getAvailableSlots(config);

      // 10:00 slot is blocked (exact overlap)
      expect(findSlot(slots, "court-1", "10:00", 60)).toBeUndefined();

      // 09:30 slot (09:30-10:30) also overlaps
      expect(findSlot(slots, "court-1", "09:30", 60)).toBeUndefined();

      // 09:00 slot (09:00-10:00) does NOT overlap — ends exactly at booking start
      expect(findSlot(slots, "court-1", "09:00", 60)).toBeDefined();

      // 11:00 slot (11:00-12:00) does NOT overlap — starts exactly at booking end
      expect(findSlot(slots, "court-1", "11:00", 60)).toBeDefined();
    });

    it("allows back-to-back bookings (no gap required)", () => {
      const config = makeConfig({
        existingBookings: [
          makeBooking({ startTime: "10:00", endTime: "11:00" }),
          makeBooking({ startTime: "12:00", endTime: "13:00" }),
        ],
        allowedDurations: [60],
      });
      const slots = getAvailableSlots(config);

      // 11:00-12:00 should be available (back-to-back with both bookings)
      expect(findSlot(slots, "court-1", "11:00", 60)).toBeDefined();
    });

    it("ignores cancelled bookings", () => {
      const config = makeConfig({
        existingBookings: [
          makeBooking({
            startTime: "10:00",
            endTime: "11:00",
            status: "cancelled",
          }),
        ],
      });
      const slots = getAvailableSlots(config);

      // 10:00 slot should be available (cancelled booking doesn't block)
      expect(findSlot(slots, "court-1", "10:00", 60)).toBeDefined();
    });

    it("respects bookings per court (different court not affected)", () => {
      const config = makeConfig({
        courts: [
          makeCourt({ id: "court-1", name: "Cancha 1" }),
          makeCourt({ id: "court-2", name: "Cancha 2" }),
        ],
        existingBookings: [
          makeBooking({
            courtId: "court-1",
            startTime: "10:00",
            endTime: "11:00",
          }),
        ],
      });
      const slots = getAvailableSlots(config);

      // Court 1 at 10:00 is blocked
      expect(findSlot(slots, "court-1", "10:00", 60)).toBeUndefined();
      // Court 2 at 10:00 is available
      expect(findSlot(slots, "court-2", "10:00", 60)).toBeDefined();
    });
  });

  // --- Blocked slots ---

  describe("blocked slots", () => {
    it("filters out slots that overlap with facility-wide blocked slots", () => {
      const config = makeConfig({
        blockedSlots: [
          makeBlockedSlot({
            date: "2026-03-09",
            startTime: "10:00",
            endTime: "12:00",
            courtId: null,
          }),
        ],
      });
      const slots = getAvailableSlots(config);

      // 10:00-11:00 is blocked
      expect(findSlot(slots, "court-1", "10:00", 60)).toBeUndefined();
      // 10:30-11:30 also overlaps with blocked zone
      expect(findSlot(slots, "court-1", "10:30", 60)).toBeUndefined();
      // 11:00-12:00 also overlaps (11:00 sub-slot is within 10:00-12:00 block)
      expect(findSlot(slots, "court-1", "11:00", 60)).toBeUndefined();
      // 11:30-12:30 also partially overlaps
      expect(findSlot(slots, "court-1", "11:30", 60)).toBeUndefined();
      // 12:00-13:00 is available (starts at block end)
      expect(findSlot(slots, "court-1", "12:00", 60)).toBeDefined();
    });

    it("filters out slots that overlap with court-specific blocked slots", () => {
      const config = makeConfig({
        courts: [
          makeCourt({ id: "court-1", name: "Cancha 1" }),
          makeCourt({ id: "court-2", name: "Cancha 2" }),
        ],
        blockedSlots: [
          makeBlockedSlot({
            date: "2026-03-09",
            startTime: "10:00",
            endTime: "12:00",
            courtId: "court-1",
          }),
        ],
      });
      const slots = getAvailableSlots(config);

      // Court 1 at 10:00 is blocked
      expect(findSlot(slots, "court-1", "10:00", 60)).toBeUndefined();
      // Court 2 at 10:00 is available
      expect(findSlot(slots, "court-2", "10:00", 60)).toBeDefined();
    });

    it("ignores blocked slots on different dates", () => {
      const config = makeConfig({
        blockedSlots: [
          makeBlockedSlot({
            date: "2026-03-10",
            startTime: "10:00",
            endTime: "12:00",
            courtId: null,
          }),
        ],
      });
      const slots = getAvailableSlots(config);

      // Slot on 2026-03-09 should not be blocked by a block on 2026-03-10
      expect(findSlot(slots, "court-1", "10:00", 60)).toBeDefined();
    });
  });

  // --- Pricing ---

  describe("pricing", () => {
    it("calculates regular zone pricing per 30-min slot", () => {
      const config = makeConfig({
        courts: [makeCourt({ priceInCents: 5000 })],
        allowedDurations: [60],
      });
      const slots = getAvailableSlots(config);
      const slot = findSlot(slots, "court-1", "10:00", 60);

      // 60 min = 2 x 30-min slots x 5000 = 10000
      expect(slot?.priceInCents).toBe(10000);
      expect(slot?.isPeakRate).toBe(false);
      expect(slot?.zone).toBe("regular");
    });

    it("calculates peak zone pricing", () => {
      const config = makeConfig({
        courts: [makeCourt({ priceInCents: 5000, peakPriceInCents: 8000 })],
        peakPeriods: [
          makePeakPeriod({
            daysOfWeek: [1],
            startTime: "18:00",
            endTime: "22:00",
          }),
        ],
        allowedDurations: [60],
      });
      const slots = getAvailableSlots(config);
      const slot = findSlot(slots, "court-1", "18:00", 60);

      // 2 x 8000 = 16000
      expect(slot?.priceInCents).toBe(16000);
      expect(slot?.isPeakRate).toBe(true);
      expect(slot?.zone).toBe("peak");
    });

    it("calculates blended price for split-zone slots", () => {
      const config = makeConfig({
        courts: [makeCourt({ priceInCents: 5000, peakPriceInCents: 8000 })],
        peakPeriods: [
          makePeakPeriod({
            daysOfWeek: [1],
            startTime: "18:00",
            endTime: "22:00",
          }),
        ],
        allowedDurations: [90],
      });
      const slots = getAvailableSlots(config);
      const slot = findSlot(slots, "court-1", "17:00", 90);

      // 17:00-17:30 regular (5000) + 17:30-18:00 regular (5000) + 18:00-18:30 peak (8000) = 18000
      expect(slot?.priceInCents).toBe(18000);
      expect(slot?.isPeakRate).toBe(true);
      expect(slot?.zone).toBe("peak");
    });

    it("uses facility defaults when court has no custom price", () => {
      const config = makeConfig({
        courts: [makeCourt({ priceInCents: null, peakPriceInCents: null })],
        facilityDefaults: makeFacilityDefaults({
          defaultPriceInCents: 4000,
        }),
        allowedDurations: [60],
      });
      const slots = getAvailableSlots(config);
      const slot = findSlot(slots, "court-1", "10:00", 60);

      // 2 x 4000 = 8000
      expect(slot?.priceInCents).toBe(8000);
    });

    it("calculates 90-min slot price correctly (3 x 30-min slots)", () => {
      const config = makeConfig({
        courts: [makeCourt({ priceInCents: 6000 })],
        allowedDurations: [90],
      });
      const slots = getAvailableSlots(config);
      const slot = findSlot(slots, "court-1", "10:00", 90);

      // 3 x 6000 = 18000
      expect(slot?.priceInCents).toBe(18000);
    });
  });

  // --- Multiple courts ---

  describe("multiple courts", () => {
    it("returns slots for each court independently", () => {
      const config = makeConfig({
        courts: [
          makeCourt({ id: "court-1", name: "Cancha 1", priceInCents: 5000 }),
          makeCourt({
            id: "court-2",
            name: "Cancha 2",
            type: "outdoor",
            priceInCents: 4000,
          }),
        ],
        operatingHours: [
          makeOperatingHours({
            dayOfWeek: 1,
            openTime: "08:00",
            closeTime: "09:00",
          }),
        ],
        allowedDurations: [60],
      });
      const slots = getAvailableSlots(config);

      // 1 slot per court = 2 total
      expect(slots).toHaveLength(2);

      const court1Slot = findSlot(slots, "court-1", "08:00", 60);
      const court2Slot = findSlot(slots, "court-2", "08:00", 60);

      expect(court1Slot?.priceInCents).toBe(10000);
      expect(court1Slot?.courtType).toBe("indoor");

      expect(court2Slot?.priceInCents).toBe(8000);
      expect(court2Slot?.courtType).toBe("outdoor");
    });
  });

  // --- Sorting ---

  describe("sorting", () => {
    it("returns slots ordered by court, then start time, then duration", () => {
      const config = makeConfig({
        courts: [
          makeCourt({ id: "court-1", name: "Cancha 1" }),
          makeCourt({ id: "court-2", name: "Cancha 2" }),
        ],
        operatingHours: [
          makeOperatingHours({
            dayOfWeek: 1,
            openTime: "08:00",
            closeTime: "10:00",
          }),
        ],
        allowedDurations: [60, 90],
      });
      const slots = getAvailableSlots(config);

      // Court 1 comes first, then court 2
      const court1Slots = slots.filter((s) => s.courtId === "court-1");
      const court2Slots = slots.filter((s) => s.courtId === "court-2");

      // Within each court, sorted by startTime then duration
      expect(court1Slots[0]!.startTime).toBe("08:00");
      expect(court1Slots[0]!.durationMinutes).toBe(60);
      expect(court1Slots[1]!.startTime).toBe("08:00");
      expect(court1Slots[1]!.durationMinutes).toBe(90);

      // Court 2 starts after all court 1 slots
      const lastCourt1Index = slots.findIndex(
        (s) =>
          s.courtId === "court-1" && s === court1Slots[court1Slots.length - 1],
      );
      const firstCourt2Index = slots.findIndex((s) => s.courtId === "court-2");
      expect(firstCourt2Index).toBeGreaterThan(lastCourt1Index);

      expect(court2Slots[0]!.startTime).toBe("08:00");
    });
  });

  // --- Edge cases ---

  describe("edge cases", () => {
    it("handles all booking statuses correctly (only cancelled is ignored)", () => {
      const statuses = [
        "pending",
        "confirmed",
        "in_progress",
        "completed",
        "open_match",
      ];
      for (const status of statuses) {
        const config = makeConfig({
          existingBookings: [
            makeBooking({ startTime: "10:00", endTime: "11:00", status }),
          ],
        });
        const slots = getAvailableSlots(config);
        expect(
          findSlot(slots, "court-1", "10:00", 60),
          `Status "${status}" should block the slot`,
        ).toBeUndefined();
      }
    });

    it("handles a fully booked day", () => {
      // Book every hour from 08:00-22:00
      const bookings: ExistingBooking[] = [];
      for (let h = 8; h < 22; h++) {
        bookings.push(
          makeBooking({
            startTime: `${h.toString().padStart(2, "0")}:00`,
            endTime: `${(h + 1).toString().padStart(2, "0")}:00`,
          }),
        );
      }

      const config = makeConfig({ existingBookings: bookings });
      const slots = getAvailableSlots(config);
      expect(slots).toEqual([]);
    });

    it("filters out past slots when nowMinutes is provided", () => {
      const config = makeConfig({
        operatingHours: [
          makeOperatingHours({
            dayOfWeek: 1,
            openTime: "08:00",
            closeTime: "14:00",
          }),
        ],
        allowedDurations: [60],
        nowMinutes: 11 * 60 + 35, // 11:35
      });
      const slots = getAvailableSlots(config);

      // Slots starting before 11:35 should be excluded
      expect(findSlot(slots, "court-1", "08:00", 60)).toBeUndefined();
      expect(findSlot(slots, "court-1", "09:00", 60)).toBeUndefined();
      expect(findSlot(slots, "court-1", "10:00", 60)).toBeUndefined();
      expect(findSlot(slots, "court-1", "11:00", 60)).toBeUndefined();
      expect(findSlot(slots, "court-1", "11:30", 60)).toBeUndefined();

      // Slots starting at or after 12:00 should be available
      expect(findSlot(slots, "court-1", "12:00", 60)).toBeDefined();
      expect(findSlot(slots, "court-1", "13:00", 60)).toBeDefined();
    });

    it("does not filter slots when nowMinutes is undefined (future date)", () => {
      const config = makeConfig({
        operatingHours: [
          makeOperatingHours({
            dayOfWeek: 1,
            openTime: "08:00",
            closeTime: "12:00",
          }),
        ],
        allowedDurations: [60],
        // nowMinutes not set — future date
      });
      const slots = getAvailableSlots(config);

      expect(findSlot(slots, "court-1", "08:00", 60)).toBeDefined();
      expect(findSlot(slots, "court-1", "09:00", 60)).toBeDefined();
    });

    it("handles multiple blocked slots and bookings combined", () => {
      const config = makeConfig({
        operatingHours: [
          makeOperatingHours({
            dayOfWeek: 1,
            openTime: "08:00",
            closeTime: "12:00",
          }),
        ],
        blockedSlots: [
          makeBlockedSlot({
            date: "2026-03-09",
            startTime: "08:00",
            endTime: "09:00",
            courtId: null,
          }),
        ],
        existingBookings: [
          makeBooking({ startTime: "10:00", endTime: "11:00" }),
        ],
        allowedDurations: [60],
      });
      const slots = getAvailableSlots(config);

      // 08:00 blocked, 08:30 partially blocked, 09:00 available, 09:30 overlaps booking,
      // 10:00 booked, 10:30 overlaps booking, 11:00 available
      expect(findSlot(slots, "court-1", "08:00", 60)).toBeUndefined();
      expect(findSlot(slots, "court-1", "09:00", 60)).toBeDefined();
      expect(findSlot(slots, "court-1", "10:00", 60)).toBeUndefined();
      expect(findSlot(slots, "court-1", "11:00", 60)).toBeDefined();
    });
  });
});
