import { Card, CardContent, CardHeader, CardTitle } from "@wifo/ui/card";

import { AMENITIES } from "~/lib/constants/amenities";

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

