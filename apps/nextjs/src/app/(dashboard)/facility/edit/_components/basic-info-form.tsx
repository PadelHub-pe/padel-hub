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
import { Textarea } from "@wifo/ui/textarea";

import type { FacilityFormValues } from "./facility-edit-form";

interface BasicInfoFormProps {
  control: Control<FacilityFormValues>;
}

export function BasicInfoForm({ control }: BasicInfoFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">
          Información Básica
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
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
        </div>
      </CardContent>
    </Card>
  );
}
