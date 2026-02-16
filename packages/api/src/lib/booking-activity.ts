import type { db as DbType } from "@wifo/db/client";
import { bookingActivity } from "@wifo/db/schema";

type BookingActivityType =
  | "created"
  | "confirmed"
  | "player_joined"
  | "player_left"
  | "status_changed"
  | "modified"
  | "started"
  | "completed"
  | "cancelled";

interface LogBookingActivityParams {
  db: typeof DbType;
  bookingId: string;
  type: BookingActivityType;
  description: string;
  metadata?: Record<string, unknown>;
  performedBy?: string | null;
}

export async function logBookingActivity({
  db,
  bookingId,
  type,
  description,
  metadata = {},
  performedBy,
}: LogBookingActivityParams) {
  await db.insert(bookingActivity).values({
    bookingId,
    type,
    description,
    metadata,
    performedBy: performedBy ?? null,
  });
}
