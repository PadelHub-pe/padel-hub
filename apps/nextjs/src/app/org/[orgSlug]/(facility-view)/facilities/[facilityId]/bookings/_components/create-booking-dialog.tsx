"use client";

import { useCallback, useEffect, useMemo } from "react";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import {
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { format, parse } from "date-fns";
import { es } from "date-fns/locale";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod/v4";

import { Badge } from "@wifo/ui/badge";
import { Button } from "@wifo/ui/button";
import {
  Dialog,
  DialogContent,
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

import { useFacilityContext } from "~/hooks";
import { useTRPC } from "~/trpc/react";

// --- Time slot helpers ---

const ALL_TIME_SLOTS = generateTimeSlots("06:00", "23:00", 30);
const DURATION_OPTIONS = [
  { value: "60", label: "1 hora" },
  { value: "90", label: "1.5 horas" },
  { value: "120", label: "2 horas" },
];

function generateTimeSlots(
  start: string,
  end: string,
  intervalMinutes: number,
): { value: string; label: string }[] {
  const slots: { value: string; label: string }[] = [];
  const [startH, startM] = start.split(":").map(Number);
  const [endH, endM] = end.split(":").map(Number);
  let totalMinutes = (startH ?? 0) * 60 + (startM ?? 0);
  const endTotalMinutes = (endH ?? 0) * 60 + (endM ?? 0);

  while (totalMinutes <= endTotalMinutes) {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    const value = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
    const label = formatTimeLabel(h, m);
    slots.push({ value, label });
    totalMinutes += intervalMinutes;
  }
  return slots;
}

function formatTimeLabel(h: number, m: number): string {
  const suffix = h < 12 ? "AM" : "PM";
  const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${displayH}:${m.toString().padStart(2, "0")} ${suffix}`;
}

function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = (h ?? 0) * 60 + (m ?? 0) + minutes;
  const newH = Math.floor(total / 60);
  const newM = total % 60;
  return `${newH.toString().padStart(2, "0")}:${newM.toString().padStart(2, "0")}`;
}

/** Normalize "HH:mm:ss" or "HH:mm" to "HH:mm" */
function normalizeTime(time: string): string {
  return time.slice(0, 5);
}

// --- Schema ---

const createBookingSchema = z.object({
  courtId: z.string().min(1, "Selecciona una cancha"),
  date: z.string().min(1, "La fecha es requerida"),
  startTime: z.string().min(1, "Selecciona la hora"),
  duration: z.string().min(1, "Selecciona la duración"),
  customerName: z.string().min(1, "El nombre es requerido").max(100),
  customerPhone: z.string().max(20).optional(),
  customerEmail: z
    .string()
    .email("Email inválido")
    .optional()
    .or(z.literal("")),
  paymentMethod: z.enum(["cash", "card", "app"]).optional(),
  notes: z.string().max(500).optional(),
  players: z
    .array(
      z.object({
        position: z.number().int().min(2).max(4),
        guestName: z.string().min(1, "El nombre es requerido").max(100),
      }),
    )
    .max(3)
    .optional(),
});

type CreateBookingFormValues = z.infer<typeof createBookingSchema>;

interface CreateBookingDialogProps {
  open: boolean;
  onClose: () => void;
  onBookingCreated: () => void;
  initialCourtId?: string;
  initialDate?: string;
  initialStartTime?: string;
}

export function CreateBookingDialog({
  open,
  onClose,
  onBookingCreated,
  initialCourtId,
  initialDate,
  initialStartTime,
}: CreateBookingDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { facilityId } = useFacilityContext();

  const { data: courts } = useSuspenseQuery(
    trpc.court.list.queryOptions({ facilityId }),
  );

  const form = useForm<CreateBookingFormValues>({
    resolver: standardSchemaResolver(createBookingSchema),
    defaultValues: {
      courtId: initialCourtId ?? "",
      date: initialDate ?? format(new Date(), "yyyy-MM-dd"),
      startTime: initialStartTime ?? "",
      duration: "90",
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      paymentMethod: undefined,
      notes: "",
      players: [],
    },
  });

  // Reset form with fresh values when dialog opens
  useEffect(() => {
    if (open) {
      form.reset({
        courtId: initialCourtId ?? "",
        date: initialDate ?? format(new Date(), "yyyy-MM-dd"),
        startTime: initialStartTime ?? "",
        duration: "90",
        customerName: "",
        customerPhone: "",
        customerEmail: "",
        paymentMethod: undefined,
        notes: "",
        players: [],
      });
    }
  }, [open, initialCourtId, initialDate, initialStartTime, form]);

  const {
    fields: playerFields,
    append: appendPlayer,
    remove: removePlayer,
  } = useFieldArray({
    control: form.control,
    name: "players",
  });

  const addPlayer = useCallback(() => {
    const currentPlayers = form.getValues("players") ?? [];
    const usedPositions = new Set(currentPlayers.map((p) => p.position));
    // Find next available position (2, 3, or 4)
    const nextPosition = [2, 3, 4].find((pos) => !usedPositions.has(pos));
    if (nextPosition) {
      appendPlayer({ position: nextPosition, guestName: "" });
    }
  }, [form, appendPlayer]);

  const watchCourtId = form.watch("courtId");
  const watchStartTime = form.watch("startTime");
  const watchDuration = form.watch("duration");
  const watchDate = form.watch("date");

  // Parse date string to Date for the API call
  const parsedDate = useMemo(() => {
    if (!watchDate) return null;
    try {
      return parse(watchDate, "yyyy-MM-dd", new Date());
    } catch {
      return null;
    }
  }, [watchDate]);

  // Fetch slot info (operating hours, peak periods, existing bookings, blocked slots)
  const { data: slotInfo } = useQuery({
    ...trpc.booking.getSlotInfo.queryOptions({
      facilityId,
      date: parsedDate ?? new Date(),
    }),
    enabled: !!parsedDate,
  });

  const endTime = useMemo(() => {
    if (!watchStartTime || !watchDuration) return null;
    return addMinutesToTime(watchStartTime, parseInt(watchDuration, 10));
  }, [watchStartTime, watchDuration]);

  // Filter time slots to operating hours
  const availableTimeSlots = useMemo(() => {
    if (!slotInfo?.operatingHours || slotInfo.operatingHours.isClosed) {
      return ALL_TIME_SLOTS;
    }
    const openTime = normalizeTime(slotInfo.operatingHours.openTime);
    const closeTime = normalizeTime(slotInfo.operatingHours.closeTime);
    return ALL_TIME_SLOTS.filter(
      (slot) => slot.value >= openTime && slot.value < closeTime,
    );
  }, [slotInfo?.operatingHours]);

  // Server-side price calculation preview
  const canCalculatePrice =
    !!watchCourtId && !!watchStartTime && !!endTime && !!parsedDate;
  const { data: pricePreview } = useQuery({
    ...trpc.booking.calculatePrice.queryOptions({
      facilityId,
      courtId: watchCourtId,
      date: parsedDate ?? new Date(),
      startTime: watchStartTime,
      endTime: endTime ?? "00:00",
    }),
    enabled: canCalculatePrice,
  });

  const isPeak = pricePreview?.isPeakRate ?? false;

  // Detect booking conflict
  const conflict = useMemo(() => {
    if (!watchCourtId || !watchStartTime || !endTime || !slotInfo) return null;
    return (
      slotInfo.existingBookings.find(
        (b) =>
          b.courtId === watchCourtId &&
          normalizeTime(b.startTime) < endTime &&
          normalizeTime(b.endTime) > watchStartTime,
      ) ?? null
    );
  }, [watchCourtId, watchStartTime, endTime, slotInfo]);

  // Detect blocked slot conflict
  const blockedConflict = useMemo(() => {
    if (!watchCourtId || !watchStartTime || !endTime || !slotInfo) return null;
    return (
      slotInfo.blockedSlots.find(
        (b) =>
          (b.courtId === null || b.courtId === watchCourtId) &&
          normalizeTime(b.startTime) < endTime &&
          normalizeTime(b.endTime) > watchStartTime,
      ) ?? null
    );
  }, [watchCourtId, watchStartTime, endTime, slotInfo]);

  const isClosed = slotInfo?.operatingHours.isClosed ?? false;

  const createMutation = useMutation(
    trpc.booking.createManual.mutationOptions({
      onSuccess: () => {
        toast.success("Reserva creada exitosamente");
        void queryClient.invalidateQueries({ queryKey: [["booking"]] });
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

  const onSubmit = (values: CreateBookingFormValues) => {
    const computedEndTime = addMinutesToTime(
      values.startTime,
      parseInt(values.duration, 10),
    );
    createMutation.mutate({
      facilityId,
      courtId: values.courtId,
      date: parse(values.date, "yyyy-MM-dd", new Date()),
      startTime: values.startTime,
      endTime: computedEndTime,
      paymentMethod: values.paymentMethod,
      customerName: values.customerName,
      customerPhone: values.customerPhone ?? undefined,
      customerEmail: values.customerEmail ?? undefined,
      notes: values.notes ?? undefined,
      players: values.players?.length ? values.players : undefined,
    });
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
      form.reset();
    }
  };

  const selectedCourtName = courts.find((c) => c.id === watchCourtId)?.name;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nueva reserva</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Court selector */}
            <FormField
              control={form.control}
              name="courtId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cancha *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar cancha" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {courts.map((court) => (
                        <SelectItem key={court.id} value={court.id}>
                          {court.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date picker */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Closed day warning */}
            {isClosed && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                El local está cerrado este día
              </div>
            )}

            {/* Start time + Duration */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora inicio *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableTimeSlots.map((slot) => (
                          <SelectItem key={slot.value} value={slot.value}>
                            {slot.label}
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
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duración *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DURATION_OPTIONS.map((opt) => (
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
            </div>

            {/* Computed time summary + peak badge */}
            {watchStartTime && endTime && watchDate && (
              <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">
                <ClockIcon className="h-4 w-4 shrink-0 text-gray-400" />
                <span>
                  {format(
                    parse(watchDate, "yyyy-MM-dd", new Date()),
                    "EEE d MMM",
                    { locale: es },
                  )}{" "}
                  &middot;{" "}
                  {
                    ALL_TIME_SLOTS.find((s) => s.value === watchStartTime)
                      ?.label
                  }{" "}
                  &ndash;{" "}
                  {formatTimeLabel(
                    ...(endTime.split(":").map(Number) as [number, number]),
                  )}
                </span>
                {isPeak && (
                  <Badge
                    variant="outline"
                    className="ml-auto border-orange-300 bg-orange-50 text-orange-700"
                  >
                    Horario pico
                  </Badge>
                )}
              </div>
            )}

            {/* Booking conflict warning */}
            {conflict && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
                <span className="font-medium">Conflicto:</span>{" "}
                {selectedCourtName ?? "La cancha"} ya tiene reserva de{" "}
                {normalizeTime(conflict.startTime)} a{" "}
                {normalizeTime(conflict.endTime)}
                {conflict.customerName ? ` (${conflict.customerName})` : ""}
              </div>
            )}

            {/* Blocked slot warning */}
            {blockedConflict && !conflict && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
                <span className="font-medium">Bloqueado:</span> Horario
                bloqueado de {normalizeTime(blockedConflict.startTime)} a{" "}
                {normalizeTime(blockedConflict.endTime)} (
                {blockedConflict.reason})
              </div>
            )}

            {/* Customer name */}
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

            {/* Phone + Email */}
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

            {/* Additional players (positions 2-4) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Jugadores adicionales
                </span>
                {playerFields.length < 3 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={addPlayer}
                  >
                    + Agregar jugador
                  </Button>
                )}
              </div>
              {playerFields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-2">
                  <span className="text-muted-foreground w-5 shrink-0 text-center text-xs">
                    {field.position}
                  </span>
                  <FormField
                    control={form.control}
                    name={`players.${index}.guestName`}
                    render={({ field: nameField }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            placeholder={`Jugador ${field.position}`}
                            {...nameField}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive h-8 w-8 shrink-0 p-0"
                    onClick={() => removePlayer(index)}
                  >
                    <XIcon className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {playerFields.length === 0 && (
                <p className="text-muted-foreground text-xs">
                  Sin jugadores adicionales
                </p>
              )}
            </div>

            {/* Price preview + Payment method */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="text-sm font-medium">Precio</span>
                <div className="bg-muted flex h-9 items-center rounded-md border px-3 text-sm">
                  {canCalculatePrice && pricePreview
                    ? `S/ ${(pricePreview.priceInCents / 100).toFixed(2)}`
                    : "—"}
                </div>
              </div>

              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Método de pago</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? ""}
                    >
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

            {/* Notes */}
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

function ClockIcon({ className }: { className?: string }) {
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
        d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
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
        d="M6 18 18 6M6 6l12 12"
      />
    </svg>
  );
}
