import { Suspense } from "react";

import { HydrateClient, prefetch, trpc } from "~/trpc/server";
import { CourtsView } from "./_components/courts-view";

export default function CourtsPage() {
  // Prefetch data for client components
  prefetch(trpc.court.list.queryOptions());
  prefetch(trpc.court.getStats.queryOptions());

  return (
    <HydrateClient>
      <Suspense fallback={<CourtsPageSkeleton />}>
        <CourtsView />
      </Suspense>
    </HydrateClient>
  );
}

function CourtsPageSkeleton() {
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

      {/* Grid skeleton */}
      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-64 animate-pulse rounded-xl border bg-white"
          />
        ))}
      </div>

      {/* Stats bar skeleton */}
      <div className="mt-8 flex justify-center gap-8">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="h-8 w-8 animate-pulse rounded bg-gray-200" />
            <div className="h-3 w-16 animate-pulse rounded bg-gray-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
