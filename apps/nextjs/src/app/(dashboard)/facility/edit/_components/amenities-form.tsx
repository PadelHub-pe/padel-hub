"use client";

import type { Control } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@wifo/ui/card";
import { Checkbox } from "@wifo/ui/checkbox";
import { FormField, FormItem, FormLabel } from "@wifo/ui/form";

import { AMENITIES } from "~/lib/constants/amenities";
import type { FacilityFormValues } from "./facility-edit-form";

interface AmenitiesFormProps {
  control: Control<FacilityFormValues>;
}

export function AmenitiesForm({ control }: AmenitiesFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">
          Servicios y Comodidades
        </CardTitle>
      </CardHeader>
      <CardContent>
        <FormField
          control={control}
          name="amenities"
          render={({ field }) => (
            <FormItem>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {AMENITIES.map((amenity) => (
                  <div key={amenity.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`amenity-${amenity.id}`}
                      checked={field.value.includes(amenity.id)}
                      onCheckedChange={(checked) => {
                        const newValue = checked
                          ? [...field.value, amenity.id]
                          : field.value.filter((id) => id !== amenity.id);
                        field.onChange(newValue);
                      }}
                    />
                    <FormLabel
                      htmlFor={`amenity-${amenity.id}`}
                      className="cursor-pointer text-sm font-normal"
                    >
                      <span className="mr-1">{amenity.icon}</span>
                      {amenity.label}
                    </FormLabel>
                  </div>
                ))}
              </div>
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
