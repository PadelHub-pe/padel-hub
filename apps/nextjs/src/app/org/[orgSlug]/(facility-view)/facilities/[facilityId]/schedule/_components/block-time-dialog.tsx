"use client";

import { useEffect } from "react";
import { format } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@wifo/ui/button";
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

interface Court {
  id: string;
  name: string;
  type: string;
  status: string;
}

interface BlockTimeDialogProps {
  open: boolean;
  onClose: () => void;
  facilityId: string;
  courts: Court[];
  defaultDate?: Date;
  defaultCourtId?: string;
  defaultStartTime?: string;
}

const reasonOptions = [
  { value: "maintenance", label: "Mantenimiento" },
  { value: "private_event", label: "Evento Privado" },
  { value: "tournament", label: "Torneo" },
  { value: "weather", label: "Clima" },
  { value: "other", label: "Otro" },
];

const timeOptions = Array.from({ length: 19 }, (_, i) => {
  const hour = i + 5;
  return `${hour.toString().padStart(2, "0")}:00`;
});

// Special value for "all courts" since Radix Select doesn't allow empty string
const ALL_COURTS_VALUE = "_all";

const blockSlotSchema = z.object({
  courtId: z.string(),
  date: z.string().min(1, "La fecha es requerida"),
  startTime: z.string().min(1, "La hora de inicio es requerida"),
  endTime: z.string().min(1, "La hora de fin es requerida"),
  reason: z.enum(["maintenance", "private_event", "tournament", "weather", "other"]),
  notes: z.string().max(500).optional(),
});

type BlockSlotFormValues = z.infer<typeof blockSlotSchema>;

export function BlockTimeDialog({
  open,
  onClose,
  facilityId,
  courts,
  defaultDate,
  defaultCourtId,
  defaultStartTime,
}: BlockTimeDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const form = useForm<BlockSlotFormValues>({
    resolver: standardSchemaResolver(blockSlotSchema),
    defaultValues: {
      courtId: ALL_COURTS_VALUE,
      date: format(new Date(), "yyyy-MM-dd"),
      startTime: "08:00",
      endTime: "09:00",
      reason: "maintenance",
      notes: "",
    },
  });

  // Update defaults when dialog opens
  useEffect(() => {
    if (open) {
      form.reset({
        courtId: defaultCourtId ?? ALL_COURTS_VALUE,
        date: defaultDate ? format(defaultDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
        startTime: defaultStartTime ?? "08:00",
        endTime: defaultStartTime
          ? `${(parseInt(defaultStartTime.split(":")[0] ?? "8") + 1).toString().padStart(2, "0")}:00`
          : "09:00",
        reason: "maintenance",
        notes: "",
      });
    }
  }, [open, defaultDate, defaultCourtId, defaultStartTime, form]);

  const blockMutation = useMutation(
    trpc.schedule.blockTimeSlot.mutationOptions({
      onSuccess: () => {
        toast.success("Horario bloqueado");
        form.reset();
        onClose();
        void queryClient.invalidateQueries({
          queryKey: trpc.schedule.getBlockedSlots.queryKey(),
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

  function onSubmit(values: BlockSlotFormValues) {
    // Convert special "all courts" value to null for the API
    const courtIdValue = values.courtId === ALL_COURTS_VALUE ? null : values.courtId;
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    const notesValue = values.notes || undefined;

    blockMutation.mutate({
      facilityId,
      courtId: courtIdValue,
      date: new Date(values.date),
      startTime: values.startTime,
      endTime: values.endTime,
      reason: values.reason,
      notes: notesValue,
    });
  }

  const handleClose = () => {
    form.reset();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={handleClose} />

      {/* Dialog */}
      <div className="relative z-50 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-gray-900">Bloquear Horario</h2>
        <p className="mt-1 text-sm text-gray-500">
          El horario bloqueado no estara disponible para reservas
        </p>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-4">
            <FormField
              control={form.control}
              name="courtId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cancha</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas las canchas" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={ALL_COURTS_VALUE}>Todas las canchas</SelectItem>
                      {courts.map((court) => (
                        <SelectItem key={court.id} value={court.id}>
                          {court.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Deja vacio para bloquear todas las canchas
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
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
                      {reasonOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
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
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detalles adicionales..."
                      rows={2}
                      {...field}
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
              <Button type="submit" disabled={blockMutation.isPending}>
                {blockMutation.isPending ? "Bloqueando..." : "Bloquear"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
