import { Suspense } from "react";

import { HydrateClient, prefetch, trpc } from "~/trpc/server";
import { CalendarView } from "./_components/calendar-view";

export default function CalendarPage() {
  // Prefetch today's data for client components
  prefetch(trpc.calendar.getDayView.queryOptions({ date: new Date() }));
  prefetch(trpc.court.list.queryOptions());

  return (
    <HydrateClient>
      <Suspense fallback={<CalendarPageSkeleton />}>
        <CalendarView />
      </Suspense>
    </HydrateClient>
  );
}

function CalendarPageSkeleton() {
  return (
    <div className="flex h-full">
      {/* Sidebar skeleton */}
      <div className="w-64 shrink-0 border-r bg-gray-50 p-4">
        <div className="h-6 w-32 animate-pulse rounded bg-gray-200" />
        <div className="mt-4 grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-8 w-8 animate-pulse rounded bg-gray-200" />
          ))}
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="flex-1 p-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex gap-1">
              <div className="h-9 w-9 animate-pulse rounded-md bg-gray-200" />
              <div className="h-9 w-16 animate-pulse rounded-md bg-gray-200" />
              <div className="h-9 w-9 animate-pulse rounded-md bg-gray-200" />
            </div>
            <div className="h-7 w-64 animate-pulse rounded bg-gray-200" />
          </div>
          <div className="flex items-center gap-4">
            <div className="h-9 w-32 animate-pulse rounded-md bg-gray-200" />
            <div className="h-9 w-36 animate-pulse rounded-md bg-gray-200" />
          </div>
        </div>

        {/* Legend skeleton */}
        <div className="mt-4 flex items-center justify-between rounded-lg border bg-gray-50 px-4 py-2">
          <div className="flex gap-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="h-3 w-3 animate-pulse rounded-full bg-gray-200" />
                <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
              </div>
            ))}
          </div>
          <div className="flex gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-4 w-24 animate-pulse rounded bg-gray-200" />
            ))}
          </div>
        </div>

        {/* Grid skeleton */}
        <div className="mt-4 overflow-hidden rounded-lg border bg-white">
          {/* Header row */}
          <div className="flex border-b bg-gray-50">
            <div className="w-20 shrink-0 border-r p-2">
              <div className="h-4 w-12 animate-pulse rounded bg-gray-200" />
            </div>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex-1 border-r p-2 last:border-r-0">
                <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
              </div>
            ))}
          </div>
          {/* Time rows */}
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex border-b last:border-b-0">
              <div className="w-20 shrink-0 border-r p-2">
                <div className="h-4 w-12 animate-pulse rounded bg-gray-200" />
              </div>
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="h-16 flex-1 border-r last:border-r-0" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
