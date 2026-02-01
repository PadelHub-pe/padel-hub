import { Card, CardContent, CardHeader, CardTitle } from "@wifo/ui/card";

interface LocationSectionProps {
  address: {
    street: string;
    district: string;
    city: string;
  };
}

export function LocationSection({ address }: LocationSectionProps) {
  const fullAddress = [address.street, address.district, address.city]
    .filter(Boolean)
    .join(", ");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">
          Ubicación
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-500">Dirección</p>
            <p className="text-sm text-gray-900">{address.street || "—"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-500">Distrito</p>
            <p className="text-sm text-gray-900">{address.district || "—"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-500">Ciudad</p>
            <p className="text-sm text-gray-900">{address.city || "—"}</p>
          </div>
        </div>
        {/* Map preview placeholder for MVP */}
        <div className="mt-4 flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50">
          <div className="text-center">
            <MapPinIcon className="mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-2 text-sm font-medium text-gray-600">
              {fullAddress}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Vista previa del mapa próximamente
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MapPinIcon({ className }: { className?: string }) {
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
        d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
      />
    </svg>
  );
}
