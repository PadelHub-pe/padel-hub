"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { cn } from "@wifo/ui";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@wifo/ui/select";
import { toast } from "@wifo/ui/toast";

import { useTRPC } from "~/trpc/react";

interface AddPeakPeriodDialogProps {
  open: boolean;
  onClose: () => void;
  facilityId: string;
}

const dayOptions = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miercoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sabado" },
];

const timeOptions = Array.from({ length: 19 }, (_, i) => {
  const hour = i + 5;
  return `${hour.toString().padStart(2, "0")}:00`;
});

const peakPeriodSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100),
  daysOfWeek: z.array(z.number()).min(1, "Selecciona al menos un dia"),
  startTime: z.string().min(1, "La hora de inicio es requerida"),
  endTime: z.string().min(1, "La hora de fin es requerida"),
  markupPercent: z.number().int().min(0).max(200),
});

type PeakPeriodFormValues = z.infer<typeof peakPeriodSchema>;

export function AddPeakPeriodDialog({
  open,
  onClose,
  facilityId,
}: AddPeakPeriodDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const form = useForm<PeakPeriodFormValues>({
    resolver: standardSchemaResolver(peakPeriodSchema),
    defaultValues: {
      name: "",
      daysOfWeek: [],
      startTime: "18:00",
      endTime: "22:00",
      markupPercent: 25,
    },
  });

  const createMutation = useMutation(
    trpc.schedule.createPeakPeriod.mutationOptions({
      onSuccess: () => {
        toast.success("Periodo pico creado");
        form.reset();
        onClose();
        void queryClient.invalidateQueries({
          queryKey: trpc.schedule.getPeakPeriods.queryKey({ facilityId }),
        });
        void queryClient.invalidateQueries({
          queryKey: trpc.schedule.getDayOverview.queryKey(),
        });
      },
      onError: (error) => {
        form.setError("root", { message: error.message });
      },
    }),
  );

  function onSubmit(values: PeakPeriodFormValues) {
    createMutation.mutate({
      facilityId,
      ...values,
    });
  }

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const toggleDay = (dayValue: number) => {
    const current = form.getValues("daysOfWeek");
    if (current.includes(dayValue)) {
      form.setValue(
        "daysOfWeek",
        current.filter((d) => d !== dayValue),
      );
    } else {
      form.setValue("daysOfWeek", [...current, dayValue]);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={handleClose} />

      {/* Dialog */}
      <div className="relative z-50 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-gray-900">
          Agregar Periodo Pico
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Define un periodo con tarifa especial
        </p>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Horario Nocturno" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="daysOfWeek"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dias de la semana</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {dayOptions.map((day) => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleDay(day.value)}
                        className={cn(
                          "rounded-full px-3 py-1 text-sm font-medium transition-colors",
                          field.value.includes(day.value)
                            ? "bg-amber-500 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                        )}
                      >
                        {day.label.substring(0, 3)}
                      </button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora inicio</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {timeOptions.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora fin</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {timeOptions.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="markupPercent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Incremento (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={200}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.formState.errors.root && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                {form.formState.errors.root.message}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creando..." : "Crear Periodo"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
