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
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: "https://padelhub.pe/canchas?search={search_term_string}",
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
    courts: { name: string; type: string; priceInCents: number | null }[];
  };
}) {
  const districtDisplay = formatDistrictName(facility.district);
  const minPrice = facility.courts.reduce((min, c) => {
    if (c.priceInCents === null) return min;
    const price = c.priceInCents / 100;
    return price < min ? price : min;
  }, Infinity);

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
        ...(minPrice !== Infinity && {
          priceRange: `Desde S/ ${minPrice}`,
        }),
      }}
    />
  );
}
