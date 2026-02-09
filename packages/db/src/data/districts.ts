/**
 * District name mapping system
 *
 * The research JSON uses official district names (e.g. "Santiago de Surco")
 * The DB and website use short display names (e.g. "Surco")
 *
 * This module provides the canonical mapping between the two.
 */

export const DISTRICTS = {
  MIRAFLORES: {
    key: "MIRAFLORES",
    short: "Miraflores",
    official: "Miraflores",
    slug: "miraflores",
  },
  SAN_ISIDRO: {
    key: "SAN_ISIDRO",
    short: "San Isidro",
    official: "San Isidro",
    slug: "san-isidro",
  },
  SANTIAGO_DE_SURCO: {
    key: "SANTIAGO_DE_SURCO",
    short: "Surco",
    official: "Santiago de Surco",
    slug: "surco",
  },
  LA_MOLINA: {
    key: "LA_MOLINA",
    short: "La Molina",
    official: "La Molina",
    slug: "la-molina",
  },
  SAN_BORJA: {
    key: "SAN_BORJA",
    short: "San Borja",
    official: "San Borja",
    slug: "san-borja",
  },
  SURQUILLO: {
    key: "SURQUILLO",
    short: "Surquillo",
    official: "Surquillo",
    slug: "surquillo",
  },
  CHORRILLOS: {
    key: "CHORRILLOS",
    short: "Chorrillos",
    official: "Chorrillos",
    slug: "chorrillos",
  },
  SAN_MIGUEL: {
    key: "SAN_MIGUEL",
    short: "San Miguel",
    official: "San Miguel",
    slug: "san-miguel",
  },
  BARRANCO: {
    key: "BARRANCO",
    short: "Barranco",
    official: "Barranco",
    slug: "barranco",
  },
  PUEBLO_LIBRE: {
    key: "PUEBLO_LIBRE",
    short: "Pueblo Libre",
    official: "Pueblo Libre",
    slug: "pueblo-libre",
  },
  JESUS_MARIA: {
    key: "JESUS_MARIA",
    short: "Jesús María",
    official: "Jesús María",
    slug: "jesus-maria",
  },
  MAGDALENA: {
    key: "MAGDALENA",
    short: "Magdalena",
    official: "Magdalena del Mar",
    slug: "magdalena",
  },
} as const;

export type DistrictKey = keyof typeof DISTRICTS;

type DistrictEntry = (typeof DISTRICTS)[DistrictKey];

/** Lookup by official name → district entry */
const officialNameIndex = new Map<string, DistrictEntry>(
  Object.values(DISTRICTS).map((d) => [d.official, d]),
);

/** Lookup by slug → district entry */
const slugIndex = new Map<string, DistrictEntry>(
  Object.values(DISTRICTS).map((d) => [d.slug, d]),
);

/**
 * Convert an official district name (from research JSON) to the short display name stored in DB.
 * e.g. "Santiago de Surco" → "Surco"
 */
export function normalizeDistrict(officialName: string): string {
  return officialNameIndex.get(officialName)?.short ?? officialName;
}

/**
 * Get full district info from official name.
 */
export function districtFromOfficial(officialName: string) {
  return officialNameIndex.get(officialName);
}

/**
 * Get full district info from URL slug.
 */
export function districtFromSlug(slug: string) {
  return slugIndex.get(slug);
}
