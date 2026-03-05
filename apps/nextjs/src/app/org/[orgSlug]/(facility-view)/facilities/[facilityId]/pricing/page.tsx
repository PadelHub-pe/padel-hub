import { Suspense } from "react";
import { redirect } from "next/navigation";

import { api, HydrateClient, prefetch, trpc } from "~/trpc/server";
import { PricingView } from "./_components/pricing-view";

interface FacilityPricingPageProps {
  params: Promise<{ orgSlug: string; facilityId: string }>;
}

export default async function FacilityPricingPage({
  params,
}: FacilityPricingPageProps) {
  const { orgSlug, facilityId } = await params;

  // Staff cannot access pricing configuration
  const caller = await api();
  const organizations = await caller.org.getMyOrganizations();
  const org = organizations.find((o) => o.slug === orgSlug);
  if (org?.role === "staff") {
    redirect(`/org/${orgSlug}/facilities/${facilityId}`);
  }

  prefetch(trpc.pricing.getOverview.queryOptions({ facilityId }));
  prefetch(
    trpc.pricing.calculateRevenue.queryOptions({
      facilityId,
      occupancyPercent: 70,
    }),
  );

  return (
    <HydrateClient>
      <Suspense fallback={<PricingPageSkeleton />}>
        <PricingView />
      </Suspense>
    </HydrateClient>
  );
}

function PricingPageSkeleton() {
  return (
    <div className="p-8">
      {/* Header skeleton */}
      <div>
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="mt-2 h-4 w-80 animate-pulse rounded bg-gray-200" />
      </div>

      <div className="mt-6 space-y-6">
        {/* Rate cards skeleton */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="h-64 animate-pulse rounded-2xl border bg-white" />
          <div className="h-64 animate-pulse rounded-2xl border bg-amber-50" />
        </div>

        {/* Weekly schedule skeleton */}
        <div className="h-80 animate-pulse rounded-xl border bg-white" />

        {/* Court table skeleton */}
        <div className="h-48 animate-pulse rounded-xl border bg-white" />

        {/* Revenue calculator skeleton */}
        <div className="h-40 animate-pulse rounded-xl bg-blue-100" />

        {/* Peak periods skeleton */}
        <div className="h-48 animate-pulse rounded-xl border bg-white" />
      </div>
    </div>
  );
}
