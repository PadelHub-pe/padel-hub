import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "~/components/layout/container";
import { Breadcrumbs } from "~/components/seo/breadcrumbs";
import { FacilityGrid } from "~/components/facility/facility-grid";
import { FacilityFilters } from "~/components/facility/facility-filters";
import { FacilityMapWrapper } from "~/components/facility/facility-map-wrapper";
import { StructuredData } from "~/components/seo/structured-data";
import { formatDistrictName } from "~/lib/format";
import { api } from "~/trpc/server";

export const metadata: Metadata = {
  title: "Canchas de Padel en Lima | Directorio Completo",
  description:
    "Encuentra y compara canchas de padel en Lima. Filtra por distrito, tipo de cancha y precio. Miraflores, San Isidro, Surco y mas.",
};

export default async function CanchasPage(props: {
  searchParams: Promise<{
    distrito?: string;
    tipo?: string;
    search?: string;
    pagina?: string;
    orden?: string;
    amenidades?: string;
    servicios?: string;
    vista?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const caller = await api();

  const isMapView = searchParams.vista === "mapa";
  const page = parseInt(searchParams.pagina ?? "1");
  const limit = isMapView ? 50 : 12;
  const offset = (page - 1) * limit;

  // Parse comma-separated params
  const districts = searchParams.distrito
    ? searchParams.distrito.split(",").filter(Boolean)
    : undefined;

  const amenities = searchParams.amenidades
    ? searchParams.amenidades.split(",").filter(Boolean)
    : undefined;

  const coreOfferings = searchParams.servicios
    ? searchParams.servicios.split(",").filter(Boolean)
    : undefined;

  const result = await caller.publicFacility.list({
    districts,
    courtType: searchParams.tipo as "indoor" | "outdoor" | undefined,
    search: searchParams.search,
    amenities,
    coreOfferings,
    limit,
    offset,
  });

  return (
    <>
      <StructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Canchas de Padel en Lima",
          description:
            "Directorio completo de canchas de padel en Lima, Peru",
          numberOfItems: result.total,
          itemListElement: result.facilities.map((facility, index) => ({
            "@type": "ListItem",
            position: index + 1 + offset,
            item: {
              "@type": "SportsActivityLocation",
              name: facility.name,
              address: {
                "@type": "PostalAddress",
                streetAddress: facility.address,
                addressLocality: formatDistrictName(facility.district),
                addressRegion: "Lima",
                addressCountry: "PE",
              },
            },
          })),
        }}
      />

      <Container className="py-8">
        <Breadcrumbs items={[{ name: "Canchas", href: "/canchas" }]} />

        <div className="mb-6">
          <h1 className="mb-1 text-3xl font-bold sm:text-4xl">
            Canchas de Padel en Lima
          </h1>
          <p className="text-muted-foreground text-lg">
            {result.total}{" "}
            {result.total === 1
              ? "cancha encontrada"
              : "canchas encontradas"}
          </p>
        </div>

        <FacilityFilters />

        {result.facilities.length === 0 ? (
          <div className="py-16 text-center">
            <svg
              className="text-muted-foreground/40 mx-auto mb-4 h-16 w-16"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
            <h3 className="mb-2 text-lg font-semibold">
              No encontramos canchas
            </h3>
            <p className="text-muted-foreground mb-4 text-sm">
              Intenta con otros filtros o busca en otro distrito.
            </p>
            <Link
              href="/canchas"
              className="text-primary text-sm font-medium hover:underline"
            >
              Ver todas las canchas
            </Link>
          </div>
        ) : isMapView ? (
          <FacilityMapWrapper
            facilities={result.facilities.map((f) => ({
              ...f,
              imageUrl: (f.photos as string[] | null)?.[0] ?? null,
            }))}
          />
        ) : (
          <FacilityGrid facilities={result.facilities} />
        )}

        {/* Pagination — only for list view */}
        {!isMapView && result.total > limit && (
          <div className="mt-8 flex items-center justify-center gap-2">
            {page > 1 && (
              <a
                href={`/canchas?${buildPageParams(searchParams, page - 1)}`}
                className="bg-muted hover:bg-muted/80 rounded-md px-4 py-2 text-sm transition-colors"
              >
                Anterior
              </a>
            )}
            <span className="text-muted-foreground px-4 text-sm">
              Pagina {page} de {Math.ceil(result.total / limit)}
            </span>
            {result.hasMore && (
              <a
                href={`/canchas?${buildPageParams(searchParams, page + 1)}`}
                className="bg-muted hover:bg-muted/80 rounded-md px-4 py-2 text-sm transition-colors"
              >
                Siguiente
              </a>
            )}
          </div>
        )}
      </Container>
    </>
  );
}

function buildPageParams(
  current: Record<string, string | undefined>,
  page: number,
): string {
  const params = new URLSearchParams();
  if (current.distrito) params.set("distrito", current.distrito);
  if (current.tipo) params.set("tipo", current.tipo);
  if (current.search) params.set("search", current.search);
  if (current.amenidades) params.set("amenidades", current.amenidades);
  if (current.servicios) params.set("servicios", current.servicios);
  if (current.vista) params.set("vista", current.vista);
  if (current.orden) params.set("orden", current.orden);
  if (page > 1) params.set("pagina", String(page));
  return params.toString();
}
