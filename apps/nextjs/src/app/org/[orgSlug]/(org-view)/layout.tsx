import { getSession } from "~/auth/server";
import {
  BreadcrumbProvider,
  Breadcrumbs,
  ResponsiveSidebar,
} from "~/components/navigation";
import { api } from "~/trpc/server";
import { OrgSidebar } from "../../_components/org-sidebar";

interface OrgViewLayoutProps {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}

export default async function OrgViewLayout({
  children,
  params,
}: OrgViewLayoutProps) {
  const { orgSlug } = await params;
  const session = await getSession();
  const caller = await api();

  // Get user's organizations for the sidebar
  const organizations = await caller.org.getMyOrganizations();
  const currentOrg = organizations.find((org) => org.slug === orgSlug);
  const userRole = currentOrg?.role ?? "staff";

  const userName = session?.user.name ?? "";
  const userEmail = session?.user.email ?? "";
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
        <OrgSidebar
          organizations={organizations}
          currentRole={userRole}
          userEmail={userEmail}
          userName={userName}
          userImage={session?.user.image}
        />
      }
      userInitials={userInitials}
      userAvatarUrl={session?.user.image ?? null}
      userName={userName}
    >
      <BreadcrumbProvider>
        <Breadcrumbs
          orgName={currentOrg?.name ?? ""}
          orgSlug={orgSlug}
          userRole={userRole}
        />
        {children}
      </BreadcrumbProvider>
    </ResponsiveSidebar>
  );
}
