"use client";

import type { Control } from "react-hook-form";
import { useWatch } from "react-hook-form";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@wifo/ui/select";
import { Textarea } from "@wifo/ui/textarea";

import type { CourtEditFormValues } from "../edit/_components/court-edit-form";

interface BasicInfoSectionProps {
  control: Control<CourtEditFormValues>;
}

export function BasicInfoSection({ control }: BasicInfoSectionProps) {
  const description = useWatch({ control, name: "description" }) ?? "";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">
          Información Básica
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Court Name */}
          <FormField
            control={control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Nombre de la cancha <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input type="text" placeholder="Cancha 1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Status */}
          <FormField
            control={control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el estado" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-green-500" />
                        Activa
                      </span>
                    </SelectItem>
                    <SelectItem value="maintenance">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-amber-500" />
                        Mantenimiento
                      </span>
                    </SelectItem>
                    <SelectItem value="inactive">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-red-500" />
                        Inactiva
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Description */}
        <FormField
          control={control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Cancha profesional con paredes de cristal panorámico y sistema de iluminación LED."
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
              <FormDescription>
                {description.length}/500 caracteres
              </FormDescription>
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
