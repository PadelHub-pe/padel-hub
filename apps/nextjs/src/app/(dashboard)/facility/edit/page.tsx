import { Suspense } from "react";

import { HydrateClient, prefetch, trpc } from "~/trpc/server";
import { FacilityEditForm } from "./_components/facility-edit-form";

export default function EditFacilityPage() {
  // Prefetch data for client components
  prefetch(trpc.facility.getProfile.queryOptions());

  return (
    <HydrateClient>
      <Suspense fallback={<EditFormSkeleton />}>
        <FacilityEditForm />
      </Suspense>
    </HydrateClient>
  );
}

function EditFormSkeleton() {
  return (
    <div className="p-8">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-56 animate-pulse rounded bg-gray-200" />
          <div className="mt-2 h-4 w-64 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="flex gap-3">
          <div className="h-9 w-24 animate-pulse rounded bg-gray-200" />
          <div className="h-9 w-36 animate-pulse rounded bg-gray-200" />
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
