import { Suspense } from "react";
import { notFound } from "next/navigation";

import { api, HydrateClient, prefetch, trpc } from "~/trpc/server";
import { BookingPage } from "./_components/booking-page";
import { BookingPageSkeleton } from "./_components/booking-page-skeleton";

interface PageProps {
  params: Promise<{ facilitySlug: string }>;
  searchParams: Promise<{ date?: string }>;
}

export default async function BookPage({ params, searchParams }: PageProps) {
  const { facilitySlug } = await params;
  const { date: dateParam } = await searchParams;

  // Validate facility exists
  try {
    const caller = await api();
    await caller.publicBooking.getFacility({ slug: facilitySlug });
  } catch {
    notFound();
  }

  // Parse date from search params (default to today)
  const date = dateParam ? new Date(dateParam + "T00:00:00") : new Date();

  // Prefetch for client hydration
  prefetch(trpc.publicBooking.getFacility.queryOptions({ slug: facilitySlug }));
  prefetch(
    trpc.publicBooking.getAvailableSlots.queryOptions({
      slug: facilitySlug,
      date,
    }),
  );

  return (
    <HydrateClient>
      <Suspense fallback={<BookingPageSkeleton />}>
        <BookingPage facilitySlug={facilitySlug} />
      </Suspense>
    </HydrateClient>
  );
}
