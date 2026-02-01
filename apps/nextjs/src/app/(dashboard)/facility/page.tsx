import { Suspense } from "react";

import { HydrateClient, prefetch, trpc } from "~/trpc/server";
import { FacilityView } from "./_components/facility-view";

export default function FacilityPage() {
  // Prefetch data for client components
  prefetch(trpc.facility.getProfile.queryOptions());

  return (
    <HydrateClient>
      <Suspense fallback={<FacilityViewSkeleton />}>
        <FacilityView />
      </Suspense>
    </HydrateClient>
  );
}

function FacilityViewSkeleton() {
  return (
    <div className="p-8">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
          <div className="mt-2 h-4 w-64 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="flex gap-3">
          <div className="h-9 w-20 animate-pulse rounded bg-gray-200" />
          <div className="h-9 w-32 animate-pulse rounded bg-gray-200" />
        </div>
      </div>

      {/* Form sections skeleton */}
      <div className="mt-8 space-y-6">
        <div className="h-80 animate-pulse rounded-xl border bg-white" />
        <div className="h-72 animate-pulse rounded-xl border bg-white" />
        <div className="h-56 animate-pulse rounded-xl border bg-white" />
        <div className="h-40 animate-pulse rounded-xl border bg-white" />
      </div>
    </div>
  );
}
