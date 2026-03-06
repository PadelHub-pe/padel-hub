import type { db as DbType } from "@wifo/db/client";
import { operatingHours } from "@wifo/db/schema";

/**
 * Insert default operating hours (Mon-Sun 07:00-22:00) for a new facility.
 * Works with both a regular db instance and a transaction handle.
 */
export async function insertDefaultOperatingHours(
  db: Pick<typeof DbType, "insert">,
  facilityId: string,
) {
  const rows = Array.from({ length: 7 }, (_, dayOfWeek) => ({
    facilityId,
    dayOfWeek,
    openTime: "07:00",
    closeTime: "22:00",
    isClosed: false,
  }));

  await db.insert(operatingHours).values(rows);
}
