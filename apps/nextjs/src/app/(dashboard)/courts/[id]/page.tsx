import { Suspense } from "react";

import { HydrateClient, prefetch, trpc } from "~/trpc/server";
import { CourtView } from "./_components/court-view";

interface CourtDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CourtDetailPage({ params }: CourtDetailPageProps) {
  const { id } = await params;

  prefetch(trpc.court.getById.queryOptions({ id }));

  return (
    <HydrateClient>
      <Suspense fallback={<CourtViewSkeleton />}>
        <CourtView id={id} />
      </Suspense>
    </HydrateClient>
  );
}

function CourtViewSkeleton() {
  return (
    <div className="p-8">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-9 w-9 animate-pulse rounded-lg bg-gray-200" />
          <div>
            <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
            <div className="mt-2 h-4 w-32 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
        <div className="h-9 w-32 animate-pulse rounded-lg bg-gray-200" />
      </div>

      {/* Content skeleton */}
      <div className="mt-8 space-y-6">
        <div className="h-64 animate-pulse rounded-xl border bg-white" />
        <div className="h-48 animate-pulse rounded-xl border bg-white" />
      </div>
    </div>
  );
}
