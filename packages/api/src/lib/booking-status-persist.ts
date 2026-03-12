import { inArray } from "drizzle-orm";

import type { db as DbType } from "@wifo/db/client";
import { bookings } from "@wifo/db/schema";

import type { BookingForResolution } from "../utils/booking-status";
import { resolveBookingStatuses } from "../utils/booking-status";
import { logBookingActivity } from "./booking-activity";

/**
 * Resolve time-based status transitions for a list of bookings,
 * persist changes to the DB, and log activity entries.
 *
 * Returns a map of bookingId → newStatus so callers can update
 * their in-memory objects without re-fetching.
 */
export async function resolveAndPersistBookingStatuses(
  db: typeof DbType,
  bookingList: BookingForResolution[],
  now: Date,
): Promise<Map<string, "in_progress" | "completed">> {
  const transitions = resolveBookingStatuses(bookingList, now);

  if (transitions.length === 0) {
    return new Map();
  }

  // Batch update: group by new status to minimize queries
  const toInProgress = transitions.filter((t) => t.newStatus === "in_progress");
  const toCompleted = transitions.filter((t) => t.newStatus === "completed");

  if (toInProgress.length > 0) {
    await db
      .update(bookings)
      .set({ status: "in_progress" })
      .where(
        inArray(
          bookings.id,
          toInProgress.map((t) => t.bookingId),
        ),
      );
  }

  if (toCompleted.length > 0) {
    await db
      .update(bookings)
      .set({ status: "completed" })
      .where(
        inArray(
          bookings.id,
          toCompleted.map((t) => t.bookingId),
        ),
      );
  }

  // Log activity entries for each transition
  await Promise.all(
    transitions.map((t) =>
      logBookingActivity({
        db,
        bookingId: t.bookingId,
        type: t.activityType,
        description:
          t.activityType === "started"
            ? "Reserva iniciada automáticamente"
            : "Reserva completada automáticamente",
        metadata: {
          oldStatus: t.oldStatus,
          newStatus: t.newStatus,
          autoTransition: true,
        },
      }),
    ),
  );

  // Return map for in-memory updates
  const statusMap = new Map<string, "in_progress" | "completed">();
  for (const t of transitions) {
    statusMap.set(t.bookingId, t.newStatus);
  }
  return statusMap;
}

/**
 * Resolve and persist status for a single booking.
 * Convenience wrapper for getById use case.
 */
export async function resolveAndPersistSingleBookingStatus(
  db: typeof DbType,
  booking: BookingForResolution,
  now: Date,
): Promise<"in_progress" | "completed" | null> {
  const statusMap = await resolveAndPersistBookingStatuses(db, [booking], now);
  return statusMap.get(booking.id) ?? null;
}
