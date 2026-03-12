import { Suspense } from "react";

import {
  DashboardHeader,
  ScheduleTable,
  StatsGrid,
} from "~/components/dashboard";
import { RedirectToast } from "~/components/redirect-toast";
import { api, HydrateClient, prefetch, trpc } from "~/trpc/server";
import { SetupBanner } from "./_components/setup-banner";

interface FacilityDashboardPageProps {
  params: Promise<{ orgSlug: string; facilityId: string }>;
}

export default async function FacilityDashboardPage({
  params,
}: FacilityDashboardPageProps) {
  const { orgSlug, facilityId } = await params;
  const caller = await api();

  // Get user role for permission checks
  const organizations = await caller.org.getMyOrganizations();
  const currentOrg = organizations.find((org) => org.slug === orgSlug);
  const userRole = currentOrg?.role ?? "staff";

  // Prefetch data for client components
  prefetch(trpc.facility.getSetupStatus.queryOptions({ facilityId }));
  // TODO: Update to accept facilityId for facility-scoped data
  prefetch(trpc.dashboard.getStats.queryOptions());
  prefetch(trpc.dashboard.getTodaySchedule.queryOptions());

  return (
    <HydrateClient>
      <RedirectToast />
      <div className="p-8">
        {/* Setup Incomplete Banner */}
        <Suspense fallback={null}>
          <SetupBanner
            facilityId={facilityId}
            orgSlug={orgSlug}
            userRole={userRole}
          />
        </Suspense>

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
  return <div className="h-96 animate-pulse rounded-xl border bg-white" />;
}
