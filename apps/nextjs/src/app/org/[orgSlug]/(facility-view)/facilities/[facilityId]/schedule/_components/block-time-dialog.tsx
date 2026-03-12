"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@wifo/ui/button";
import { Checkbox } from "@wifo/ui/checkbox";
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
import { Label } from "@wifo/ui/label";
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

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

interface BlockTimeDialogProps {
  open: boolean;
  onClose: () => void;
  facilityId: string;
}

const reasonOptions = [
  { value: "maintenance", label: "Mantenimiento" },
  { value: "private_event", label: "Evento privado" },
  { value: "tournament", label: "Torneo" },
  { value: "weather", label: "Clima" },
  { value: "other", label: "Otro" },
] as const;

// 30-min increments from 05:00 to 23:30
const timeOptions = Array.from({ length: 38 }, (_, i) => {
  const totalMinutes = 5 * 60 + i * 30;
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
});

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const blockTimeSchema = z
  .object({
    courtIds: z.array(z.string()).min(1, "Selecciona al menos una cancha"),
    date: z.string().min(1, "La fecha es requerida"),
    startTime: z.string().min(1, "La hora de inicio es requerida"),
    endTime: z.string().min(1, "La hora de fin es requerida"),
    reason: z.enum([
      "maintenance",
      "private_event",
      "tournament",
      "weather",
      "other",
    ]),
    notes: z.string().max(500).optional(),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: "La hora de fin debe ser posterior a la hora de inicio",
    path: ["endTime"],
  });

