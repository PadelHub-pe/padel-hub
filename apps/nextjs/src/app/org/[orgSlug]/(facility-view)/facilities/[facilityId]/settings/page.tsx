import { Suspense } from "react";

import { HydrateClient, prefetch, trpc } from "~/trpc/server";
import { FacilitySettingsView } from "./_components/facility-settings-view";

interface FacilitySettingsPageProps {
  params: Promise<{ orgSlug: string; facilityId: string }>;
}

export default async function FacilitySettingsPage({
  params,
}: FacilitySettingsPageProps) {
  const { facilityId } = await params;

  // Prefetch data in parallel
  prefetch(trpc.account.getMyProfile.queryOptions());
  prefetch(trpc.facility.getProfile.queryOptions({ facilityId }));

  return (
    <HydrateClient>
      <Suspense fallback={<SettingsPageSkeleton />}>
        <FacilitySettingsView facilityId={facilityId} />
      </Suspense>
    </HydrateClient>
  );
}

function SettingsPageSkeleton() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="mt-2 h-4 w-80 animate-pulse rounded bg-gray-200" />
      </div>
      <div className="h-10 w-96 animate-pulse rounded bg-gray-200" />
      <div className="mt-6 h-96 animate-pulse rounded-lg bg-gray-200" />
    </div>
  );
}
