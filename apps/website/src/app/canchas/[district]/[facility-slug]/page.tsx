import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@wifo/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@wifo/ui/card";
import { Separator } from "@wifo/ui/separator";

import { Container } from "~/components/layout/container";
import { SiteHeader } from "~/components/layout/site-header";
import { SiteFooter } from "~/components/layout/site-footer";
import { Breadcrumbs } from "~/components/seo/breadcrumbs";
import { FacilitySchema } from "~/components/seo/structured-data";
import { CourtTypeBadge } from "~/components/facility/court-type-badge";
import { PriceRange } from "~/components/facility/price-display";
import { AmenitiesList } from "~/components/facility/amenities-list";
import { OperatingHours } from "~/components/facility/operating-hours";
import { ShareButton } from "~/components/facility/share-button";
import { StickyBookingBar } from "~/components/facility/sticky-booking-bar";
import { FacilityGrid } from "~/components/facility/facility-grid";
import {
  formatDistrictName,
  formatPricePEN,
  getMinPrice,
} from "~/lib/format";
import { generateFacilityMetadata } from "~/lib/seo";
import { APP_STORE_URL, GOOGLE_PLAY_URL, SITE_URL } from "~/lib/constants";
import { api } from "~/trpc/server";

export async function generateMetadata(props: {
  params: Promise<{ district: string; "facility-slug": string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const districtName = formatDistrictName(params.district);

  const caller = await api();
  const facility = await caller.publicFacility.getBySlug({
    district: districtName,
    slug: params["facility-slug"],
  });

  if (!facility) {
    return { title: "Cancha no encontrada" };
  }

  return generateFacilityMetadata(facility);
}

export default async function FacilityDetailPage(props: {
  params: Promise<{ district: string; "facility-slug": string }>;
}) {
  const params = await props.params;
  const districtName = formatDistrictName(params.district);

  const caller = await api();
  const facility = await caller.publicFacility.getBySlug({
    district: districtName,
    slug: params["facility-slug"],
  });

  if (!facility) {
    notFound();
  }

  // Fetch nearby courts in the same district
  const nearby = await caller.publicFacility.listByDistrict({
    district: districtName,
  });
  const nearbyCourts = nearby
    .filter((f) => f.slug !== facility.slug)
    .slice(0, 3);

  const minPrice = getMinPrice(facility.courts);
  const priceLabel = minPrice ? `Desde ${formatPricePEN(minPrice)}` : null;
  const facilityUrl = `${SITE_URL}/canchas/${params.district}/${facility.slug}`;

  return (
    <>
      <FacilitySchema facility={facility} />

      <SiteHeader />

      <main className="pb-24 pt-8 md:pb-8">
        <Container>
          <Breadcrumbs
            items={[
              { name: "Canchas", href: "/canchas" },
              { name: districtName, href: `/canchas/${params.district}` },
              {
                name: facility.name,
                href: `/canchas/${params.district}/${facility.slug}`,
              },
            ]}
          />

          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold sm:text-4xl">
                {facility.name}
              </h1>
              <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span className="inline-flex items-center gap-1">
                  <svg
                    className="h-3.5 w-3.5"
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
                  {facility.district}, Lima
                </span>
                <span>&middot;</span>
                <span>{facility.address}</span>
                {facility.phone && (
                  <>
                    <span>&middot;</span>
                    <a
                      href={`tel:${facility.phone}`}
                      className="text-primary hover:underline"
                    >
                      {facility.phone}
                    </a>
                  </>
                )}
              </div>
              <div className="mt-2">
                <PriceRange courts={facility.courts} className="text-lg" />
              </div>
            </div>
            <ShareButton title={facility.name} url={facilityUrl} />
          </div>

          {/* Photo Gallery Placeholder */}
          <div className="bg-muted mb-8 flex aspect-[2/1] items-center justify-center rounded-xl">
            <div className="text-center">
              <svg
                className="text-muted-foreground/40 mx-auto mb-2 h-16 w-16"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
                />
              </svg>
              <p className="text-muted-foreground text-sm">
                Fotos proximamente
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Main Content */}
            <div className="space-y-8 lg:col-span-2">
              {/* Description */}
              {facility.description && (
                <div>
                  <h2 className="mb-3 text-xl font-semibold">
                    Acerca del Club
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {facility.description}
                  </p>
                </div>
              )}

              <Separator />

              {/* Courts */}
              <div>
                <h2 className="mb-4 text-xl font-semibold">
                  Canchas ({facility.courts.length})
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {facility.courts.map((court) => (
                    <Card key={court.id}>
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium">{court.name}</p>
                            <CourtTypeBadge type={court.type} />
                          </div>
                        </div>
                        {court.priceInCents && (
                          <span className="text-secondary text-lg font-bold">
                            {formatPricePEN(court.priceInCents)}
                          </span>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Amenities */}
              {facility.amenities && facility.amenities.length > 0 && (
                <div>
                  <h2 className="mb-4 text-xl font-semibold">Amenidades</h2>
                  <AmenitiesList amenities={facility.amenities} />
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Booking CTA */}
              <Card>
                <CardHeader>
                  <CardTitle>Reservar Cancha</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-muted-foreground text-sm">
                    Proximamente podras reservar directamente desde la web.
                    Descarga la app para reservar ahora.
                  </p>
                  <Button className="w-full" size="lg" asChild>
                    <a
                      href={APP_STORE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Descargar App
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    size="lg"
                    asChild
                  >
                    <a
                      href={GOOGLE_PLAY_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Google Play
                    </a>
                  </Button>
                  {facility.phone && (
                    <Button variant="ghost" className="w-full" asChild>
                      <a href={`tel:${facility.phone}`}>
                        Llamar: {facility.phone}
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Operating Hours */}
              {facility.operatingHours.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Horarios</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <OperatingHours hours={facility.operatingHours} />
                  </CardContent>
                </Card>
              )}

              {/* Location */}
              <Card>
                <CardHeader>
                  <CardTitle>Ubicacion</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-2 text-sm">
                    {facility.address}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {facility.district}, Lima
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Nearby Courts Section */}
          {nearbyCourts.length > 0 && (
            <>
              <Separator className="my-12" />
              <div>
                <div className="mb-6 flex items-end justify-between">
                  <div>
                    <h2 className="mb-1 text-2xl font-bold">
                      Mas canchas en {districtName}
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      Otras opciones cerca de ti
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/canchas/${params.district}`}>Ver todas</Link>
                  </Button>
                </div>
                <FacilityGrid facilities={nearbyCourts} />
              </div>
            </>
          )}

          {nearbyCourts.length === 0 && (
            <>
              <Separator className="my-12" />
              <div className="text-center">
                <p className="text-muted-foreground mb-3 text-sm">
                  Explora mas canchas en {districtName}
                </p>
                <Button variant="outline" asChild>
                  <Link href={`/canchas/${params.district}`}>
                    Ver canchas en {districtName}
                  </Link>
                </Button>
              </div>
            </>
          )}
        </Container>
      </main>

      {/* Mobile sticky booking bar */}
      <StickyBookingBar
        facilityName={facility.name}
        priceLabel={priceLabel}
        phone={facility.phone}
      />

      <SiteFooter />
    </>
  );
}