type BlockTimeFormValues = z.infer<typeof blockTimeSchema>;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BlockTimeDialog({
  open,
  onClose,
  facilityId,
}: BlockTimeDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [allCourts, setAllCourts] = useState(false);

  const form = useForm<BlockTimeFormValues>({
    resolver: standardSchemaResolver(blockTimeSchema),
    defaultValues: {
      courtIds: [],
      date: format(new Date(), "yyyy-MM-dd"),
      startTime: "08:00",
      endTime: "10:00",
      reason: "maintenance",
      notes: "",
    },
  });

  const watchedCourtIds = form.watch("courtIds");
  const watchedDate = form.watch("date");
  const watchedStartTime = form.watch("startTime");
  const watchedEndTime = form.watch("endTime");

  // Fetch courts for multi-select
  const { data: courtsData } = useQuery(
    trpc.court.list.queryOptions({ facilityId }),
  );

  const courts = useMemo(
    () => courtsData?.filter((c) => c.isActive) ?? [],
    [courtsData],
  );

  // Handle "all courts" toggle
  const handleAllCourtsChange = useCallback(
    (checked: boolean) => {
      setAllCourts(checked);
      if (checked) {
        form.setValue(
          "courtIds",
          courts.map((c) => c.id),
          { shouldValidate: true },
        );
      } else {
        form.setValue("courtIds", [], { shouldValidate: true });
      }
    },
    [courts, form],
  );

  // Keep allCourts state in sync
  useEffect(() => {
    if (courts.length > 0 && watchedCourtIds.length === courts.length) {
      setAllCourts(true);
    } else if (allCourts && watchedCourtIds.length < courts.length) {
      setAllCourts(false);
    }
  }, [watchedCourtIds.length, courts.length, allCourts]);

  const toggleCourt = (courtId: string) => {
    const current = form.getValues("courtIds");
    if (current.includes(courtId)) {
      form.setValue(
        "courtIds",
        current.filter((id) => id !== courtId),
        { shouldValidate: true },
      );
    } else {
      form.setValue("courtIds", [...current, courtId], {
        shouldValidate: true,
      });
    }
  };

  // Conflict check query
  const shouldCheckConflicts =
    watchedCourtIds.length > 0 &&
    watchedDate.length > 0 &&
    watchedStartTime.length > 0 &&
    watchedEndTime.length > 0 &&
    watchedEndTime > watchedStartTime;

  const { data: conflicts } = useQuery({
    ...trpc.schedule.checkBlockConflicts.queryOptions({
      facilityId,
      courtIds: watchedCourtIds,
      date: new Date(watchedDate),
      startTime: watchedStartTime,
      endTime: watchedEndTime,
    }),
    enabled: shouldCheckConflicts,
  });

  // Block mutation
  const blockMutation = useMutation(
    trpc.schedule.blockTimeSlot.mutationOptions({
      onSuccess: () => {
        toast.success("Horario bloqueado");
        void queryClient.invalidateQueries({
          queryKey: trpc.schedule.listBlockedSlots.queryKey({ facilityId }),
        });
        void queryClient.invalidateQueries({
          queryKey: trpc.schedule.getBlockedSlots.queryKey(),
        });
        void queryClient.invalidateQueries({
          queryKey: trpc.schedule.getDayOverview.queryKey(),
        });
        handleClose();
      },
      onError: (error) => {
        form.setError("root", { message: error.message });
      },
    }),
  );

  function onSubmit(values: BlockTimeFormValues) {
    const dateObj = new Date(values.date);
    // Create one blocked slot per court if "all courts" is selected,
    // or one with null courtId. We'll use null courtId for "all courts".
    if (allCourts) {
      blockMutation.mutate({
        facilityId,
        courtId: null,
        date: dateObj,
        startTime: values.startTime,
        endTime: values.endTime,
        reason: values.reason,
        notes: values.notes,
      });
    } else {
      // Block each court individually
      // For simplicity, we block the first court (single or multi)
      // Actually, the API supports null courtId for all courts.
      // For individual courts, we need to call once per court.
      // Let's use a simple sequential approach.
      const blockCourt = async () => {
        for (const courtId of values.courtIds) {
          await blockMutation.mutateAsync({
            facilityId,
            courtId,
            date: dateObj,
            startTime: values.startTime,
            endTime: values.endTime,
            reason: values.reason,
            notes: values.notes,
          });
        }
      };
      void blockCourt();
    }
  }

  const handleClose = () => {
    form.reset();
    setAllCourts(false);
    onClose();
  };

  // Today as min date
  const today = format(new Date(), "yyyy-MM-dd");

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Bloquear Horario</DialogTitle>
          <DialogDescription>
            Bloquea un rango de tiempo para mantenimiento, eventos u otras
            razones
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Court selection */}
            <FormField
              control={form.control}
              name="courtIds"
              render={() => (
                <FormItem>
                  <FormLabel>Canchas</FormLabel>
                  <div className="space-y-2">
                    {/* All courts toggle */}
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={allCourts}
                        onCheckedChange={(checked: boolean) =>
                          handleAllCourtsChange(checked)
                        }
                      />
                      <Label className="text-sm font-medium">
                        Todas las canchas
                      </Label>
                    </div>

                    {/* Individual court checkboxes */}
                    {!allCourts && (
                      <div className="grid grid-cols-2 gap-2">
                        {courts.map((court) => (
                          <div
                            key={court.id}
                            className="flex items-center gap-2"
                          >
                            <Checkbox
                              checked={watchedCourtIds.includes(court.id)}
                              onCheckedChange={() => toggleCourt(court.id)}
                            />
                            <Label className="text-sm">{court.name}</Label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha</FormLabel>
                  <FormControl>
                    <Input type="date" min={today} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Time range */}
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

            {/* Reason */}
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {reasonOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detalles adicionales..."
                      maxLength={500}
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Conflict warning */}
            {conflicts && conflicts.count > 0 && (
              <ConflictWarning conflicts={conflicts} />
            )}

            {/* Root error */}
            {form.formState.errors.root && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                {form.formState.errors.root.message}
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={blockMutation.isPending}
                variant={
                  conflicts && conflicts.count > 0 ? "destructive" : "default"
                }
              >
                {blockMutation.isPending
                  ? "Bloqueando..."
                  : conflicts && conflicts.count > 0
                    ? "Bloquear de todas formas"
                    : "Bloquear Horario"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Conflict Warning sub-component
// ---------------------------------------------------------------------------

interface ConflictWarningProps {
  conflicts: {
    count: number;
    bookings: {
      id: string;
      code: string | null;
      courtName: string | null;
      startTime: string;
      endTime: string;
      customerName: string | null;
      status: string;
    }[];
  };
}

function ConflictWarning({ conflicts }: ConflictWarningProps) {
  return (
    <div className="rounded-md border border-amber-300 bg-amber-50 p-3">
      <div className="flex items-start gap-2">
        <WarningIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-amber-800">
            {conflicts.count === 1
              ? "1 reserva en conflicto"
              : `${conflicts.count} reservas en conflicto`}
          </p>
          <ul className="mt-1 space-y-1">
            {conflicts.bookings.slice(0, 5).map((b) => (
              <li key={b.id} className="text-xs text-amber-700">
                {b.courtName && (
                  <span className="font-medium">{b.courtName}: </span>
                )}
                {b.startTime} - {b.endTime}
                {b.customerName && ` (${b.customerName})`}
              </li>
            ))}
            {conflicts.count > 5 && (
              <li className="text-xs text-amber-600">
                ...y {conflicts.count - 5} más
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

function WarningIcon({ className }: { className?: string }) {
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
        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
      />
    </svg>
  );
}
