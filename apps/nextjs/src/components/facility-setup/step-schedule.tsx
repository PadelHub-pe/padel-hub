"use client";

import type { Control } from "react-hook-form";
import { Checkbox } from "@wifo/ui/checkbox";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@wifo/ui/form";
import { Input } from "@wifo/ui/input";
import { Label } from "@wifo/ui/label";
import { RadioGroup, RadioGroupItem } from "@wifo/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@wifo/ui/select";
import { useWatch } from "react-hook-form";

const DAYS_OF_WEEK = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 0, label: "Domingo" },
];

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
  defaultDurationMinutes: "60" | "90" | "120";
  defaultPriceInSoles: string;
}

interface StepScheduleProps {
  control: Control<ScheduleFormValues>;
}

export function StepSchedule({ control }: StepScheduleProps) {
  const operatingHours = useWatch({ control, name: "operatingHours" });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Horarios y Precios</h2>
        <p className="mt-1 text-sm text-gray-500">
          Configura los horarios de operación y precio por defecto de tus canchas.
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
                const hourIndex = operatingHours.findIndex((h) => h.dayOfWeek === day.value);
                const hour = operatingHours[hourIndex];
                if (!hour) return null;

                function handleHourChange(
                  fieldKey: keyof OperatingHour,
                  value: string | boolean,
                ) {
                  const newHours: OperatingHour[] = operatingHours.map((h, i) =>
                    i === hourIndex ? { ...h, [fieldKey]: value } : h,
                  );
                  field.onChange(newHours);
                }

                return (
                  <div
                    key={day.value}
                    className="flex flex-col gap-3 rounded-lg border bg-white p-3 sm:flex-row sm:items-center"
                  >
                    {/* Day name */}
                    <div className="w-24 font-medium text-gray-700">{day.label}</div>

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
                          onValueChange={(value) => handleHourChange("openTime", value)}
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
                          onValueChange={(value) => handleHourChange("closeTime", value)}
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
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Slot Duration */}
      <FormField
        control={control}
        name="defaultDurationMinutes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Duración por defecto de cada turno</FormLabel>
            <FormControl>
              <RadioGroup
                value={field.value}
                onValueChange={field.onChange}
                className="mt-2 flex flex-wrap gap-4"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="60" id="duration-60" />
                  <Label htmlFor="duration-60" className="cursor-pointer font-normal">
                    60 minutos
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="90" id="duration-90" />
                  <Label htmlFor="duration-90" className="cursor-pointer font-normal">
                    90 minutos (recomendado)
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="120" id="duration-120" />
                  <Label htmlFor="duration-120" className="cursor-pointer font-normal">
                    120 minutos
                  </Label>
                </div>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Default Price */}
      <FormField
        control={control}
        name="defaultPriceInSoles"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Precio por turno (en Soles) <span className="text-red-500">*</span>
            </FormLabel>
            <div className="relative max-w-xs">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                S/
              </span>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="80"
                  className="pl-9"
                  {...field}
                />
              </FormControl>
            </div>
            <FormMessage />
            <FormDescription>
              Podrás configurar precios por horario más tarde desde tu panel de control.
            </FormDescription>
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
