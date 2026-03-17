"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

import { ImageUpload } from "~/components/images/ImageUpload";
import { useUnsavedChanges } from "~/hooks";
import { useTRPC } from "~/trpc/react";

const profileSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100),
  phone: z
    .string()
    .max(20, "Máximo 20 caracteres")
    .optional()
    .or(z.literal("")),
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
  const router = useRouter();

  const { data: profile } = useSuspenseQuery(
    trpc.account.getMyProfile.queryOptions(),
  );

  const [avatarValue, setAvatarValue] = useState<string[]>(
    profile.image ? [profile.image] : [],
  );

  function handleAvatarChange(ids: string[]) {
    setAvatarValue(ids);
    void queryClient.invalidateQueries(
      trpc.account.getMyProfile.queryOptions(),
    );
    // Re-render server layout so sidebar avatar updates
    router.refresh();
  }

  const form = useForm<ProfileFormValues>({
    resolver: standardSchemaResolver(profileSchema),
    defaultValues: {
      name: profile.name,
      phone: profile.phone ?? "",
    },
  });

  useUnsavedChanges(form.formState.isDirty);

  const updateProfile = useMutation(
    trpc.account.updateMyProfile.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries(
          trpc.account.getMyProfile.queryOptions(),
        );
        form.reset(form.getValues());
        toast.success("Perfil actualizado");
        // Re-render server layout so sidebar name/avatar updates
        router.refresh();
      },
      onError: (error) => {
        form.setError("root", { message: error.message });
      },
    }),
  );

  function onSubmit(values: ProfileFormValues) {
    updateProfile.mutate({
      name: values.name,
      phone: values.phone !== "" ? values.phone : null,
    });
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
        <div className="mb-8">
          <p className="mb-2 text-sm font-medium text-gray-900">
            Foto de perfil
          </p>
          <div className="flex items-center gap-5">
            <div className="relative h-20 w-20">
              {avatarValue.length > 0 ? (
                <ImageUpload
                  entityType="user"
                  entityId={profile.id}
                  mode="single"
                  value={avatarValue}
                  onChange={handleAvatarChange}
                  variant="avatar"
                  aspectRatio="1/1"
                  placeholder=""
                  className="[&_img]:rounded-full"
                />
              ) : (
                <div className="relative h-full w-full">
                  <div className="from-primary-500 to-primary-700 flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br text-2xl font-bold text-white">
                    {initials}
                  </div>
                  <div className="absolute inset-0">
                    <ImageUpload
                      entityType="user"
                      entityId={profile.id}
                      mode="single"
                      value={avatarValue}
                      onChange={handleAvatarChange}
                      variant="avatar"
                      aspectRatio="1/1"
                      placeholder=""
                      className="h-full w-full rounded-full opacity-0 hover:opacity-100 [&>div]:rounded-full"
                    />
                  </div>
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {profile.name}
              </p>
              {profile.authProvider === "google" && !profile.image && (
                <p className="text-xs text-gray-500">
                  Sube una foto o usaremos tu avatar de Google
                </p>
              )}
              {!profile.image && profile.authProvider !== "google" && (
                <p className="text-xs text-gray-500">
                  Haz clic para subir una foto
                </p>
              )}
            </div>
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
                Para cambiar tu email, contacta a soporte
              </p>
            </div>

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl>
                    <Input placeholder="+51 999 888 777" {...field} />
                  </FormControl>
                  <p className="text-xs text-gray-400">
                    Formato sugerido: +51 999 888 777
                  </p>
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
