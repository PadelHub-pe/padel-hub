"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@wifo/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@wifo/ui/card";
import { toast } from "@wifo/ui/toast";

import { useTRPC } from "~/trpc/react";
import { AddPeakPeriodDialog } from "./add-peak-period-dialog";
import { PeakPeriodCard } from "./peak-period-card";

interface PeakPeriod {
  id: string;
  name: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  markupPercent: number;
}

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

  const deleteMutation = useMutation(
    trpc.schedule.deletePeakPeriod.mutationOptions({
      onSuccess: () => {
        toast.success("Periodo pico eliminado");
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

  const handleDelete = (id: string) => {
    deleteMutation.mutate({ facilityId, id });
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Periodos Pico
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDialogOpen(true)}
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            Agregar
          </Button>
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
                  onDelete={() => handleDelete(period.id)}
                  isDeleting={deleteMutation.isPending}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddPeakPeriodDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        facilityId={facilityId}
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
