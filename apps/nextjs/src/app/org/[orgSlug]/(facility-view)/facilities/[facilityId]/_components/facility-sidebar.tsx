"use client";

import { getAvatarUrl } from "@wifo/images/url";
import { Avatar, AvatarFallback, AvatarImage } from "@wifo/ui/avatar";

import { SignOutButton } from "~/components/sign-out-button";
import { FacilitySidebarNav } from "./facility-sidebar-nav";
import { FacilitySwitcher } from "./facility-switcher";

interface FacilitySidebarProps {
  facilityId: string;
  facilities: {
    id: string;
    name: string;
    district: string;
    isActive: boolean;
    isSetupComplete: boolean;
  }[];
  organization: {
    name: string;
    slug: string;
    logoUrl: string | null;
  };
  userRole: "org_admin" | "facility_manager" | "staff";
  userEmail: string;
  userName?: string;
  userImage?: string | null;
}

export function FacilitySidebar({
  facilityId,
  facilities,
  organization,
  userRole,
  userEmail,
  userName,
  userImage,
}: FacilitySidebarProps) {
  const avatarUrl = getAvatarUrl(userImage ?? null);
  const initials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : userEmail.charAt(0).toUpperCase();

  return (
    <aside className="flex h-screen w-64 flex-col bg-gray-900 text-white">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-gray-800 px-6 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-lg font-bold">
          P
        </div>
        <span className="text-xl font-semibold">PadelHub</span>
      </div>

      {/* Facility Switcher */}
      <div className="border-b border-gray-800 py-1">
        <FacilitySwitcher
          currentFacilityId={facilityId}
          facilities={facilities}
          organization={organization}
          userRole={userRole}
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <FacilitySidebarNav userRole={userRole} />
      </nav>

      {/* User info */}
      <div className="border-t border-gray-800 p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={userName ?? ""} />}
            <AvatarFallback className="bg-gray-700 text-sm text-gray-200">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 truncate">
            <p className="truncate text-sm font-medium text-white">
              {userName ?? userEmail}
            </p>
            <p className="truncate text-xs text-gray-400">{userEmail}</p>
          </div>
        </div>
        <SignOutButton />
      </div>
    </aside>
  );
}
