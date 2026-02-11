"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@wifo/ui/button";
import { Textarea } from "@wifo/ui/textarea";
import { toast } from "@wifo/ui/toast";

import { useFacilityContext } from "~/hooks";
import { useTRPC } from "~/trpc/react";

interface CancelBookingDialogProps {
  bookingId: string;
  open: boolean;
  onClose: () => void;
  onCancelled: () => void;
}

export function CancelBookingDialog({
  bookingId,
  open,
  onClose,
  onCancelled,
}: CancelBookingDialogProps) {
  const trpc = useTRPC();
  const { facilityId } = useFacilityContext();
  const [reason, setReason] = useState("");

  const cancelMutation = useMutation(
    trpc.booking.cancel.mutationOptions({
      onSuccess: () => {
        toast.success("Reserva cancelada");
        onCancelled();
        onClose();
        setReason("");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const handleCancel = () => {
    cancelMutation.mutate({
      facilityId,
      id: bookingId,
      reason: reason || undefined,
    });
  };

  const handleClose = () => {
    setReason("");
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={handleClose}
      />

      {/* Dialog */}
      <div className="relative z-50 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-gray-900">
          Cancelar reserva
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Esta accion no se puede deshacer. El cliente sera notificado de la
          cancelacion.
        </p>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">
            Motivo de cancelacion (opcional)
          </label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ingresa el motivo de la cancelacion..."
            className="mt-1"
            rows={3}
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
