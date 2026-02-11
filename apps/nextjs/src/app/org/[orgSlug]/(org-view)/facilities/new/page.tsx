import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@wifo/ui/card";

import { api } from "~/trpc/server";
import { QuickCreateForm } from "./_components/quick-create-form";

interface NewFacilityPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function NewFacilityPage({ params }: NewFacilityPageProps) {
  const { orgSlug } = await params;
  const caller = await api();

  // Get organization ID from slug
  const organizations = await caller.org.getMyOrganizations();
  const org = organizations.find((o) => o.slug === orgSlug);

  if (!org) {
    redirect(`/org`);
  }

  // Only org_admin can create facilities
  if (org.role !== "org_admin") {
    redirect(`/org/${orgSlug}/facilities`);
  }

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-500">
        <Link href={`/org/${orgSlug}/facilities`} className="hover:text-gray-700">
          Locales
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">Nuevo Local</span>
      </nav>

      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Crear nuevo local</CardTitle>
            <CardDescription>
              Ingresa la información básica de tu local. Podrás configurar las canchas y horarios
              después.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <QuickCreateForm organizationId={org.id} orgSlug={orgSlug} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
