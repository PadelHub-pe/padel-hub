import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getSession } from "~/auth/server";
import {
  BreadcrumbProvider,
  Breadcrumbs,
  ResponsiveSidebar,
} from "~/components/navigation";
import { api } from "~/trpc/server";
import { FacilitySidebar } from "./_components/facility-sidebar";

/** Routes that staff members are not allowed to access */
const STAFF_RESTRICTED_SEGMENTS = [
  "/courts",
  "/schedule",
  "/pricing",
  "/settings",
];

interface FacilityLayoutProps {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string; facilityId: string }>;
}

export default async function FacilityLayout({
  children,
  params,
}: FacilityLayoutProps) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const { orgSlug, facilityId } = await params;
  const caller = await api();

  // Get user's organizations
  const organizations = await caller.org.getMyOrganizations();
  const currentOrg = organizations.find((org) => org.slug === orgSlug);

  if (!currentOrg) {
    redirect("/dashboard");
  }

  // Get facilities to find the current one
  const facilities = await caller.org.getFacilities({
    organizationId: currentOrg.id,
    status: "all",
    sortBy: "name",
  });

  const facility = facilities.find((f) => f.id === facilityId);

  if (!facility) {
    // Scoped user accessing unassigned facility: redirect to first assigned facility
    const firstFacility = facilities[0];
    if (firstFacility) {
      redirect(
        `/org/${orgSlug}/facilities/${firstFacility.id}?message=no-access`,
      );
    }
    redirect(`/org/${orgSlug}/facilities`);
  }

  // Staff route guard: prevent access to config pages via direct URL
  if (currentOrg.role === "staff") {
    const headersList = await headers();
    const pathname = headersList.get("x-pathname") ?? "";
    const facilityBasePath = `/org/${orgSlug}/facilities/${facilityId}`;
    const subPath = pathname.slice(facilityBasePath.length);

    const isRestricted = STAFF_RESTRICTED_SEGMENTS.some(
      (segment) => subPath === segment || subPath.startsWith(`${segment}/`),
    );

    if (isRestricted) {
      redirect(`/org/${orgSlug}/facilities/${facilityId}/bookings`);
    }
  }

  const userName = session.user.name;
  const userEmail = session.user.email;
  const userInitials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : userEmail.charAt(0).toUpperCase();

  return (
    <ResponsiveSidebar
      sidebar={
        <FacilitySidebar
          facilityId={facilityId}
          facilities={facilities.map((f) => ({
            id: f.id,
            name: f.name,
            district: f.district,
            isActive: f.isActive,
            isSetupComplete: f.isSetupComplete,
          }))}
          organization={{
            name: currentOrg.name,
            slug: currentOrg.slug,
            logoUrl: currentOrg.logoUrl,
          }}
          userRole={currentOrg.role}
          userEmail={userEmail}
          userName={userName}
          userImage={session.user.image}
        />
      }
      userInitials={userInitials}
      userAvatarUrl={session.user.image ?? null}
      userName={userName}
    >
      <BreadcrumbProvider>
        <Breadcrumbs
          orgName={currentOrg.name}
          orgSlug={orgSlug}
          facilityName={facility.name}
          facilityId={facilityId}
          userRole={currentOrg.role}
        />
        {children}
      </BreadcrumbProvider>
    </ResponsiveSidebar>
  );
}
