import type { Metadata } from "next";

const BASE_URL = "https://padelhub.pe";

/**
 * Generate metadata for district pages
 */
export function generateDistrictMetadata(
  district: string,
  facilityCount: number,
): Metadata {
  return {
    title: `Canchas de Padel en ${district} | Precios y Horarios`,
    description: `Encuentra las mejores canchas de padel en ${district}, Lima. ${facilityCount} canchas disponibles. Compara precios y horarios. Reserva al instante.`,
    openGraph: {
      title: `Canchas de Padel en ${district} | PadelHub`,
      description: `Encuentra ${facilityCount} canchas de padel en ${district}, Lima. Compara precios y reserva.`,
      url: `${BASE_URL}/canchas/${district.toLowerCase().replace(/\s+/g, "-")}`,
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

  const districtSlug = facility.district.toLowerCase().replace(/\s+/g, "-");
  const courtCount = facility.courts.length;

  const description =
    facility.description ??
    `${facility.name} en ${facility.district}. ${courtCount} ${courtCount === 1 ? "cancha" : "canchas"}${minPrice ? `, desde S/ ${minPrice}` : ""}. Reserva ahora.`;

  return {
    title: `${facility.name} - Cancha de Padel en ${facility.district}`,
    description,
    openGraph: {
      title: `${facility.name} | PadelHub`,
      description,
      url: `${BASE_URL}/canchas/${districtSlug}/${facility.slug}`,
    },
  };
}
