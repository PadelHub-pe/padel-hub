import { Suspense } from "react";
import { notFound } from "next/navigation";

import { api, HydrateClient, prefetch, trpc } from "~/trpc/server";
import { MisReservasPage } from "./_components/mis-reservas-page";
import { MisReservasSkeleton } from "./_components/mis-reservas-skeleton";

interface PageProps {
  params: Promise<{ facilitySlug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { facilitySlug } = await params;

  try {
    const caller = await api();
    const facility = await caller.publicBooking.getFacility({
      slug: facilitySlug,
    });

    return {
      title: `Mis Reservas — ${facility.name} | PadelHub`,
      description: `Consulta y gestiona tus reservas en ${facility.name}.`,
    };
  } catch {
    return {
      title: "Local no encontrado | PadelHub",
    };
  }
}

export default async function MisReservasRoute({ params }: PageProps) {
  const { facilitySlug } = await params;

  // Validate facility exists
  try {
    const caller = await api();
    await caller.publicBooking.getFacility({ slug: facilitySlug });
  } catch {
    notFound();
  }

  prefetch(trpc.publicBooking.getFacility.queryOptions({ slug: facilitySlug }));

  return (
    <HydrateClient>
      <Suspense fallback={<MisReservasSkeleton />}>
        <MisReservasPage facilitySlug={facilitySlug} />
      </Suspense>
    </HydrateClient>
  );
}
