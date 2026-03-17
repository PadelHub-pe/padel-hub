"use client";

import Link from "next/link";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Badge } from "@wifo/ui/badge";
import { Button } from "@wifo/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@wifo/ui/form";
import { Input } from "@wifo/ui/input";
import { Textarea } from "@wifo/ui/textarea";
import { toast } from "@wifo/ui/toast";

import { useFacilityContext, useUnsavedChanges } from "~/hooks";
import { useTRPC } from "~/trpc/react";

const facilityInfoSchema = z.object({
  name: z
    .string()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(100),
  phone: z.string().min(1, "El teléfono es requerido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  address: z.object({
    street: z.string().min(1, "La dirección es requerida"),
    district: z.string().min(1, "El distrito es requerido"),
    city: z.string().min(1, "La ciudad es requerida"),
  }),
  description: z
    .string()
    .max(500, "Máximo 500 caracteres")
    .optional()
    .or(z.literal("")),
});

type FacilityInfoFormValues = z.infer<typeof facilityInfoSchema>;

interface FacilityInfoTabProps {
  facilityId: string;
}

export function FacilityInfoTab({ facilityId }: FacilityInfoTabProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { basePath } = useFacilityContext();

  const { data: facility } = useSuspenseQuery(
    trpc.facility.getProfile.queryOptions({ facilityId }),
  );

  const form = useForm<FacilityInfoFormValues>({
    resolver: standardSchemaResolver(facilityInfoSchema),
    defaultValues: {
      name: facility.name,
      phone: facility.phone,
      email: facility.email,
      address: facility.address,
      description: facility.description,
    },
  });

  useUnsavedChanges(form.formState.isDirty);

  const updateProfile = useMutation(
    trpc.facility.updateProfile.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries(
          trpc.facility.getProfile.queryOptions({ facilityId }),
        );
        form.reset(form.getValues());
        toast.success("Local actualizado");
      },
      onError: (error) => {
        form.setError("root", { message: error.message });
      },
    }),
  );

  function onSubmit(values: FacilityInfoFormValues) {
    updateProfile.mutate({
      facilityId,
      name: values.name,
      phone: values.phone,
      email: values.email ?? undefined,
      address: values.address,
      description: values.description ?? undefined,
      amenities: facility.amenities,
    });
  }

  const initials = facility.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="from-secondary-400 to-secondary-600 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br text-lg font-bold text-white">
          {initials}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-900">
              {facility.name}
            </h2>
            <Badge variant="secondary" className="text-[10px]">
              Editando
            </Badge>
          </div>
          <p className="text-sm text-gray-500">Local actual</p>
        </div>
      </div>

      {/* Editable Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre del local</FormLabel>
                <FormControl>
                  <Input placeholder="PadelHub Arena" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl>
                    <Input placeholder="+51 999 888 777" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="contacto@ejemplo.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="address.street"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dirección</FormLabel>
                <FormControl>
                  <Input placeholder="Av. Example 123" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="address.district"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Distrito</FormLabel>
                  <FormControl>
                    <Input placeholder="Miraflores" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address.city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ciudad</FormLabel>
                  <FormControl>
                    <Input placeholder="Lima" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe tu local..."
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {form.formState.errors.root && (
            <div className="text-sm text-red-500">
              {form.formState.errors.root.message}
            </div>
          )}

          <Button
            type="submit"
            disabled={updateProfile.isPending || !form.formState.isDirty}
          >
            {updateProfile.isPending ? "Guardando..." : "Guardar cambios"}
          </Button>
        </form>
      </Form>

      {/* Read-only Stats */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
        <h3 className="mb-4 text-sm font-semibold text-gray-900">
          Información del Local
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-500">Canchas</p>
            <p className="mt-1 text-sm font-semibold text-gray-900">
              {facility.courtCount}{" "}
              {facility.courtCount === 1 ? "cancha" : "canchas"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Tipo</p>
            <p className="mt-1 text-sm text-gray-700">
              {facility.indoorCount > 0 && `${facility.indoorCount} indoor`}
              {facility.indoorCount > 0 && facility.outdoorCount > 0 && " / "}
              {facility.outdoorCount > 0 && `${facility.outdoorCount} outdoor`}
              {facility.courtCount === 0 && "Sin canchas"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Estado</p>
            <div className="mt-1">
              {facility.isActive ? (
                <Badge className="bg-success-light text-success-dark">
                  Activo
                </Badge>
              ) : (
                <Badge className="bg-warning-light text-warning-dark">
                  Inactivo
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-gray-900">
          Accesos Rápidos
        </h3>
        <div className="flex flex-wrap gap-2">
          <Link href={`${basePath}/schedule`}>
            <Button variant="outline" size="sm">
              Horarios
            </Button>
          </Link>
          <Link href={`${basePath}/pricing`}>
            <Button variant="outline" size="sm">
              Precios
            </Button>
          </Link>
          <Link href={`${basePath}/courts`}>
            <Button variant="outline" size="sm">
              Canchas
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
