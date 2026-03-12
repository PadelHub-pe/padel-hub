import { and, eq } from "drizzle-orm";

import type { db as DbType } from "@wifo/db/client";
import { facilities, organizations } from "@wifo/db/schema";

/**
 * Convert a string to a URL-friendly slug.
 * - Lowercases
 * - Strips accents (NFD normalize + remove combining marks)
 * - Replaces non-alphanumeric chars with hyphens
 * - Collapses consecutive hyphens
 * - Trims leading/trailing hyphens
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const MAX_SLUG_ATTEMPTS = 100;

/**
 * Generate a unique facility slug within an organization.
 * If "trigal-padel" is taken, tries "trigal-padel-2", "trigal-padel-3", etc.
 */
export async function generateUniqueFacilitySlug(
  db: Pick<typeof DbType, "query">,
  organizationId: string,
  name: string,
): Promise<string> {
  const base = slugify(name);

  for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const existing = await db.query.facilities.findFirst({
      where: and(
        eq(facilities.organizationId, organizationId),
        eq(facilities.slug, candidate),
      ),
      columns: { id: true },
    });
    if (!existing) {
      return candidate;
    }
  }

  throw new Error("No se pudo generar un slug único para el local");
}

/**
 * Generate a unique organization slug.
 * If "padel-group" is taken, tries "padel-group-2", "padel-group-3", etc.
 */
export async function generateUniqueOrgSlug(
  db: Pick<typeof DbType, "query">,
  name: string,
): Promise<string> {
  const base = slugify(name);

  for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const existing = await db.query.organizations.findFirst({
      where: eq(organizations.slug, candidate),
      columns: { id: true },
    });
    if (!existing) {
      return candidate;
    }
  }

  throw new Error("No se pudo generar un slug único para la organización");
}
