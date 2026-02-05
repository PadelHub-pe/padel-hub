"use client";

import type { Control } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@wifo/ui/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@wifo/ui/form";
import { Input } from "@wifo/ui/input";

import type { FacilityFormValues } from "./facility-edit-form";

interface LocationFormProps {
  control: Control<FacilityFormValues>;
}

export function LocationForm({ control }: LocationFormProps) {
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
          <FormField
            control={control}
            name="address.street"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>
                  Dirección <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="Av. José Pardo 620"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* District */}
          <FormField
            control={control}
            name="address.district"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Distrito <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input type="text" placeholder="Miraflores" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* City */}
          <FormField
            control={control}
            name="address.city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Ciudad <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input type="text" placeholder="Lima" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
