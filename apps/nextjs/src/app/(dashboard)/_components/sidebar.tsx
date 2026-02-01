"use client";

import { SidebarNav } from "./sidebar-nav";
import { SidebarUser } from "./sidebar-user";

interface SidebarProps {
  facilityName: string;
  userEmail: string;
  userName?: string;
}

export function Sidebar({ facilityName, userEmail, userName }: SidebarProps) {
  return (
    <aside className="flex h-screen w-64 flex-col bg-gray-900 text-white">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-gray-800 px-6 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-lg font-bold">
          P
        </div>
        <span className="text-xl font-semibold">PadelHub</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <SidebarNav />
      </nav>

      {/* User info */}
      <SidebarUser
        facilityName={facilityName}
        email={userEmail}
        name={userName}
      />
    </aside>
  );
}
