import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@wifo/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@wifo/ui/card";
import { Separator } from "@wifo/ui/separator";

import { AmenitiesList } from "~/components/facility/amenities-list";
import { CourtTypeBadge } from "~/components/facility/court-type-badge";
import { FacilityGrid } from "~/components/facility/facility-grid";
import { FacilityMapWrapper } from "~/components/facility/facility-map-wrapper";
import { OperatingHours } from "~/components/facility/operating-hours";
import { PriceRange } from "~/components/facility/price-display";
import { ShareButton } from "~/components/facility/share-button";
import { StickyBookingBar } from "~/components/facility/sticky-booking-bar";
import { Container } from "~/components/layout/container";
import { Breadcrumbs } from "~/components/seo/breadcrumbs";
import { FacilitySchema } from "~/components/seo/structured-data";
import { SITE_URL } from "~/lib/constants";
import { formatDistrictName, formatPricePEN, getMinPrice } from "~/lib/format";
import { generateFacilityMetadata } from "~/lib/seo";
import { api } from "~/trpc/server";

export async function generateMetadata(props: {
  params: Promise<{ district: string; "facility-slug": string }>;
}): Promise<Metadata> {
  const params = await props.params;

  const caller = await api();
  const facility = await caller.publicFacility.getBySlug({
    district: params.district,
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
    district: params.district,
    slug: params["facility-slug"],
  });

  if (!facility) {
    notFound();
  }

  // Fetch nearby courts in the same district
  const nearby = await caller.publicFacility.listByDistrict({
    district: params.district,
  });
  const nearbyCourts = nearby
    .filter((f) => f.slug !== facility.slug)
    .slice(0, 3);

  const minPrice = getMinPrice(facility.courts);
  const priceLabel = minPrice ? `Desde ${formatPricePEN(minPrice)}` : null;
  const facilityUrl = `${SITE_URL}/canchas/${params.district}/${facility.slug}`;

  const hasCoordinates =
    facility.latitude !== null && facility.longitude !== null;

  const socialMedia = facility.socialMedia as {
    instagram?: string | null;
    facebook?: string | null;
    tiktok?: string | null;
    youtube?: string | null;
  } | null;

  const hasSocials =
    socialMedia &&
    (socialMedia.instagram ||
      socialMedia.facebook ||
      socialMedia.tiktok ||
      socialMedia.youtube);

  const coreOfferings = facility.coreOfferings as string[] | null;

  return (
    <>
      <FacilitySchema facility={facility} />

      <Container className="pt-8 pb-24 md:pb-8">
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

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="mb-8 flex flex-col gap-4 pt-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold sm:text-4xl">
                {facility.name}
              </h1>
              {facility.googleRating && (
                <div className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-sm font-medium text-amber-700">
                  <svg
                    className="h-4 w-4 fill-amber-400 stroke-amber-400"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                    />
                  </svg>
                  {facility.googleRating}
                  {facility.googleReviewCount && (
                    <span className="text-xs text-amber-600">
                      ({facility.googleReviewCount})
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Meta line: location, address, phone */}
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
                {formatDistrictName(facility.district)}, Lima
              </span>
              <span>&middot;</span>
              <span>{facility.address}</span>
              {facility.foundedYear && (
                <>
                  <span>&middot;</span>
                  <span>Desde {facility.foundedYear}</span>
                </>
              )}
            </div>

            {/* Quick action badges */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <PriceRange courts={facility.courts} className="text-lg" />
              {facility.phone && (
                <a
                  href={`tel:${facility.phone}`}
                  className="text-muted-foreground hover:text-primary inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors"
                >
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
                      d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
                    />
                  </svg>
                  {facility.phone}
                </a>
              )}
              {facility.whatsappPhone && (
                <a
                  href={`https://wa.me/${facility.whatsappPhone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-sm font-medium text-green-700 transition-colors hover:bg-green-100"
                >
                  <svg
                    className="h-3.5 w-3.5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.553 4.121 1.52 5.86L0 24l6.335-1.652A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75c-1.876 0-3.651-.508-5.18-1.396l-.37-.22-3.834 1.006 1.022-3.735-.242-.385A9.709 9.709 0 012.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75z" />
                  </svg>
                  WhatsApp
                </a>
              )}
              {facility.website && (
                <a
                  href={facility.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors"
                >
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
                      d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
                    />
                  </svg>
                  Web
                </a>
              )}
              {facility.googleMapsUrl && (
                <a
                  href={facility.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors"
                >
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
                      d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z"
                    />
                  </svg>
                  Google Maps
                </a>
              )}
            </div>
          </div>
          <ShareButton title={facility.name} url={facilityUrl} />
        </div>

        {/* ── Main content grid ──────────────────────────────── */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-8 lg:col-span-2">
            {/* Photo Gallery Placeholder */}

            {facility.photos && facility.photos.length > 0 ? (
              <div className="bg-muted relative aspect-[16/10] overflow-hidden rounded-xl">
                <div className="bg-muted flex h-full items-center justify-center">
                  <Image
                    key={facility.photos[0]}
                    src={facility.photos[0] || ""}
                    alt="Cancha de padel en Lima"
                    fill
                    className={`object-cover transition-opacity duration-700 ease-in-out`}
                    quality={85}
                  />
                </div>{" "}
              </div>
            ) : (
              <div className="bg-muted flex aspect-[2/1] items-center justify-center rounded-xl">
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
            )}

            {/* Description */}
            {facility.description && (
              <div>
                <h2 className="mb-3 text-xl font-semibold">Acerca del Club</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {facility.description}
                </p>
              </div>
            )}

            {/* Core Offerings */}
            {coreOfferings && coreOfferings.length > 0 && (
              <>
                <Separator />
                <div>
                  <h2 className="mb-4 text-xl font-semibold">Servicios</h2>
                  <div className="flex flex-wrap gap-2">
                    {coreOfferings.map((offering) => (
                      <span
                        key={offering}
                        className="bg-primary/5 text-primary border-primary/10 inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-medium"
                      >
                        {offering}
                      </span>
                    ))}
                  </div>
                </div>
              </>
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

            {/* Location Card + Map */}
            <Separator />
            <div>
              <h2 className="mb-4 text-xl font-semibold">Ubicacion</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <svg
                    className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0"
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
                  <div>
                    <p className="text-sm">{facility.address}</p>
                    <p className="text-muted-foreground text-sm">
                      {formatDistrictName(facility.district)}, Lima
                    </p>
                  </div>
                </div>
                {facility.googleMapsUrl && (
                  <a
                    href={facility.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                      />
                    </svg>
                    Abrir en Google Maps
                  </a>
                )}
                {hasCoordinates && (
                  <div className="aspect-[16/9] overflow-hidden rounded-lg">
                    <FacilityMapWrapper
                      facilities={[
                        {
                          name: facility.name,
                          slug: facility.slug,
                          district: facility.district,
                          address: facility.address,
                          latitude: facility.latitude,
                          longitude: facility.longitude,
                          imageUrl:
                            (facility.photos as string[] | null)?.[0] ?? null,
                          courts: facility.courts.map((c) => ({
                            id: c.id,
                            name: c.name,
                            type: c.type,
                            priceInCents: c.priceInCents,
                          })),
                        },
                      ]}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Sidebar ──────────────────────────────────────── */}
          <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            {/* Booking CTA */}
            <Card>
              <CardHeader>
                <CardTitle>Reservar Cancha</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {facility.bookingUrl ? (
                  <>
                    <p className="text-muted-foreground text-sm">
                      Reserva directamente en{" "}
                      {facility.bookingPlatform ?? "su plataforma"}.
                    </p>
                    <Button className="w-full" size="lg" asChild>
                      <a
                        href={facility.bookingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Reservar Ahora
                      </a>
                    </Button>
                  </>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Contacta al club directamente para reservar.
                  </p>
                )}
                {facility.whatsappPhone && (
                  <Button
                    variant="outline"
                    className="w-full gap-2 border-green-200 text-green-700 hover:bg-green-50"
                    size="lg"
                    asChild
                  >
                    <a
                      href={`https://wa.me/${facility.whatsappPhone.replace(/\D/g, "")}?text=Hola, me gustaria reservar una cancha en ${facility.name}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <svg
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.553 4.121 1.52 5.86L0 24l6.335-1.652A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75c-1.876 0-3.651-.508-5.18-1.396l-.37-.22-3.834 1.006 1.022-3.735-.242-.385A9.709 9.709 0 012.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75z" />
                      </svg>
                      WhatsApp
                    </a>
                  </Button>
                )}
                {facility.phone && (
                  <Button variant="ghost" className="w-full gap-2" asChild>
                    <a href={`tel:${facility.phone}`}>
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
                        />
                      </svg>
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

            {/* Social Media */}
            {hasSocials && (
              <Card>
                <CardHeader>
                  <CardTitle>Redes Sociales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {socialMedia.instagram && (
                      <a
                        href={socialMedia.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary hover:border-primary/30 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors"
                      >
                        <svg
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                        </svg>
                        Instagram
                      </a>
                    )}
                    {socialMedia.facebook && (
                      <a
                        href={socialMedia.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary hover:border-primary/30 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors"
                      >
                        <svg
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                        Facebook
                      </a>
                    )}
                    {socialMedia.tiktok && (
                      <a
                        href={socialMedia.tiktok}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary hover:border-primary/30 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors"
                      >
                        <svg
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                        </svg>
                        TikTok
                      </a>
                    )}
                    {socialMedia.youtube && (
                      <a
                        href={socialMedia.youtube}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary hover:border-primary/30 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors"
                      >
                        <svg
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                        </svg>
                        YouTube
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* ── Nearby Courts Section ──────────────────────────── */}
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

      {/* Mobile sticky booking bar */}
      <StickyBookingBar
        facilityName={facility.name}
        priceLabel={priceLabel}
        phone={facility.phone}
        whatsappPhone={facility.whatsappPhone}
        bookingUrl={facility.bookingUrl}
      />
    </>
  );
}
