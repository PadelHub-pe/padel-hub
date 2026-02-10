import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Separator } from "@wifo/ui/separator";

import { Container } from "~/components/layout/container";
import { FacilityGrid } from "~/components/facility/facility-grid";
import { FacilityMapWrapper } from "~/components/facility/facility-map-wrapper";
import { Breadcrumbs } from "~/components/seo/breadcrumbs";
import { StructuredData } from "~/components/seo/structured-data";
import {
  countCourtsByType,
  formatDistrictName,
  formatPricePEN,
} from "~/lib/format";
import { generateDistrictMetadata } from "~/lib/seo";
import { DISTRICT_DESCRIPTIONS, DISTRICT_SLUGS } from "~/lib/constants";
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
    district,
  });

  return generateDistrictMetadata(districtName, facilities.length, district);
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
  const [facilities, allDistricts] = await Promise.all([
    caller.publicFacility.listByDistrict({ district }),
    caller.publicFacility.getDistricts(),
  ]);

  // ── Compute stats ────────────────────────────────────────────────
  const allCourts = facilities.flatMap((f) => f.courts);
  const totalCourts = allCourts.length;
  const { indoor, outdoor } = countCourtsByType(allCourts);
  const allPrices = allCourts
    .map((c) => c.priceInCents)
    .filter((p): p is number => p !== null);
  const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : null;
  const maxPrice = allPrices.length > 0 ? Math.max(...allPrices) : null;

  const hasCoordinates = facilities.some(
    (f) => f.latitude !== null && f.longitude !== null,
  );

  const otherDistricts = allDistricts.filter((d) => d.district !== district);
  const description = DISTRICT_DESCRIPTIONS[district];

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
                addressLocality: formatDistrictName(facility.district),
                addressRegion: "Lima",
                addressCountry: "PE",
              },
              url: `https://padelhub.pe/canchas/${district}/${facility.slug}`,
            },
          })),
        }}
      />

      <Container className="py-8">
        <Breadcrumbs
          items={[
            { name: "Canchas", href: "/canchas" },
            { name: districtName, href: `/canchas/${district}` },
          ]}
        />

        {/* ── Hero ───────────────────────────────────────────────── */}
        <div className="mb-8">
          <h1 className="mb-3 text-3xl font-bold sm:text-4xl">
            Canchas de Padel en {districtName}
          </h1>
          {facilities.length === 0 ? (
            <p className="text-muted-foreground text-lg">
              Aun no tenemos canchas registradas en {districtName}. Vuelve
              pronto.
            </p>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium">
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                  />
                </svg>
                {facilities.length}{" "}
                {facilities.length === 1 ? "club" : "clubes"}
              </span>
              <span className="bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium">
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"
                  />
                </svg>
                {totalCourts}{" "}
                {totalCourts === 1 ? "cancha" : "canchas"}
              </span>
              {minPrice !== null && (
                <span className="bg-secondary/10 text-secondary inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium">
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Desde {formatPricePEN(minPrice)}
                </span>
              )}
            </div>
          )}
          {description && (
            <p className="text-muted-foreground mt-3">{description}</p>
          )}
        </div>

        {facilities.length > 0 ? (
          <>
            {/* ── Stats bar ──────────────────────────────────────── */}
            <div className="bg-muted/50 mb-10 grid grid-cols-2 divide-x rounded-xl sm:grid-cols-4">
              {/* Total courts */}
              <div className="flex items-center gap-3 px-4 py-3 sm:px-5">
                <div className="bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                  <svg
                    className="h-4.5 w-4.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"
                    />
                  </svg>
                </div>
                <div>
                  <div className="text-foreground text-lg font-bold leading-tight">
                    {totalCourts}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {totalCourts === 1 ? "cancha" : "canchas"}
                  </div>
                </div>
              </div>

              {/* Indoor / Outdoor */}
              <div className="flex items-center gap-3 px-4 py-3 sm:px-5">
                <div className="bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                  <svg
                    className="h-4.5 w-4.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
                    />
                  </svg>
                </div>
                <div>
                  <div className="text-foreground text-lg font-bold leading-tight">
                    {indoor + outdoor > 0 ? `${indoor} / ${outdoor}` : "—"}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    indoor / outdoor
                  </div>
                </div>
              </div>

              {/* Price range */}
              <div className="flex items-center gap-3 px-4 py-3 sm:px-5">
                <div className="bg-secondary/10 text-secondary flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                  <svg
                    className="h-4.5 w-4.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <div className="text-foreground text-lg font-bold leading-tight">
                    {minPrice !== null
                      ? maxPrice !== null && maxPrice !== minPrice
                        ? `${formatPricePEN(minPrice)} – ${formatPricePEN(maxPrice)}`
                        : formatPricePEN(minPrice)
                      : "—"}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    rango de precios
                  </div>
                </div>
              </div>

              {/* Facilities count */}
              <div className="flex items-center gap-3 px-4 py-3 sm:px-5">
                <div className="bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                  <svg
                    className="h-4.5 w-4.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                    />
                  </svg>
                </div>
                <div>
                  <div className="text-foreground text-lg font-bold leading-tight">
                    {facilities.length}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {facilities.length === 1 ? "club" : "clubes"}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Facilities grid ────────────────────────────────── */}
            <div className="mb-10">
              <h2 className="mb-4 text-2xl font-semibold">
                Todos los clubes en {districtName}
              </h2>
              <FacilityGrid facilities={facilities} />
            </div>

            {/* ── Map ────────────────────────────────────────────── */}
            {hasCoordinates && (
              <div className="mb-10">
                <h2 className="mb-4 text-2xl font-semibold">
                  Ubicaciones en {districtName}
                </h2>
                <FacilityMapWrapper
                  facilities={facilities.map((f) => ({
                    ...f,
                    imageUrl: (f.photos as string[] | null)?.[0] ?? null,
                  }))}
                />
              </div>
            )}

            {/* ── Other districts ─────────────────────────────────── */}
            {otherDistricts.length > 0 && (
              <>
                <Separator className="mb-8" />
                <div>
                  <h2 className="mb-4 text-2xl font-semibold">
                    Explora otros distritos
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {otherDistricts.map((d) => (
                      <Link
                        key={d.district}
                        href={`/canchas/${d.district}`}
                        className="border-border hover:border-primary/30 hover:bg-primary/5 hover:text-primary inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors"
                      >
                        {formatDistrictName(d.district)}
                        <span className="text-muted-foreground text-xs">
                          ({d.count})
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        ) : (
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
    </>
  );
}
