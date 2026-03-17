"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { cn } from "@wifo/ui";
import { Button } from "@wifo/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@wifo/ui/dropdown-menu";

interface Facility {
  id: string;
  name: string;
  district: string;
  isActive: boolean;
  isSetupComplete: boolean;
}

interface Organization {
  name: string;
  slug: string;
  logoUrl: string | null;
}

interface FacilitySwitcherProps {
  currentFacilityId: string;
  facilities: Facility[];
  organization: Organization;
  userRole: "org_admin" | "facility_manager" | "staff";
}

const gradients = [
  "from-blue-400 to-blue-600",
  "from-emerald-400 to-emerald-600",
  "from-amber-400 to-amber-600",
  "from-purple-400 to-purple-600",
  "from-rose-400 to-rose-600",
];

function getGradient(index: number) {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return gradients[index % gradients.length]!;
}

/** Pages that can be preserved when switching facilities */
const PRESERVABLE_SEGMENTS = new Set([
  "bookings",
  "courts",
  "schedule",
  "pricing",
  "settings",
]);

/** Sub-pages that should be fully preserved (not collapsed to parent) */
const PRESERVABLE_SUB_PAGES = new Set(["bookings/calendar"]);

/**
 * Compute the target path when switching between facilities.
 * - Preserves the current page segment (e.g., /bookings, /courts)
 * - Collapses detail pages to list pages (e.g., /courts/[id] → /courts)
 * - Navigates to facility root for non-preservable pages (e.g., /setup)
 */
export function getFacilitySwitchPath(
  currentPathname: string,
  basePath: string,
  currentFacilityId: string,
  newFacilityId: string,
): string {
  const currentFacilityPath = `${basePath}/${currentFacilityId}`;

  const relativePath = currentPathname.startsWith(currentFacilityPath)
    ? currentPathname.slice(currentFacilityPath.length)
    : "";

  const segments = relativePath.replace(/^\//, "").split("/").filter(Boolean);

  const firstSegment = segments[0];
  if (!firstSegment || !PRESERVABLE_SEGMENTS.has(firstSegment)) {
    return `${basePath}/${newFacilityId}`;
  }

  if (segments.length >= 2) {
    const subPage = `${firstSegment}/${segments[1]}`;
    if (PRESERVABLE_SUB_PAGES.has(subPage)) {
      return `${basePath}/${newFacilityId}/${subPage}`;
    }
    return `${basePath}/${newFacilityId}/${firstSegment}`;
  }

  return `${basePath}/${newFacilityId}/${firstSegment}`;
}

export function FacilitySwitcher({
  currentFacilityId,
  facilities,
  organization,
  userRole,
}: FacilitySwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const currentFacility = facilities.find((f) => f.id === currentFacilityId);

  if (!currentFacility) return null;

  const currentIndex = facilities.findIndex((f) => f.id === currentFacilityId);
  const basePath = `/org/${organization.slug}/facilities`;
  const isSingleFacility = facilities.length === 1;

  const facilityInfoBlock = (
    <>
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-sm font-bold text-white",
          getGradient(currentIndex),
        )}
      >
        {currentFacility.name.charAt(0).toUpperCase()}
      </div>
      <div className="flex flex-1 flex-col truncate">
        <span className="truncate text-sm font-semibold text-white">
          {currentFacility.name}
        </span>
        <span className="truncate text-xs text-gray-400">
          {currentFacility.district}
        </span>
      </div>
    </>
  );

  // Single facility: show info only, no dropdown
  if (isSingleFacility) {
    return (
      <div className="flex w-full items-center gap-3 px-4 py-3">
        {facilityInfoBlock}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-auto w-full justify-start gap-3 px-4 py-3 text-left hover:bg-gray-800"
        >
          {facilityInfoBlock}
          <ChevronUpDownIcon className="h-4 w-4 shrink-0 text-gray-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-64 border border-gray-700 bg-gray-800 shadow-lg shadow-black/50"
        align="start"
        sideOffset={4}
      >
        {/* Org header */}
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-xs font-bold text-white">
            {organization.logoUrl ? (
              <img
                src={organization.logoUrl}
                alt={organization.name}
                className="h-7 w-7 rounded-md object-cover"
              />
            ) : (
              organization.name.charAt(0).toUpperCase()
            )}
          </div>
          <span className="truncate text-sm font-medium text-gray-200">
            {organization.name}
          </span>
        </div>

        <DropdownMenuSeparator className="bg-gray-700" />

        {/* Facility list */}
        <DropdownMenuLabel className="text-xs text-gray-400">
          Tus sedes
        </DropdownMenuLabel>
        {facilities.map((facility, index) => {
          const isCurrent = facility.id === currentFacilityId;
          const isInactive = !facility.isActive;
          return (
            <DropdownMenuItem
              key={facility.id}
              onClick={() => {
                if (!isCurrent) {
                  const targetPath = getFacilitySwitchPath(
                    pathname,
                    basePath,
                    currentFacilityId,
                    facility.id,
                  );
                  router.push(targetPath);
                }
              }}
              className={cn(
                "cursor-pointer text-gray-200 focus:bg-gray-700 focus:text-white",
                isCurrent && "bg-gray-700",
                isInactive && "opacity-50",
              )}
            >
              <div className="flex w-full items-center gap-3">
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gradient-to-br text-xs font-bold text-white",
                    getGradient(index),
                  )}
                >
                  {facility.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-1 flex-col truncate">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-medium">
                      {facility.name}
                    </span>
                    {isInactive && (
                      <span className="shrink-0 rounded bg-gray-600 px-1.5 py-0.5 text-[10px] font-medium text-gray-300">
                        Inactivo
                      </span>
                    )}
                  </div>
                  <span className="truncate text-xs text-gray-400">
                    {facility.district}
                  </span>
                </div>
                {isCurrent && (
                  <CheckIcon className="h-4 w-4 shrink-0 text-blue-400" />
                )}
              </div>
            </DropdownMenuItem>
          );
        })}

        <DropdownMenuSeparator className="bg-gray-700" />

        {/* Role-based actions */}
        {userRole === "org_admin" && (
          <>
            <DropdownMenuItem asChild>
              <Link
                href={basePath}
                className="cursor-pointer text-gray-200 focus:bg-gray-700 focus:text-white"
              >
                <BuildingIcon className="mr-2 h-4 w-4 text-gray-400" />
                Ajustes de organización
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href={`${basePath}/new`}
                className="cursor-pointer text-gray-200 focus:bg-gray-700 focus:text-white"
              >
                <PlusIcon className="mr-2 h-4 w-4 text-gray-400" />
                Agregar sede
              </Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuItem asChild>
          <Link
            href={`${basePath}/${currentFacilityId}/settings`}
            className="cursor-pointer text-gray-200 focus:bg-gray-800 focus:text-white"
          >
            <GearIcon className="mr-2 h-4 w-4 text-gray-400" />
            Ajustes de sede
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ChevronUpDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.5 12.75l6 6 9-13.5"
      />
    </svg>
  );
}

function BuildingIcon({ className }: { className?: string }) {
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
        d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"
      />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
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
        d="M12 4.5v15m7.5-7.5h-15"
      />
    </svg>
  );
}

function GearIcon({ className }: { className?: string }) {
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
        d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}
