"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { cn } from "@wifo/ui";
import { Badge } from "@wifo/ui/badge";
import { Card } from "@wifo/ui/card";

interface CourtCardProps {
  court: {
    id: string;
    name: string;
    type: "indoor" | "outdoor";
    status: "active" | "maintenance" | "inactive";
    description: string | null;
    priceInCents: number | null;
    imageUrl: string | null;
    todayBookings: number;
  };
}

const statusConfig = {
  active: {
    label: "Activa",
    variant: "success" as const,
    gradient: "from-green-400 to-green-500",
  },
  maintenance: {
    label: "Mantenimiento",
    variant: "warning" as const,
    gradient: "from-amber-400 to-amber-500",
  },
  inactive: {
    label: "Inactiva",
    variant: "destructive" as const,
    gradient: "from-gray-400 to-gray-500",
  },
};

const typeConfig = {
  indoor: {
    label: "Indoor",
    icon: "🏠",
  },
  outdoor: {
    label: "Outdoor",
    icon: "☀️",
  },
};

export function CourtCard({ court }: CourtCardProps) {
  const params = useParams();
  const orgSlug = params.orgSlug as string;
  const facilityId = params.facilityId as string;

  const status = statusConfig[court.status];
  const type = typeConfig[court.type];

  const formattedPrice = court.priceInCents
    ? `S/ ${(court.priceInCents / 100).toFixed(0)}/hr`
    : null;

  return (
    <Link
      href={`/org/${orgSlug}/facilities/${facilityId}/courts/${court.id}`}
      className="group block"
    >
      <Card className="overflow-hidden transition-all duration-200 group-hover:shadow-md group-hover:ring-2 group-hover:ring-primary/20">
        {/* Image area with gradient fallback */}
        <div
          className={cn(
            "relative h-32 bg-gradient-to-br transition-transform duration-200 group-hover:scale-[1.02]",
            court.imageUrl ? "" : status.gradient,
          )}
          style={
            court.imageUrl
              ? {
                  backgroundImage: `url(${court.imageUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : undefined
          }
        >
          {/* Status badge - top left */}
          <Badge variant={status.variant} className="absolute left-3 top-3">
            {status.label}
          </Badge>

          {/* Type badge - top right */}
          <Badge
            variant="secondary"
            className="absolute right-3 top-3 bg-white/90 text-gray-700"
          >
            {type.icon} {type.label}
          </Badge>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-gray-900 group-hover:text-primary">
              {court.name}
            </h3>
            {formattedPrice && (
              <span className="text-sm font-medium text-blue-600">
                {formattedPrice}
              </span>
            )}
          </div>

          {court.description && (
            <p className="mt-1 line-clamp-2 text-sm text-gray-500">
              {court.description}
            </p>
          )}

          <div className="mt-3 flex items-center gap-1.5 text-sm text-gray-500">
            <CalendarIcon className="h-4 w-4" />
            <span>{court.todayBookings} reservas hoy</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

function CalendarIcon({ className }: { className?: string }) {
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
        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
      />
    </svg>
  );
}
