/**
 * On-access booking status resolver.
 *
 * Pure logic — resolves time-based status transitions without DB dependencies.
 * `confirmed → in_progress` when now >= startDateTime
 * `in_progress → completed` when now >= endDateTime
 */

// =============================================================================
// Types
// =============================================================================

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "open_match";

export interface BookingForResolution {
  id: string;
  status: BookingStatus;
  date: Date;
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
}

export interface StatusTransition {
  bookingId: string;
  oldStatus: BookingStatus;
  newStatus: "in_progress" | "completed";
  activityType: "started" | "completed";
}

// =============================================================================
// Pure resolver
// =============================================================================

/**
 * Build a full Date from a booking's date + time string (HH:MM).
 * The booking date is stored as a date (no timezone), so we combine
 * year/month/day from the date with hours/minutes from the time string.
 */
function buildDateTime(date: Date, time: string): Date {
  const [hours, minutes] = time.split(":").map(Number) as [number, number];
  const dt = new Date(date);
  dt.setHours(hours, minutes, 0, 0);
  return dt;
}

/**
 * Resolve the time-based status of a booking.
 *
 * Returns the new status if a transition should occur, or `null` if no change.
 * Only transitions:
 *   - `confirmed` → `in_progress` (when now >= startDateTime)
 *   - `in_progress` → `completed` (when now >= endDateTime)
 *
 * Cancelled, completed, pending, and open_match bookings are never auto-transitioned.
 */
export function resolveBookingStatus(
  booking: BookingForResolution,
  now: Date,
): StatusTransition | null {
  const { status } = booking;

  // Only confirmed and in_progress can auto-transition
  if (status !== "confirmed" && status !== "in_progress") {
    return null;
  }

  const startDateTime = buildDateTime(booking.date, booking.startTime);
  const endDateTime = buildDateTime(booking.date, booking.endTime);

  if (status === "confirmed" && now >= startDateTime) {
    // Check if it should jump straight to completed
    if (now >= endDateTime) {
      return {
        bookingId: booking.id,
        oldStatus: "confirmed",
        newStatus: "completed",
        activityType: "completed",
      };
    }
    return {
      bookingId: booking.id,
      oldStatus: "confirmed",
      newStatus: "in_progress",
      activityType: "started",
    };
  }

  if (status === "in_progress" && now >= endDateTime) {
    return {
      bookingId: booking.id,
      oldStatus: "in_progress",
      newStatus: "completed",
      activityType: "completed",
    };
  }

  return null;
}

/**
 * Resolve statuses for a batch of bookings.
 * Returns only the bookings that need transitions.
 */
export function resolveBookingStatuses(
  bookingList: BookingForResolution[],
  now: Date,
): StatusTransition[] {
  const transitions: StatusTransition[] = [];
  for (const booking of bookingList) {
    const transition = resolveBookingStatus(booking, now);
    if (transition) {
      transitions.push(transition);
    }
  }
  return transitions;
}
