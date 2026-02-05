import { redirect } from "next/navigation";

import { getSession } from "~/auth/server";
import { api } from "~/trpc/server";

interface OrgLayoutProps {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}

export default async function OrgLayout({ children, params }: OrgLayoutProps) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const { orgSlug } = await params;
  const caller = await api();

  // Get user's organizations
  const organizations = await caller.org.getMyOrganizations();

  // Verify user has access to this org
  const currentOrg = organizations.find((org) => org.slug === orgSlug);

  if (!currentOrg) {
    // User doesn't have access to this org
    const firstOrg = organizations[0];
    if (firstOrg) {
      // Redirect to first available org
      redirect(`/org/${firstOrg.slug}/facilities`);
    } else {
      // No orgs, redirect to onboarding
      redirect("/onboarding");
    }
  }

  // Just handle auth validation - sidebars are handled by nested route group layouts
  return <>{children}</>;
}
