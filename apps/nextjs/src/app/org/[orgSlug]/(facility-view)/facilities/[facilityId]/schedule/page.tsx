import { Suspense } from "react";

import { ScheduleView } from "./_components/schedule-view";

export default function FacilitySchedulePage() {
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
      <div>
        <div className="h-8 w-64 animate-pulse rounded bg-gray-200" />
        <div className="mt-2 h-4 w-96 animate-pulse rounded bg-gray-200" />
      </div>

      {/* Cards skeleton */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="h-96 animate-pulse rounded-xl border bg-white" />
        <div className="h-96 animate-pulse rounded-xl border bg-white" />
      </div>
    </div>
  );
}
