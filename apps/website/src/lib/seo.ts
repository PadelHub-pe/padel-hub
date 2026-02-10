import type { Metadata } from "next";

import { formatDistrictName } from "~/lib/format";

const BASE_URL = "https://padelhub.pe";

/**
 * Generate metadata for district pages
 */
export function generateDistrictMetadata(
  districtName: string,
  facilityCount: number,
  districtSlug?: string,
): Metadata {
  const slug =
    districtSlug ?? districtName.toLowerCase().replace(/\s+/g, "-");
  return {
    title: `Canchas de Padel en ${districtName} | Precios y Horarios`,
    description: `Encuentra las mejores canchas de padel en ${districtName}, Lima. ${facilityCount} canchas disponibles. Compara precios y horarios. Reserva al instante.`,
    openGraph: {
      title: `Canchas de Padel en ${districtName} | PadelHub`,
      description: `Encuentra ${facilityCount} canchas de padel en ${districtName}, Lima. Compara precios y reserva.`,
      url: `${BASE_URL}/canchas/${slug}`,
    },
  };
}

/**
 * Generate metadata for facility detail pages
 */
export function generateFacilityMetadata(facility: {
  name: string;
  description: string | null;
  district: string;
  slug: string;
  courts: { priceInCents: number | null }[];
}): Metadata {
  const prices = facility.courts
    .map((c) => c.priceInCents)
    .filter((p): p is number => p !== null);
  const minPrice = prices.length > 0 ? Math.min(...prices) / 100 : null;

  const districtDisplay = formatDistrictName(facility.district);
  const courtCount = facility.courts.length;

  const description =
    facility.description ??
    `${facility.name} en ${districtDisplay}. ${courtCount} ${courtCount === 1 ? "cancha" : "canchas"}${minPrice ? `, desde S/ ${minPrice}` : ""}. Reserva ahora.`;

  return {
    title: `${facility.name} - Cancha de Padel en ${districtDisplay}`,
    description,
    openGraph: {
      title: `${facility.name} | PadelHub`,
      description,
      url: `${BASE_URL}/canchas/${facility.district}/${facility.slug}`,
    },
  };
}
