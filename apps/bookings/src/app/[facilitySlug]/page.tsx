import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";

import { parseLimaDateParam, startOfLimaDay } from "@wifo/api/datetime";
import { getImageUrl } from "@wifo/images/url";

import { api, HydrateClient, prefetch, trpc } from "~/trpc/server";
import { FacilityLanding } from "./_components/facility-landing";
import { FacilityLandingSkeleton } from "./_components/facility-landing-skeleton";

interface PageProps {
  params: Promise<{ facilitySlug: string }>;
  searchParams: Promise<{ date?: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { facilitySlug } = await params;

  try {
    const caller = await api();
    const facility = await caller.publicBooking.getFacility({
      slug: facilitySlug,
    });

    const photos = facility.photos ?? [];
    const ogImage =
      photos[0] != null ? getImageUrl(photos[0], "og") : undefined;

    return {
      title: `Reserva en ${facility.name} | PadelHub`,
      description: `Reserva tu cancha de pádel online en ${facility.name}, ${facility.district}. Disponibilidad en tiempo real.`,
      openGraph: {
        title: `Reserva en ${facility.name} | PadelHub`,
        description: `Reserva tu cancha de pádel online en ${facility.name}, ${facility.district}`,
        type: "website",
        ...(ogImage
          ? { images: [{ url: ogImage, width: 1200, height: 630 }] }
          : {}),
      },
    };
  } catch {
    return {
      title: "Local no encontrado | PadelHub",
    };
  }
}

export default async function FacilityPage({
  params,
  searchParams,
}: PageProps) {
  const { facilitySlug } = await params;
  const { date: dateParam } = await searchParams;

  // Validate facility exists before rendering
  try {
    const caller = await api();
    await caller.publicBooking.getFacility({ slug: facilitySlug });
  } catch {
    notFound();
  }

  // Parse initial date from search params (supports redirects from /book?date=...)
  // Always Lima-zoned so the same instant is produced on server and client.
  const initialDate =
    dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
      ? parseLimaDateParam(dateParam)
      : startOfLimaDay(new Date());

  // Prefetch for client component hydration
  prefetch(trpc.publicBooking.getFacility.queryOptions({ slug: facilitySlug }));
  prefetch(
    trpc.publicBooking.getAvailableSlots.queryOptions({
      slug: facilitySlug,
      date: initialDate,
    }),
  );

  return (
    <HydrateClient>
      <Suspense fallback={<FacilityLandingSkeleton />}>
        <FacilityLanding
          facilitySlug={facilitySlug}
          initialDate={initialDate}
        />
      </Suspense>
    </HydrateClient>
  );
}
