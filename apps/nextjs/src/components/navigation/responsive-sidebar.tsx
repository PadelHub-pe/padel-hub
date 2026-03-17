"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

import { getAvatarUrl } from "@wifo/images/url";
import { Avatar, AvatarFallback, AvatarImage } from "@wifo/ui/avatar";
import { Sheet, SheetContent, SheetTitle } from "@wifo/ui/sheet";

interface ResponsiveSidebarProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
  userInitials: string;
  userAvatarUrl: string | null;
  userName: string;
}

export function ResponsiveSidebar({
  sidebar,
  children,
  userInitials,
  userAvatarUrl,
  userName,
}: ResponsiveSidebarProps) {
  // Track the pathname at which the sheet was opened.
  // When pathname changes (nav link clicked), the derived `open` becomes false.
  const [sheetState, setSheetState] = useState({ open: false, pathname: "" });
  const pathname = usePathname();

  const open = sheetState.open && sheetState.pathname === pathname;

  function handleOpenChange(value: boolean) {
    setSheetState({ open: value, pathname });
  }

  const avatarUrl = getAvatarUrl(userAvatarUrl);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <div className="hidden shrink-0 lg:flex">{sidebar}</div>

      {/* Mobile header */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between bg-gray-900 px-4 text-white lg:hidden">
        <button
          type="button"
          onClick={() => handleOpenChange(true)}
          aria-label="Abrir menú"
          className="rounded-md p-1.5 hover:bg-gray-800"
        >
          <MenuIcon className="h-6 w-6" />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-sm font-bold">
            P
          </div>
          <span className="text-lg font-semibold">PadelHub</span>
        </div>
        <Avatar className="h-8 w-8">
          {avatarUrl && <AvatarImage src={avatarUrl} alt={userName} />}
          <AvatarFallback className="bg-gray-700 text-xs text-gray-200">
            {userInitials}
          </AvatarFallback>
        </Avatar>
      </header>

      {/* Mobile sidebar sheet */}
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent
          side="left"
          className="w-64 border-gray-800 bg-gray-900 p-0"
          showCloseButton={false}
        >
          <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
          {sidebar}
        </SheetContent>
      </Sheet>

      {/* Main content — top padding on mobile for fixed header */}
      <main className="flex-1 overflow-y-auto pt-14 lg:pt-0">{children}</main>
    </div>
  );
}

function MenuIcon({ className }: { className?: string }) {
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
        d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
      />
    </svg>
  );
}
