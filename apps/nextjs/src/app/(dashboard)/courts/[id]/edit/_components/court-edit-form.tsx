"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "@wifo/ui/toast";

import { Button } from "@wifo/ui/button";

import { useTRPC } from "~/trpc/react";
import { BasicInfoSection } from "../../_components/basic-info-section";
import { CourtTypeSection } from "../../_components/court-type-section";
import { DangerZoneSection } from "../../_components/danger-zone-section";
import { PhotoSection } from "../../_components/photo-section";
import { PricingSection } from "../../_components/pricing-section";

interface CourtEditFormProps {
  id: string;
}

interface CourtFormData {
  name: string;
  status: "active" | "maintenance" | "inactive";
  description: string;
  type: "indoor" | "outdoor";
  priceInCents: number | null;
  peakPriceInCents: number | null;
  imageUrl: string;
}

export function CourtEditForm({ id }: CourtEditFormProps) {
  const router = useRouter();
  const trpc = useTRPC();

  const { data: court } = useSuspenseQuery(
    trpc.court.getById.queryOptions({ id }),
  );

  const [formData, setFormData] = useState<CourtFormData>(() => ({
    name: court.name,
    status: court.status,
    description: court.description ?? "",
    type: court.type,
    priceInCents: court.priceInCents,
    peakPriceInCents: court.peakPriceInCents,
    imageUrl: court.imageUrl ?? "",
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateMutation = useMutation(
    trpc.court.update.mutationOptions({
      onSuccess: () => {
        toast.success("Cancha actualizada correctamente");
        router.push(`/courts/${id}`);
      },
      onError: (error) => {
        toast.error(error.message || "Error al guardar los cambios");
      },
    }),
  );

  const deleteMutation = useMutation(
    trpc.court.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Cancha eliminada correctamente");
        router.push("/courts");
      },
      onError: (error) => {
        toast.error(error.message || "Error al eliminar la cancha");
      },
    }),
  );

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim() || formData.name.length < 2) {
      newErrors.name = "El nombre debe tener al menos 2 caracteres";
    }
    if (formData.name.length > 50) {
      newErrors.name = "El nombre no puede exceder 50 caracteres";
    }
    if (formData.description.length > 500) {
      newErrors.description = "La descripción no puede exceder 500 caracteres";
    }
    if (formData.imageUrl && !isValidUrl(formData.imageUrl)) {
      newErrors.imageUrl = "URL de imagen inválida";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSave() {
    if (!validateForm()) return;

    updateMutation.mutate({
      id,
      data: {
        name: formData.name,
        type: formData.type,
        status: formData.status,
        description: formData.description || undefined,
        priceInCents: formData.priceInCents ?? undefined,
        peakPriceInCents: formData.peakPriceInCents ?? undefined,
        imageUrl: formData.imageUrl || undefined,
      },
    });
  }

  function handleDelete() {
    deleteMutation.mutate({ id });
  }

  function handleChange<K extends keyof CourtFormData>(
    field: K,
    value: CourtFormData[K],
  ) {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/courts" className="hover:text-gray-700">
          Canchas
        </Link>
        <span>/</span>
        <Link href={`/courts/${id}`} className="hover:text-gray-700">
          {court.name}
        </Link>
        <span>/</span>
        <span className="text-gray-900">Editar</span>
      </nav>

      {/* Header */}
      <header className="mt-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">
          Editar {court.name}
        </h1>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link href={`/courts/${id}`}>Cancelar</Link>
          </Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      </header>

      {/* Form Sections */}
      <div className="mt-8 space-y-6">
        <BasicInfoSection
          name={formData.name}
          status={formData.status}
          description={formData.description}
          errors={errors}
          onChange={(field, value) => {
            if (field === "status") {
              handleChange("status", value as "active" | "maintenance" | "inactive");
            } else {
              handleChange(field, value);
            }
          }}
        />

        <CourtTypeSection
          type={formData.type}
          onChange={(type) => handleChange("type", type)}
        />

        <PricingSection
          priceInCents={formData.priceInCents}
          peakPriceInCents={formData.peakPriceInCents}
          errors={errors}
          onChange={handleChange}
        />

        <PhotoSection
          imageUrl={formData.imageUrl}
          errors={errors}
          onChange={(url) => handleChange("imageUrl", url)}
        />

        <DangerZoneSection
          courtName={court.name}
          isDeleting={deleteMutation.isPending}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}

function isValidUrl(url: string): boolean {
  if (!url) return true;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
