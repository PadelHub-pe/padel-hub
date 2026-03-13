"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { Button } from "@wifo/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@wifo/ui/select";
import { Textarea } from "@wifo/ui/textarea";
import { toast } from "@wifo/ui/toast";

import { useFacilityContext } from "~/hooks";
import { useTRPC } from "~/trpc/react";

const CANCELLATION_REASONS = [
  "Solicitud del jugador",
  "No-show",
  "Mantenimiento de cancha",
  "Evento privado",
  "Error de reserva",
  "Otro",
] as const;

export interface CancelBookingInfo {
  code: string;
  courtName: string;
  date: string;
  timeRange: string;
  playerCount: number;
}

interface CancelBookingDialogProps {
  bookingId: string;
  bookingInfo?: CancelBookingInfo;
  open: boolean;
  onClose: () => void;
  onCancelled: () => void;
}

export function CancelBookingDialog({
  bookingId,
  bookingInfo,
  open,
  onClose,
  onCancelled,
}: CancelBookingDialogProps) {
  const trpc = useTRPC();
  const { facilityId } = useFacilityContext();
  const [selectedReason, setSelectedReason] = useState("");
  const [internalNote, setInternalNote] = useState("");

  const cancelMutation = useMutation(
    trpc.booking.cancel.mutationOptions({
      onSuccess: () => {
        toast.success("Reserva cancelada");
        onCancelled();
        onClose();
        setSelectedReason("");
        setInternalNote("");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const handleCancel = () => {
    const parts: string[] = [];
    if (selectedReason) parts.push(selectedReason);
    if (internalNote.trim()) parts.push(`Nota: ${internalNote.trim()}`);
    const reason = parts.length > 0 ? parts.join(" — ") : undefined;

    cancelMutation.mutate({
      facilityId,
      id: bookingId,
      reason,
    });
  };

  const handleClose = () => {
    setSelectedReason("");
    setInternalNote("");
    onClose();
  };

  if (!open) return null;

  const notifiedCount = bookingInfo ? bookingInfo.playerCount : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={handleClose} />

      {/* Dialog */}
      <div className="relative z-50 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-gray-900">
          {bookingInfo
            ? `¿Cancelar reserva ${bookingInfo.code}?`
            : "Cancelar reserva"}
        </h2>

        {/* Booking summary */}
        {bookingInfo && (
          <p className="mt-2 text-sm text-gray-600">
            {bookingInfo.courtName} &bull; {bookingInfo.date} &bull;{" "}
            {bookingInfo.timeRange}
          </p>
        )}

        {/* Player notification count */}
        {notifiedCount > 0 && (
          <p className="mt-2 text-sm text-amber-700">
            {notifiedCount}{" "}
            {notifiedCount === 1
              ? "jugador será notificado"
              : "jugadores serán notificados"}
          </p>
        )}

        {/* Predefined reason dropdown */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">
            Motivo (opcional)
          </label>
          <Select value={selectedReason} onValueChange={setSelectedReason}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Seleccionar motivo" />
            </SelectTrigger>
            <SelectContent>
              {CANCELLATION_REASONS.map((reason) => (
                <SelectItem key={reason} value={reason}>
                  {reason}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Internal note */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">
            Nota interna (opcional)
          </label>
          <Textarea
            value={internalNote}
            onChange={(e) => setInternalNote(e.target.value)}
            placeholder="Nota interna, no visible para el jugador..."
            className="mt-1"
            rows={3}
            maxLength={500}
          />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose}>
            Volver
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={cancelMutation.isPending}
          >
            {cancelMutation.isPending ? "Cancelando..." : "Cancelar reserva"}
          </Button>
        </div>
      </div>
    </div>
  );
}
