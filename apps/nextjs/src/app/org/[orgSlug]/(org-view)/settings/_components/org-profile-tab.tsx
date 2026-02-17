"use client";

import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
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
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useTRPC } from "~/trpc/react";

const orgProfileSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(200),
  description: z.string().max(500, "Máximo 500 caracteres").optional().or(z.literal("")),
  contactEmail: z.string().email("Email inválido").optional().or(z.literal("")),
  contactPhone: z.string().max(20).optional().or(z.literal("")),
});

type OrgProfileFormValues = z.infer<typeof orgProfileSchema>;

interface OrgProfileTabProps {
  organizationId: string;
}

export function OrgProfileTab({ organizationId }: OrgProfileTabProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: org } = useSuspenseQuery(
    trpc.org.getOrgProfile.queryOptions({ organizationId }),
  );

  const form = useForm<OrgProfileFormValues>({
    resolver: standardSchemaResolver(orgProfileSchema),
    defaultValues: {
      name: org.name,
      description: org.description ?? "",
      contactEmail: org.contactEmail ?? "",
      contactPhone: org.contactPhone ?? "",
    },
  });

  const updateProfile = useMutation(
    trpc.org.updateOrgProfile.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries(
          trpc.org.getOrgProfile.queryOptions({ organizationId }),
        );
        toast.success("Organización actualizada");
      },
      onError: (error) => {
        form.setError("root", { message: error.message });
      },
    }),
  );

  function onSubmit(values: OrgProfileFormValues) {
    updateProfile.mutate({
      organizationId,
      name: values.name,
      description: values.description || undefined,
      contactEmail: values.contactEmail || undefined,
      contactPhone: values.contactPhone || undefined,
    });
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Perfil de la Organización
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Información general de tu organización
        </p>
      </div>

      {/* Logo placeholder */}
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-xl font-bold text-white">
          {org.name
            .split(" ")
            .map((w) => w[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">{org.name}</p>
          <p className="text-xs text-gray-500">
            La carga de logo estará disponible próximamente
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre de la organización</FormLabel>
                <FormControl>
                  <Input placeholder="Mi Organización" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe tu organización..."
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="contactEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email de contacto</FormLabel>
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

            <FormField
              control={form.control}
              name="contactPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono de contacto</FormLabel>
                  <FormControl>
                    <Input placeholder="+51 999 888 777" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

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
    </div>
  );
}
