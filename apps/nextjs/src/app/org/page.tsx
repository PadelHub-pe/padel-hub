import { Suspense } from "react";
import { redirect } from "next/navigation";

import { getSession } from "~/auth/server";
import { api, HydrateClient, prefetch, trpc } from "~/trpc/server";
import { PendingInviteBanner } from "./_components/pending-invite-banner";

export default async function OrgIndexPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const caller = await api();
  const organizations = await caller.org.getMyOrganizations();

  // Determine where the user normally goes based on role
  const firstOrg = organizations[0];
  let defaultRedirect = "/no-organization";

  if (firstOrg) {
    if (firstOrg.role === "org_admin") {
      // Admins land on the facilities list (org-level view)
      defaultRedirect = `/org/${firstOrg.slug}/facilities`;
    } else {
      // Managers and staff land on their first accessible facility
      const facilities = await caller.org.getFacilities({
        organizationId: firstOrg.id,
        status: "all",
        sortBy: "name",
      });
      const firstFacility = facilities[0];

      if (!firstFacility) {
        // No accessible facilities — show empty state
        defaultRedirect = `/org/${firstOrg.slug}/facilities`;
      } else if (firstOrg.role === "staff") {
        // Staff land directly on bookings
        defaultRedirect = `/org/${firstOrg.slug}/facilities/${firstFacility.id}/bookings`;
      } else {
        // Facility managers land on the facility dashboard
        defaultRedirect = `/org/${firstOrg.slug}/facilities/${firstFacility.id}`;
      }
    }
  }

  // Check for pending invites
  const pendingInvites = await caller.invite.getPendingInvites();

  if (pendingInvites.length === 0) {
    redirect(defaultRedirect);
  }

  // Prefetch for client component hydration
  prefetch(trpc.invite.getPendingInvites.queryOptions());

  return (
    <HydrateClient>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center">
            <p className="text-sm text-gray-500">Cargando...</p>
          </div>
        }
      >
        <PendingInviteBanner redirectTo={defaultRedirect} />
      </Suspense>
    </HydrateClient>
  );
}
