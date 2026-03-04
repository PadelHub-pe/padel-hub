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

  // Determine where the user normally goes
  const firstOrg = organizations[0];
  const defaultRedirect = firstOrg
    ? `/org/${firstOrg.slug}/facilities`
    : "/no-organization";

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
