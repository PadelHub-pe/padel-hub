import { getSession } from "~/auth/server";
import { BreadcrumbProvider, Breadcrumbs } from "~/components/navigation";
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

  return (
    <div className="flex h-screen bg-gray-50">
      <OrgSidebar
        organizations={organizations}
        currentRole={userRole}
        userEmail={session?.user.email ?? ""}
        userName={session?.user.name ?? ""}
        userImage={session?.user.image}
      />
      <main className="flex-1 overflow-y-auto">
        <BreadcrumbProvider>
          <Breadcrumbs
            orgName={currentOrg?.name ?? ""}
            orgSlug={orgSlug}
            userRole={userRole}
          />
          {children}
        </BreadcrumbProvider>
      </main>
    </div>
  );
}
