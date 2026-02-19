import { Suspense } from "react";

import { AdminLayout } from "~/app/_components/admin-layout";
import { requireAdmin } from "~/lib/require-admin";
import { HydrateClient, prefetch, trpc } from "~/trpc/server";
import { AccessRequestsView } from "./_components/access-requests-view";

export default async function AccessRequestsPage() {
  await requireAdmin();

  prefetch(trpc.admin.getStats.queryOptions());
  prefetch(trpc.admin.listAccessRequests.queryOptions({}));

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
          <AccessRequestsView />
        </Suspense>
      </HydrateClient>
    </AdminLayout>
  );
}
