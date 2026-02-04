import { Badge } from "@wifo/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@wifo/ui/card";

interface CourtInfoSectionProps {
  name: string;
  status: "active" | "maintenance" | "inactive";
  type: "indoor" | "outdoor";
  description: string | null;
  priceInCents: number | null;
}

const statusConfig = {
  active: {
    label: "Activa",
    variant: "success" as const,
  },
  maintenance: {
    label: "Mantenimiento",
    variant: "warning" as const,
  },
  inactive: {
    label: "Inactiva",
    variant: "destructive" as const,
  },
};

const typeConfig = {
  indoor: {
    label: "Indoor",
    description: "Cancha techada",
  },
  outdoor: {
    label: "Outdoor",
    description: "Cancha al aire libre",
  },
};

export function CourtInfoSection({
  name,
  status,
  type,
  description,
  priceInCents,
}: CourtInfoSectionProps) {
  const statusInfo = statusConfig[status];
  const typeInfo = typeConfig[type];

  const formattedPrice = priceInCents
    ? `S/ ${(priceInCents / 100).toFixed(2)}`
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">
          Información de la Cancha
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <InfoField label="Nombre" value={name} />
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-500">Estado</p>
            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-500">Tipo</p>
            <p className="text-sm text-gray-900">{typeInfo.label}</p>
            <p className="text-xs text-gray-500">{typeInfo.description}</p>
          </div>
          <InfoField
            label="Precio por hora"
            value={formattedPrice ?? "No definido"}
          />
        </div>

        {description && (
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-500">Descripción</p>
            <p className="text-sm text-gray-900">{description}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="text-sm text-gray-900">{value}</p>
    </div>
  );
}
