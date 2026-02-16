"use client";

import { useMutation } from "@tanstack/react-query";

import { Button } from "@wifo/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@wifo/ui/dialog";
import { toast } from "@wifo/ui/toast";

import { useFacilityContext } from "~/hooks";
import { useTRPC } from "~/trpc/react";

interface RemovePlayerDialogProps {
  open: boolean;
  onClose: () => void;
  bookingId: string;
  player: {
    id: string;
    position: number;
    guestName: string | null;
    user: { name: string | null } | null;
  } | null;
  onPlayerRemoved: () => void;
}

export function RemovePlayerDialog({
  open,
  onClose,
  bookingId,
  player,
  onPlayerRemoved,
}: RemovePlayerDialogProps) {
  const trpc = useTRPC();
  const { facilityId } = useFacilityContext();

  const playerName =
    player?.user?.name ?? player?.guestName ?? "Jugador";

  const removeMutation = useMutation(
    trpc.booking.removePlayer.mutationOptions({
      onSuccess: () => {
        toast.success("Jugador removido");
        onPlayerRemoved();
        onClose();
      },
      onError: (e) => {
        toast.error(e.message);
      },
    }),
  );

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Remover jugador?</DialogTitle>
          <DialogDescription>
            {playerName} de la posición {player?.position}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-700">
          Esta acción no se puede deshacer
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            disabled={removeMutation.isPending}
            onClick={() => {
              if (!player) return;
              removeMutation.mutate({
                bookingId,
                playerId: player.id,
                facilityId,
              });
            }}
          >
            {removeMutation.isPending ? "Removiendo..." : "Remover"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
