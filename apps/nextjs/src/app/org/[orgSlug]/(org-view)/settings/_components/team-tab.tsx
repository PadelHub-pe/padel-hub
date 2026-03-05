"use client";

import { useMemo, useState } from "react";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";

import { Button } from "@wifo/ui/button";
import { toast } from "@wifo/ui/toast";

import type { TeamMemberRow } from "./team-columns";
import { DataTable } from "~/components/ui/data-table";
import { useTRPC } from "~/trpc/react";
import { EditMemberDialog } from "./edit-member-dialog";
import { InviteMemberDialog } from "./invite-member-dialog";
import { RemoveMemberDialog } from "./remove-member-dialog";
import { getTeamColumns } from "./team-columns";

interface TeamTabProps {
  organizationId: string;
}

function sortTeamMembers(members: TeamMemberRow[]): TeamMemberRow[] {
  return [...members].sort((a, b) => {
    // Current user always first
    if (a.isCurrentUser) return -1;
    if (b.isCurrentUser) return 1;

    // Active members before invites
    if (a.type !== b.type) {
      return a.type === "member" ? -1 : 1;
    }

    // Within active members: alphabetically by name
    if (a.type === "member" && b.type === "member") {
      return a.name.localeCompare(b.name, "es");
    }

    // Within invites: by created date (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
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

  const sortedMembers = useMemo(
    () => sortTeamMembers(data.members),
    [data.members],
  );

  const activeCount = data.members.filter((m) => m.type === "member").length;
  const pendingCount = data.members.filter((m) => m.type === "invite").length;
  const adminCount = data.members.filter(
    (m) => m.type === "member" && m.role === "org_admin",
  ).length;
  const isAlone = activeCount === 1 && pendingCount === 0;

  const getRowClassName = useMemo(
    () => (row: TeamMemberRow) =>
      row.isCurrentUser ? "bg-blue-50" : undefined,
    [],
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Equipo y Roles
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {pendingCount > 0
              ? `${activeCount} ${activeCount === 1 ? "miembro" : "miembros"} / ${pendingCount} ${pendingCount === 1 ? "invitación pendiente" : "invitaciones pendientes"}`
              : `${activeCount} ${activeCount === 1 ? "miembro" : "miembros"}`}
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>Invitar Miembro</Button>
      </div>

      {isAlone ? (
        <div className="rounded-lg border border-dashed border-gray-300 py-12 text-center">
          <p className="text-sm text-gray-600">
            Eres el único miembro. Invita a tu equipo para gestionar tus locales
            juntos.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setInviteOpen(true)}
          >
            Invitar Miembro
          </Button>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={sortedMembers}
          getRowClassName={getRowClassName}
        />
      )}

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
          adminCount={adminCount}
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
