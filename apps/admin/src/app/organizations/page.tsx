import { Suspense } from "react";

import { AdminLayout } from "~/app/_components/admin-layout";
import { requireAdmin } from "~/lib/require-admin";
import { HydrateClient, prefetch, trpc } from "~/trpc/server";
import { OrganizationsView } from "./_components/organizations-view";

export default async function OrganizationsPage() {
  await requireAdmin();

  prefetch(trpc.admin.listOrganizations.queryOptions({}));

  return (
    <AdminLayout>
      <HydrateClient>
        <Suspense
          fallback={
            <div className="flex h-64 items-center justify-center">
              <div className="text-muted-foreground text-sm">Cargando...</div>
            </div>
          }
        >
          <OrganizationsView />
        </Suspense>
      </HydrateClient>
    </AdminLayout>
  );
}
