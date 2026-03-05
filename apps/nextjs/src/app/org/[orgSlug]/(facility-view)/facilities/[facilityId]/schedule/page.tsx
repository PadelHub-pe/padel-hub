import { Suspense } from "react";
import { redirect } from "next/navigation";

import { api } from "~/trpc/server";
import { ScheduleView } from "./_components/schedule-view";

interface FacilitySchedulePageProps {
  params: Promise<{ orgSlug: string; facilityId: string }>;
}

export default async function FacilitySchedulePage({
  params,
}: FacilitySchedulePageProps) {
  const { orgSlug, facilityId } = await params;

  // Staff cannot access schedule configuration
  const caller = await api();
  const organizations = await caller.org.getMyOrganizations();
  const org = organizations.find((o) => o.slug === orgSlug);
  if (org?.role === "staff") {
    redirect(`/org/${orgSlug}/facilities/${facilityId}`);
  }

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
