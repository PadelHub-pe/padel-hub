"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { cn } from "@wifo/ui";
import { Button } from "@wifo/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@wifo/ui/card";
import {
  Form,
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
import { toast } from "@wifo/ui/toast";

import { useTRPC } from "~/trpc/react";

const courtSchema = z.object({
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
  priceInSoles: z.string().min(1, "La tarifa estándar es requerida"),
  peakPriceInSoles: z.string().optional(),
  imageUrl: z.string().url("URL de imagen inválida").or(z.literal("")),
});

type CourtFormValues = z.infer<typeof courtSchema>;

const courtTypes = [
  {
    value: "indoor" as const,
    label: "Indoor",
    description: "Cancha techada",
    icon: "\u{1F3E0}",
  },
  {
    value: "outdoor" as const,
    label: "Outdoor",
    description: "Al aire libre",
    icon: "\u{2600}\u{FE0F}",
  },
];

export function CourtCreateForm() {
  const router = useRouter();
  const params = useParams();
  const orgSlug = params.orgSlug as string;
  const facilityId = params.facilityId as string;
  const trpc = useTRPC();

  const basePath = `/org/${orgSlug}/facilities/${facilityId}`;

  const form = useForm<CourtFormValues>({
    resolver: standardSchemaResolver(courtSchema),
    defaultValues: {
      name: "",
      status: "active",
      description: "",
      type: "indoor",
      priceInSoles: "",
      peakPriceInSoles: "",
      imageUrl: "",
    },
  });

  const createMutation = useMutation(
    trpc.court.create.mutationOptions({
      onSuccess: (court) => {
        toast.success("Cancha creada correctamente");
        router.push(`${basePath}/courts/${court.id}`);
      },
      onError: (error) => {
        form.setError("root", {
          message: error.message || "Error al crear la cancha",
        });
      },
    }),
  );

  function onSubmit(values: CourtFormValues) {
    const priceInCents = values.priceInSoles
      ? Math.round(parseFloat(values.priceInSoles) * 100)
      : undefined;
    const peakPriceInCents =
      values.peakPriceInSoles && values.peakPriceInSoles !== ""
        ? Math.round(parseFloat(values.peakPriceInSoles) * 100)
        : undefined;

    createMutation.mutate({
      facilityId,
      name: values.name,
      type: values.type,
      status: values.status,
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- intentional: convert empty string to undefined
      description: values.description || undefined,
      priceInCents,
      peakPriceInCents,
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- intentional: convert empty string to undefined
      imageUrl: values.imageUrl || undefined,
    });
  }

  const imageUrl = form.watch("imageUrl");
  const description = form.watch("description") ?? "";
  const type = form.watch("type");

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <Link href={`${basePath}/courts`} className="hover:text-gray-700">
          Canchas
        </Link>
        <span>/</span>
        <span className="text-gray-900">Nueva Cancha</span>
      </nav>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {/* Header */}
          <header className="mt-4 flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-900">
              Nueva Cancha
            </h1>
            <div className="flex gap-3">
              <Button variant="outline" asChild>
                <Link href={`${basePath}/courts`}>Cancelar</Link>
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creando..." : "Crear Cancha"}
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
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Información Básica
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Nombre de la cancha{" "}
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="Cancha 1"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
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

                <FormField
                  control={form.control}
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

            {/* Court Type */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Tipo de Cancha
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <div className="grid grid-cols-2 gap-4">
                        {courtTypes.map((courtType) => (
                          <button
                            key={courtType.value}
                            type="button"
                            onClick={() => field.onChange(courtType.value)}
                            className={cn(
                              "flex flex-col items-center rounded-lg border-2 p-4 transition-all",
                              type === courtType.value
                                ? "border-primary bg-primary/5 text-primary"
                                : "border-gray-200 text-gray-700 hover:bg-gray-50",
                            )}
                          >
                            <span className="text-3xl">{courtType.icon}</span>
                            <span
                              className={cn(
                                "mt-2 font-medium",
                                type === courtType.value
                                  ? "text-primary"
                                  : "text-gray-900",
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                  <FormField
                    control={form.control}
                    name="priceInSoles"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Tarifa Estándar{" "}
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <div className="relative">
                          <span className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-500">
                            S/
                          </span>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="80.00"
                              className="pl-9"
                              {...field}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                        <FormDescription>
                          Precio por hora (horario regular)
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="peakPriceInSoles"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tarifa Horario Pico</FormLabel>
                        <div className="relative">
                          <span className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-500">
                            S/
                          </span>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="100.00"
                              className="pl-9"
                              {...field}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                        <FormDescription>
                          Precio por hora (horario pico)
                        </FormDescription>
                      </FormItem>
                    )}
                  />
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
                    imageUrl
                      ? "border-transparent"
                      : "border-gray-300 bg-gray-50",
                  )}
                >
                  {imageUrl ? (
                    <div
                      className="h-full w-full bg-cover bg-center"
                      style={{ backgroundImage: `url(${imageUrl})` }}
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center text-gray-400">
                      <ImageIcon className="h-12 w-12" />
                      <p className="mt-2 text-sm">Vista previa de imagen</p>
                      <p className="text-xs">Resolución mínima: 800x600px</p>
                    </div>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL de la imagen</FormLabel>
                      <FormControl>
                        <Input
                          type="url"
                          placeholder="https://ejemplo.com/imagen-cancha.jpg"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                      <FormDescription>
                        Formatos soportados: JPG, PNG, WebP
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>
        </form>
      </Form>
    </div>
  );
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
