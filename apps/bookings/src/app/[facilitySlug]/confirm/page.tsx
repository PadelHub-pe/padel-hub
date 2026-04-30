import { Suspense } from "react";
import { notFound } from "next/navigation";

import { parseLimaDateParam } from "@wifo/api/datetime";

import { api, HydrateClient, prefetch, trpc } from "~/trpc/server";
import { ConfirmPage } from "./_components/confirm-page";

interface PageProps {
  params: Promise<{ facilitySlug: string }>;
  searchParams: Promise<{
    courtId?: string;
    date?: string;
    start?: string;
    end?: string;
  }>;
}

export default async function ConfirmBookingPage({
  params,
  searchParams,
}: PageProps) {
  const { facilitySlug } = await params;
  const { courtId, date, start, end } = await searchParams;

  // Validate facility exists
  let facility;
  try {
    const caller = await api();
    facility = await caller.publicBooking.getFacility({ slug: facilitySlug });
  } catch {
    notFound();
  }

  // Prefetch facility data
  prefetch(trpc.publicBooking.getFacility.queryOptions({ slug: facilitySlug }));

  // Prefetch price if all params are present.
  // parseLimaDateParam ensures server and client agree on the same instant.
  if (courtId && date && start && end && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const parsedDate = parseLimaDateParam(date);
    prefetch(
      trpc.publicBooking.calculatePrice.queryOptions({
        facilityId: facility.id,
        courtId,
        date: parsedDate,
        startTime: start,
        endTime: end,
      }),
    );
  }

  return (
    <HydrateClient>
      <Suspense
        fallback={
          <main className="container pb-8">
            <div className="bg-muted mt-4 h-7 w-48 animate-pulse rounded" />
            <div className="bg-muted mt-4 h-40 animate-pulse rounded-lg" />
            <div className="mt-6 space-y-4">
              <div className="bg-muted h-10 animate-pulse rounded" />
              <div className="bg-muted h-10 animate-pulse rounded" />
              <div className="bg-muted h-12 animate-pulse rounded" />
            </div>
          </main>
        }
      >
        <ConfirmPage facilitySlug={facilitySlug} />
      </Suspense>
    </HydrateClient>
  );
}
