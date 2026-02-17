"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Button } from "@wifo/ui/button";
import { toast } from "@wifo/ui/toast";

import { DataTable } from "~/components/ui/data-table";
import { useTRPC } from "~/trpc/react";
import { EditMemberDialog } from "./edit-member-dialog";
import { InviteMemberDialog } from "./invite-member-dialog";
import { RemoveMemberDialog } from "./remove-member-dialog";
import type { TeamMemberRow } from "./team-columns";
import { getTeamColumns } from "./team-columns";

interface TeamTabProps {
  organizationId: string;
}

export function TeamTab({ organizationId }: TeamTabProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data } = useSuspenseQuery(
    trpc.org.getTeamMembers.queryOptions({ organizationId }),
  );

  const [inviteOpen, setInviteOpen] = useState(false);
  const [editMember, setEditMember] = useState<TeamMemberRow | null>(null);
  const [removeMember, setRemoveMember] = useState<TeamMemberRow | null>(null);

  const resendInvite = useMutation(
    trpc.org.resendInvite.mutationOptions({
      onSuccess: () => {
        toast.success("Invitación reenviada");
        void queryClient.invalidateQueries(
          trpc.org.getTeamMembers.queryOptions({ organizationId }),
        );
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const columns = useMemo(
    () =>
      getTeamColumns({
        onEdit: (member) => setEditMember(member),
        onRemove: (member) => setRemoveMember(member),
        onResend: (member) =>
          resendInvite.mutate({ organizationId, inviteId: member.id }),
        onCancel: (member) => setRemoveMember(member),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [organizationId],
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Equipo y Roles</h2>
          <p className="mt-1 text-sm text-gray-500">
            Administra los miembros de tu organización y sus permisos
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>Invitar Miembro</Button>
      </div>

      <DataTable columns={columns} data={data.members} />

      <InviteMemberDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        organizationId={organizationId}
        facilities={data.facilities}
      />

      {editMember && (
        <EditMemberDialog
          open={!!editMember}
          onOpenChange={(open) => !open && setEditMember(null)}
          organizationId={organizationId}
          member={editMember}
          facilities={data.facilities}
        />
      )}

      {removeMember && (
        <RemoveMemberDialog
          open={!!removeMember}
          onOpenChange={(open) => !open && setRemoveMember(null)}
          organizationId={organizationId}
          member={removeMember}
        />
      )}
    </div>
  );
}
