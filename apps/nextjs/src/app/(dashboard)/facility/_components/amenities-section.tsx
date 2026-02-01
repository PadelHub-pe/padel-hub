import { Card, CardContent, CardHeader, CardTitle } from "@wifo/ui/card";

const AMENITIES = [
  { id: "parking", label: "Estacionamiento", icon: "🅿️" },
  { id: "indoor", label: "Canchas Techadas", icon: "🏠" },
  { id: "cafe", label: "Cafetería", icon: "☕" },
  { id: "showers", label: "Duchas", icon: "🚿" },
  { id: "lockers", label: "Casilleros", icon: "🔒" },
  { id: "proshop", label: "Pro Shop", icon: "🏪" },
  { id: "rental", label: "Alquiler de Equipos", icon: "🎾" },
  { id: "wifi", label: "WiFi", icon: "📶" },
  { id: "accessible", label: "Accesible", icon: "♿" },
  { id: "kids", label: "Área de Niños", icon: "👶" },
] as const;

interface AmenitiesSectionProps {
  selectedAmenities: string[];
}

export function AmenitiesSection({ selectedAmenities }: AmenitiesSectionProps) {
  const activeAmenities = AMENITIES.filter((a) =>
    selectedAmenities.includes(a.id),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">
          Servicios y Comodidades
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activeAmenities.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {activeAmenities.map((amenity) => (
              <div
                key={amenity.id}
                className="inline-flex items-center gap-2 rounded-full border border-blue-500 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700"
              >
                <span>{amenity.icon}</span>
                <span>{amenity.label}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            No hay servicios configurados
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export { AMENITIES };
