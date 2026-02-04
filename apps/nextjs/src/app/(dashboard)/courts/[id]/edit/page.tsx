import { Suspense } from "react";

import { HydrateClient, prefetch, trpc } from "~/trpc/server";
import { CourtEditForm } from "./_components/court-edit-form";

interface EditCourtPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCourtPage({ params }: EditCourtPageProps) {
  const { id } = await params;

  prefetch(trpc.court.getById.queryOptions({ id }));

  return (
    <HydrateClient>
      <Suspense fallback={<EditFormSkeleton />}>
        <CourtEditForm id={id} />
      </Suspense>
    </HydrateClient>
  );
}

function EditFormSkeleton() {
  return (
    <div className="p-8">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-9 w-9 animate-pulse rounded-lg bg-gray-200" />
          <div>
            <div className="h-8 w-56 animate-pulse rounded bg-gray-200" />
            <div className="mt-2 h-4 w-40 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
        <div className="flex gap-3">
          <div className="h-9 w-24 animate-pulse rounded-lg bg-gray-200" />
          <div className="h-9 w-36 animate-pulse rounded-lg bg-gray-200" />
        </div>
      </div>

      {/* Form sections skeleton */}
      <div className="mt-8 space-y-6">
        <div className="h-80 animate-pulse rounded-xl border bg-white" />
        <div className="h-48 animate-pulse rounded-xl border bg-white" />
      </div>
    </div>
  );
}
