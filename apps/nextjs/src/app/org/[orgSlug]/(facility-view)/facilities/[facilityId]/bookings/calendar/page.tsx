import { Suspense } from "react";
import { parse, startOfWeek } from "date-fns";

import { HydrateClient, prefetch, trpc } from "~/trpc/server";
import { CalendarView } from "./_components/calendar-view";

interface FacilityCalendarPageProps {
  params: Promise<{ orgSlug: string; facilityId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function parseDateParam(value: string | undefined): Date {
  if (!value) return new Date();
  const d = parse(value, "yyyy-MM-dd", new Date());
  return isNaN(d.getTime()) ? new Date() : d;
}

function parseViewParam(value: string | undefined): "day" | "week" {
  return value === "week" ? "week" : "day";
}

export default async function FacilityCalendarPage({
  params,
  searchParams,
}: FacilityCalendarPageProps) {
  const { facilityId } = await params;
  const sp = await searchParams;
  const dateStr = typeof sp.date === "string" ? sp.date : undefined;
  const viewStr = typeof sp.view === "string" ? sp.view : undefined;
  const date = parseDateParam(dateStr);
  const view = parseViewParam(viewStr);

  // Prefetch based on URL searchParams
  if (view === "week") {
    const weekStart = startOfWeek(date, { weekStartsOn: 1 });
    prefetch(trpc.calendar.getWeekView.queryOptions({ facilityId, weekStart }));
  } else {
    prefetch(trpc.calendar.getDayView.queryOptions({ facilityId, date }));
  }
  prefetch(trpc.court.list.queryOptions({ facilityId }));
  prefetch(trpc.org.getMyOrganizations.queryOptions());

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
            <div
              key={i}
              className="h-8 w-8 animate-pulse rounded bg-gray-200"
            />
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
