/**
 * Shared zone calculation utilities for schedule and pricing.
 *
 * Pure logic — no DB dependencies. Consumed by Flows 6, 7, and 8.
 */

import { toZonedTime } from "date-fns-tz";

const LIMA_TZ = "America/Lima";

// =============================================================================
// Timezone
// =============================================================================

/**
 * Get the day of week (0=Sunday .. 6=Saturday) in America/Lima timezone.
 * Avoids timezone drift when the server runs in UTC (e.g. CI, production).
 */
export function getLimaDayOfWeek(date: Date): number {
  return toZonedTime(date, LIMA_TZ).getDay();
}

// =============================================================================
// Types
// =============================================================================

export type TimeZone = "closed" | "regular" | "peak" | "blocked";

export interface OperatingHoursConfig {
  dayOfWeek: number;
  openTime: string; // "HH:MM"
  closeTime: string; // "HH:MM"
  isClosed: boolean;
}

export interface PeakPeriodConfig {
  daysOfWeek: number[]; // 0=Sunday .. 6=Saturday
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  markupPercent: number;
}

export interface BlockedSlotConfig {
  date: string; // "YYYY-MM-DD"
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  courtId: string | null; // null = facility-wide block
}

export interface ScheduleConfig {
  operatingHours: OperatingHoursConfig[];
  peakPeriods: PeakPeriodConfig[];
  blockedSlots: BlockedSlotConfig[];
}

export interface SlotCourtPricing {
  priceInCents: number | null;
  peakPriceInCents: number | null;
}

export interface SlotFacilityDefaults {
  defaultPriceInCents: number | null;
  defaultPeakPriceInCents: number | null;
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Parse "HH:MM" to total minutes since midnight.
 * Returns 1440 for "00:00" when used as a close time (handled by callers).
 */
export function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

// =============================================================================
// getTimeZone
// =============================================================================

/**
 * Determine the zone type for a given time and day.
 *
 * Priority: closed > blocked > peak > regular
 *
 * @param time - "HH:MM" format
 * @param dayOfWeek - 0=Sunday .. 6=Saturday
 * @param date - "YYYY-MM-DD" for blocked slot matching, or null to skip
 * @param config - Operating hours, peak periods, and blocked slots
 */
export function getTimeZone(
  time: string,
  dayOfWeek: number,
  date: string | null,
  config: ScheduleConfig,
): TimeZone {
  return getTimeZoneWithMarkup(time, dayOfWeek, date, config).zone;
}

/**
 * Like getTimeZone but also returns the applicable peak markup percentage.
 * Returns markupPercent=0 for non-peak zones.
 */
export function getTimeZoneWithMarkup(
  time: string,
  dayOfWeek: number,
  date: string | null,
  config: ScheduleConfig,
): { zone: TimeZone; markupPercent: number } {
  const timeMinutes = parseTimeToMinutes(time);

  // 1. Check if the facility is open on this day
  const dayHours = config.operatingHours.find((h) => h.dayOfWeek === dayOfWeek);

  if (!dayHours || dayHours.isClosed) {
    return { zone: "closed", markupPercent: 0 };
  }

  // 2. Check if time falls within operating hours
  const openMinutes = parseTimeToMinutes(dayHours.openTime);
  // Treat "00:00" close time as midnight (1440 minutes) = open until end of day
  const closeMinutes =
    dayHours.closeTime === "00:00"
      ? 1440
      : parseTimeToMinutes(dayHours.closeTime);

  if (timeMinutes < openMinutes || timeMinutes >= closeMinutes) {
    return { zone: "closed", markupPercent: 0 };
  }

  // 3. Check blocked slots (only facility-wide blocks, courtId === null)
  if (date) {
    for (const slot of config.blockedSlots) {
      if (slot.courtId !== null) continue; // Skip court-specific blocks
      if (slot.date !== date) continue;

      const blockStart = parseTimeToMinutes(slot.startTime);
      const blockEnd = parseTimeToMinutes(slot.endTime);
      if (timeMinutes >= blockStart && timeMinutes < blockEnd) {
        return { zone: "blocked", markupPercent: 0 };
      }
    }
  }

  // 4. Check peak periods — find the highest markup if overlapping
  let maxMarkup = 0;
  for (const period of config.peakPeriods) {
    if (!period.daysOfWeek.includes(dayOfWeek)) continue;

    const peakStart = parseTimeToMinutes(period.startTime);
    const peakEnd = parseTimeToMinutes(period.endTime);
    if (timeMinutes >= peakStart && timeMinutes < peakEnd) {
      if (period.markupPercent > maxMarkup) {
        maxMarkup = period.markupPercent;
      }
    }
  }

  if (maxMarkup > 0) {
    return { zone: "peak", markupPercent: maxMarkup };
  }

  // 5. Default: regular
  return { zone: "regular", markupPercent: 0 };
}

// =============================================================================
// getRateForSlot
// =============================================================================

/**
 * Get the applicable rate in cents for a court in a given zone.
 *
 * Fallback chain:
 * - regular: court.priceInCents → facility.defaultPriceInCents → 0
 * - peak: court.peakPriceInCents → facility.defaultPeakPriceInCents
 *         → (regular chain as fallback) → 0
 * - closed/blocked: 0
 */
export function getRateForSlot(
  court: SlotCourtPricing,
  zone: TimeZone,
  facilityDefaults: SlotFacilityDefaults | null,
): number {
  if (zone === "closed" || zone === "blocked") {
    return 0;
  }

  const regularRate =
    court.priceInCents ?? facilityDefaults?.defaultPriceInCents ?? 0;

  if (zone === "regular") {
    return regularRate;
  }

  // zone === "peak"
  const peakRate =
    court.peakPriceInCents ?? facilityDefaults?.defaultPeakPriceInCents ?? null;

  if (peakRate !== null) {
    return peakRate;
  }

  // No explicit peak price set anywhere — fall back to regular rate
  return regularRate;
}
