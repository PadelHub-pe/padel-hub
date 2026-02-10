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
  priceRange?: { min: number; max: number } | null,
): Metadata {
  const slug =
    districtSlug ?? districtName.toLowerCase().replace(/\s+/g, "-");

  const priceText =
    priceRange && priceRange.min > 0
      ? ` Precios desde S/ ${priceRange.min / 100}.`
      : "";

  return {
    title: `Canchas de Padel en ${districtName} | Precios y Horarios`,
    description: `Encuentra las mejores canchas de padel en ${districtName}, Lima. ${facilityCount} canchas disponibles.${priceText} Compara precios y horarios. Reserva al instante.`,
    alternates: {
      canonical: `/canchas/${slug}`,
    },
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
  photos: unknown;
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

  const photos = facility.photos as string[] | null;
  const ogImages =
    photos && photos.length > 0
      ? photos.slice(0, 3).map((url) => ({
          url,
          width: 1200,
          height: 630,
          alt: `${facility.name} - Cancha de padel en ${districtDisplay}`,
        }))
      : undefined;

  return {
    title: `${facility.name} - Cancha de Padel en ${districtDisplay}`,
    description,
    alternates: {
      canonical: `/canchas/${facility.district}/${facility.slug}`,
    },
    openGraph: {
      title: `${facility.name} | PadelHub`,
      description,
      url: `${BASE_URL}/canchas/${facility.district}/${facility.slug}`,
      ...(ogImages && { images: ogImages }),
    },
    twitter: {
      card: "summary_large_image",
      title: `${facility.name} - Padel en ${districtDisplay}`,
      description,
      ...(ogImages && ogImages[0] && { images: [ogImages[0].url] }),
    },
  };
}
