import { redirect } from "next/navigation";

import { getSession } from "~/auth/server";
import { api } from "~/trpc/server";
import { NoOrganizationView } from "./_components/no-organization-view";

export default async function NoOrganizationPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  // Check if user actually has orgs (redirect them if they do)
  const caller = await api();
  const organizations = await caller.org.getMyOrganizations();

  const firstOrg = organizations[0];
  if (firstOrg) {
    redirect(`/org/${firstOrg.slug}/facilities`);
  }

  return <NoOrganizationView userEmail={session.user.email} />;
}
