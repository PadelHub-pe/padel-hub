import { redirect } from "next/navigation";

import { getSession } from "~/auth/server";
import { api } from "~/trpc/server";

interface OrgSlugPageProps {
  params: Promise<{ orgSlug: string }>;
}

/**
 * Redirect page for `/org/[orgSlug]`.
 *
 * When a user lands on `/org/padel-group-lima` (e.g. after login),
 * this page redirects them to the appropriate destination based on their role:
 * - org_admin → facilities list
 * - facility_manager → first facility dashboard
 * - staff → first facility bookings
 */
export default async function OrgSlugPage({ params }: OrgSlugPageProps) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const { orgSlug } = await params;
  const caller = await api();
  const organizations = await caller.org.getMyOrganizations();
  const org = organizations.find((o) => o.slug === orgSlug);

  if (!org) {
    redirect("/org");
  }

  if (org.role === "org_admin") {
    redirect(`/org/${orgSlug}/facilities`);
  }

  // For managers and staff, find their first accessible facility
  const facilities = await caller.org.getFacilities({
    organizationId: org.id,
    status: "all",
    sortBy: "name",
  });

  const firstFacility = facilities[0];

  if (!firstFacility) {
    redirect(`/org/${orgSlug}/facilities`);
  }

  if (org.role === "staff") {
    redirect(`/org/${orgSlug}/facilities/${firstFacility.id}/bookings`);
  }

  // facility_manager → facility dashboard
  redirect(`/org/${orgSlug}/facilities/${firstFacility.id}`);
}
