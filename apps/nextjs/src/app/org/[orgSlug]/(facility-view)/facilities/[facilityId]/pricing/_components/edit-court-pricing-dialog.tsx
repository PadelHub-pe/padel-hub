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
}

interface EditCourtPricingDialogProps {
  open: boolean;
  onClose: () => void;
  facilityId: string;
  court: Court;
  avgMarkupPercent: number;
}

const pricingSchema = z.object({
  priceInSoles: z.number().min(1, "El precio debe ser mayor a 0"),
});

type PricingFormValues = z.infer<typeof pricingSchema>;

export function EditCourtPricingDialog({
  open,
  onClose,
  facilityId,
  court,
  avgMarkupPercent,
}: EditCourtPricingDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const form = useForm<PricingFormValues>({
    resolver: standardSchemaResolver(pricingSchema),
    defaultValues: {
      priceInSoles: court.priceInCents ? court.priceInCents / 100 : 0,
    },
  });

  const updateMutation = useMutation(
    trpc.court.update.mutationOptions({
      onSuccess: () => {
        toast.success("Precio actualizado");
        onClose();
        void queryClient.invalidateQueries({
          queryKey: trpc.pricing.getOverview.queryKey(),
        });
        void queryClient.invalidateQueries({
          queryKey: trpc.pricing.calculateRevenue.queryKey(),
        });
        void queryClient.invalidateQueries({
          queryKey: trpc.court.list.queryKey(),
        });
      },
      onError: (error) => {
        form.setError("root", { message: error.message });
      },
    }),
  );

  function onSubmit(values: PricingFormValues) {
    updateMutation.mutate({
      facilityId,
      id: court.id,
      data: {
        priceInCents: Math.round(values.priceInSoles * 100),
      },
    });
  }

  const handleClose = () => {
    form.reset();
    onClose();
  };

  if (!open) return null;

  const currentPrice = form.watch("priceInSoles");
  const computedPeakPrice =
    avgMarkupPercent > 0
      ? Math.round(currentPrice * (1 + avgMarkupPercent / 100))
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={handleClose} />

      <div className="relative z-50 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-gray-900">
          Editar Precio - {court.name}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Configura la tarifa por hora para esta cancha
        </p>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="mt-4 space-y-4"
          >
            <FormField
              control={form.control}
              name="priceInSoles"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tarifa por hora (S/)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step={5}
                      placeholder="80"
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

            {computedPeakPrice !== null && currentPrice > 0 && (
              <div className="rounded-lg bg-amber-50 p-3">
                <p className="text-sm text-amber-800">
                  Tarifa en hora pico:{" "}
                  <span className="font-bold">S/ {computedPeakPrice}</span>
                  <span className="ml-1 text-amber-600">
                    (+{avgMarkupPercent}% incremento)
                  </span>
                </p>
              </div>
            )}

            {form.formState.errors.root && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                {form.formState.errors.root.message}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
