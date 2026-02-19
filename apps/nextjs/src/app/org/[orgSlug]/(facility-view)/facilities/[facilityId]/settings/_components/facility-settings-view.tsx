"use client";

import { Badge } from "@wifo/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@wifo/ui/tabs";

import { FacilityInfoTab } from "./facility-info-tab";
import { NotificationsTab } from "./notifications-tab";
import { ProfileTab } from "./profile-tab";
import { SecurityTab } from "./security-tab";

interface FacilitySettingsViewProps {
  facilityId: string;
}

export function FacilitySettingsView({
  facilityId,
}: FacilitySettingsViewProps) {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Ajustes</h1>
        <p className="mt-1 text-sm text-gray-500">
          Administra tu perfil y la configuración del local
        </p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList variant="line" className="mb-6 w-full justify-start border-b">
          <TabsTrigger value="profile">Mi Perfil</TabsTrigger>
          <TabsTrigger value="facility">Info del Local</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            Notificaciones
            <Badge variant="secondary" className="ml-1 text-[10px]">
              Pronto
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            Seguridad
            <Badge variant="secondary" className="ml-1 text-[10px]">
              Pronto
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileTab />
        </TabsContent>

        <TabsContent value="facility">
          <FacilityInfoTab facilityId={facilityId} />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationsTab />
        </TabsContent>

        <TabsContent value="security">
          <SecurityTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
