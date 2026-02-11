import { redirect } from "next/navigation";

import { api } from "~/trpc/server";
import { SetupWizard } from "./_components/setup-wizard";

interface SetupPageProps {
  params: Promise<{ orgSlug: string; facilityId: string }>;
}

export default async function SetupPage({ params }: SetupPageProps) {
  const { orgSlug, facilityId } = await params;
  const caller = await api();

  // Get facility profile to check if setup is needed
  try {
    const facility = await caller.facility.getProfile({ facilityId });

    // If setup is already complete, redirect to dashboard
    if (facility.onboardingCompletedAt) {
      redirect(`/org/${orgSlug}/facilities/${facilityId}`);
    }

    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="mx-auto max-w-3xl px-6">
          <SetupWizard
            facilityId={facilityId}
            facilityName={facility.name}
            orgSlug={orgSlug}
          />
        </div>
      </div>
    );
  } catch {
    // If facility not found or no access, redirect to facilities list
    redirect(`/org/${orgSlug}/facilities`);
  }
}
