"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useForm } from "react-hook-form";
import { z } from "zod";

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
import { formatTime } from "./calendar-utils";

const quickBookingSchema = z.object({
  customerName: z.string().min(1, "El nombre es requerido").max(100),
  customerPhone: z.string().max(20).optional(),
  customerEmail: z.string().email("Email inválido").optional().or(z.literal("")),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato inválido (HH:mm)"),
  priceInCents: z.number().int().min(0, "El precio debe ser positivo"),
  isPeakRate: z.boolean(),
  paymentMethod: z.enum(["cash", "card", "app"]).optional(),
  notes: z.string().max(500).optional(),
});

type QuickBookingFormValues = z.infer<typeof quickBookingSchema>;

interface QuickBookingFormProps {
  open: boolean;
  onClose: () => void;
  courtId: string;
  courtName: string;
  date: Date;
  startTime: string;
  defaultPrice: number;
  isPeakRate: boolean;
  onBookingCreated: () => void;
}

export function QuickBookingForm({
  open,
  onClose,
  courtId,
  courtName,
  date,
  startTime,
  defaultPrice,
  isPeakRate,
  onBookingCreated,
}: QuickBookingFormProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const form = useForm<QuickBookingFormValues>({
    resolver: standardSchemaResolver(quickBookingSchema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      endTime: calculateEndTime(startTime),
      priceInCents: defaultPrice,
      isPeakRate: isPeakRate,
      paymentMethod: undefined,
      notes: "",
    },
  });

  const createMutation = useMutation(
    trpc.booking.createManual.mutationOptions({
      onSuccess: () => {
        toast.success("Reserva creada exitosamente");
        void queryClient.invalidateQueries({ queryKey: [["calendar"]] });
        onBookingCreated();
        onClose();
        form.reset();
      },
      onError: (error) => {
        form.setError("root", { message: error.message });
      },
    }),
  );

  const onSubmit = (values: QuickBookingFormValues) => {
    createMutation.mutate({
      courtId,
      date,
      startTime,
      endTime: values.endTime,
      priceInCents: values.priceInCents,
      isPeakRate: values.isPeakRate,
      paymentMethod: values.paymentMethod,
      customerName: values.customerName,
      customerPhone: values.customerPhone ?? undefined,
      customerEmail: values.customerEmail ?? undefined,
      notes: values.notes ?? undefined,
    });
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
      form.reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva reserva</DialogTitle>
          <DialogDescription>
            {courtName} - {format(date, "EEEE d 'de' MMMM", { locale: es })} a las{" "}
            {formatTime(startTime)}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="customerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del cliente *</FormLabel>
                  <FormControl>
                    <Input placeholder="Juan Pérez" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customerPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input placeholder="999 888 777" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customerEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="email@ejemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Hora inicio</label>
                <Input
                  value={formatTime(startTime)}
                  disabled
                  className="mt-1.5 bg-gray-50"
                />
              </div>

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora fin *</FormLabel>
                    <FormControl>
                      <Input placeholder="10:30" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priceInCents"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio (S/) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        {...field}
                        value={field.value / 100}
                        onChange={(e) =>
                          field.onChange(Math.round(parseFloat(e.target.value) * 100))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Método de pago</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cash">Efectivo</SelectItem>
                        <SelectItem value="card">Tarjeta</SelectItem>
                        <SelectItem value="app">App</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
                    <Input placeholder="Notas adicionales..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.formState.errors.root && (
              <div className="text-sm text-red-500">
                {form.formState.errors.root.message}
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creando..." : "Crear reserva"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function calculateEndTime(startTime: string): string {
  const [hours, minutes] = startTime.split(":").map(Number);
  const endHour = (hours ?? 0) + 1;
  const endMinute = minutes ?? 30;
  return `${endHour.toString().padStart(2, "0")}:${endMinute.toString().padStart(2, "0")}`;
}
