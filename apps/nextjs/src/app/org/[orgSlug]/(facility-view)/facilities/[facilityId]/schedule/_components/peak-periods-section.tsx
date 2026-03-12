"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@wifo/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@wifo/ui/card";
import { toast } from "@wifo/ui/toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@wifo/ui/tooltip";

import type { PeakPeriod } from "./peak-period-dialog";
import { useTRPC } from "~/trpc/react";
import { DeletePeakPeriodDialog } from "./delete-peak-period-dialog";
import { PeakPeriodCard } from "./peak-period-card";
import { PeakPeriodDialog } from "./peak-period-dialog";

const MAX_PEAK_PERIODS = 5;

interface PeakPeriodsSectionProps {
  facilityId: string;
  periods: PeakPeriod[];
}

export function PeakPeriodsSection({
  facilityId,
  periods,
}: PeakPeriodsSectionProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<PeakPeriod | null>(null);
  const [deletingPeriod, setDeletingPeriod] = useState<PeakPeriod | null>(null);

  const atLimit = periods.length >= MAX_PEAK_PERIODS;

  const deleteMutation = useMutation(
    trpc.schedule.deletePeakPeriod.mutationOptions({
      onSuccess: () => {
        toast.success("Periodo eliminado");
        setDeletingPeriod(null);
        void queryClient.invalidateQueries({
          queryKey: trpc.schedule.getPeakPeriods.queryKey({ facilityId }),
        });
        void queryClient.invalidateQueries({
          queryKey: trpc.schedule.getDayOverview.queryKey(),
        });
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const handleAdd = () => {
    setEditingPeriod(null);
    setDialogOpen(true);
  };

  const handleEdit = (period: PeakPeriod) => {
    setEditingPeriod(period);
    setDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (deletingPeriod) {
      deleteMutation.mutate({ facilityId, id: deletingPeriod.id });
    }
  };

  const addButton = (
    <Button variant="outline" size="sm" onClick={handleAdd} disabled={atLimit}>
      <PlusIcon className="mr-2 h-4 w-4" />
      Agregar
    </Button>
  );

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Periodos Pico
          </CardTitle>
          {atLimit ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={0}>{addButton}</span>
                </TooltipTrigger>
                <TooltipContent>
                  Maximo 5 periodos de hora punta por instalacion
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            addButton
          )}
        </CardHeader>
        <CardContent>
          {periods.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8 text-center">
              <ClockIcon className="h-8 w-8 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">
                No hay periodos pico configurados
              </p>
              <p className="text-xs text-gray-400">
                Agrega periodos para aplicar tarifas especiales
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {periods.map((period) => (
                <PeakPeriodCard
                  key={period.id}
                  period={period}
                  onEdit={() => handleEdit(period)}
                  onDelete={() => setDeletingPeriod(period)}
                  isDeleting={false}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <PeakPeriodDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        facilityId={facilityId}
        editingPeriod={editingPeriod}
        existingPeriods={periods}
      />

      <DeletePeakPeriodDialog
        open={!!deletingPeriod}
        onClose={() => setDeletingPeriod(null)}
        onConfirm={handleDeleteConfirm}
        periodName={deletingPeriod?.name ?? ""}
        isDeleting={deleteMutation.isPending}
      />
    </>
  );
}

function PlusIcon({ className }: { className?: string }) {
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
        d="M12 4.5v15m7.5-7.5h-15"
      />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
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
        d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </svg>
  );
}
