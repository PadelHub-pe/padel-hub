"use client";

import { useRouter } from "next/navigation";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { Form } from "@wifo/ui/form";
import { toast } from "@wifo/ui/toast";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useTRPC } from "~/trpc/react";
import { AmenitiesForm } from "./amenities-form";
import { BasicInfoForm } from "./basic-info-form";
import { EditHeader } from "./edit-header";
import { LocationForm } from "./location-form";
import { PhotosForm } from "./photos-form";

const facilitySchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  phone: z.string().min(1, "El teléfono es requerido"),
  email: z.string().email("Correo electrónico inválido").or(z.literal("")),
  website: z.string().url("URL inválida").or(z.literal("")),
  description: z.string().optional(),
  address: z.object({
    street: z.string().min(1, "La dirección es requerida"),
    district: z.string().min(1, "El distrito es requerido"),
    city: z.string().min(1, "La ciudad es requerida"),
  }),
  amenities: z.array(z.string()),
});

export type FacilityFormValues = z.infer<typeof facilitySchema>;

export function FacilityEditForm() {
  const router = useRouter();
  const trpc = useTRPC();

  const { data: profile } = useSuspenseQuery(
    trpc.facility.getProfile.queryOptions(),
  );

  const form = useForm<FacilityFormValues>({
    resolver: standardSchemaResolver(facilitySchema),
    defaultValues: {
      name: profile.name,
      phone: profile.phone,
      email: profile.email,
      website: profile.website,
      description: profile.description,
      address: {
        street: profile.address.street,
        district: profile.address.district,
        city: profile.address.city,
      },
      amenities: profile.amenities,
    },
  });

  const updateMutation = useMutation(
    trpc.facility.updateProfile.mutationOptions({
      onSuccess: () => {
        toast.success("Perfil actualizado correctamente");
        router.push("/facility");
      },
      onError: (error) => {
        form.setError("root", {
          message: error.message || "Error al guardar los cambios",
        });
      },
    }),
  );

  function onSubmit(values: FacilityFormValues) {
    updateMutation.mutate({
      name: values.name,
      phone: values.phone,
      email: values.email,
      website: values.website,
      description: values.description,
      address: values.address,
      amenities: values.amenities,
    });
  }

  return (
    <div className="p-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <EditHeader isSaving={updateMutation.isPending} />

          {form.formState.errors.root && (
            <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
              {form.formState.errors.root.message}
            </div>
          )}

          <div className="mt-8 space-y-6">
            <BasicInfoForm control={form.control} />
            <LocationForm control={form.control} />
            <PhotosForm />
            <AmenitiesForm control={form.control} />
          </div>
        </form>
      </Form>
    </div>
  );
}
