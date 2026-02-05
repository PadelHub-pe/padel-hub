"use client";

import type { Control } from "react-hook-form";
import { Checkbox } from "@wifo/ui/checkbox";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@wifo/ui/form";
import { Input } from "@wifo/ui/input";
import { Textarea } from "@wifo/ui/textarea";

import { AMENITIES } from "~/lib/constants/amenities";
import type { FacilityInfoFormValues } from "./onboarding-wizard";

interface StepFacilityInfoProps {
  control: Control<FacilityInfoFormValues>;
}

export function StepFacilityInfo({ control }: StepFacilityInfoProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          Información del Local
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Ingresa los datos básicos de tu centro de padel.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Facility Name */}
        <FormField
          control={control}
          name="name"
          render={({ field }) => (
            <FormItem className="sm:col-span-2">
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

        {/* Description */}
        <FormField
          control={control}
          name="description"
          render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe tu centro de padel, instalaciones, servicios especiales, etc."
                  rows={3}
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
            <FormItem className="sm:col-span-2">
              <FormLabel>
                Dirección <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input type="text" placeholder="Av. José Pardo 620" {...field} />
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
                <Input type="text" placeholder="Miraflores" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* City */}
        <FormField
          control={control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ciudad</FormLabel>
              <FormControl>
                <Input type="text" placeholder="Lima" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Phone */}
        <FormField
          control={control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Teléfono del local <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input type="tel" placeholder="+51 1 234 5678" {...field} />
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
              <FormLabel>Correo electrónico</FormLabel>
              <FormControl>
                <Input type="email" placeholder="info@miclub.pe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Website */}
        <FormField
          control={control}
          name="website"
          render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel>Sitio web</FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder="https://www.miclub.pe"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Amenities */}
        <FormField
          control={control}
          name="amenities"
          render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel>Servicios y comodidades</FormLabel>
              <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
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
                      {amenity.label}
                    </FormLabel>
                  </div>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
