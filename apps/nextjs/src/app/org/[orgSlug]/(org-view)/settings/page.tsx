import { Suspense } from "react";
import { redirect } from "next/navigation";

import { api, HydrateClient, prefetch, trpc } from "~/trpc/server";
import { SettingsView } from "./_components/settings-view";

interface SettingsPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { orgSlug } = await params;
  const caller = await api();

  const organizations = await caller.org.getMyOrganizations();
  const org = organizations.find((o) => o.slug === orgSlug);

  if (!org) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-500">Organización no encontrada</p>
      </div>
    );
  }

  // Access control: only org_admin can access settings
  if (org.role !== "org_admin") {
    redirect(`/org/${orgSlug}/facilities`);
  }

  // Prefetch data in parallel
  prefetch(trpc.org.getOrgProfile.queryOptions({ organizationId: org.id }));
  prefetch(trpc.org.getTeamMembers.queryOptions({ organizationId: org.id }));
  prefetch(
    trpc.org.getFacilities.queryOptions({
      organizationId: org.id,
      status: "all",
      sortBy: "name",
    }),
  );

  return (
    <HydrateClient>
      <Suspense fallback={<SettingsPageSkeleton />}>
        <SettingsView organizationId={org.id} orgSlug={orgSlug} />
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
