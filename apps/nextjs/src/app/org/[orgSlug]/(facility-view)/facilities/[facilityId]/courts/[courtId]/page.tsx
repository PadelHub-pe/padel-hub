import { Suspense } from "react";

import { HydrateClient, prefetch, trpc } from "~/trpc/server";
import { CourtView } from "./_components/court-view";

interface CourtDetailPageProps {
  params: Promise<{ orgSlug: string; facilityId: string; courtId: string }>;
}

export default async function CourtDetailPage({ params }: CourtDetailPageProps) {
  const { courtId } = await params;

  prefetch(trpc.court.getById.queryOptions({ id: courtId }));

  return (
    <HydrateClient>
      <Suspense fallback={<CourtViewSkeleton />}>
        <CourtView id={courtId} />
      </Suspense>
    </HydrateClient>
  );
}

function CourtViewSkeleton() {
  return (
    <div className="p-8">
      {/* Breadcrumb skeleton */}
      <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />

      {/* Header skeleton */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-32 animate-pulse rounded bg-gray-200" />
          <div className="h-6 w-16 animate-pulse rounded-full bg-gray-200" />
        </div>
        <div className="h-9 w-36 animate-pulse rounded-lg bg-gray-200" />
      </div>

      {/* Content skeleton */}
      <div className="mt-8 space-y-6">
        <div className="h-72 animate-pulse rounded-xl border bg-white" />
        <div className="h-48 animate-pulse rounded-xl border bg-white" />
      </div>
    </div>
  );
}
