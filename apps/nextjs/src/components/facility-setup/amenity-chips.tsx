"use client";

import { cn } from "@wifo/ui";

const AMENITY_OPTIONS = [
  { id: "estacionamiento", label: "Estacionamiento" },
  { id: "canchas_techadas", label: "Canchas Techadas" },
  { id: "cafe_snacks", label: "Café/Snacks" },
  { id: "duchas", label: "Duchas" },
  { id: "lockers", label: "Lockers" },
  { id: "alquiler_equipos", label: "Alquiler de Equipos" },
  { id: "wifi", label: "WiFi" },
  { id: "accesible", label: "Accesible" },
  { id: "area_kids", label: "Área Kids" },
  { id: "pro_shop", label: "Pro Shop" },
] as const;

interface AmenityChipsProps {
  value: string[];
  onChange: (amenities: string[]) => void;
}

export function AmenityChips({ value, onChange }: AmenityChipsProps) {
  function toggleAmenity(amenityId: string) {
    if (value.includes(amenityId)) {
      onChange(value.filter((id) => id !== amenityId));
    } else {
      onChange([...value, amenityId]);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-medium text-gray-900">Amenidades</h3>
        <p className="mt-1 text-sm text-gray-500">
          Selecciona las amenidades que ofrece tu local
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {AMENITY_OPTIONS.map((amenity) => {
          const isSelected = value.includes(amenity.id);
          return (
            <button
              key={amenity.id}
              type="button"
              onClick={() => toggleAmenity(amenity.id)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                isSelected
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-gray-300 bg-white text-gray-600 hover:border-gray-400 hover:bg-gray-50",
              )}
            >
              {amenity.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
