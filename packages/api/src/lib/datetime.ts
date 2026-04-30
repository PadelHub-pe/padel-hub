/**
 * Lima-zoned datetime helpers.
 *
 * PadelHub is a single-locale (America/Lima, UTC-5, no DST) product. Vercel
 * runtimes default to UTC, so any unzoned `new Date()` / `startOfDay` / `setHours`
 * silently drifts by 5 hours. These helpers are the canonical boundary between
 * the Lima wall clock the user expects and the UTC instants the runtime gives us.
 *
 * Two conventions enforced here:
 *  - Inputs that represent a "calendar day" arrive as `YYYY-MM-DD` strings
 *    (URL params, form fields). Use `parseLimaDateParam` to turn them into instants.
 *  - "Now" is `limaNow()`. Day boundaries come from `startOfLimaDay` / `endOfLimaDay`
 *    operating on real instants. Never call `startOfDay` from `date-fns` directly.
 */

import type { Locale } from "date-fns";
import { format } from "date-fns";
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";
import { es } from "date-fns/locale";

export const LIMA_TZ = "America/Lima";

const DATE_PARAM_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Returns `new Date()`. Wrapped so tests can vi.spyOn() it and so call sites
 * are explicit about reading "now" rather than constructing arbitrary dates.
 */
export function nowUtc(): Date {
  return new Date();
}

/**
 * Returns a Date whose getFullYear/getMonth/getDate/getHours match the
 * Lima wall clock at this instant. The returned Date's underlying timestamp
 * is shifted — do NOT persist it; only use for date-of-day arithmetic.
 */
export function limaNow(): Date {
  return toZonedTime(nowUtc(), LIMA_TZ);
}

/**
 * Lima-zoned start of the calendar day that contains `date` (a real instant).
 * Returns a real instant (UTC).
 *
 * Example: `startOfLimaDay(new Date("2026-04-30T03:00:00Z"))` (= 22:00 PET on Apr 29)
 *   → `new Date("2026-04-29T05:00:00Z")` (= 00:00 PET on Apr 29).
 */
export function startOfLimaDay(date: Date): Date {
  const ymd = formatInTimeZone(date, LIMA_TZ, "yyyy-MM-dd");
  return fromZonedTime(`${ymd}T00:00:00`, LIMA_TZ);
}

/**
 * Lima-zoned end of day (exclusive upper bound — start of the next day).
 * Use as: `WHERE date >= startOfLimaDay(d) AND date < endOfLimaDay(d)`.
 */
export function endOfLimaDay(date: Date): Date {
  const ymd = formatInTimeZone(date, LIMA_TZ, "yyyy-MM-dd");
  const dt = fromZonedTime(`${ymd}T00:00:00`, LIMA_TZ);
  dt.setUTCDate(dt.getUTCDate() + 1);
  return dt;
}

/**
 * Lima-zoned start of month containing `date`.
 */
export function startOfLimaMonth(date: Date): Date {
  const ym = formatInTimeZone(date, LIMA_TZ, "yyyy-MM");
  return fromZonedTime(`${ym}-01T00:00:00`, LIMA_TZ);
}

/**
 * Lima-zoned start of week (Monday-based, ISO) containing `date`.
 */
export function startOfLimaWeek(date: Date): Date {
  const day = startOfLimaDay(date);
  const ymd = formatInTimeZone(day, LIMA_TZ, "yyyy-MM-dd");
  const limaDow = toZonedTime(day, LIMA_TZ).getDay(); // 0..6, 0=Sun
  const offset = limaDow === 0 ? 6 : limaDow - 1; // Monday-based
  const result = fromZonedTime(`${ymd}T00:00:00`, LIMA_TZ);
  result.setUTCDate(result.getUTCDate() - offset);
  return result;
}

/**
 * Add `days` calendar days in Lima TZ. Stable across DST boundaries (Lima has
 * none today, but coded defensively for future moves).
 */
export function addLimaDays(date: Date, days: number): Date {
  const ymd = formatInTimeZone(date, LIMA_TZ, "yyyy-MM-dd");
  const dt = fromZonedTime(`${ymd}T00:00:00`, LIMA_TZ);
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt;
}

/**
 * Parse a `YYYY-MM-DD` string (URL/form param) as Lima-local midnight, returning
 * a real instant.
 *
 * Example: `parseLimaDateParam("2026-04-30")` → `new Date("2026-04-30T05:00:00Z")`.
 *
 * Throws on invalid input — callers should validate upstream where possible
 * (e.g. with Zod) but this is the last line of defense.
 */
export function parseLimaDateParam(yyyyMmDd: string): Date {
  if (!DATE_PARAM_RE.test(yyyyMmDd)) {
    throw new Error(`Invalid date param: "${yyyyMmDd}" — expected YYYY-MM-DD`);
  }
  const dt = fromZonedTime(`${yyyyMmDd}T00:00:00`, LIMA_TZ);
  if (Number.isNaN(dt.getTime())) {
    throw new Error(`Invalid date param: "${yyyyMmDd}"`);
  }
  return dt;
}

/**
 * Format a Date in Lima TZ. Defaults to Spanish locale.
 *
 * Example: `formatLimaDate(d, "EEEE, d 'de' MMMM 'de' yyyy")` → "miércoles, 29 de abril de 2026".
 */
export function formatLimaDate(
  date: Date,
  fmt: string,
  locale: Locale = es,
): string {
  return formatInTimeZone(date, LIMA_TZ, fmt, { locale });
}

/**
 * Format a Date as a `YYYY-MM-DD` string in Lima TZ. Used everywhere we need
 * to compare against a stored calendar-day string.
 */
export function formatLimaDateParam(date: Date): string {
  return formatInTimeZone(date, LIMA_TZ, "yyyy-MM-dd");
}

/**
 * Construct a real instant from a Lima wall-clock date + `HH:MM` time string.
 *
 * Replacement for the broken `new Date(date); dt.setHours(h, m)` pattern in
 * booking-status.ts, which sets hours in *server* TZ.
 *
 * `date` may be any real instant whose Lima calendar-day is the target day.
 */
export function buildLimaDateTime(date: Date, hhmm: string): Date {
  const match = /^(\d{2}):(\d{2})(?::\d{2})?$/.exec(hhmm);
  if (!match) {
    throw new Error(`Invalid time: "${hhmm}" — expected HH:MM`);
  }
  const ymd = formatInTimeZone(date, LIMA_TZ, "yyyy-MM-dd");
  return fromZonedTime(`${ymd}T${match[1]}:${match[2]}:00`, LIMA_TZ);
}

/**
 * Convenience: format an instant for human display in Lima TZ.
 * Equivalent to `formatLimaDate(d, fmt, es)` but allows callers to pass a
 * non-zoned date-fns format string without re-importing es.
 */
export function formatLimaDateTime(
  date: Date,
  fmt = "d 'de' MMMM yyyy, HH:mm",
): string {
  return formatLimaDate(date, fmt, es);
}

// Re-export plain `format` from date-fns so consumers can fall back to
// browser-local formatting where that's actually desired (rare).
export { format };
