"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

import { Badge } from "@wifo/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@wifo/ui/tabs";

import { ProfileTab } from "./profile-tab";

function TabSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-6 w-48 rounded bg-gray-200" />
      <div className="h-4 w-72 rounded bg-gray-200" />
      <div className="h-64 rounded-lg bg-gray-100" />
    </div>
  );
}

const BookingLinkTab = dynamic(
  () =>
    import("./booking-link-tab").then((m) => ({ default: m.BookingLinkTab })),
  { loading: TabSkeleton },
);
const FacilityInfoTab = dynamic(
  () =>
    import("./facility-info-tab").then((m) => ({ default: m.FacilityInfoTab })),
  { loading: TabSkeleton },
);
const FacilityPhotosTab = dynamic(
  () =>
    import("./facility-photos-tab").then((m) => ({
      default: m.FacilityPhotosTab,
    })),
  { loading: TabSkeleton },
);
const FacilityTeamTab = dynamic(
  () =>
    import("./facility-team-tab").then((m) => ({ default: m.FacilityTeamTab })),
  { loading: TabSkeleton },
);
const NotificationsTab = dynamic(
  () =>
    import("./notifications-tab").then((m) => ({
      default: m.NotificationsTab,
    })),
  { loading: TabSkeleton },
);
const SecurityTab = dynamic(
  () => import("./security-tab").then((m) => ({ default: m.SecurityTab })),
  { loading: TabSkeleton },
);

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
