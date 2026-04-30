"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  formatLimaDate,
  formatLimaDateParam,
  nowUtc,
  parseLimaDateParam,
} from "@wifo/api/datetime";
import { Badge } from "@wifo/ui/badge";
import { Button } from "@wifo/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@wifo/ui/card";
import { toast } from "@wifo/ui/toast";

import { useTRPC } from "~/trpc/react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BlockedSlotsSectionProps {
  facilityId: string;
  onBlockTime: () => void;
}

const reasonLabels: Record<string, string> = {
  maintenance: "Mantenimiento",
  private_event: "Evento privado",
  tournament: "Torneo",
  weather: "Clima",
  other: "Otro",
};

const reasonColors: Record<string, string> = {
  maintenance: "bg-orange-100 text-orange-800",
  private_event: "bg-purple-100 text-purple-800",
  tournament: "bg-blue-100 text-blue-800",
  weather: "bg-sky-100 text-sky-800",
  other: "bg-gray-100 text-gray-800",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BlockedSlotsSection({
  facilityId,
  onBlockTime,
}: BlockedSlotsSectionProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const { data: blockedSlots, isLoading } = useQuery(
    trpc.schedule.listBlockedSlots.queryOptions({ facilityId }),
  );

  const deleteMutation = useMutation(
    trpc.schedule.deleteBlockedSlot.mutationOptions({
      onSuccess: () => {
        toast.success("Bloqueo eliminado");
        setConfirmingId(null);
        void queryClient.invalidateQueries({
          queryKey: trpc.schedule.listBlockedSlots.queryKey({ facilityId }),
        });
        void queryClient.invalidateQueries({
          queryKey: trpc.schedule.getBlockedSlots.queryKey(),
        });
        void queryClient.invalidateQueries({
          queryKey: trpc.schedule.getDayOverview.queryKey(),
        });
      },
      onError: (error) => {
        toast.error(error.message);
        setConfirmingId(null);
      },
    }),
  );

  const handleDelete = (id: string) => {
    if (confirmingId === id) {
      deleteMutation.mutate({ id });
    } else {
      setConfirmingId(id);
    }
  };

  // Separate upcoming from past
  const upcomingSlots =
    blockedSlots?.filter((s) => s.date >= formatLimaDateParam(nowUtc())) ?? [];
  const pastSlots =
    blockedSlots?.filter((s) => s.date < formatLimaDateParam(nowUtc())) ?? [];

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900">
          Horarios Bloqueados
        </CardTitle>
        <Button variant="outline" size="sm" onClick={onBlockTime}>
          <ShieldIcon className="mr-2 h-4 w-4" />
          Bloquear Horario
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-16 animate-pulse rounded-lg border bg-gray-50" />
            <div className="h-16 animate-pulse rounded-lg border bg-gray-50" />
          </div>
        ) : upcomingSlots.length === 0 && pastSlots.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8 text-center">
            <ShieldIcon className="h-8 w-8 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">
              No hay horarios bloqueados
            </p>
            <p className="text-xs text-gray-400">
              Bloquea horarios para mantenimiento, eventos u otras razones
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Upcoming / active slots */}
            {upcomingSlots.length > 0 && (
              <div className="space-y-2">
                {upcomingSlots.map((slot) => (
                  <BlockedSlotCard
                    key={slot.id}
                    slot={slot}
                    isConfirming={confirmingId === slot.id}
                    isDeleting={
                      deleteMutation.isPending && confirmingId === slot.id
                    }
                    onDelete={() => handleDelete(slot.id)}
                    onCancelConfirm={() => setConfirmingId(null)}
                  />
                ))}
              </div>
            )}

            {/* Past slots */}
            {pastSlots.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-400 uppercase">
                  Pasados
                </p>
                {pastSlots.slice(0, 5).map((slot) => (
                  <BlockedSlotCard
                    key={slot.id}
                    slot={slot}
                    isPast
                    isConfirming={confirmingId === slot.id}
                    isDeleting={
                      deleteMutation.isPending && confirmingId === slot.id
                    }
                    onDelete={() => handleDelete(slot.id)}
                    onCancelConfirm={() => setConfirmingId(null)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// BlockedSlotCard
// ---------------------------------------------------------------------------

interface BlockedSlotCardProps {
  slot: {
    id: string;
    courtId: string | null;
    courtName: string | null;
    date: string;
    startTime: string;
    endTime: string;
    reason: string;
    notes: string | null;
    createdBy: string | null;
  };
  isPast?: boolean;
  isConfirming: boolean;
  isDeleting: boolean;
  onDelete: () => void;
  onCancelConfirm: () => void;
}

function BlockedSlotCard({
  slot,
  isPast,
  isConfirming,
  isDeleting,
  onDelete,
  onCancelConfirm,
}: BlockedSlotCardProps) {
  const formattedDate = formatLimaDate(
    parseLimaDateParam(slot.date),
    "EEE dd/MM",
  );

  return (
    <div
      className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
        isPast
          ? "border-gray-200 bg-gray-50 opacity-60"
          : "border-red-200 bg-red-50"
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-900">
            {formattedDate}
          </span>
          <span className="text-sm text-gray-600">
            {slot.startTime} - {slot.endTime}
          </span>
          <Badge
            variant="secondary"
            className={reasonColors[slot.reason] ?? "bg-gray-100 text-gray-800"}
          >
            {reasonLabels[slot.reason] ?? slot.reason}
          </Badge>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
          <span>{slot.courtName ?? "Todas las canchas"}</span>
          {slot.notes && (
            <>
              <span className="text-gray-300">|</span>
              <span className="max-w-[200px] truncate">{slot.notes}</span>
            </>
          )}
          {slot.createdBy && (
            <>
              <span className="text-gray-300">|</span>
              <span>por {slot.createdBy}</span>
            </>
          )}
        </div>
      </div>

      <div className="ml-3 flex shrink-0 items-center gap-2">
        {isConfirming ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancelConfirm}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
              disabled={isDeleting}
              className="text-xs"
            >
              {isDeleting ? "Eliminando..." : "Confirmar"}
            </Button>
          </>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-400 hover:text-red-500"
            onClick={onDelete}
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636"
      />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
      />
    </svg>
  );
}
