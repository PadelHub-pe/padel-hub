"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@wifo/ui/button";
import { toast } from "@wifo/ui/toast";

import { useFacilityContext } from "~/hooks";
import { useTRPC } from "~/trpc/react";
import { AddPeakPeriodDialog } from "../../schedule/_components/add-peak-period-dialog";

interface PeakPeriod {
  id: string;
  name: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  markupPercent: number;
}

interface PeakPeriodsSectionProps {
  peakPeriods: PeakPeriod[];
}

const DAY_LABELS = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];
const WEEKEND_DAYS = [0, 6];

function formatTime(time: string): string {
  const [h] = time.split(":").map(Number);
  if (h === undefined) return time;
  if (h === 0) return "12:00 AM";
  if (h === 12) return "12:00 PM";
  if (h > 12) return `${h - 12}:00 PM`;
  return `${h}:00 AM`;
}

export function PeakPeriodsSection({ peakPeriods }: PeakPeriodsSectionProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { facilityId } = useFacilityContext();
  const [showAddDialog, setShowAddDialog] = useState(false);

  const deleteMutation = useMutation(
    trpc.schedule.deletePeakPeriod.mutationOptions({
      onSuccess: () => {
        toast.success("Periodo pico eliminado");
        void queryClient.invalidateQueries({
          queryKey: trpc.pricing.getOverview.queryKey(),
        });
        void queryClient.invalidateQueries({
          queryKey: trpc.pricing.calculateRevenue.queryKey(),
        });
        void queryClient.invalidateQueries({
          queryKey: trpc.schedule.getPeakPeriods.queryKey(),
        });
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const invalidatePricingQueries = () => {
    void queryClient.invalidateQueries({
      queryKey: trpc.pricing.getOverview.queryKey(),
    });
    void queryClient.invalidateQueries({
      queryKey: trpc.pricing.calculateRevenue.queryKey(),
    });
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">
          Periodos Pico
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddDialog(true)}
          className="border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
        >
          <svg
            className="mr-1 h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Agregar Periodo
        </Button>
      </div>

      {peakPeriods.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 py-8 text-center">
          <p className="text-sm text-gray-500">
            No hay periodos pico configurados
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Agrega un periodo para definir tarifas de hora pico
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {peakPeriods.map((period) => (
            <div
              key={period.id}
              className="rounded-xl border border-amber-200 bg-amber-50 p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-200">
                    <span className="text-lg">
                      {period.daysOfWeek.some((d) => WEEKEND_DAYS.includes(d))
                        ? "\u2600\uFE0F"
                        : "\uD83C\uDF19"}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {period.name}
                    </h4>
                  </div>
                </div>
                <span className="rounded bg-amber-200 px-2 py-1 text-sm font-bold text-amber-800">
                  +{period.markupPercent}%
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-1">
                {period.daysOfWeek
                  .sort((a, b) => a - b)
                  .map((day) => (
                    <span
                      key={day}
                      className={`rounded border px-2 py-0.5 text-xs ${
                        WEEKEND_DAYS.includes(day)
                          ? "border-blue-200 bg-blue-100 font-medium text-blue-700"
                          : "border-gray-200 bg-white text-gray-600"
                      }`}
                    >
                      {DAY_LABELS[day]}
                    </span>
                  ))}
              </div>

              <p className="mt-2 text-sm font-medium text-amber-700">
                {formatTime(period.startTime)} - {formatTime(period.endTime)}
              </p>

              <div className="mt-3 flex gap-2">
                <button
                  className="text-xs text-gray-500 hover:text-red-600"
                  onClick={() =>
                    deleteMutation.mutate({
                      facilityId,
                      id: period.id,
                    })
                  }
                  disabled={deleteMutation.isPending}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddPeakPeriodDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        facilityId={facilityId}
        onSuccess={invalidatePricingQueries}
      />
    </div>
  );
}
