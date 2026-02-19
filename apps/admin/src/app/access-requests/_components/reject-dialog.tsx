"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@wifo/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@wifo/ui/dialog";
import { Label } from "@wifo/ui/label";
import { Textarea } from "@wifo/ui/textarea";
import { toast } from "@wifo/ui/toast";

import type { AccessRequestRow } from "./access-requests-columns";
import { useTRPC } from "~/trpc/react";

export function RejectDialog({
  request,
  open,
  onOpenChange,
}: {
  request: AccessRequestRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState("");

  const rejectMutation = useMutation(
    trpc.admin.rejectAccessRequest.mutationOptions({
      onSuccess: () => {
        toast.success("Solicitud rechazada");
        void queryClient.invalidateQueries({
          queryKey: trpc.admin.listAccessRequests.queryKey(),
        });
        void queryClient.invalidateQueries({
          queryKey: trpc.admin.getStats.queryKey(),
        });
        handleClose();
      },
    }),
  );

  function handleClose() {
    setNotes("");
    rejectMutation.reset();
    onOpenChange(false);
  }

  if (!request) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rechazar solicitud</DialogTitle>
          <DialogDescription>
            La solicitud de <strong>{request.email}</strong> será marcada como
            rechazada.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="notes">Notas (opcional)</Label>
          <Textarea
            id="notes"
            placeholder="Motivo del rechazo..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            maxLength={500}
          />
        </div>
        {rejectMutation.error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
            {rejectMutation.error.message}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={() =>
              rejectMutation.mutate({
                id: request.id,
                notes: notes || undefined,
              })
            }
            disabled={rejectMutation.isPending}
          >
            {rejectMutation.isPending ? "Rechazando..." : "Rechazar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
