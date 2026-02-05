import Link from "next/link";
import { useParams } from "next/navigation";
import { cn } from "@wifo/ui";
import { Badge } from "@wifo/ui/badge";
import { Card, CardContent, CardFooter } from "@wifo/ui/card";

interface Facility {
  id: string;
  name: string;
  address: string;
  district: string;
  phone: string;
  isActive: boolean;
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
}

export function FacilityCard({ facility }: FacilityCardProps) {
  const params = useParams();
  const orgSlug = params.orgSlug as string;

  const photoUrl =
    facility.photos[0] ??
    "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400&h=200&fit=crop";

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-lg">
      {/* Photo Header */}
      <div className="relative h-40">
        <img
          src={photoUrl}
          alt={facility.name}
          className="h-full w-full object-cover"
        />
        {/* Status Badge */}
        <Badge
          variant={facility.isActive ? "default" : "secondary"}
          className={cn(
            "absolute right-3 top-3",
            facility.isActive
              ? "bg-green-100 text-green-700 hover:bg-green-100"
              : "bg-gray-100 text-gray-600 hover:bg-gray-100",
          )}
        >
          {facility.isActive ? "Activo" : "Inactivo"}
        </Badge>
      </div>

      <CardContent className="p-4">
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
        <Link
          href={`/org/${orgSlug}/facilities/${facility.id}`}
          className="flex w-full items-center justify-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          Ver Dashboard
          <ArrowIcon className="h-4 w-4" />
        </Link>
      </CardFooter>
    </Card>
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
