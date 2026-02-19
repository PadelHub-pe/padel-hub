"use client";

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
import { toast } from "@wifo/ui/toast";

import type { TeamMemberRow } from "./team-columns";
import { useTRPC } from "~/trpc/react";

interface RemoveMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  member: TeamMemberRow;
}

export function RemoveMemberDialog({
  open,
  onOpenChange,
  organizationId,
  member,
}: RemoveMemberDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const isInvite = member.type === "invite";

  const removeMember = useMutation(
    trpc.org.removeMember.mutationOptions({
      onSuccess: () => {
        toast.success("Miembro eliminado");
        void queryClient.invalidateQueries(
          trpc.org.getTeamMembers.queryOptions({ organizationId }),
        );
        onOpenChange(false);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const cancelInvite = useMutation(
    trpc.org.cancelInvite.mutationOptions({
      onSuccess: () => {
        toast.success("Invitación cancelada");
        void queryClient.invalidateQueries(
          trpc.org.getTeamMembers.queryOptions({ organizationId }),
        );
        onOpenChange(false);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const isPending = removeMember.isPending || cancelInvite.isPending;

  function handleConfirm() {
    if (isInvite) {
      cancelInvite.mutate({ organizationId, inviteId: member.id });
    } else {
      removeMember.mutate({ organizationId, memberId: member.id });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isInvite ? "Cancelar Invitación" : "Eliminar Miembro"}
          </DialogTitle>
          <DialogDescription>
            {isInvite
              ? `¿Estás seguro de cancelar la invitación a ${member.email}?`
              : `¿Estás seguro de eliminar a ${member.name} de la organización?`}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            No, volver
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending
              ? "Procesando..."
              : isInvite
                ? "Cancelar Invitación"
                : "Eliminar Miembro"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
