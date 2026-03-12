"use client";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";

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

interface Court {
  id: string;
  name: string;
  priceInCents: number | null;
  peakPriceInCents: number | null;
}

interface EditCourtPricingDialogProps {
  open: boolean;
  onClose: () => void;
  facilityId: string;
  court: Court;
  defaultRegularCents: number;
  defaultPeakCents: number;
}

const pricingSchema = z
  .object({
    regularPriceInSoles: z.number().min(1, "El precio debe ser mayor a 0"),
    peakPriceInSoles: z.number().min(1, "El precio debe ser mayor a 0"),
  })
  .refine((data) => data.peakPriceInSoles >= data.regularPriceInSoles, {
    message: "Debe ser igual o mayor a la tarifa regular",
    path: ["peakPriceInSoles"],
  });

type PricingFormValues = z.infer<typeof pricingSchema>;

export function EditCourtPricingDialog({
  open,
  onClose,
  facilityId,
  court,
  defaultRegularCents,
  defaultPeakCents,
}: EditCourtPricingDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const hasCustomPrice = court.priceInCents !== null;

  const form = useForm<PricingFormValues>({
    resolver: standardSchemaResolver(pricingSchema),
    defaultValues: {
      regularPriceInSoles: hasCustomPrice
        ? (court.priceInCents ?? 0) / 100
        : defaultRegularCents / 100,
      peakPriceInSoles: hasCustomPrice
        ? (court.peakPriceInCents ?? court.priceInCents ?? 0) / 100
        : defaultPeakCents / 100,
    },
  });

  function invalidateQueries() {
    void queryClient.invalidateQueries({
      queryKey: trpc.pricing.getOverview.queryKey(),
    });
    void queryClient.invalidateQueries({
      queryKey: trpc.pricing.calculateRevenue.queryKey(),
    });
    void queryClient.invalidateQueries({
      queryKey: trpc.court.list.queryKey(),
    });
  }

  const updateMutation = useMutation(
    trpc.pricing.updateCourtPricing.mutationOptions({
      onSuccess: () => {
        toast.success("Precio actualizado");
        onClose();
        invalidateQueries();
      },
      onError: (error) => {
        form.setError("root", { message: error.message });
      },
    }),
  );

  const resetMutation = useMutation(
    trpc.pricing.resetCourtPricing.mutationOptions({
      onSuccess: () => {
        toast.success("Precio restablecido a valores por defecto");
        onClose();
        invalidateQueries();
      },
      onError: (error) => {
        form.setError("root", { message: error.message });
      },
    }),
  );

  function onSubmit(values: PricingFormValues) {
    updateMutation.mutate({
      facilityId,
      courtId: court.id,
      regularPriceCents: Math.round(values.regularPriceInSoles * 100),
      peakPriceCents: Math.round(values.peakPriceInSoles * 100),
    });
  }

  function onReset() {
    resetMutation.mutate({
      facilityId,
      courtId: court.id,
    });
  }

  const handleClose = () => {
    form.reset();
    onClose();
  };

  if (!open) return null;

  const isPending = updateMutation.isPending || resetMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={handleClose} />

      <div className="relative z-50 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-gray-900">
          Editar Precio - {court.name}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Configura las tarifas por hora para esta cancha
        </p>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="mt-4 space-y-4"
          >
            <FormField
              control={form.control}
              name="regularPriceInSoles"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tarifa regular por hora (S/)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step={5}
                      placeholder={String(defaultRegularCents / 100)}
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || 0)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="peakPriceInSoles"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tarifa hora pico por hora (S/)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step={5}
                      placeholder={String(defaultPeakCents / 100)}
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || 0)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!hasCustomPrice && (
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-sm text-gray-600">
                  Esta cancha usa las tarifas por defecto del local (S/{" "}
                  {defaultRegularCents / 100} regular / S/{" "}
                  {defaultPeakCents / 100} pico)
                </p>
              </div>
            )}

            {form.formState.errors.root && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                {form.formState.errors.root.message}
              </div>
            )}

            <div className="flex items-center justify-between pt-4">
              <div>
                {hasCustomPrice && (
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={onReset}
                    disabled={isPending}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Restablecer a valores por defecto
                  </Button>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isPending}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending}>
                  {updateMutation.isPending
                    ? "Guardando..."
                    : "Guardar precio personalizado"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
