"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@wifo/ui/card";
import { Checkbox } from "@wifo/ui/checkbox";
import { Label } from "@wifo/ui/label";

import { AMENITIES } from "~/lib/constants/amenities";

interface AmenitiesFormProps {
  selectedAmenities: string[];
  onChange: (amenities: string[]) => void;
}

export function AmenitiesForm({
  selectedAmenities,
  onChange,
}: AmenitiesFormProps) {
  function handleAmenityChange(amenityId: string, checked: boolean) {
    const newAmenities = checked
      ? [...selectedAmenities, amenityId]
      : selectedAmenities.filter((id) => id !== amenityId);
    onChange(newAmenities);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">
          Servicios y Comodidades
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {AMENITIES.map((amenity) => (
            <div key={amenity.id} className="flex items-center gap-2">
              <Checkbox
                id={`amenity-${amenity.id}`}
                checked={selectedAmenities.includes(amenity.id)}
                onCheckedChange={(checked) =>
                  handleAmenityChange(amenity.id, checked === true)
                }
              />
              <Label
                htmlFor={`amenity-${amenity.id}`}
                className="cursor-pointer text-sm font-normal"
              >
                <span className="mr-1">{amenity.icon}</span>
                {amenity.label}
              </Label>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
