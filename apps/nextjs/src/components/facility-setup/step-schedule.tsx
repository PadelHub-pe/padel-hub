"use client";

import type { Control } from "react-hook-form";
import { useWatch } from "react-hook-form";

import { cn } from "@wifo/ui";
import { Checkbox } from "@wifo/ui/checkbox";
import { FormField, FormItem, FormLabel, FormMessage } from "@wifo/ui/form";
import { Label } from "@wifo/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@wifo/ui/select";
import { toast } from "@wifo/ui/toast";

const DAYS_OF_WEEK = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 0, label: "Domingo" },
];

// Generate 30-minute time options from 05:00 to 23:30
const TIME_OPTIONS = Array.from({ length: 38 }, (_, i) => {
  const totalMinutes = 5 * 60 + i * 30;
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
});

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
}

/**
 * Checks if close time is after open time
 */
function isValidTimeRange(openTime: string, closeTime: string): boolean {
  return closeTime > openTime;
}

export function StepSchedule({ control }: StepScheduleProps) {
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
    </div>
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
