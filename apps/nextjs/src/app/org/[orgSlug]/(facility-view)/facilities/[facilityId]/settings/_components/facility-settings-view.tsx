"use client";

import { useState } from "react";

import { Badge } from "@wifo/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@wifo/ui/tabs";

import { BookingLinkTab } from "./booking-link-tab";
import { FacilityInfoTab } from "./facility-info-tab";
import { FacilityPhotosTab } from "./facility-photos-tab";
import { FacilityTeamTab } from "./facility-team-tab";
import { NotificationsTab } from "./notifications-tab";
import { ProfileTab } from "./profile-tab";
import { SecurityTab } from "./security-tab";

type OrgRole = "org_admin" | "facility_manager" | "staff";

const STAFF_TABS = new Set(["profile", "notifications", "security"]);

interface FacilitySettingsViewProps {
  facilityId: string;
  organizationId: string;
  userRole: OrgRole;
}

export function FacilitySettingsView({
  facilityId,
  organizationId,
  userRole,
}: FacilitySettingsViewProps) {
  const isStaff = userRole === "staff";

  // If staff navigates to a hidden tab via URL hash or state, default to profile
  const [activeTab, setActiveTab] = useState("profile");

  const handleTabChange = (value: string) => {
    if (isStaff && !STAFF_TABS.has(value)) return;
    setActiveTab(value);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Ajustes</h1>
        <p className="mt-1 text-sm text-gray-500">
          {isStaff
            ? "Administra tu perfil y preferencias"
            : "Administra tu perfil y la configuración del local"}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList variant="line" className="mb-6 w-full justify-start border-b">
          <TabsTrigger value="profile">Mi Perfil</TabsTrigger>
          {!isStaff && (
            <TabsTrigger value="facility">Info del Local</TabsTrigger>
          )}
          {!isStaff && <TabsTrigger value="photos">Fotos</TabsTrigger>}
          {!isStaff && <TabsTrigger value="team">Equipo</TabsTrigger>}
          {!isStaff && (
            <TabsTrigger value="booking-link">Enlace de Reservas</TabsTrigger>
          )}
          <TabsTrigger value="notifications" className="gap-2">
            Notificaciones
            <Badge variant="secondary" className="ml-1 text-[10px]">
              Pronto
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="security">Seguridad</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileTab />
        </TabsContent>

        {!isStaff && (
          <TabsContent value="facility">
            <FacilityInfoTab facilityId={facilityId} />
          </TabsContent>
        )}

        {!isStaff && (
          <TabsContent value="photos">
            <FacilityPhotosTab facilityId={facilityId} />
          </TabsContent>
        )}

        {!isStaff && (
          <TabsContent value="team">
            <FacilityTeamTab
              organizationId={organizationId}
              facilityId={facilityId}
            />
          </TabsContent>
        )}

        {!isStaff && (
          <TabsContent value="booking-link">
            <BookingLinkTab facilityId={facilityId} />
          </TabsContent>
        )}

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
