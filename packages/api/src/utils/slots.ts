/**
 * Available slot generation for public booking.
 *
 * Pure logic — no DB dependencies. Composes existing schedule utilities
 * (getTimeZoneWithMarkup, getRateForSlot) to produce a list of bookable
 * time windows per court.
 */

import type {
  BlockedSlotConfig,
  OperatingHoursConfig,
  PeakPeriodConfig,
  ScheduleConfig,
  SlotCourtPricing,
  SlotFacilityDefaults,
} from "./schedule";
import {
  getRateForSlot,
  getTimeZoneWithMarkup,
  parseTimeToMinutes,
} from "./schedule";

// =============================================================================
// Types
// =============================================================================

export interface CourtInfo {
  id: string;
  name: string;
  type: "indoor" | "outdoor";
  priceInCents: number | null;
  peakPriceInCents: number | null;
}

export interface ExistingBooking {
  courtId: string;
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  status: string;
}

export interface AvailableSlot {
  courtId: string;
  courtName: string;
  courtType: "indoor" | "outdoor";
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  durationMinutes: number;
  priceInCents: number;
  isPeakRate: boolean;
  zone: "regular" | "peak";
}

export interface SlotGenerationConfig {
  date: string; // "YYYY-MM-DD"
  dayOfWeek: number; // 0=Sunday .. 6=Saturday
  courts: CourtInfo[];
  operatingHours: OperatingHoursConfig[];
  peakPeriods: PeakPeriodConfig[];
  blockedSlots: BlockedSlotConfig[];
  existingBookings: ExistingBooking[];
  allowedDurations: number[]; // e.g., [60, 90]
  facilityDefaults: SlotFacilityDefaults;
}

// =============================================================================
// Helpers
// =============================================================================

function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

/** Check overlap with court-specific blocked slots (courtId !== null). */
function hasCourtBlockOverlap(
  startMin: number,
  endMin: number,
  courtId: string,
  date: string,
  blockedSlots: BlockedSlotConfig[],
): boolean {
  for (const slot of blockedSlots) {
    if (slot.courtId !== courtId) continue;
    if (slot.date !== date) continue;

    const blockStart = parseTimeToMinutes(slot.startTime);
    const blockEnd = parseTimeToMinutes(slot.endTime);
    if (startMin < blockEnd && endMin > blockStart) return true;
  }
  return false;
}

/** Check overlap with existing non-cancelled bookings on the same court. */
function hasBookingOverlap(
  startMin: number,
  endMin: number,
  courtId: string,
  bookings: ExistingBooking[],
): boolean {
  for (const booking of bookings) {
    if (booking.courtId !== courtId) continue;
    if (booking.status === "cancelled") continue;

    const bStart = parseTimeToMinutes(booking.startTime);
    const bEnd = parseTimeToMinutes(booking.endTime);
    if (startMin < bEnd && endMin > bStart) return true;
  }
  return false;
}

// =============================================================================
// Main
// =============================================================================

/**
 * Generate all available booking slots for a given date and facility config.
 *
 * Iterates over each court × 30-min start increment × allowed duration,
 * filtering out slots that overlap with closed hours, blocked slots, or
 * existing bookings. Calculates per-30-min pricing using the existing
 * schedule zone logic.
 */
export function getAvailableSlots(
  config: SlotGenerationConfig,
): AvailableSlot[] {
  const {
    date,
    dayOfWeek,
    courts,
    operatingHours,
    peakPeriods,
    blockedSlots,
    existingBookings,
    allowedDurations,
    facilityDefaults,
  } = config;

  // Find operating hours for this day
  const dayHours = operatingHours.find((h) => h.dayOfWeek === dayOfWeek);
  if (!dayHours || dayHours.isClosed) return [];

  const openMin = parseTimeToMinutes(dayHours.openTime);
  const closeMin =
    dayHours.closeTime === "00:00"
      ? 1440
      : parseTimeToMinutes(dayHours.closeTime);

  const scheduleConfig: ScheduleConfig = {
    operatingHours,
    peakPeriods,
    blockedSlots,
  };
  const sortedDurations = [...allowedDurations].sort((a, b) => a - b);
  const results: AvailableSlot[] = [];

  for (const court of courts) {
    const courtPricing: SlotCourtPricing = {
      priceInCents: court.priceInCents,
      peakPriceInCents: court.peakPriceInCents,
    };

    for (let startMin = openMin; startMin < closeMin; startMin += 30) {
      for (const duration of sortedDurations) {
        const endMin = startMin + duration;
        if (endMin > closeMin) continue;

        // Check each 30-min sub-slot for closed/blocked (facility-wide) zones
        let blocked = false;
        let totalPrice = 0;
        let hasPeak = false;

        for (let sub = startMin; sub < endMin; sub += 30) {
          const { zone } = getTimeZoneWithMarkup(
            formatTime(sub),
            dayOfWeek,
            date,
            scheduleConfig,
          );

          if (zone === "closed" || zone === "blocked") {
            blocked = true;
            break;
          }

          const rate = getRateForSlot(courtPricing, zone, facilityDefaults);
          totalPrice += rate;
          if (zone === "peak") hasPeak = true;
        }

        if (blocked) continue;

        // Check court-specific blocked slots
        if (
          hasCourtBlockOverlap(startMin, endMin, court.id, date, blockedSlots)
        ) {
          continue;
        }

        // Check existing booking overlap
        if (hasBookingOverlap(startMin, endMin, court.id, existingBookings)) {
          continue;
        }

        results.push({
          courtId: court.id,
          courtName: court.name,
          courtType: court.type,
          startTime: formatTime(startMin),
          endTime: formatTime(endMin),
          durationMinutes: duration,
          priceInCents: totalPrice,
          isPeakRate: hasPeak,
          zone: hasPeak ? "peak" : "regular",
        });
      }
    }
  }

  return results;
}
