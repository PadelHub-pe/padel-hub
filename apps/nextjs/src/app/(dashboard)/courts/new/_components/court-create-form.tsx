"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "@wifo/ui/toast";

import { Button } from "@wifo/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@wifo/ui/card";
import { Input } from "@wifo/ui/input";
import { Label } from "@wifo/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@wifo/ui/select";
import { Textarea } from "@wifo/ui/textarea";
import { cn } from "@wifo/ui";

import { useTRPC } from "~/trpc/react";

interface CourtFormData {
  name: string;
  status: "active" | "maintenance" | "inactive";
  description: string;
  type: "indoor" | "outdoor";
  priceInCents: number | null;
  peakPriceInCents: number | null;
  imageUrl: string;
}

const courtTypes = [
  {
    value: "indoor" as const,
    label: "Indoor",
    description: "Cancha techada",
    icon: "🏠",
  },
  {
    value: "outdoor" as const,
    label: "Outdoor",
    description: "Al aire libre",
    icon: "☀️",
  },
];

export function CourtCreateForm() {
  const router = useRouter();
  const trpc = useTRPC();

  const [formData, setFormData] = useState<CourtFormData>({
    name: "",
    status: "active",
    description: "",
    type: "indoor",
    priceInCents: null,
    peakPriceInCents: null,
    imageUrl: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useMutation(
    trpc.court.create.mutationOptions({
      onSuccess: (court) => {
        toast.success("Cancha creada correctamente");
        router.push(`/courts/${court.id}`);
      },
      onError: (error) => {
        toast.error(error.message || "Error al crear la cancha");
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
    if (formData.priceInCents === null) {
      newErrors.priceInCents = "La tarifa estándar es requerida";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSave() {
    if (!validateForm()) return;

    createMutation.mutate({
      name: formData.name,
      type: formData.type,
      status: formData.status,
      description: formData.description || undefined,
      priceInCents: formData.priceInCents ?? undefined,
      peakPriceInCents: formData.peakPriceInCents ?? undefined,
      imageUrl: formData.imageUrl || undefined,
    });
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

  function handlePriceChange(field: "priceInCents" | "peakPriceInCents", value: string) {
    if (value === "") {
      handleChange(field, null);
    } else {
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue >= 0) {
        handleChange(field, Math.round(numValue * 100));
      }
    }
  }

  const standardPrice = formData.priceInCents !== null ? formData.priceInCents / 100 : "";
  const peakPrice = formData.peakPriceInCents !== null ? formData.peakPriceInCents / 100 : "";

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/courts" className="hover:text-gray-700">
          Canchas
        </Link>
        <span>/</span>
        <span className="text-gray-900">Nueva Cancha</span>
      </nav>

      {/* Header */}
      <header className="mt-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Nueva Cancha</h1>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link href="/courts">Cancelar</Link>
          </Button>
          <Button onClick={handleSave} disabled={createMutation.isPending}>
            {createMutation.isPending ? "Creando..." : "Crear Cancha"}
          </Button>
        </div>
      </header>

      {/* Form Sections */}
      <div className="mt-8 space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Información Básica
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nombre de la cancha <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Cancha 1"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    handleChange("status", value as "active" | "maintenance" | "inactive")
                  }
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Selecciona el estado" />
                  </SelectTrigger>
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
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                placeholder="Cancha profesional con paredes de cristal panorámico y sistema de iluminación LED."
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                rows={3}
                className={errors.description ? "border-red-500" : ""}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description}</p>
              )}
              <p className="text-xs text-gray-500">
                {formData.description.length}/500 caracteres
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Court Type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Tipo de Cancha
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {courtTypes.map((courtType) => (
                <button
                  key={courtType.value}
                  type="button"
                  onClick={() => handleChange("type", courtType.value)}
                  className={cn(
                    "flex flex-col items-center rounded-lg border-2 p-4 transition-all",
                    formData.type === courtType.value
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-gray-200 text-gray-700 hover:bg-gray-50",
                  )}
                >
                  <span className="text-3xl">{courtType.icon}</span>
                  <span
                    className={cn(
                      "mt-2 font-medium",
                      formData.type === courtType.value ? "text-primary" : "text-gray-900",
                    )}
                  >
                    {courtType.label}
                  </span>
                  <span className="mt-0.5 text-xs text-gray-500">
                    {courtType.description}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Precios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="standardRate">
                  Tarifa Estándar <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    S/
                  </span>
                  <Input
                    id="standardRate"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="80.00"
                    value={standardPrice}
                    onChange={(e) => handlePriceChange("priceInCents", e.target.value)}
                    className={cn("pl-9", errors.priceInCents ? "border-red-500" : "")}
                  />
                </div>
                {errors.priceInCents && (
                  <p className="text-sm text-red-500">{errors.priceInCents}</p>
                )}
                <p className="text-xs text-gray-500">Precio por hora (horario regular)</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="peakRate">Tarifa Horario Pico</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    S/
                  </span>
                  <Input
                    id="peakRate"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="100.00"
                    value={peakPrice}
                    onChange={(e) => handlePriceChange("peakPriceInCents", e.target.value)}
                    className="pl-9"
                  />
                </div>
                <p className="text-xs text-gray-500">Precio por hora (horario pico)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Photo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Foto de la Cancha
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className={cn(
                "relative h-48 overflow-hidden rounded-lg border-2 border-dashed",
                formData.imageUrl ? "border-transparent" : "border-gray-300 bg-gray-50",
              )}
            >
              {formData.imageUrl ? (
                <div
                  className="h-full w-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${formData.imageUrl})` }}
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-gray-400">
                  <ImageIcon className="h-12 w-12" />
                  <p className="mt-2 text-sm">Vista previa de imagen</p>
                  <p className="text-xs">Resolución mínima: 800×600px</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">URL de la imagen</Label>
              <Input
                id="imageUrl"
                type="url"
                placeholder="https://ejemplo.com/imagen-cancha.jpg"
                value={formData.imageUrl}
                onChange={(e) => handleChange("imageUrl", e.target.value)}
                className={errors.imageUrl ? "border-red-500" : ""}
              />
              {errors.imageUrl && (
                <p className="text-sm text-red-500">{errors.imageUrl}</p>
              )}
              <p className="text-xs text-gray-500">
                Formatos soportados: JPG, PNG, WebP
              </p>
            </div>
          </CardContent>
        </Card>
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

function ImageIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
      />
    </svg>
  );
}
