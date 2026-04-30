import { Buffer } from "node:buffer";
import { timingSafeEqual } from "node:crypto";

/**
 * Constant-time check of an `Authorization: Bearer <secret>` header.
 *
 * Returns false if:
 * - `expected` is missing/empty (treat as misconfiguration → reject)
 * - the header is missing or malformed
 * - the bearer value does not match
 */
export function isCronAuthorized(
  authHeader: string | null | undefined,
  expected: string | undefined,
): boolean {
  if (!expected) return false;
  if (!authHeader?.startsWith("Bearer ")) return false;

  const provided = authHeader.slice("Bearer ".length);
  if (provided.length !== expected.length) return false;

  try {
    return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
  } catch {
    return false;
  }
}
