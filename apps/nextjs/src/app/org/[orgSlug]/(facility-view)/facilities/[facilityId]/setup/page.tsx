import { redirect } from "next/navigation";

import { api, HydrateClient, prefetch, trpc } from "~/trpc/server";
import { SetupWizard } from "./_components/setup-wizard";

interface SetupPageProps {
  params: Promise<{ orgSlug: string; facilityId: string }>;
  searchParams: Promise<{ step?: string }>;
}

export default async function SetupPage({
  params,
  searchParams,
}: SetupPageProps) {
  const { orgSlug, facilityId } = await params;
  const { step } = await searchParams;
  const caller = await api();

  let facility;
  try {
    facility = await caller.facility.getProfile({ facilityId });
  } catch {
    // If facility not found or no access, redirect to facilities list
    redirect(`/org/${orgSlug}/facilities`);
  }

  // If setup is already complete, redirect to dashboard
  if (facility.onboardingCompletedAt) {
    redirect(`/org/${orgSlug}/facilities/${facilityId}`);
  }

  // Prefetch setup status for the wizard to determine initial step
  prefetch(trpc.facility.getSetupStatus.queryOptions({ facilityId }));

  const requestedStep = step ? parseInt(step, 10) : undefined;

  return (
    <HydrateClient>
      <div className="bg-gray-50 px-6 py-8">
        <div className="mx-auto max-w-3xl">
          <SetupWizard
            facilityId={facilityId}
            facilityName={facility.name}
            orgSlug={orgSlug}
            requestedStep={
              requestedStep && requestedStep >= 1 && requestedStep <= 3
                ? requestedStep
                : undefined
            }
          />
        </div>
      </div>
    </HydrateClient>
  );
}
