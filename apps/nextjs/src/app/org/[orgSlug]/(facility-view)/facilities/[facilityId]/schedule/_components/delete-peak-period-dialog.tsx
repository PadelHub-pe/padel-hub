"use client";

import { Button } from "@wifo/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@wifo/ui/dialog";

interface DeletePeakPeriodDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  periodName: string;
  isDeleting: boolean;
}

export function DeletePeakPeriodDialog({
  open,
  onClose,
  onConfirm,
  periodName,
  isDeleting,
}: DeletePeakPeriodDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Eliminar periodo</DialogTitle>
          <DialogDescription>
            {`¿Eliminar periodo "${periodName}"? Las reservas existentes con tarifa punta mantendrán su precio original.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
