import { cn } from "@wifo/ui";
import { Badge } from "@wifo/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@wifo/ui/card";

interface CourtImageSectionProps {
  imageUrl: string | null;
  status: "active" | "maintenance" | "inactive";
  type: "indoor" | "outdoor";
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

export function CourtImageSection({
  imageUrl,
  status,
  type,
}: CourtImageSectionProps) {
  const statusInfo = statusConfig[status];
  const typeInfo = typeConfig[type];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">
          Imagen de la Cancha
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            "relative h-48 overflow-hidden rounded-lg bg-gradient-to-br md:h-64",
            imageUrl ? "" : statusInfo.gradient,
          )}
          style={
            imageUrl
              ? {
                  backgroundImage: `url(${imageUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : undefined
          }
        >
          {/* Status badge - top left */}
          <Badge variant={statusInfo.variant} className="absolute left-3 top-3">
            {statusInfo.label}
          </Badge>

          {/* Type badge - top right */}
          <Badge
            variant="secondary"
            className="absolute right-3 top-3 bg-white/90 text-gray-700"
          >
            {typeInfo.icon} {typeInfo.label}
          </Badge>

          {!imageUrl && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white/80">
                <ImageIcon className="mx-auto h-12 w-12" />
                <p className="mt-2 text-sm">Sin imagen</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ImageIcon({ className }: { className?: string }) {
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
        d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
      />
    </svg>
  );
}
