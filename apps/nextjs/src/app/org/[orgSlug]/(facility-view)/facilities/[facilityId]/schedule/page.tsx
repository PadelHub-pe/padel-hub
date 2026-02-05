import { Suspense } from "react";

import { ScheduleView } from "./_components/schedule-view";

export default function FacilitySchedulePage() {
  // Note: Prefetch disabled temporarily - client fetches with proper auth context
  // The client component uses useParams to get facilityId

  return (
    <Suspense fallback={<SchedulePageSkeleton />}>
      <ScheduleView />
    </Suspense>
  );
}

function SchedulePageSkeleton() {
  return (
    <div className="p-8">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-64 animate-pulse rounded bg-gray-200" />
          <div className="mt-2 h-4 w-96 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-9 w-32 animate-pulse rounded-lg bg-gray-200" />
          <div className="h-9 w-48 animate-pulse rounded-lg bg-gray-200" />
          <div className="h-9 w-36 animate-pulse rounded-lg bg-gray-200" />
        </div>
      </div>

      {/* Cards skeleton */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="h-96 animate-pulse rounded-xl border bg-white" />
        <div className="h-96 animate-pulse rounded-xl border bg-white" />
      </div>

      {/* Grid skeleton */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <div className="h-6 w-32 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="h-96 animate-pulse rounded-xl border bg-white" />
      </div>
    </div>
  );
}
