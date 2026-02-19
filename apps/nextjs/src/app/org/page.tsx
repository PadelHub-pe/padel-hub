import { redirect } from "next/navigation";

import { getSession } from "~/auth/server";
import { api } from "~/trpc/server";

export default async function OrgIndexPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const caller = await api();
  const organizations = await caller.org.getMyOrganizations();

  if (organizations.length === 0) {
    // User has no organizations
    redirect("/no-organization");
  }

  // Redirect to first organization's facilities page
  const firstOrg = organizations[0];
  if (!firstOrg) {
    redirect("/no-organization");
  }
  redirect(`/org/${firstOrg.slug}/facilities`);
}
