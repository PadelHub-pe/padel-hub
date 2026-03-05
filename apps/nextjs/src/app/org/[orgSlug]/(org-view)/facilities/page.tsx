import { Suspense } from "react";

import { api, HydrateClient, prefetch, trpc } from "~/trpc/server";
import { FacilitiesView } from "./_components/facilities-view";

type StatusFilter = "all" | "active" | "inactive";
type SortBy = "name" | "bookings" | "revenue" | "utilization";

const validStatuses = new Set<StatusFilter>(["all", "active", "inactive"]);
const validSorts = new Set<SortBy>([
  "name",
  "bookings",
  "revenue",
  "utilization",
]);

interface FacilitiesPageProps {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function FacilitiesPage({
  params,
  searchParams,
}: FacilitiesPageProps) {
  const { orgSlug } = await params;
  const sp = await searchParams;
  const caller = await api();

  // Parse filter params for prefetch
  const statusParam = typeof sp.status === "string" ? sp.status : "all";
  const sortParam = typeof sp.sort === "string" ? sp.sort : "name";
  const districtParam =
    typeof sp.district === "string" ? sp.district : undefined;
  const searchParam = typeof sp.q === "string" ? sp.q : undefined;

  const status: StatusFilter = validStatuses.has(statusParam as StatusFilter)
    ? (statusParam as StatusFilter)
    : "all";
  const sortBy: SortBy = validSorts.has(sortParam as SortBy)
    ? (sortParam as SortBy)
    : "name";

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

  // Prefetch data with URL filter params
  prefetch(trpc.org.getStats.queryOptions({ organizationId: org.id }));
  prefetch(
    trpc.org.getFacilities.queryOptions({
      organizationId: org.id,
      search: searchParam,
      status,
      district: districtParam,
      sortBy,
    }),
  );
  prefetch(trpc.org.getDistricts.queryOptions({ organizationId: org.id }));

  return (
    <HydrateClient>
      <Suspense fallback={<FacilitiesPageSkeleton />}>
        <FacilitiesView
          organizationId={org.id}
          organizationName={org.name}
          userRole={org.role}
        />
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
