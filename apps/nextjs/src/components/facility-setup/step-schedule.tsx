"use client";

import type { Control } from "react-hook-form";
import { useState } from "react";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { cn } from "@wifo/ui";
import { Button } from "@wifo/ui/button";
import { Checkbox } from "@wifo/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@wifo/ui/form";
import { Input } from "@wifo/ui/input";
import { Label } from "@wifo/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@wifo/ui/select";
import { toast } from "@wifo/ui/toast";

import { useTRPC } from "~/trpc/react";

const DAYS_OF_WEEK = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 0, label: "Domingo" },
];

const DAY_LABELS = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];

const TIME_OPTIONS = [
  "06:00",
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
  "23:00",
];

export interface OperatingHour {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export interface ScheduleFormValues {
  operatingHours: OperatingHour[];
}

interface StepScheduleProps {
  control: Control<ScheduleFormValues>;
  facilityId: string;
}

/**
 * Checks if close time is after open time
 */
function isValidTimeRange(openTime: string, closeTime: string): boolean {
  return closeTime > openTime;
}

export function StepSchedule({ control, facilityId }: StepScheduleProps) {
  const operatingHours = useWatch({ control, name: "operatingHours" });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          Horarios de Operación
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Configura los horarios de operación de tu local.
        </p>
      </div>

      {/* Operating Hours */}
      <FormField
        control={control}
        name="operatingHours"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Horarios de operación</FormLabel>
            <div className="mt-2 space-y-2">
              {DAYS_OF_WEEK.map((day) => {
                const hourIndex = operatingHours.findIndex(
                  (h) => h.dayOfWeek === day.value,
                );
                const hour = operatingHours[hourIndex];
                if (!hour) return null;

                const timeError =
                  !hour.isClosed &&
                  !isValidTimeRange(hour.openTime, hour.closeTime);

                function handleHourChange(
                  fieldKey: keyof OperatingHour,
                  value: string | boolean,
                ) {
                  const newHours: OperatingHour[] = operatingHours.map(
                    (h, i) =>
                      i === hourIndex ? { ...h, [fieldKey]: value } : h,
                  );
                  field.onChange(newHours);
                }

                function handleApplyToAll(sourceHour: OperatingHour) {
                  const newHours: OperatingHour[] = operatingHours.map((h) => {
                    if (h.dayOfWeek === sourceHour.dayOfWeek) return h;
                    if (h.isClosed) return h;
                    return {
                      ...h,
                      openTime: sourceHour.openTime,
                      closeTime: sourceHour.closeTime,
                    };
                  });
                  field.onChange(newHours);
                  toast.success(
                    `Horario de ${day.label} aplicado a todos los días abiertos`,
                  );
                }

                return (
                  <div
                    key={day.value}
                    className={cn(
                      "flex flex-col gap-3 rounded-lg border bg-white p-3 sm:flex-row sm:items-center",
                      timeError && "border-red-300 bg-red-50",
                    )}
                  >
                    {/* Day name */}
                    <div className="w-24 font-medium text-gray-700">
                      {day.label}
                    </div>

                    {/* Closed checkbox */}
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`closed-${day.value}`}
                        checked={hour.isClosed}
                        onCheckedChange={(checked) =>
                          handleHourChange("isClosed", checked === true)
                        }
                      />
                      <Label
                        htmlFor={`closed-${day.value}`}
                        className="cursor-pointer text-sm font-normal text-gray-600"
                      >
                        Cerrado
                      </Label>
                    </div>

                    {/* Time selects */}
                    {!hour.isClosed && (
                      <div className="flex flex-1 items-center gap-2">
                        <Select
                          value={hour.openTime}
                          onValueChange={(value) =>
                            handleHourChange("openTime", value)
                          }
                        >
                          <SelectTrigger className="w-full sm:w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TIME_OPTIONS.map((time) => (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span className="text-gray-500">a</span>
                        <Select
                          value={hour.closeTime}
                          onValueChange={(value) =>
                            handleHourChange("closeTime", value)
                          }
                        >
                          <SelectTrigger className="w-full sm:w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TIME_OPTIONS.map((time) => (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* Apply to all button */}
                        <button
                          type="button"
                          onClick={() => handleApplyToAll(hour)}
                          className="ml-1 shrink-0 rounded-md px-2 py-1 text-xs text-blue-600 hover:bg-blue-50"
                          title={`Aplicar horario de ${day.label} a todos los días abiertos`}
                        >
                          Aplicar a todos
                        </button>
                      </div>
                    )}

                    {/* Time error */}
                    {timeError && (
                      <p className="text-xs text-red-500">
                        La hora de cierre debe ser posterior a la de apertura
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Peak Periods */}
      <PeakPeriodsSetup
        facilityId={facilityId}
        operatingHours={operatingHours}
      />
    </div>
  );
}

// =============================================================================
// Peak Periods Setup (optional, collapsible)
// =============================================================================

const peakPeriodFormSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100),
  daysOfWeek: z.array(z.number()).min(1, "Selecciona al menos un día"),
  startTime: z.string().min(1, "La hora de inicio es requerida"),
  endTime: z.string().min(1, "La hora de fin es requerida"),
  markupPercent: z.number().int().min(0).max(200),
});

type PeakPeriodFormValues = z.infer<typeof peakPeriodFormSchema>;

function PeakPeriodsSetup({
  facilityId,
  operatingHours,
}: {
  facilityId: string;
  operatingHours: OperatingHour[];
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [enabled, setEnabled] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const { data: peakPeriods } = useQuery(
    trpc.schedule.getPeakPeriods.queryOptions({ facilityId }),
  );

  // Auto-enable if peak periods already exist
  const hasPeakPeriods = (peakPeriods?.length ?? 0) > 0;
  const isEnabled = enabled || hasPeakPeriods;

  const deleteMutation = useMutation(
    trpc.schedule.deletePeakPeriod.mutationOptions({
      onSuccess: () => {
        toast.success("Periodo pico eliminado");
        void queryClient.invalidateQueries({
          queryKey: trpc.schedule.getPeakPeriods.queryKey({ facilityId }),
        });
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const form = useForm<PeakPeriodFormValues>({
    resolver: standardSchemaResolver(peakPeriodFormSchema),
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
        setShowForm(false);
        void queryClient.invalidateQueries({
          queryKey: trpc.schedule.getPeakPeriods.queryKey({ facilityId }),
        });
      },
      onError: (error) => {
        form.setError("root", { message: error.message });
      },
    }),
  );

  function onSubmit(values: PeakPeriodFormValues) {
    if (values.endTime <= values.startTime) {
      form.setError("endTime", {
        message: "La hora de fin debe ser posterior a la de inicio",
      });
      return;
    }

    // Validate peak period falls within operating hours
    for (const day of values.daysOfWeek) {
      const dayHours = operatingHours.find((h) => h.dayOfWeek === day);
      const dayLabel = DAY_LABELS[day] ?? `Día ${day}`;

      if (!dayHours || dayHours.isClosed) {
        form.setError("daysOfWeek", {
          message: `${dayLabel} está cerrado — no se puede asignar periodo pico`,
        });
        return;
      }

      if (
        values.startTime < dayHours.openTime ||
        values.endTime > dayHours.closeTime
      ) {
        form.setError("startTime", {
          message: `El periodo debe estar dentro del horario de ${dayLabel} (${dayHours.openTime} - ${dayHours.closeTime})`,
        });
        return;
      }
    }

    createMutation.mutate({ facilityId, ...values });
  }

  function toggleDay(dayValue: number) {
    const current = form.getValues("daysOfWeek");
    if (current.includes(dayValue)) {
      form.setValue(
        "daysOfWeek",
        current.filter((d) => d !== dayValue),
      );
    } else {
      form.setValue("daysOfWeek", [...current, dayValue]);
    }
  }

  return (
    <div className="space-y-4 rounded-lg border bg-gray-50 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-900">
            Horarios de hora punta
          </h3>
          <p className="text-xs text-gray-500">
            Configura tarifas especiales para horarios de mayor demanda
          </p>
        </div>
        <Checkbox
          checked={isEnabled}
          onCheckedChange={(checked) => setEnabled(checked === true)}
          disabled={hasPeakPeriods}
        />
      </div>

      {isEnabled && (
        <div className="space-y-3">
          {/* Existing peak periods */}
          {peakPeriods?.map((period) => (
            <div
              key={period.id}
              className="flex items-center justify-between rounded-lg border bg-amber-50 px-4 py-3"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-gray-900">
                    {period.name}
                  </span>
                  <span className="rounded bg-amber-200 px-2 py-0.5 text-xs font-medium text-amber-800">
                    +{period.markupPercent}%
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-3">
                  <span className="text-sm text-gray-600">
                    {period.startTime} - {period.endTime}
                  </span>
                  <div className="flex gap-1">
                    {DAY_LABELS.map((label, index) => (
                      <span
                        key={index}
                        className={cn(
                          "rounded px-1.5 py-0.5 text-[10px] font-medium",
                          period.daysOfWeek.includes(index)
                            ? "bg-amber-200 text-amber-800"
                            : "bg-gray-100 text-gray-400",
                        )}
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-red-500"
                onClick={() =>
                  deleteMutation.mutate({ facilityId, id: period.id })
                }
                disabled={deleteMutation.isPending}
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </div>
          ))}

          {/* Add peak period form */}
          {showForm ? (
            <div className="rounded-lg border bg-white p-4">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ej: Horario Nocturno"
                            {...field}
                          />
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
                        <FormLabel>Días de la semana</FormLabel>
                        <div className="flex flex-wrap gap-2">
                          {DAY_LABELS.map((label, index) => {
                            const dayHours = operatingHours.find(
                              (h) => h.dayOfWeek === index,
                            );
                            const isClosed = !dayHours || dayHours.isClosed;

                            return (
                              <button
                                key={index}
                                type="button"
                                onClick={() => !isClosed && toggleDay(index)}
                                disabled={isClosed}
                                className={cn(
                                  "rounded-full px-3 py-1 text-sm font-medium transition-colors",
                                  isClosed
                                    ? "cursor-not-allowed bg-gray-50 text-gray-300 line-through"
                                    : field.value.includes(index)
                                      ? "bg-amber-500 text-white"
                                      : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                                )}
                              >
                                {label}
                              </button>
                            );
                          })}
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
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {TIME_OPTIONS.map((time) => (
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
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {TIME_OPTIONS.map((time) => (
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
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value) || 0)
                            }
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

                  <div className="flex justify-end gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        form.reset();
                        setShowForm(false);
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={createMutation.isPending}
                    >
                      {createMutation.isPending
                        ? "Creando..."
                        : "Crear Periodo"}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowForm(true)}
              className="w-full border-dashed"
            >
              <PlusIcon className="mr-2 h-4 w-4" />
              Agregar Periodo Pico
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Icons
// =============================================================================

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
      />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 4.5v15m7.5-7.5h-15"
      />
    </svg>
  );
}

// Helper to create default operating hours
export function createDefaultOperatingHours(): OperatingHour[] {
  return [
    { dayOfWeek: 0, openTime: "09:00", closeTime: "21:00", isClosed: false },
    { dayOfWeek: 1, openTime: "07:00", closeTime: "22:00", isClosed: false },
    { dayOfWeek: 2, openTime: "07:00", closeTime: "22:00", isClosed: false },
    { dayOfWeek: 3, openTime: "07:00", closeTime: "22:00", isClosed: false },
    { dayOfWeek: 4, openTime: "07:00", closeTime: "22:00", isClosed: false },
    { dayOfWeek: 5, openTime: "07:00", closeTime: "22:00", isClosed: false },
    { dayOfWeek: 6, openTime: "08:00", closeTime: "22:00", isClosed: false },
  ];
}
