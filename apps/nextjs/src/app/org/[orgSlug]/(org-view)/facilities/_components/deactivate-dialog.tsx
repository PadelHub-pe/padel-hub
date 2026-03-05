"use client";

import { useQuery } from "@tanstack/react-query";

import { Button } from "@wifo/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@wifo/ui/dialog";

import { useTRPC } from "~/trpc/react";

interface DeactivateFacility {
  id: string;
  name: string;
}

export function DeactivateDialog({
  facility,
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: {
  facility: DeactivateFacility | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  const trpc = useTRPC();

  const { data: stats } = useQuery({
    ...trpc.booking.getStats.queryOptions({
      facilityId: facility?.id ?? "",
    }),
    enabled: open && !!facility,
  });

  if (!facility) return null;

  const pendingCount = stats?.pendingBookings ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Desactivar {facility.name}?</DialogTitle>
          <DialogDescription>
            El local dejará de estar visible para los jugadores y no se podrán
            crear nuevas reservas.
          </DialogDescription>
        </DialogHeader>
        {pendingCount > 0 && (
          <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-700">
            <strong>Atención:</strong> Este local tiene{" "}
            <strong>
              {pendingCount}{" "}
              {pendingCount === 1 ? "reserva pendiente" : "reservas pendientes"}
            </strong>
            . Desactivar el local no cancela las reservas existentes.
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? "Desactivando..." : "Desactivar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
