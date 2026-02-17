"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { Badge } from "@wifo/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@wifo/ui/tabs";

import { useTRPC } from "~/trpc/react";
import { BillingTab } from "./billing-tab";
import { FacilitiesTab } from "./facilities-tab";
import { OrgProfileTab } from "./org-profile-tab";
import { TeamTab } from "./team-tab";

interface SettingsViewProps {
  organizationId: string;
  orgSlug: string;
}

export function SettingsView({ organizationId, orgSlug }: SettingsViewProps) {
  const trpc = useTRPC();
  const { data: org } = useSuspenseQuery(
    trpc.org.getOrgProfile.queryOptions({ organizationId }),
  );

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Ajustes</h1>
        <p className="mt-1 text-sm text-gray-500">
          Administra tu organización, equipo y configuración
        </p>
      </div>

      <Tabs defaultValue="organization">
        <TabsList variant="line" className="mb-6 w-full justify-start border-b">
          <TabsTrigger value="organization">Organización</TabsTrigger>
          <TabsTrigger value="team">Equipo y Roles</TabsTrigger>
          <TabsTrigger value="facilities">Locales</TabsTrigger>
          <TabsTrigger
            value="billing"
            disabled={!org.billingEnabled}
            className="gap-2"
          >
            Facturación
            {!org.billingEnabled && (
              <Badge variant="secondary" className="ml-1 text-[10px]">
                Pronto
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="organization">
          <OrgProfileTab organizationId={organizationId} />
        </TabsContent>

        <TabsContent value="team">
          <TeamTab organizationId={organizationId} />
        </TabsContent>

        <TabsContent value="facilities">
          <FacilitiesTab organizationId={organizationId} orgSlug={orgSlug} />
        </TabsContent>

        <TabsContent value="billing">
          <BillingTab billingEnabled={org.billingEnabled} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
