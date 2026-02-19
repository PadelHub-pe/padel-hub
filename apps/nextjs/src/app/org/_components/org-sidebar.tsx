"use client";

import { useRouter } from "next/navigation";

import { signOut } from "@wifo/auth/client";
import { Avatar, AvatarFallback } from "@wifo/ui/avatar";
import { Button } from "@wifo/ui/button";

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
  userEmail: string;
  userName?: string;
}

export function OrgSidebar({
  organizations,
  userEmail,
  userName,
}: OrgSidebarProps) {
  const router = useRouter();

  const initials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : userEmail.charAt(0).toUpperCase();

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  return (
    <aside className="flex h-screen w-64 flex-col bg-gray-900 text-white">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-gray-800 px-6 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-lg font-bold">
          P
        </div>
        <span className="text-xl font-semibold">PadelHub</span>
      </div>

      {/* Organization Selector */}
      <div className="border-b border-gray-800 px-3 py-3">
        <OrgSelector organizations={organizations} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <OrgSidebarNav />
      </nav>

      {/* User info */}
      <div className="border-t border-gray-800 p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
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
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="mt-3 w-full justify-start text-gray-400 hover:bg-gray-800 hover:text-white"
        >
          <LogoutIcon className="mr-2 h-4 w-4" />
          Cerrar sesión
        </Button>
      </div>
    </aside>
  );
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
      />
    </svg>
  );
}
