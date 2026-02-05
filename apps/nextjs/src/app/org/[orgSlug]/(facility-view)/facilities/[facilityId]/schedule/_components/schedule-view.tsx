"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { useTRPC } from "~/trpc/react";
import { BlockTimeDialog } from "./block-time-dialog";
import { DayOverviewGrid } from "./day-overview-grid";
import { DayOverviewLegend } from "./day-overview-legend";
import { OperatingHoursSection } from "./operating-hours-section";
import { PeakPeriodsSection } from "./peak-periods-section";
import { ScheduleHeader } from "./schedule-header";

export function ScheduleView() {
  const params = useParams();
  const facilityId = params.facilityId as string;
  const trpc = useTRPC();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [blockContext, setBlockContext] = useState<{
    courtId?: string;
    startTime?: string;
  } | null>(null);

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

  const {
    data: dayOverview,
    isLoading: isLoadingOverview,
    error: overviewError,
  } = useQuery(
    trpc.schedule.getDayOverview.queryOptions({ facilityId, date: selectedDate }),
  );

  const isLoading = isLoadingHours || isLoadingPeaks || isLoadingOverview;
  const error = hoursError ?? peaksError ?? overviewError;

  const handleEmptySlotClick = (courtId: string, startTime: string) => {
    setBlockContext({ courtId, startTime });
    setBlockDialogOpen(true);
  };

  const handleBlockButtonClick = () => {
    setBlockContext(null);
    setBlockDialogOpen(true);
  };

  if (error) {
    return (
      <div className="p-8">
        <ScheduleHeader
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          onBlockClick={handleBlockButtonClick}
        />
        <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-600">Error al cargar los datos</p>
          <p className="mt-1 text-sm text-red-500">{error.message}</p>
        </div>
      </div>
    );
  }

  if (isLoading || !operatingHours || !peakPeriods || !dayOverview) {
    return (
      <div className="p-8">
        <ScheduleHeader
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          onBlockClick={handleBlockButtonClick}
        />

        {/* Loading skeletons */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="h-96 animate-pulse rounded-xl border bg-white" />
          <div className="h-96 animate-pulse rounded-xl border bg-white" />
        </div>
        <div className="mt-8">
          <div className="mb-4 h-6 w-32 animate-pulse rounded bg-gray-200" />
          <div className="h-96 animate-pulse rounded-xl border bg-white" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <ScheduleHeader
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        onBlockClick={handleBlockButtonClick}
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <OperatingHoursSection facilityId={facilityId} hours={operatingHours} />
        <PeakPeriodsSection facilityId={facilityId} periods={peakPeriods} />
      </div>

      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Vista del Dia
          </h2>
          <DayOverviewLegend />
        </div>
        <DayOverviewGrid
          date={selectedDate}
          courts={dayOverview.courts}
          operatingHours={dayOverview.operatingHours}
          peakPeriods={dayOverview.peakPeriods}
          bookings={dayOverview.bookings}
          blockedSlots={dayOverview.blockedSlots}
          onEmptySlotClick={handleEmptySlotClick}
        />
      </div>

      <BlockTimeDialog
        open={blockDialogOpen}
        onClose={() => {
          setBlockDialogOpen(false);
          setBlockContext(null);
        }}
        facilityId={facilityId}
        courts={dayOverview.courts}
        defaultDate={selectedDate}
        defaultCourtId={blockContext?.courtId}
        defaultStartTime={blockContext?.startTime}
      />
    </div>
  );
}
