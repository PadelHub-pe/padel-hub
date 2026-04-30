import { describe, expect, it } from "vitest";

import type {
  BookingForResolution,
  BookingStatus,
} from "../utils/booking-status";
import { buildLimaDateTime } from "../lib/datetime";
import {
  resolveBookingStatus,
  resolveBookingStatuses,
} from "../utils/booking-status";

// =============================================================================
// Factories
// =============================================================================

const TEST_DAY = "2026-03-12";

function makeBooking(
  overrides?: Partial<BookingForResolution>,
): BookingForResolution {
  return {
    id: "booking-1",
    status: "confirmed",
    date: TEST_DAY, // YYYY-MM-DD Lima calendar day
    startTime: "10:00",
    endTime: "11:30",
    ...overrides,
  };
}

/** Helper to create a real instant for a specific time on 2026-03-12 (Lima TZ) */
function timeOn(hours: number, minutes = 0): Date {
  const hh = hours.toString().padStart(2, "0");
  const mm = minutes.toString().padStart(2, "0");
  return buildLimaDateTime(TEST_DAY, `${hh}:${mm}`);
}

// =============================================================================
// resolveBookingStatus — single booking
// =============================================================================

describe("resolveBookingStatus", () => {
  // -------------------------------------------------------------------------
  // confirmed → in_progress
  // -------------------------------------------------------------------------
  describe("confirmed → in_progress", () => {
    it("transitions when now is after start time", () => {
      const booking = makeBooking({ status: "confirmed", startTime: "10:00" });
      const result = resolveBookingStatus(booking, timeOn(10, 30));

      expect(result).toEqual({
        bookingId: "booking-1",
        oldStatus: "confirmed",
        newStatus: "in_progress",
        activityType: "started",
      });
    });

    it("transitions at exact start time boundary", () => {
      const booking = makeBooking({ status: "confirmed", startTime: "10:00" });
      const result = resolveBookingStatus(booking, timeOn(10, 0));

      expect(result).toEqual({
        bookingId: "booking-1",
        oldStatus: "confirmed",
        newStatus: "in_progress",
        activityType: "started",
      });
    });

    it("does not transition when now is before start time", () => {
      const booking = makeBooking({ status: "confirmed", startTime: "10:00" });
      const result = resolveBookingStatus(booking, timeOn(9, 59));

      expect(result).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // in_progress → completed
  // -------------------------------------------------------------------------
  describe("in_progress → completed", () => {
    it("transitions when now is after end time", () => {
      const booking = makeBooking({ status: "in_progress", endTime: "11:30" });
      const result = resolveBookingStatus(booking, timeOn(12, 0));

      expect(result).toEqual({
        bookingId: "booking-1",
        oldStatus: "in_progress",
        newStatus: "completed",
        activityType: "completed",
      });
    });

    it("transitions at exact end time boundary", () => {
      const booking = makeBooking({ status: "in_progress", endTime: "11:30" });
      const result = resolveBookingStatus(booking, timeOn(11, 30));

      expect(result).toEqual({
        bookingId: "booking-1",
        oldStatus: "in_progress",
        newStatus: "completed",
        activityType: "completed",
      });
    });

    it("does not transition when now is before end time", () => {
      const booking = makeBooking({ status: "in_progress", endTime: "11:30" });
      const result = resolveBookingStatus(booking, timeOn(11, 0));

      expect(result).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // confirmed → completed (skip in_progress when past end time)
  // -------------------------------------------------------------------------
  describe("confirmed → completed (past end time)", () => {
    it("jumps to completed when now is past end time", () => {
      const booking = makeBooking({
        status: "confirmed",
        startTime: "10:00",
        endTime: "11:30",
      });
      const result = resolveBookingStatus(booking, timeOn(12, 0));

      expect(result).toEqual({
        bookingId: "booking-1",
        oldStatus: "confirmed",
        newStatus: "completed",
        activityType: "completed",
      });
    });

    it("jumps to completed at exact end time boundary", () => {
      const booking = makeBooking({
        status: "confirmed",
        startTime: "10:00",
        endTime: "11:30",
      });
      const result = resolveBookingStatus(booking, timeOn(11, 30));

      expect(result).toEqual({
        bookingId: "booking-1",
        oldStatus: "confirmed",
        newStatus: "completed",
        activityType: "completed",
      });
    });
  });

  // -------------------------------------------------------------------------
  // Statuses that should never auto-transition
  // -------------------------------------------------------------------------
  describe("non-transitioning statuses", () => {
    const nonTransitioning: BookingStatus[] = [
      "pending",
      "cancelled",
      "completed",
      "open_match",
    ];

    for (const status of nonTransitioning) {
      it(`does not transition ${status} bookings`, () => {
        const booking = makeBooking({ status });
        // Even when well past the end time
        const result = resolveBookingStatus(booking, timeOn(23, 59));
        expect(result).toBeNull();
      });
    }
  });

  // -------------------------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------------------------
  describe("edge cases", () => {
    it("handles midnight time strings", () => {
      const booking = makeBooking({
        status: "confirmed",
        startTime: "00:00",
        endTime: "01:30",
      });
      const result = resolveBookingStatus(booking, timeOn(0, 0));

      expect(result).toEqual({
        bookingId: "booking-1",
        oldStatus: "confirmed",
        newStatus: "in_progress",
        activityType: "started",
      });
    });

    it("handles late-night booking end time", () => {
      const booking = makeBooking({
        status: "in_progress",
        startTime: "22:00",
        endTime: "23:30",
      });
      const result = resolveBookingStatus(booking, timeOn(23, 30));

      expect(result).toEqual({
        bookingId: "booking-1",
        oldStatus: "in_progress",
        newStatus: "completed",
        activityType: "completed",
      });
    });

    it("preserves booking id in transition", () => {
      const booking = makeBooking({
        id: "custom-id-123",
        status: "confirmed",
        startTime: "10:00",
      });
      const result = resolveBookingStatus(booking, timeOn(10, 0));
      expect(result?.bookingId).toBe("custom-id-123");
    });
  });
});

// =============================================================================
// resolveBookingStatuses — batch
// =============================================================================

describe("resolveBookingStatuses", () => {
  it("returns empty array when no transitions needed", () => {
    const bookingList = [
      makeBooking({ id: "b1", status: "pending" }),
      makeBooking({ id: "b2", status: "cancelled" }),
      makeBooking({ id: "b3", status: "completed" }),
    ];
    const result = resolveBookingStatuses(bookingList, timeOn(23, 59));
    expect(result).toEqual([]);
  });

  it("returns only bookings needing transitions", () => {
    const bookingList = [
      makeBooking({ id: "b1", status: "confirmed", startTime: "10:00" }),
      makeBooking({ id: "b2", status: "pending", startTime: "10:00" }),
      makeBooking({ id: "b3", status: "in_progress", endTime: "09:00" }),
      makeBooking({ id: "b4", status: "confirmed", startTime: "14:00" }),
    ];
    const result = resolveBookingStatuses(bookingList, timeOn(10, 30));

    expect(result).toHaveLength(2);
    expect(result[0]?.bookingId).toBe("b1");
    expect(result[0]?.newStatus).toBe("in_progress");
    expect(result[1]?.bookingId).toBe("b3");
    expect(result[1]?.newStatus).toBe("completed");
  });

  it("handles empty booking list", () => {
    const result = resolveBookingStatuses([], timeOn(12, 0));
    expect(result).toEqual([]);
  });

  it("handles all bookings needing transition", () => {
    const bookingList = [
      makeBooking({ id: "b1", status: "confirmed", startTime: "08:00" }),
      makeBooking({ id: "b2", status: "in_progress", endTime: "09:00" }),
    ];
    const result = resolveBookingStatuses(bookingList, timeOn(12, 0));

    expect(result).toHaveLength(2);
  });
});
