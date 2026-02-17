import { formatDistrictName } from "~/lib/format";

/**
 * JSON-LD structured data component for SEO
 * Renders a <script type="application/ld+json"> tag in the page
 */
export function StructuredData({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/**
 * Organization structured data for PadelHub
 */
export function OrganizationSchema() {
  return (
    <StructuredData
      data={{
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "PadelHub",
        url: "https://padelhub.pe",
        logo: "https://padelhub.pe/logo.png",
        description:
          "Plataforma para descubrir y reservar canchas de padel en Lima, Peru.",
        foundingDate: "2024",
        areaServed: {
          "@type": "GeoCircle",
          geoMidpoint: {
            "@type": "GeoCoordinates",
            latitude: -12.0464,
            longitude: -77.0428,
          },
          geoRadius: "50000",
        },
        sameAs: [
          "https://instagram.com/padelhub_pe",
          "https://facebook.com/padelhub",
          "https://tiktok.com/@padelhub_pe",
        ],
        contactPoint: {
          "@type": "ContactPoint",
          telephone: "+51-999-888-777",
          contactType: "customer service",
          areaServed: "PE",
          availableLanguage: "Spanish",
        },
        address: {
          "@type": "PostalAddress",
          addressLocality: "Lima",
          addressRegion: "Lima",
          addressCountry: "PE",
        },
      }}
    />
  );
}

/**
 * WebSite structured data with search action
 */
export function WebSiteSchema() {
  return (
    <StructuredData
      data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "PadelHub",
        url: "https://padelhub.pe",
        description:
          "Descubre y reserva canchas de padel en Lima, Peru. Compara precios, horarios y encuentra jugadores de tu nivel.",
        inLanguage: "es",
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate:
              "https://padelhub.pe/canchas?search={search_term_string}",
          },
          "query-input": "required name=search_term_string",
        },
      }}
    />
  );
}

/**
 * BreadcrumbList structured data
 */
export function BreadcrumbSchema({
  items,
}: {
  items: { name: string; href: string }[];
}) {
  return (
    <StructuredData
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: `https://padelhub.pe${item.href}`,
        })),
      }}
    />
  );
}

/**
 * SportsActivityLocation structured data for facilities
 * Enhanced with geo, opening hours, ratings, images, and amenities
 */
export function FacilitySchema({
  facility,
}: {
  facility: {
    name: string;
    description: string | null;
    address: string;
    district: string;
    phone: string | null;
    slug: string;
    latitude: string | null;
    longitude: string | null;
    googleMapsUrl: string | null;
    googleRating: string | null;
    googleReviewCount: number | null;
    photos: unknown;
    amenities: unknown;
    courts: { name: string; type: string; priceInCents: number | null }[];
    operatingHours: {
      dayOfWeek: number;
      openTime: string;
      closeTime: string;
      isClosed: boolean;
    }[];
  };
}) {
  const districtDisplay = formatDistrictName(facility.district);
  const minPrice = facility.courts.reduce((min, c) => {
    if (c.priceInCents === null) return min;
    const price = c.priceInCents / 100;
    return price < min ? price : min;
  }, Infinity);

  const photos = facility.photos as string[] | null;
  const amenities = facility.amenities as string[] | null;

  // Map dayOfWeek (0=Sunday) to schema.org day names
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const openingHours = facility.operatingHours
    .filter((h) => !h.isClosed)
    .map((h) => ({
      "@type": "OpeningHoursSpecification" as const,
      dayOfWeek: dayNames[h.dayOfWeek],
      opens: h.openTime,
      closes: h.closeTime,
    }));

  return (
    <StructuredData
      data={{
        "@context": "https://schema.org",
        "@type": "SportsActivityLocation",
        name: facility.name,
        description:
          facility.description ?? `Cancha de padel en ${districtDisplay}, Lima`,
        address: {
          "@type": "PostalAddress",
          streetAddress: facility.address,
          addressLocality: districtDisplay,
          addressRegion: "Lima",
          addressCountry: "PE",
        },
        telephone: facility.phone,
        url: `https://padelhub.pe/canchas/${facility.district}/${facility.slug}`,
        sport: "Padel",
        // Geo coordinates for local search
        ...(facility.latitude &&
          facility.longitude && {
            geo: {
              "@type": "GeoCoordinates",
              latitude: parseFloat(facility.latitude),
              longitude: parseFloat(facility.longitude),
            },
          }),
        // Google Maps link
        ...(facility.googleMapsUrl && {
          hasMap: facility.googleMapsUrl,
        }),
        // Aggregate rating from Google reviews
        ...(facility.googleRating &&
          facility.googleReviewCount && {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: parseFloat(facility.googleRating),
              bestRating: 5,
              reviewCount: facility.googleReviewCount,
            },
          }),
        // Price range
        ...(minPrice !== Infinity && {
          priceRange: `Desde S/ ${minPrice}`,
        }),
        // Facility images
        ...(photos &&
          photos.length > 0 && {
            image: photos,
          }),
        // Opening hours specification
        ...(openingHours.length > 0 && {
          openingHoursSpecification: openingHours,
        }),
        // Amenity features
        ...(amenities &&
          amenities.length > 0 && {
            amenityFeature: amenities.map((a) => ({
              "@type": "LocationFeatureSpecification",
              name: a.replace(/_/g, " "),
              value: true,
            })),
          }),
        // Number of courts
        numberOfRooms: facility.courts.length,
      }}
    />
  );
}

/**
 * FAQPage structured data for pages with Q&A content
 */
export function FAQSchema({
  faqs,
}: {
  faqs: { question: string; answer: string }[];
}) {
  return (
    <StructuredData
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      }}
    />
  );
}
