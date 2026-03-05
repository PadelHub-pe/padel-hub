"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { cn } from "@wifo/ui";
import { Badge } from "@wifo/ui/badge";
import { Card, CardContent, CardFooter } from "@wifo/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@wifo/ui/dropdown-menu";

interface Facility {
  id: string;
  name: string;
  address: string;
  district: string;
  phone: string;
  isActive: boolean;
  isSetupComplete: boolean;
  photos: string[];
  courtCount: number;
  indoorCount: number;
  outdoorCount: number;
  todayBookings: number;
  monthRevenue: number;
  utilization: number;
}

interface FacilityCardProps {
  facility: Facility;
  userRole: "org_admin" | "facility_manager" | "staff";
  onDeactivate?: (facility: Facility) => void;
  onReactivate?: (facility: Facility) => void;
}

export function FacilityCard({
  facility,
  userRole,
  onDeactivate,
  onReactivate,
}: FacilityCardProps) {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params.orgSlug as string;

  const photoUrl =
    facility.photos[0] ??
    "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400&h=200&fit=crop";

  const dashboardPath = facility.isSetupComplete
    ? `/org/${orgSlug}/facilities/${facility.id}`
    : `/org/${orgSlug}/facilities/${facility.id}/setup`;

  const editPath = facility.isSetupComplete
    ? `/org/${orgSlug}/facilities/${facility.id}/settings`
    : `/org/${orgSlug}/facilities/${facility.id}/setup`;

  return (
    <Card
      className={cn(
        "overflow-hidden transition-shadow hover:shadow-lg",
        !facility.isActive && "opacity-75",
      )}
    >
      {/* Photo Header */}
      <div
        className="relative h-40 cursor-pointer"
        onClick={() => router.push(dashboardPath)}
      >
        <img
          src={photoUrl}
          alt={facility.name}
          className="h-full w-full object-cover"
        />
        {/* Gray overlay for inactive */}
        {!facility.isActive && (
          <div className="absolute inset-0 bg-gradient-to-b from-gray-500/30 to-gray-600/40" />
        )}
        {/* Status Badges */}
        <div className="absolute top-3 right-3 flex flex-col gap-1">
          {!facility.isSetupComplete && (
            <Badge
              variant="secondary"
              className="bg-amber-100 text-amber-700 hover:bg-amber-100"
            >
              <SetupIcon className="mr-1 h-3 w-3" />
              Pendiente
            </Badge>
          )}
          <Badge
            variant={facility.isActive ? "default" : "secondary"}
            className={cn(
              facility.isActive
                ? "bg-green-100 text-green-700 hover:bg-green-100"
                : "bg-gray-100 text-gray-600 hover:bg-gray-100",
            )}
          >
            {facility.isActive ? "Activo" : "Inactivo"}
          </Badge>
        </div>
        {/* Actions Menu */}
        <div className="absolute top-3 left-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
              >
                <MoreIcon className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => router.push(dashboardPath)}>
                <DashboardIcon className="mr-2 h-4 w-4" />
                Ver Dashboard
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(editPath)}>
                <EditIcon className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              {userRole === "org_admin" && (
                <>
                  <DropdownMenuSeparator />
                  {facility.isActive ? (
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => onDeactivate?.(facility)}
                    >
                      <DeactivateIcon className="mr-2 h-4 w-4" />
                      Desactivar
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => onReactivate?.(facility)}>
                      <ActivateIcon className="mr-2 h-4 w-4" />
                      Reactivar
                    </DropdownMenuItem>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <CardContent
        className="cursor-pointer p-4"
        onClick={() => router.push(dashboardPath)}
      >
        {/* Name and Location */}
        <h3 className="font-semibold text-gray-900">{facility.name}</h3>
        <p className="mt-1 text-sm text-gray-500">{facility.district}</p>

        {/* Court Type Pills */}
        <div className="mt-3 flex flex-wrap gap-2">
          {facility.indoorCount > 0 && (
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
              <IndoorIcon className="mr-1 h-3 w-3" />
              {facility.indoorCount} Indoor
            </span>
          )}
          {facility.outdoorCount > 0 && (
            <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
              <OutdoorIcon className="mr-1 h-3 w-3" />
              {facility.outdoorCount} Outdoor
            </span>
          )}
        </div>

        {/* Stats Row */}
        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-gray-100 pt-4">
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-900">
              {facility.todayBookings}
            </p>
            <p className="text-xs text-gray-500">Hoy</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-900">
              S/{" "}
              {(facility.monthRevenue / 100).toLocaleString("es-PE", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </p>
            <p className="text-xs text-gray-500">Este mes</p>
          </div>
          <div className="text-center">
            <p
              className={cn(
                "text-lg font-semibold",
                facility.utilization >= 70
                  ? "text-green-600"
                  : facility.utilization >= 40
                    ? "text-amber-600"
                    : "text-gray-600",
              )}
            >
              {facility.utilization}%
            </p>
            <p className="text-xs text-gray-500">Ocupación</p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="border-t bg-gray-50 p-3">
        {facility.isSetupComplete ? (
          <Link
            href={`/org/${orgSlug}/facilities/${facility.id}`}
            className="flex w-full items-center justify-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Ver Dashboard
            <ArrowIcon className="h-4 w-4" />
          </Link>
        ) : (
          <Link
            href={`/org/${orgSlug}/facilities/${facility.id}/setup`}
            className="flex w-full items-center justify-center gap-2 text-sm font-medium text-amber-600 hover:text-amber-700"
          >
            <SetupIcon className="h-4 w-4" />
            Completar configuración
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}

function MoreIcon({ className }: { className?: string }) {
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
        d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
      />
    </svg>
  );
}

function DashboardIcon({ className }: { className?: string }) {
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
        d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
      />
    </svg>
  );
}

function EditIcon({ className }: { className?: string }) {
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
        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
      />
    </svg>
  );
}

function DeactivateIcon({ className }: { className?: string }) {
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
        d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
      />
    </svg>
  );
}

function ActivateIcon({ className }: { className?: string }) {
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
        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function IndoorIcon({ className }: { className?: string }) {
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
        d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
      />
    </svg>
  );
}

function OutdoorIcon({ className }: { className?: string }) {
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
        d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
      />
    </svg>
  );
}

function ArrowIcon({ className }: { className?: string }) {
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
        d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
      />
    </svg>
  );
}

function SetupIcon({ className }: { className?: string }) {
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
        d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}
