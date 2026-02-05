import { Suspense } from "react";

import { HydrateClient, prefetch, trpc } from "~/trpc/server";
import { CourtEditForm } from "./_components/court-edit-form";

interface EditCourtPageProps {
  params: Promise<{ orgSlug: string; facilityId: string; courtId: string }>;
}

export default async function EditCourtPage({ params }: EditCourtPageProps) {
  const { courtId } = await params;

  prefetch(trpc.court.getById.queryOptions({ id: courtId }));

  return (
    <HydrateClient>
      <Suspense fallback={<EditFormSkeleton />}>
        <CourtEditForm id={courtId} />
      </Suspense>
    </HydrateClient>
  );
}

function EditFormSkeleton() {
  return (
    <div className="p-8">
      {/* Breadcrumb skeleton */}
      <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />

      {/* Header skeleton */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="flex gap-3">
          <div className="h-9 w-24 animate-pulse rounded-lg bg-gray-200" />
          <div className="h-9 w-36 animate-pulse rounded-lg bg-gray-200" />
        </div>
      </div>

      {/* Form sections skeleton */}
      <div className="mt-8 space-y-6">
        <div className="h-64 animate-pulse rounded-xl border bg-white" />
        <div className="h-32 animate-pulse rounded-xl border bg-white" />
        <div className="h-32 animate-pulse rounded-xl border bg-white" />
        <div className="h-48 animate-pulse rounded-xl border bg-white" />
        <div className="h-24 animate-pulse rounded-xl border border-red-200 bg-white" />
      </div>
    </div>
  );
}
