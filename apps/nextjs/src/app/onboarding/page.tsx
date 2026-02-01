import { redirect } from "next/navigation";

import { getSession } from "~/auth/server";
import { api } from "~/trpc/server";
import { OnboardingWizard } from "./_components/onboarding-wizard";

export default async function OnboardingPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  // Get server-side caller
  const caller = await api();

  // Check onboarding status
  const status = await caller.owner.getOnboardingStatus();

  // If no owner account, redirect to register
  if (!status.hasOwnerAccount) {
    redirect("/register");
  }

  // If onboarding already completed, redirect to dashboard
  if (status.onboardingCompletedAt) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto flex h-16 max-w-4xl items-center px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
              P
            </div>
            <span className="text-lg font-semibold">PadelHub</span>
          </div>
        </div>
      </header>

      {/* Wizard */}
      <main className="mx-auto max-w-4xl px-6 py-8">
        <OnboardingWizard />
      </main>
    </div>
  );
}
