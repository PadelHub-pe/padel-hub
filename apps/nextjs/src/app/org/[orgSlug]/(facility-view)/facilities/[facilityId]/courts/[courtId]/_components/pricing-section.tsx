"use client";

import type { Control } from "react-hook-form";

import { Card, CardContent, CardHeader, CardTitle } from "@wifo/ui/card";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@wifo/ui/form";
import { Input } from "@wifo/ui/input";

import type { CourtEditFormValues } from "../edit/_components/court-edit-form";

interface PricingSectionProps {
  control: Control<CourtEditFormValues>;
}

export function PricingSection({ control }: PricingSectionProps) {
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
          <FormField
            control={control}
            name="priceInSoles"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Tarifa Estándar <span className="text-red-500">*</span>
                </FormLabel>
                <div className="relative">
                  <span className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-500">
                    S/
                  </span>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="80.00"
                      className="pl-9"
                      {...field}
                    />
                  </FormControl>
                </div>
                <FormMessage />
                <FormDescription>
                  Precio por hora (horario regular)
                </FormDescription>
              </FormItem>
            )}
          />

          {/* Peak Rate */}
          <FormField
            control={control}
            name="peakPriceInSoles"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tarifa Horario Pico</FormLabel>
                <div className="relative">
                  <span className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-500">
                    S/
                  </span>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="100.00"
                      className="pl-9"
                      {...field}
                    />
                  </FormControl>
                </div>
                <FormMessage />
                <FormDescription>
                  Precio por hora (horario pico)
                </FormDescription>
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}
