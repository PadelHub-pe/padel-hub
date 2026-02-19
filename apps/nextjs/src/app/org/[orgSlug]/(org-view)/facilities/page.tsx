import { Suspense } from "react";

import { api, HydrateClient, prefetch, trpc } from "~/trpc/server";
import { FacilitiesView } from "./_components/facilities-view";

interface FacilitiesPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function FacilitiesPage({ params }: FacilitiesPageProps) {
  const { orgSlug } = await params;
  const caller = await api();

  // Get organization ID from slug
  const organizations = await caller.org.getMyOrganizations();
  const org = organizations.find((o) => o.slug === orgSlug);

  if (!org) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-500">Organización no encontrada</p>
      </div>
    );
  }

  // Prefetch data
  prefetch(trpc.org.getStats.queryOptions({ organizationId: org.id }));
  prefetch(
    trpc.org.getFacilities.queryOptions({
      organizationId: org.id,
      status: "all",
      sortBy: "name",
    }),
  );
  prefetch(trpc.org.getDistricts.queryOptions({ organizationId: org.id }));

  return (
    <HydrateClient>
      <Suspense fallback={<FacilitiesPageSkeleton />}>
        <FacilitiesView organizationId={org.id} organizationName={org.name} />
      </Suspense>
    </HydrateClient>
  );
}

function FacilitiesPageSkeleton() {
  return (
    <div className="p-8">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="h-8 w-32 animate-pulse rounded bg-gray-200" />
        <div className="mt-2 h-4 w-64 animate-pulse rounded bg-gray-200" />
      </div>

      {/* Stats skeleton */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl bg-gray-200" />
        ))}
      </div>

      {/* Filters skeleton */}
      <div className="mt-8 mb-6 flex gap-4">
        <div className="h-10 w-64 animate-pulse rounded-md bg-gray-200" />
        <div className="h-10 w-40 animate-pulse rounded-md bg-gray-200" />
        <div className="h-10 w-40 animate-pulse rounded-md bg-gray-200" />
      </div>

      {/* Grid skeleton */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-80 animate-pulse rounded-lg bg-gray-200" />
        ))}
      </div>
    </div>
  );
}
