import { Suspense } from "react";

import { HydrateClient, prefetch, trpc } from "~/trpc/server";
import { BookingsView } from "./_components/bookings-view";

interface FacilityBookingsPageProps {
  params: Promise<{ orgSlug: string; facilityId: string }>;
}

export default async function FacilityBookingsPage({ params }: FacilityBookingsPageProps) {
  const { facilityId } = await params;

  // Prefetch data for client components
  prefetch(trpc.booking.list.queryOptions({ facilityId, page: 1, limit: 10 }));
  prefetch(trpc.court.list.queryOptions({ facilityId }));

  return (
    <HydrateClient>
      <Suspense fallback={<BookingsPageSkeleton />}>
        <BookingsView />
      </Suspense>
    </HydrateClient>
  );
}

function BookingsPageSkeleton() {
  return (
    <div className="p-8">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-32 animate-pulse rounded bg-gray-200" />
          <div className="mt-2 h-4 w-64 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="h-10 w-36 animate-pulse rounded-lg bg-gray-200" />
      </div>

      {/* Filters skeleton */}
      <div className="mt-6 flex gap-4">
        <div className="h-9 w-64 animate-pulse rounded-md bg-gray-200" />
        <div className="h-9 w-40 animate-pulse rounded-md bg-gray-200" />
        <div className="h-9 w-40 animate-pulse rounded-md bg-gray-200" />
        <div className="h-9 w-40 animate-pulse rounded-md bg-gray-200" />
      </div>

      {/* Table skeleton */}
      <div className="mt-6 rounded-lg border bg-white">
        <div className="border-b p-4">
          <div className="flex gap-4">
            {[120, 200, 100, 150, 100, 100, 50].map((w, i) => (
              <div
                key={i}
                style={{ width: w }}
                className="h-4 animate-pulse rounded bg-gray-200"
              />
            ))}
          </div>
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="border-b p-4 last:border-b-0">
            <div className="flex items-center gap-4">
              {[120, 200, 100, 150, 100, 100, 50].map((w, j) => (
                <div
                  key={j}
                  style={{ width: w }}
                  className="h-4 animate-pulse rounded bg-gray-200"
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination skeleton */}
      <div className="mt-4 flex items-center justify-between">
        <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
        <div className="flex gap-2">
          <div className="h-9 w-24 animate-pulse rounded-md bg-gray-200" />
          <div className="h-9 w-24 animate-pulse rounded-md bg-gray-200" />
        </div>
      </div>
    </div>
  );
}
