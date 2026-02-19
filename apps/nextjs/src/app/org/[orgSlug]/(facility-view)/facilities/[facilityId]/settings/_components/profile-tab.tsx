"use client";

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
import { toast } from "@wifo/ui/toast";

import { useTRPC } from "~/trpc/react";

const profileSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const ROLE_LABELS: Record<string, string> = {
  org_admin: "Administrador",
  facility_manager: "Gerente",
  staff: "Staff",
};

const ROLE_COLORS: Record<string, string> = {
  org_admin: "bg-error-light text-error-dark",
  facility_manager: "bg-info-light text-info-dark",
  staff: "bg-gray-100 text-gray-700",
};

export function ProfileTab() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: profile } = useSuspenseQuery(
    trpc.account.getMyProfile.queryOptions(),
  );

  const form = useForm<ProfileFormValues>({
    resolver: standardSchemaResolver(profileSchema),
    defaultValues: {
      name: profile.name,
    },
  });

  const updateProfile = useMutation(
    trpc.account.updateMyProfile.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries(
          trpc.account.getMyProfile.queryOptions(),
        );
        toast.success("Perfil actualizado");
      },
      onError: (error) => {
        form.setError("root", { message: error.message });
      },
    }),
  );

  function onSubmit(values: ProfileFormValues) {
    updateProfile.mutate({ name: values.name });
  }

  const initials = profile.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="max-w-2xl space-y-8">
      {/* Personal Information */}
      <div>
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Información Personal
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Actualiza tu información de perfil
          </p>
        </div>

        {/* Avatar */}
        <div className="mb-8 flex items-center gap-4">
          <div className="from-primary-500 to-primary-700 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br text-xl font-bold text-white">
            {initials}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{profile.name}</p>
            <p className="text-xs text-gray-500">
              La carga de foto estará disponible próximamente
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
                  <FormLabel>Nombre completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Juan Pérez" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <Input
                value={profile.email}
                disabled
                className="mt-1.5 bg-gray-50"
              />
              <p className="mt-1 text-xs text-gray-400">
                El email no puede ser modificado desde aquí
              </p>
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

      {/* Access Information */}
      {profile.organization && profile.role && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
          <h3 className="text-sm font-semibold text-gray-900">Tu Acceso</h3>
          <p className="mt-1 text-xs text-gray-500">
            Información de tu rol y permisos en la organización
          </p>

          <div className="mt-5 space-y-4">
            {/* Organization */}
            <div className="flex items-center gap-3">
              <div className="from-primary-500 to-primary-700 flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br text-xs font-bold text-white">
                {profile.organization.name
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {profile.organization.name}
                </p>
                <p className="text-xs text-gray-500">Organización</p>
              </div>
            </div>

            {/* Role */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">Rol:</span>
              <Badge className={ROLE_COLORS[profile.role]}>
                {ROLE_LABELS[profile.role] ?? profile.role}
              </Badge>
            </div>

            {/* Assigned Facilities */}
            {profile.facilityNames.length > 0 && (
              <div>
                <p className="mb-2 text-sm text-gray-600">Locales asignados:</p>
                <div className="flex flex-wrap gap-2">
                  {profile.facilityNames.map((name) => (
                    <span
                      key={name}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700 ring-1 ring-gray-200"
                    >
                      <span className="from-secondary-400 to-secondary-600 h-2 w-2 rounded-full bg-gradient-to-br" />
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {profile.role === "org_admin" &&
              profile.facilityNames.length === 0 && (
                <p className="text-xs text-gray-500">
                  Como administrador, tienes acceso a todos los locales
                </p>
              )}
          </div>

          <p className="mt-5 text-xs text-gray-400">
            Contacta a tu Administrador para cambiar asignaciones
          </p>
        </div>
      )}
    </div>
  );
}
