"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Button } from "@wifo/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@wifo/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
} from "@wifo/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@wifo/ui/select";
import { Checkbox } from "@wifo/ui/checkbox";
import { toast } from "@wifo/ui/toast";

import { useTRPC } from "~/trpc/react";

interface DayConfig {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

interface OperatingHoursSectionProps {
  facilityId: string;
  hours: DayConfig[];
}

const dayNames = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miercoles",
  "Jueves",
  "Viernes",
  "Sabado",
];

// Generate time options from 05:00 to 23:00
const timeOptions = Array.from({ length: 19 }, (_, i) => {
  const hour = i + 5;
  return `${hour.toString().padStart(2, "0")}:00`;
});

const hoursSchema = z.object({
  hours: z.array(
    z.object({
      dayOfWeek: z.number(),
      openTime: z.string(),
      closeTime: z.string(),
      isClosed: z.boolean(),
    }),
  ),
});

type HoursFormValues = z.infer<typeof hoursSchema>;

export function OperatingHoursSection({
  facilityId,
  hours,
}: OperatingHoursSectionProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<HoursFormValues>({
    resolver: standardSchemaResolver(hoursSchema),
    defaultValues: { hours },
  });

  const updateMutation = useMutation(
    trpc.schedule.updateOperatingHours.mutationOptions({
      onSuccess: () => {
        toast.success("Horarios actualizados");
        setIsEditing(false);
        void queryClient.invalidateQueries({
          queryKey: trpc.schedule.getOperatingHours.queryKey({ facilityId }),
        });
        void queryClient.invalidateQueries({
          queryKey: trpc.schedule.getDayOverview.queryKey(),
        });
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  function onSubmit(values: HoursFormValues) {
    updateMutation.mutate({
      facilityId,
      hours: values.hours,
    });
  }

  const handleCancel = () => {
    form.reset({ hours });
    setIsEditing(false);
  };

  // Re-order to start from Monday (index 1) instead of Sunday
  const orderedDays = [1, 2, 3, 4, 5, 6, 0]; // Mon-Sun

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900">
          Horarios de Operacion
        </CardTitle>
        {!isEditing ? (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            <EditIcon className="mr-2 h-4 w-4" />
            Editar
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={form.handleSubmit(onSubmit)}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-3">
              {orderedDays.map((dayIndex) => {
                const fieldIndex = hours.findIndex((h) => h.dayOfWeek === dayIndex);
                if (fieldIndex === -1) return null;

                return (
                  <DayRow
                    key={dayIndex}
                    dayIndex={dayIndex}
                    fieldIndex={fieldIndex}
                    isEditing={isEditing}
                    hours={hours}
                    form={form}
                  />
                );
              })}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

interface DayRowProps {
  dayIndex: number;
  fieldIndex: number;
  isEditing: boolean;
  hours: DayConfig[];
  form: ReturnType<typeof useForm<HoursFormValues>>;
}

function DayRow({ dayIndex, fieldIndex, isEditing, hours, form }: DayRowProps) {
  // Use useWatch at component level to avoid the form.watch inside render warning
  const isClosed = useWatch({
    control: form.control,
    name: `hours.${fieldIndex}.isClosed`,
  });

  return (
    <div className="flex items-center gap-4 rounded-lg border px-4 py-3">
      <span className="w-24 text-sm font-medium text-gray-700">
        {dayNames[dayIndex]}
      </span>

      {isEditing ? (
        <>
          <FormField
            control={form.control}
            name={`hours.${fieldIndex}.isClosed`}
            render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl>
                  <Checkbox
                    checked={!field.value}
                    onCheckedChange={(checked: boolean) => field.onChange(!checked)}
                  />
                </FormControl>
                <span className="text-xs text-gray-500">
                  {field.value ? "Cerrado" : "Abierto"}
                </span>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={`hours.${fieldIndex}.openTime`}
            render={({ field }) => (
              <FormItem>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isClosed}
                >
                  <FormControl>
                    <SelectTrigger className="w-24">
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
              </FormItem>
            )}
          />

          <span className="text-gray-400">-</span>

          <FormField
            control={form.control}
            name={`hours.${fieldIndex}.closeTime`}
            render={({ field }) => (
              <FormItem>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isClosed}
                >
                  <FormControl>
                    <SelectTrigger className="w-24">
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
              </FormItem>
            )}
          />
        </>
      ) : (
        <div className="flex flex-1 items-center gap-2">
          {hours[fieldIndex]?.isClosed ? (
            <span className="rounded bg-gray-100 px-2 py-1 text-sm text-gray-500">
              Cerrado
            </span>
          ) : (
            <span className="text-sm text-gray-600">
              {hours[fieldIndex]?.openTime} - {hours[fieldIndex]?.closeTime}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function EditIcon({ className }: { className?: string }) {
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
        d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
      />
    </svg>
  );
}
