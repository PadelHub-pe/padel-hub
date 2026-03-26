import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";

import { getImageUrl } from "@wifo/images/url";

import { api, HydrateClient, prefetch, trpc } from "~/trpc/server";
import { FacilityLanding } from "./_components/facility-landing";
import { FacilityLandingSkeleton } from "./_components/facility-landing-skeleton";

interface PageProps {
  params: Promise<{ facilitySlug: string }>;
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

export default async function FacilityPage({ params }: PageProps) {
  const { facilitySlug } = await params;

  // Validate facility exists before rendering
  try {
    const caller = await api();
    await caller.publicBooking.getFacility({ slug: facilitySlug });
  } catch {
    notFound();
  }

  // Prefetch for client component hydration
  prefetch(trpc.publicBooking.getFacility.queryOptions({ slug: facilitySlug }));

  return (
    <HydrateClient>
      <Suspense fallback={<FacilityLandingSkeleton />}>
        <FacilityLanding facilitySlug={facilitySlug} />
      </Suspense>
    </HydrateClient>
  );
}
