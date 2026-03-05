"use client";

import { useParams, useRouter } from "next/navigation";

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

interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  role: "org_admin" | "facility_manager" | "staff";
}

interface OrgSelectorProps {
  organizations: Organization[];
}

const roleLabels: Record<Organization["role"], string> = {
  org_admin: "Admin",
  facility_manager: "Manager",
  staff: "Staff",
};

export function OrgSelector({ organizations }: OrgSelectorProps) {
  const router = useRouter();
  const params = useParams();
  const currentSlug = params.orgSlug as string;

  const currentOrg = organizations.find((org) => org.slug === currentSlug);

  if (!currentOrg) return null;

  const isSingleOrg = organizations.length === 1;

  const handleSelectOrg = (slug: string) => {
    router.push(`/org/${slug}/facilities`);
  };

  const triggerContent = (
    <div className="flex h-auto w-full items-center justify-start gap-3 px-3 py-3 text-left">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-lg font-bold text-white">
        {currentOrg.logoUrl ? (
          <img
            src={currentOrg.logoUrl}
            alt={currentOrg.name}
            className="h-9 w-9 rounded-lg object-cover"
          />
        ) : (
          currentOrg.name.charAt(0).toUpperCase()
        )}
      </div>
      <div className="flex flex-1 flex-col truncate">
        <span className="truncate text-sm font-semibold text-white">
          {currentOrg.name}
        </span>
        <span className="text-xs text-gray-400">
          {roleLabels[currentOrg.role]}
        </span>
      </div>
      {!isSingleOrg && <ChevronIcon className="h-4 w-4 text-gray-400" />}
    </div>
  );

  if (isSingleOrg) {
    return triggerContent;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-auto w-full justify-start gap-0 px-0 py-0 text-left hover:bg-gray-800"
        >
          {triggerContent}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-64 border-gray-800 bg-gray-900"
        align="start"
        sideOffset={4}
      >
        <DropdownMenuLabel className="text-gray-400">
          Mis Organizaciones
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-gray-800" />
        {organizations.map((org) => {
          const isActive = org.slug === currentSlug;
          return (
            <DropdownMenuItem
              key={org.id}
              onClick={() => handleSelectOrg(org.slug)}
              className={cn(
                "cursor-pointer text-gray-200 focus:bg-gray-800 focus:text-white",
                isActive && "bg-gray-800",
              )}
            >
              <div className="flex w-full items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-600 text-sm font-bold text-white">
                  {org.logoUrl ? (
                    <img
                      src={org.logoUrl}
                      alt={org.name}
                      className="h-8 w-8 rounded-md object-cover"
                    />
                  ) : (
                    org.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex flex-1 flex-col">
                  <span className="text-sm font-medium">{org.name}</span>
                  <span className="text-xs text-gray-400">
                    {roleLabels[org.role]}
                  </span>
                </div>
                {isActive && (
                  <CheckIcon className="h-4 w-4 shrink-0 text-blue-400" />
                )}
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ChevronIcon({ className }: { className?: string }) {
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
