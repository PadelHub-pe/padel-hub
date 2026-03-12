"use client";

import { useEffect, useMemo } from "react";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { cn } from "@wifo/ui";
import { Button } from "@wifo/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@wifo/ui/dialog";
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

export interface PeakPeriod {
  id: string;
  name: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  markupPercent: number;
}

interface PeakPeriodDialogProps {
  open: boolean;
  onClose: () => void;
  facilityId: string;
  editingPeriod?: PeakPeriod | null;
  existingPeriods?: PeakPeriod[];
  medianPriceCents?: number | null;
  onSuccess?: () => void;
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

const timeOptions = Array.from({ length: 37 }, (_, i) => {
  const totalMinutes = i * 30 + 300; // Start at 05:00
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
});

const peakPeriodSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100),
  daysOfWeek: z.array(z.number()).min(1, "Selecciona al menos un dia"),
  startTime: z.string().min(1, "La hora de inicio es requerida"),
  endTime: z.string().min(1, "La hora de fin es requerida"),
  markupPercent: z.number().int().min(0).max(200),
});

type PeakPeriodFormValues = z.infer<typeof peakPeriodSchema>;

function getOverlapWarning(
  values: PeakPeriodFormValues,
  existingPeriods: PeakPeriod[],
  editingId?: string,
): string | null {
  for (const existing of existingPeriods) {
    if (existing.id === editingId) continue;

    const sharedDays = values.daysOfWeek.filter((d) =>
      existing.daysOfWeek.includes(d),
    );
    if (sharedDays.length === 0) continue;

    // Time overlap: start < existing.end AND end > existing.start
    if (
      values.startTime < existing.endTime &&
      values.endTime > existing.startTime
    ) {
      return `Este periodo se superpone con "${existing.name}" en los mismos dias`;
    }
  }
  return null;
}

export function PeakPeriodDialog({
  open,
  onClose,
  facilityId,
  editingPeriod,
  existingPeriods = [],
  medianPriceCents,
  onSuccess,
}: PeakPeriodDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const isEditing = !!editingPeriod;

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

  // Reset form when dialog opens/closes or editingPeriod changes
  useEffect(() => {
    if (open) {
      if (editingPeriod) {
        form.reset({
          name: editingPeriod.name,
          daysOfWeek: [...editingPeriod.daysOfWeek],
          startTime: editingPeriod.startTime,
          endTime: editingPeriod.endTime,
          markupPercent: editingPeriod.markupPercent,
        });
      } else {
        form.reset({
          name: "",
          daysOfWeek: [],
          startTime: "18:00",
          endTime: "22:00",
          markupPercent: 25,
        });
      }
    }
  }, [open, editingPeriod, form]);

  const invalidateQueries = () => {
    void queryClient.invalidateQueries({
      queryKey: trpc.schedule.getPeakPeriods.queryKey({ facilityId }),
    });
    void queryClient.invalidateQueries({
      queryKey: trpc.schedule.getDayOverview.queryKey(),
    });
  };

  const createMutation = useMutation(
    trpc.schedule.createPeakPeriod.mutationOptions({
      onSuccess: () => {
        toast.success("Periodo pico creado");
        onClose();
        invalidateQueries();
        onSuccess?.();
      },
      onError: (error) => {
        form.setError("root", { message: error.message });
      },
    }),
  );

  const updateMutation = useMutation(
    trpc.schedule.updatePeakPeriod.mutationOptions({
      onSuccess: () => {
        toast.success("Periodo actualizado");
        onClose();
        invalidateQueries();
        onSuccess?.();
      },
      onError: (error) => {
        form.setError("root", { message: error.message });
      },
    }),
  );

  const isPending = createMutation.isPending || updateMutation.isPending;

  function onSubmit(values: PeakPeriodFormValues) {
    if (isEditing) {
      updateMutation.mutate({
        facilityId,
        id: editingPeriod.id,
        ...values,
      });
    } else {
      createMutation.mutate({
        facilityId,
        ...values,
      });
    }
  }

  const toggleDay = (dayValue: number) => {
    const current = form.getValues("daysOfWeek");
    if (current.includes(dayValue)) {
      form.setValue(
        "daysOfWeek",
        current.filter((d) => d !== dayValue),
        { shouldValidate: true },
      );
    } else {
      form.setValue("daysOfWeek", [...current, dayValue], {
        shouldValidate: true,
      });
    }
  };

  const setDayShortcut = (days: number[]) => {
    const current = form.getValues("daysOfWeek");
    const allSelected = days.every((d) => current.includes(d));
    if (allSelected) {
      // Deselect these days
      form.setValue(
        "daysOfWeek",
        current.filter((d) => !days.includes(d)),
        { shouldValidate: true },
      );
    } else {
      // Select these days (merge with existing)
      const merged = [...new Set([...current, ...days])];
      form.setValue("daysOfWeek", merged, { shouldValidate: true });
    }
  };

  // Watch values for overlap detection and markup preview
  const watchedValues = form.watch();

  const overlapWarning = useMemo(
    () => getOverlapWarning(watchedValues, existingPeriods, editingPeriod?.id),
    [watchedValues, existingPeriods, editingPeriod?.id],
  );

  const markupPreview = useMemo(() => {
    if (!medianPriceCents || medianPriceCents <= 0) return null;
    const peakPrice =
      medianPriceCents * (1 + watchedValues.markupPercent / 100);
    return `S/ ${(peakPrice / 100).toFixed(0)}/hr`;
  }, [medianPriceCents, watchedValues.markupPercent]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Periodo Pico" : "Agregar Periodo Pico"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica los datos del periodo con tarifa especial"
              : "Define un periodo con tarifa especial"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  {/* Day shortcuts */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setDayShortcut([1, 2, 3, 4, 5])}
                      className={cn(
                        "rounded-md border px-2 py-0.5 text-xs font-medium transition-colors",
                        [1, 2, 3, 4, 5].every((d) => field.value.includes(d))
                          ? "border-amber-300 bg-amber-100 text-amber-800"
                          : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100",
                      )}
                    >
                      Lun-Vie
                    </button>
                    <button
                      type="button"
                      onClick={() => setDayShortcut([6, 0])}
                      className={cn(
                        "rounded-md border px-2 py-0.5 text-xs font-medium transition-colors",
                        [6, 0].every((d) => field.value.includes(d))
                          ? "border-amber-300 bg-amber-100 text-amber-800"
                          : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100",
                      )}
                    >
                      Sab-Dom
                    </button>
                    <button
                      type="button"
                      onClick={() => setDayShortcut([0, 1, 2, 3, 4, 5, 6])}
                      className={cn(
                        "rounded-md border px-2 py-0.5 text-xs font-medium transition-colors",
                        field.value.length === 7
                          ? "border-amber-300 bg-amber-100 text-amber-800"
                          : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100",
                      )}
                    >
                      Todos
                    </button>
                  </div>
                  {/* Day toggles */}
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
                  <div className="flex items-center gap-3">
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={200}
                        className="flex-1"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    {markupPreview && (
                      <span className="text-sm font-medium whitespace-nowrap text-amber-700">
                        = {markupPreview}
                      </span>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {overlapWarning && (
              <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-700">
                {overlapWarning}
              </div>
            )}

            {form.formState.errors.root && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                {form.formState.errors.root.message}
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? isEditing
                    ? "Guardando..."
                    : "Creando..."
                  : isEditing
                    ? "Guardar Cambios"
                    : "Crear Periodo"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
