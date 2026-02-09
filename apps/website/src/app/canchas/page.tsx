import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "~/components/layout/container";
import { SiteHeader } from "~/components/layout/site-header";
import { SiteFooter } from "~/components/layout/site-footer";
import { Breadcrumbs } from "~/components/seo/breadcrumbs";
import { FacilityGrid } from "~/components/facility/facility-grid";
import { FacilityFilters } from "~/components/facility/facility-filters";
import { SortSelect } from "~/components/facility/sort-select";
import { StructuredData } from "~/components/seo/structured-data";
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
  }>;
}) {
  const searchParams = await props.searchParams;
  const caller = await api();

  const page = parseInt(searchParams.pagina ?? "1");
  const limit = 12;
  const offset = (page - 1) * limit;

  // Map distrito slug back to district name for API
  const districtParam = searchParams.distrito;

  const result = await caller.publicFacility.list({
    district: districtParam,
    courtType: searchParams.tipo as "indoor" | "outdoor" | undefined,
    search: searchParams.search,
    limit,
    offset,
  });

  // Collect active filters for display pills
  const activeFilters: { key: string; label: string }[] = [];
  if (searchParams.distrito)
    activeFilters.push({
      key: "distrito",
      label: searchParams.distrito.replace(/-/g, " "),
    });
  if (searchParams.tipo)
    activeFilters.push({
      key: "tipo",
      label: searchParams.tipo === "indoor" ? "Indoor" : "Outdoor",
    });
  if (searchParams.search)
    activeFilters.push({
      key: "search",
      label: `"${searchParams.search}"`,
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
                addressLocality: facility.district,
                addressRegion: "Lima",
                addressCountry: "PE",
              },
            },
          })),
        }}
      />

      <SiteHeader />

      <main className="py-8">
        <Container>
          <Breadcrumbs items={[{ name: "Canchas", href: "/canchas" }]} />

          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
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
            <SortSelect />
          </div>

          <FacilityFilters />

          {/* Active filter pills */}
          {activeFilters.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-2">
              {activeFilters.map((filter) => (
                <span
                  key={filter.key}
                  className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary capitalize"
                >
                  {filter.label}
                </span>
              ))}
            </div>
          )}

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
          ) : (
            <FacilityGrid facilities={result.facilities} />
          )}

          {/* Pagination */}
          {result.total > limit && (
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
      </main>

      <SiteFooter />
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
  if (page > 1) params.set("pagina", String(page));
  return params.toString();
}
