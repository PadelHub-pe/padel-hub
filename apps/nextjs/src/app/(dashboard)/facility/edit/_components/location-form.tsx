"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@wifo/ui/card";
import { Input } from "@wifo/ui/input";
import { Label } from "@wifo/ui/label";

interface LocationFormProps {
  street: string;
  district: string;
  city: string;
  errors: Record<string, string>;
  onChange: (field: string, value: string) => void;
}

export function LocationForm({
  street,
  district,
  city,
  errors,
  onChange,
}: LocationFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">
          Ubicación
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Address */}
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="street">
              Dirección <span className="text-red-500">*</span>
            </Label>
            <Input
              id="street"
              type="text"
              placeholder="Av. José Pardo 620"
              value={street}
              onChange={(e) => onChange("street", e.target.value)}
              className={errors.street ? "border-red-500" : ""}
            />
            {errors.street && (
              <p className="text-sm text-red-500">{errors.street}</p>
            )}
          </div>

          {/* District */}
          <div className="space-y-2">
            <Label htmlFor="district">
              Distrito <span className="text-red-500">*</span>
            </Label>
            <Input
              id="district"
              type="text"
              placeholder="Miraflores"
              value={district}
              onChange={(e) => onChange("district", e.target.value)}
              className={errors.district ? "border-red-500" : ""}
            />
            {errors.district && (
              <p className="text-sm text-red-500">{errors.district}</p>
            )}
          </div>

          {/* City */}
          <div className="space-y-2">
            <Label htmlFor="city">
              Ciudad <span className="text-red-500">*</span>
            </Label>
            <Input
              id="city"
              type="text"
              placeholder="Lima"
              value={city}
              onChange={(e) => onChange("city", e.target.value)}
              className={errors.city ? "border-red-500" : ""}
            />
            {errors.city && (
              <p className="text-sm text-red-500">{errors.city}</p>
            )}
          </div>
        </div>

        {/* Map Placeholder */}
        <div className="flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50">
          <div className="text-center">
            <MapIcon className="mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">
              Mapa de ubicación próximamente
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MapIcon({ className }: { className?: string }) {
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
