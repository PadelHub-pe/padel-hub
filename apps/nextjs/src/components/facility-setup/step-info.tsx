"use client";

import type { Control } from "react-hook-form";
import { useWatch } from "react-hook-form";

import { cn } from "@wifo/ui";
import { Checkbox } from "@wifo/ui/checkbox";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@wifo/ui/form";
import { Input } from "@wifo/ui/input";
import { Label } from "@wifo/ui/label";

import { AddressMapPreview } from "~/components/address-map-preview";
import { DistrictSelector } from "~/components/district-selector";

export interface InfoFormValues {
  name: string;
  address: string;
  district: string;
  phone: string;
  email: string;
  allowedDurationMinutes: number[];
}

const DURATION_OPTIONS = [
  { value: 60, label: "60 minutos", description: "1 hora" },
  { value: 90, label: "90 minutos", description: "1.5 horas" },
  { value: 120, label: "120 minutos", description: "2 horas" },
] as const;

interface StepInfoProps {
  control: Control<InfoFormValues>;
}

const noop = (_lat: number, _lng: number) => {
  // Map preview only — coordinates not persisted during setup
};

export function StepInfo({ control }: StepInfoProps) {
  const watchedAddress = useWatch({ control, name: "address" });
  const watchedDistrict = useWatch({ control, name: "district" });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          Información del Local
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Completa los datos de tu local. Esta información será visible para los
          jugadores.
        </p>
      </div>

      {/* Name */}
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Nombre del local <span className="text-red-500">*</span>
            </FormLabel>
            <FormControl>
              <Input
                type="text"
                placeholder="Padel Club Miraflores"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Address */}
      <FormField
        control={control}
        name="address"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Dirección <span className="text-red-500">*</span>
            </FormLabel>
            <FormControl>
              <Input
                type="text"
                placeholder="Av. Javier Prado Este 1234"
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
        name="district"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Distrito <span className="text-red-500">*</span>
            </FormLabel>
            <FormControl>
              <DistrictSelector
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Map Preview */}
      <AddressMapPreview
        address={watchedAddress}
        district={watchedDistrict}
        onGeocode={noop}
      />

      {/* Phone */}
      <FormField
        control={control}
        name="phone"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Teléfono <span className="text-red-500">*</span>
            </FormLabel>
            <FormControl>
              <Input type="tel" placeholder="+51 999 888 777" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Email */}
      <FormField
        control={control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email (opcional)</FormLabel>
            <FormControl>
              <Input type="email" placeholder="contacto@miclub.pe" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Divider */}
      <div className="border-t border-gray-200" />

      {/* Booking Duration */}
      <FormField
        control={control}
        name="allowedDurationMinutes"
        render={({ field }) => (
          <FormItem>
            <div>
              <FormLabel>
                Duración de reservas <span className="text-red-500">*</span>
              </FormLabel>
              <p className="mt-1 text-sm text-gray-500">
                Selecciona las duraciones que ofreces para las reservas.
              </p>
            </div>
            <div className="mt-3 space-y-3">
              {DURATION_OPTIONS.map((option) => {
                const isChecked = field.value.includes(option.value);
                return (
                  <div
                    key={option.value}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-3 transition-colors",
                      isChecked
                        ? "border-blue-300 bg-blue-50"
                        : "border-gray-200 bg-white",
                    )}
                  >
                    <Checkbox
                      id={`duration-${option.value}`}
                      checked={isChecked}
                      onCheckedChange={(checked) => {
                        const current = field.value;
                        if (checked) {
                          field.onChange([...current, option.value].sort());
                        } else {
                          const next = current.filter(
                            (v) => v !== option.value,
                          );
                          if (next.length > 0) {
                            field.onChange(next);
                          }
                        }
                      }}
                    />
                    <Label
                      htmlFor={`duration-${option.value}`}
                      className="flex cursor-pointer items-baseline gap-2 font-normal"
                    >
                      <span className="font-medium text-gray-900">
                        {option.label}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({option.description})
                      </span>
                    </Label>
                  </div>
                );
              })}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
