"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@wifo/ui/button";
import { Form } from "@wifo/ui/form";
import { toast } from "@wifo/ui/toast";

import { useTRPC } from "~/trpc/react";
import { BasicInfoSection } from "../../_components/basic-info-section";
import { CourtTypeSection } from "../../_components/court-type-section";
import { DangerZoneSection } from "../../_components/danger-zone-section";
import { PhotoSection } from "../../_components/photo-section";
import { PricingSection } from "../../_components/pricing-section";

interface CourtEditFormProps {
  id: string;
}

const courtEditSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(50, "El nombre no puede exceder 50 caracteres"),
  status: z.enum(["active", "maintenance", "inactive"]),
  description: z
    .string()
    .max(500, "La descripción no puede exceder 500 caracteres")
    .optional(),
  type: z.enum(["indoor", "outdoor"]),
  priceInSoles: z.string().optional(),
  peakPriceInSoles: z.string().optional(),
  imageUrl: z.string(),
});

export type CourtEditFormValues = z.infer<typeof courtEditSchema>;

export function CourtEditForm({ id }: CourtEditFormProps) {
  const router = useRouter();
  const params = useParams();
  const orgSlug = params.orgSlug as string;
  const facilityId = params.facilityId as string;
  const trpc = useTRPC();

  const basePath = `/org/${orgSlug}/facilities/${facilityId}`;

  const { data: court } = useSuspenseQuery(
    trpc.court.getById.queryOptions({ facilityId, id }),
  );

  const form = useForm<CourtEditFormValues>({
    resolver: standardSchemaResolver(courtEditSchema),
    defaultValues: {
      name: court.name,
      status: court.status,
      description: court.description ?? "",
      type: court.type,
      priceInSoles:
        court.priceInCents !== null ? String(court.priceInCents / 100) : "",
      peakPriceInSoles:
        court.peakPriceInCents !== null
          ? String(court.peakPriceInCents / 100)
          : "",
      imageUrl: court.imageUrl ?? "",
    },
  });

  const updateMutation = useMutation(
    trpc.court.update.mutationOptions({
      onSuccess: () => {
        toast.success("Cancha actualizada correctamente");
        router.push(`${basePath}/courts/${id}`);
      },
      onError: (error) => {
        form.setError("root", {
          message: error.message || "Error al guardar los cambios",
        });
      },
    }),
  );

  const deleteMutation = useMutation(
    trpc.court.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Cancha eliminada correctamente");
        router.push(`${basePath}/courts`);
      },
      onError: (error) => {
        toast.error(error.message || "Error al eliminar la cancha");
      },
    }),
  );

  function onSubmit(values: CourtEditFormValues) {
    const priceInCents =
      values.priceInSoles && values.priceInSoles !== ""
        ? Math.round(parseFloat(values.priceInSoles) * 100)
        : undefined;
    const peakPriceInCents =
      values.peakPriceInSoles && values.peakPriceInSoles !== ""
        ? Math.round(parseFloat(values.peakPriceInSoles) * 100)
        : undefined;

    updateMutation.mutate({
      facilityId,
      id,
      data: {
        name: values.name,
        type: values.type,
        status: values.status,
        description: values.description ?? undefined,
        priceInCents,
        peakPriceInCents,
        imageUrl: values.imageUrl || undefined,
      },
    });
  }

  function handleDelete() {
    deleteMutation.mutate({ facilityId, id });
  }

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <Link href={`${basePath}/courts`} className="hover:text-gray-700">
          Canchas
        </Link>
        <span>/</span>
        <Link href={`${basePath}/courts/${id}`} className="hover:text-gray-700">
          {court.name}
        </Link>
        <span>/</span>
        <span className="text-gray-900">Editar</span>
      </nav>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {/* Header */}
          <header className="mt-4 flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-900">
              Editar {court.name}
            </h1>
            <div className="flex gap-3">
              <Button variant="outline" asChild>
                <Link href={`${basePath}/courts/${id}`}>Cancelar</Link>
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </header>

          {form.formState.errors.root && (
            <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
              {form.formState.errors.root.message}
            </div>
          )}

          {/* Form Sections */}
          <div className="mt-8 space-y-6">
            <BasicInfoSection control={form.control} />
            <CourtTypeSection control={form.control} />
            <PricingSection control={form.control} />
            <PhotoSection control={form.control} courtId={id} />

            <DangerZoneSection
              courtName={court.name}
              isDeleting={deleteMutation.isPending}
              onDelete={handleDelete}
            />
          </div>
        </form>
      </Form>
    </div>
  );
}
