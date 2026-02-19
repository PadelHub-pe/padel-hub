import { getSession } from "~/auth/server";
import { api } from "~/trpc/server";
import { OrgSidebar } from "../../_components/org-sidebar";

interface OrgViewLayoutProps {
  children: React.ReactNode;
}

export default async function OrgViewLayout({ children }: OrgViewLayoutProps) {
  const session = await getSession();
  const caller = await api();

  // Get user's organizations for the sidebar
  const organizations = await caller.org.getMyOrganizations();

  return (
    <div className="flex h-screen bg-gray-50">
      <OrgSidebar
        organizations={organizations}
        userEmail={session?.user.email ?? ""}
        userName={session?.user.name ?? ""}
      />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
