"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "@wifo/ui/toast";

import { useTRPC } from "~/trpc/react";
import { CourtBasicInfoForm } from "./court-basic-info-form";
import { CourtImageForm } from "./court-image-form";
import { EditHeader } from "./edit-header";

interface CourtEditFormProps {
  id: string;
}

interface CourtEditData {
  name: string;
  type: "indoor" | "outdoor";
  status: "active" | "maintenance" | "inactive";
  description: string;
  priceInCents: number | null;
  imageUrl: string;
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

export function CourtEditForm({ id }: CourtEditFormProps) {
  const router = useRouter();
  const trpc = useTRPC();

  const { data: court } = useSuspenseQuery(
    trpc.court.getById.queryOptions({ id }),
  );

  const [formData, setFormData] = useState<CourtEditData>(() => ({
    name: court.name,
    type: court.type,
    status: court.status,
    description: court.description ?? "",
    priceInCents: court.priceInCents,
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

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim() || formData.name.length < 2) {
      newErrors.name = "El nombre debe tener al menos 2 caracteres";
    }
    if (formData.imageUrl && !isValidUrl(formData.imageUrl)) {
      newErrors.imageUrl = "URL de imagen inválida";
    }
    if (formData.priceInCents !== null && formData.priceInCents < 0) {
      newErrors.priceInCents = "El precio no puede ser negativo";
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
        imageUrl: formData.imageUrl || undefined,
      },
    });
  }

  function handleFieldChange(
    field: keyof CourtEditData,
    value: string | number | null,
  ) {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

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
      <EditHeader
        courtId={id}
        courtName={court.name}
        isSaving={updateMutation.isPending}
        onSave={handleSave}
      />

      <div className="mt-8 space-y-6">
        <CourtBasicInfoForm
          name={formData.name}
          type={formData.type}
          status={formData.status}
          description={formData.description}
          priceInCents={formData.priceInCents}
          errors={errors}
          onChange={handleFieldChange}
        />

        <CourtImageForm
          imageUrl={formData.imageUrl}
          errors={errors}
          onChange={(value) => handleFieldChange("imageUrl", value)}
        />
      </div>
    </div>
  );
}
