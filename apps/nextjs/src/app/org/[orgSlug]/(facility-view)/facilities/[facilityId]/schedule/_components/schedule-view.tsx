"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { useTRPC } from "~/trpc/react";
import { BlockTimeDialog } from "./block-time-dialog";
import { BlockedSlotsSection } from "./blocked-slots-section";
import { OperatingHoursSection } from "./operating-hours-section";
import { PeakPeriodsSection } from "./peak-periods-section";
import { ScheduleHeader } from "./schedule-header";

export function ScheduleView() {
  const params = useParams();
  const facilityId = params.facilityId as string;
  const trpc = useTRPC();
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);

  // Fetch data
  const {
    data: operatingHours,
    isLoading: isLoadingHours,
    error: hoursError,
  } = useQuery(trpc.schedule.getOperatingHours.queryOptions({ facilityId }));

  const {
    data: peakPeriods,
    isLoading: isLoadingPeaks,
    error: peaksError,
  } = useQuery(trpc.schedule.getPeakPeriods.queryOptions({ facilityId }));

  const isLoading = isLoadingHours || isLoadingPeaks;
  const error = hoursError ?? peaksError;

  if (error) {
    return (
      <div className="p-8">
        <ScheduleHeader />
        <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-600">Error al cargar los datos</p>
          <p className="mt-1 text-sm text-red-500">{error.message}</p>
        </div>
      </div>
    );
  }

  if (isLoading || !operatingHours || !peakPeriods) {
    return (
      <div className="p-8">
        <ScheduleHeader />

        {/* Loading skeletons */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="h-96 animate-pulse rounded-xl border bg-white" />
          <div className="h-96 animate-pulse rounded-xl border bg-white" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <ScheduleHeader onBlockTime={() => setBlockDialogOpen(true)} />

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <OperatingHoursSection facilityId={facilityId} hours={operatingHours} />
        <PeakPeriodsSection facilityId={facilityId} periods={peakPeriods} />
        <BlockedSlotsSection
          facilityId={facilityId}
          onBlockTime={() => setBlockDialogOpen(true)}
        />
      </div>

      <BlockTimeDialog
        open={blockDialogOpen}
        onClose={() => setBlockDialogOpen(false)}
        facilityId={facilityId}
      />
    </div>
  );
}
