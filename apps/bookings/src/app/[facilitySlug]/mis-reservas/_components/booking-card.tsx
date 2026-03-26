"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

import { cn } from "@wifo/ui";
import { Badge } from "@wifo/ui/badge";
import { Button } from "@wifo/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@wifo/ui/dialog";

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "outline" | "destructive";
  }
> = {
  confirmed: { label: "Confirmada", variant: "default" },
  in_progress: { label: "En curso", variant: "secondary" },
  completed: { label: "Completada", variant: "outline" },
  cancelled: { label: "Cancelada", variant: "destructive" },
};

interface BookingCardProps {
  booking: {
    id: string;
    code: string;
    date: Date;
    startTime: string;
    endTime: string;
    priceInCents: number;
    isPeakRate: boolean | null;
    status: string;
    court: { id: string; name: string; type: "indoor" | "outdoor" };
  };
  canCancel: boolean;
  onCancel: (bookingId: string) => Promise<void>;
  isCancelling: boolean;
}

export function BookingCard({
  booking,
  canCancel,
  onCancel,
  isCancelling,
}: BookingCardProps) {
  const [showCancel, setShowCancel] = useState(false);
  const [cancelError, setCancelError] = useState("");

  const statusConfig = STATUS_CONFIG[booking.status] ?? {
    label: booking.status,
    variant: "outline" as const,
  };

  const dateStr =
    typeof booking.date === "string"
      ? (booking.date as string)
      : booking.date instanceof Date
        ? (booking.date.toISOString().split("T")[0] ?? "")
        : "";

  let formattedDate: string;
  try {
    formattedDate = format(parseISO(dateStr), "EEE d MMM", { locale: es });
  } catch {
    formattedDate = dateStr;
  }

  async function handleCancel() {
    setCancelError("");
    try {
      await onCancel(booking.id);
      setShowCancel(false);
    } catch (e) {
      setCancelError(
        e instanceof Error ? e.message : "Error al cancelar la reserva",
      );
    }
  }

  return (
    <>
      <div
        className={cn(
          "rounded-lg border p-4",
          booking.status === "cancelled" && "opacity-60",
        )}
      >
        {/* Header: code + status */}
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-medium">{booking.code}</span>
          <Badge variant={statusConfig.variant} className="text-xs">
            {statusConfig.label}
          </Badge>
        </div>

        {/* Details */}
        <div className="mt-3 space-y-1 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Cancha</span>
            <div className="flex items-center gap-1.5">
              <span className="font-medium">{booking.court.name}</span>
              <span className="text-muted-foreground text-xs capitalize">
                ({booking.court.type})
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Fecha</span>
            <span className="font-medium capitalize">{formattedDate}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Horario</span>
            <span className="font-medium">
              {booking.startTime} – {booking.endTime}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Total</span>
            <div className="flex items-center gap-1.5">
              <span className="font-medium">
                S/ {(booking.priceInCents / 100).toFixed(0)}
              </span>
              {booking.isPeakRate && (
                <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
                  Punta
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Cancel button */}
        {canCancel && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 w-full text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950 dark:hover:text-red-300"
            onClick={() => setShowCancel(true)}
          >
            Cancelar reserva
          </Button>
        )}
      </div>

      {/* Cancel confirmation dialog */}
      <Dialog open={showCancel} onOpenChange={setShowCancel}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Cancelar reserva</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas cancelar tu reserva{" "}
              <span className="font-medium">{booking.code}</span> del{" "}
              <span className="font-medium capitalize">{formattedDate}</span> de{" "}
              <span className="font-medium">
                {booking.startTime} a {booking.endTime}
              </span>
              ?
            </DialogDescription>
          </DialogHeader>

          {cancelError && <p className="text-sm text-red-500">{cancelError}</p>}

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={isCancelling}>
                No, mantener
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={isCancelling}
            >
              {isCancelling ? "Cancelando..." : "Sí, cancelar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
