import { Suspense } from "react";

import { HydrateClient, prefetch, trpc } from "~/trpc/server";
import { DashboardHeader } from "../_components/dashboard-header";
import { ScheduleTable } from "../_components/schedule-table";
import { StatsGrid } from "../_components/stats-grid";

export default function DashboardPage() {
  // Prefetch data for client components
  prefetch(trpc.dashboard.getStats.queryOptions());
  prefetch(trpc.dashboard.getTodaySchedule.queryOptions());

  return (
    <HydrateClient>
      <div className="p-8">
        <DashboardHeader title="Dashboard" />

        <div className="mt-8 space-y-8">
          {/* Stats Cards */}
          <Suspense fallback={<StatsGridSkeleton />}>
            <StatsGrid />
          </Suspense>

          {/* Schedule Table */}
          <Suspense fallback={<ScheduleTableSkeleton />}>
            <ScheduleTable />
          </Suspense>
        </div>
      </div>
    </HydrateClient>
  );
}

function StatsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-32 animate-pulse rounded-xl border bg-white"
        />
      ))}
    </div>
  );
}

function ScheduleTableSkeleton() {
  return (
    <div className="h-96 animate-pulse rounded-xl border bg-white" />
  );
}
