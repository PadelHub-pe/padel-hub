"use client";

import Image from "next/image";

import { getAvatarUrl } from "@wifo/images/url";
import { Avatar, AvatarFallback, AvatarImage } from "@wifo/ui/avatar";

import { SignOutButton } from "~/components/sign-out-button";
import { OrgSelector } from "./org-selector";
import { OrgSidebarNav } from "./org-sidebar-nav";

interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  role: "org_admin" | "facility_manager" | "staff";
}

interface OrgSidebarProps {
  organizations: Organization[];
  currentRole: Organization["role"];
  userEmail: string;
  userName?: string;
  userImage?: string | null;
}

export function OrgSidebar({
  organizations,
  currentRole,
  userEmail,
  userName,
  userImage,
}: OrgSidebarProps) {
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
      <div className="flex items-center border-b border-gray-800 px-6 py-5">
        <Image
          src="/images/logo-horizontal-reversed.svg"
          alt="PadelHub"
          width={160}
          height={32}
          className="h-8 w-auto"
        />
      </div>

      {/* Organization Selector */}
      <div className="border-b border-gray-800 px-3 py-3">
        <OrgSelector organizations={organizations} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <OrgSidebarNav userRole={currentRole} />
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
