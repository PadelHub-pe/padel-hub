"use client";

import { useMemo, useState } from "react";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";

import { Button } from "@wifo/ui/button";
import { toast } from "@wifo/ui/toast";

import type { TeamMemberRow } from "~/app/org/[orgSlug]/(org-view)/settings/_components/team-columns";
import { EditMemberDialog } from "~/app/org/[orgSlug]/(org-view)/settings/_components/edit-member-dialog";
import { InviteMemberDialog } from "~/app/org/[orgSlug]/(org-view)/settings/_components/invite-member-dialog";
import { RemoveMemberDialog } from "~/app/org/[orgSlug]/(org-view)/settings/_components/remove-member-dialog";
import { getTeamColumns } from "~/app/org/[orgSlug]/(org-view)/settings/_components/team-columns";
import { DataTable } from "~/components/ui/data-table";
import { useTRPC } from "~/trpc/react";

interface FacilityTeamTabProps {
  organizationId: string;
  facilityId: string;
}

function sortTeamMembers(members: TeamMemberRow[]): TeamMemberRow[] {
  return [...members].sort((a, b) => {
    if (a.isCurrentUser) return -1;
    if (b.isCurrentUser) return 1;
    if (a.type !== b.type) return a.type === "member" ? -1 : 1;
    if (a.type === "member" && b.type === "member") {
      return a.name.localeCompare(b.name, "es");
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function FacilityTeamTab({
  organizationId,
  facilityId,
}: FacilityTeamTabProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const queryOptions = trpc.org.getTeamMembers.queryOptions({
    organizationId,
    facilityId,
  });
  const { data } = useSuspenseQuery(queryOptions);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [editMember, setEditMember] = useState<TeamMemberRow | null>(null);
  const [removeMember, setRemoveMember] = useState<TeamMemberRow | null>(null);

  // Invalidate facility-scoped query when any dialog closes
  const invalidateFacilityTeam = () => {
    void queryClient.invalidateQueries(queryOptions);
  };

  const resendInvite = useMutation(
    trpc.org.resendInvite.mutationOptions({
      onSuccess: () => {
        toast.success("Invitación reenviada");
        invalidateFacilityTeam();
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

  const currentUser = data.members.find((m) => m.isCurrentUser);
  const userRole = currentUser?.role ?? "staff";
  const userFacilityIds = currentUser?.facilityIds ?? [];

  const activeCount = data.members.filter((m) => m.type === "member").length;
  const pendingCount = data.members.filter((m) => m.type === "invite").length;
  const adminCount = data.members.filter(
    (m) => m.type === "member" && m.role === "org_admin",
  ).length;

  const isManager = userRole === "facility_manager";

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
            Equipo del Local
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {activeCount === 0 && pendingCount === 0
              ? "No hay equipo asignado a este local"
              : pendingCount > 0
                ? `${activeCount} ${activeCount === 1 ? "miembro" : "miembros"} / ${pendingCount} ${pendingCount === 1 ? "invitación pendiente" : "invitaciones pendientes"}`
                : `${activeCount} ${activeCount === 1 ? "miembro" : "miembros"}`}
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          {isManager ? "Invitar Staff" : "Invitar Miembro"}
        </Button>
      </div>

      {activeCount === 0 && pendingCount === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 py-12 text-center">
          <p className="text-sm text-gray-600">
            No hay equipo asignado a este local. Invita miembros para gestionar
            este local.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setInviteOpen(true)}
          >
            {isManager ? "Invitar Staff" : "Invitar Miembro"}
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
        onOpenChange={(open) => {
          setInviteOpen(open);
          if (!open) invalidateFacilityTeam();
        }}
        organizationId={organizationId}
        facilities={data.facilities}
        userRole={userRole}
        userFacilityIds={userFacilityIds}
      />

      {editMember && (
        <EditMemberDialog
          open={!!editMember}
          onOpenChange={(open) => {
            if (!open) {
              setEditMember(null);
              invalidateFacilityTeam();
            }
          }}
          organizationId={organizationId}
          member={editMember}
          facilities={data.facilities}
          adminCount={adminCount}
        />
      )}

      {removeMember && (
        <RemoveMemberDialog
          open={!!removeMember}
          onOpenChange={(open) => {
            if (!open) {
              setRemoveMember(null);
              invalidateFacilityTeam();
            }
          }}
          organizationId={organizationId}
          member={removeMember}
        />
      )}
    </div>
  );
}
