"use client";

import { cn } from "@wifo/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@wifo/ui/card";
import { Input } from "@wifo/ui/input";
import { Label } from "@wifo/ui/label";

interface PricingSectionProps {
  priceInCents: number | null;
  peakPriceInCents: number | null;
  errors: Record<string, string>;
  onChange: (
    field: "priceInCents" | "peakPriceInCents",
    value: number | null,
  ) => void;
}

export function PricingSection({
  priceInCents,
  peakPriceInCents,
  errors,
  onChange,
}: PricingSectionProps) {
  const standardPrice = priceInCents !== null ? priceInCents / 100 : "";
  const peakPrice = peakPriceInCents !== null ? peakPriceInCents / 100 : "";

  function handlePriceChange(field: "priceInCents" | "peakPriceInCents", value: string) {
    if (value === "") {
      onChange(field, null);
    } else {
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue >= 0) {
        onChange(field, Math.round(numValue * 100));
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">
          Precios
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Standard Rate */}
          <div className="space-y-2">
            <Label htmlFor="standardRate">
              Tarifa Estándar <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                S/
              </span>
              <Input
                id="standardRate"
                type="number"
                min="0"
                step="0.01"
                placeholder="80.00"
                value={standardPrice}
                onChange={(e) => handlePriceChange("priceInCents", e.target.value)}
                className={cn("pl-9", errors.priceInCents ? "border-red-500" : "")}
              />
            </div>
            {errors.priceInCents && (
              <p className="text-sm text-red-500">{errors.priceInCents}</p>
            )}
            <p className="text-xs text-gray-500">Precio por hora (horario regular)</p>
          </div>

          {/* Peak Rate */}
          <div className="space-y-2">
            <Label htmlFor="peakRate">Tarifa Horario Pico</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                S/
              </span>
              <Input
                id="peakRate"
                type="number"
                min="0"
                step="0.01"
                placeholder="100.00"
                value={peakPrice}
                onChange={(e) => handlePriceChange("peakPriceInCents", e.target.value)}
                className={cn("pl-9", errors.peakPriceInCents ? "border-red-500" : "")}
              />
            </div>
            {errors.peakPriceInCents && (
              <p className="text-sm text-red-500">{errors.peakPriceInCents}</p>
            )}
            <p className="text-xs text-gray-500">Precio por hora (horario pico)</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
