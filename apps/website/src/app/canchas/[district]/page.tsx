import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Container } from "~/components/layout/container";
import { SiteHeader } from "~/components/layout/site-header";
import { SiteFooter } from "~/components/layout/site-footer";
import { Breadcrumbs } from "~/components/seo/breadcrumbs";
import { FacilityGrid } from "~/components/facility/facility-grid";
import { StructuredData } from "~/components/seo/structured-data";
import { formatDistrictName } from "~/lib/format";
import { generateDistrictMetadata } from "~/lib/seo";
import { DISTRICT_SLUGS } from "~/lib/constants";
import { api } from "~/trpc/server";

// Generate static params for all districts
export function generateStaticParams() {
  return Object.values(DISTRICT_SLUGS).map((slug) => ({
    district: slug,
  }));
}

export async function generateMetadata(props: {
  params: Promise<{ district: string }>;
}): Promise<Metadata> {
  const { district } = await props.params;
  const districtName = formatDistrictName(district);

  const caller = await api();
  const facilities = await caller.publicFacility.listByDistrict({
    district: districtName,
  });

  return generateDistrictMetadata(districtName, facilities.length);
}

export default async function DistrictPage(props: {
  params: Promise<{ district: string }>;
}) {
  const { district } = await props.params;
  const districtName = formatDistrictName(district);

  // Validate the district slug exists
  const validSlugs = Object.values(DISTRICT_SLUGS);
  if (!validSlugs.includes(district)) {
    notFound();
  }

  const caller = await api();
  const facilities = await caller.publicFacility.listByDistrict({
    district: districtName,
  });

  return (
    <>
      <StructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: `Canchas de Padel en ${districtName}`,
          description: `Directorio de canchas de padel en ${districtName}, Lima, Peru`,
          numberOfItems: facilities.length,
          itemListElement: facilities.map((facility, index) => ({
            "@type": "ListItem",
            position: index + 1,
            item: {
              "@type": "SportsActivityLocation",
              name: facility.name,
              address: {
                "@type": "PostalAddress",
                streetAddress: facility.address,
                addressLocality: facility.district,
                addressRegion: "Lima",
                addressCountry: "PE",
              },
              url: `https://padelhub.pe/canchas/${district}/${facility.slug}`,
            },
          })),
        }}
      />

      <SiteHeader />

      <main className="py-8">
        <Container>
          <Breadcrumbs
            items={[
              { name: "Canchas", href: "/canchas" },
              { name: districtName, href: `/canchas/${district}` },
            ]}
          />

          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold sm:text-4xl">
              Canchas de Padel en {districtName}
            </h1>
            <p className="text-muted-foreground text-lg">
              {facilities.length === 0
                ? `Aun no tenemos canchas registradas en ${districtName}. Vuelve pronto.`
                : `${facilities.length} ${facilities.length === 1 ? "cancha disponible" : "canchas disponibles"} en ${districtName}, Lima`}
            </p>
          </div>

          <FacilityGrid facilities={facilities} />

          {facilities.length === 0 && (
            <div className="mt-8 text-center">
              <p className="text-muted-foreground mb-4">
                Conoces una cancha en {districtName}?
              </p>
              <a
                href="/para-propietarios"
                className="text-primary font-medium underline underline-offset-4"
              >
                Registra tu cancha gratis
              </a>
            </div>
          )}
        </Container>
      </main>

      <SiteFooter />
    </>
  );
}
