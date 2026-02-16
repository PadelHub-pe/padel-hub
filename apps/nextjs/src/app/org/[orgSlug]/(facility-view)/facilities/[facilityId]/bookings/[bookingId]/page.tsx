import { Suspense } from "react";

import { HydrateClient, prefetch, trpc } from "~/trpc/server";
import { BookingDetailView } from "./_components/booking-detail-view";

interface BookingDetailPageProps {
  params: Promise<{ orgSlug: string; facilityId: string; bookingId: string }>;
}

export default async function BookingDetailPage({ params }: BookingDetailPageProps) {
  const { facilityId, bookingId } = await params;

  prefetch(trpc.booking.getById.queryOptions({ facilityId, id: bookingId }));

  return (
    <HydrateClient>
      <Suspense fallback={<BookingDetailSkeleton />}>
        <BookingDetailView />
      </Suspense>
    </HydrateClient>
  );
}

function BookingDetailSkeleton() {
  return (
    <div className="p-8">
      {/* Breadcrumb skeleton */}
      <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />

      {/* Header skeleton */}
      <div className="mt-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-8 w-36 animate-pulse rounded bg-gray-200" />
          <div className="h-6 w-24 animate-pulse rounded bg-gray-200" />
          <div className="h-6 w-16 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="h-10 w-28 animate-pulse rounded-lg bg-gray-200" />
      </div>

      {/* Content skeleton */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Court viz */}
        <div className="h-64 animate-pulse rounded-lg bg-gray-200 lg:col-span-1" />
        {/* Info panel */}
        <div className="space-y-4 lg:col-span-2">
          <div className="h-32 animate-pulse rounded-lg bg-gray-200" />
          <div className="h-32 animate-pulse rounded-lg bg-gray-200" />
        </div>
      </div>

      {/* Player grid skeleton */}
      <div className="mt-8 grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-gray-200" />
        ))}
      </div>
    </div>
  );
}
