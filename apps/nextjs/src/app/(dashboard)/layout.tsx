import { redirect } from "next/navigation";

import { getSession } from "~/auth/server";
import { api } from "~/trpc/server";
import { Sidebar } from "./_components/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  // Get server-side caller
  const caller = await api();

  // Check if owner has completed onboarding
  const ownerStatus = await caller.owner.getOnboardingStatus();

  // If no owner account, redirect to register
  if (!ownerStatus.hasOwnerAccount) {
    redirect("/register");
  }

  // If onboarding not completed, redirect to onboarding
  if (!ownerStatus.onboardingCompletedAt) {
    redirect("/onboarding");
  }

  // Get facility data for the sidebar
  const facility = await caller.owner.getFacility();
  const facilityName = facility?.name ?? "Mi Centro de Padel";

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        facilityName={facilityName}
        userEmail={session.user.email}
        userName={session.user.name}
      />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
