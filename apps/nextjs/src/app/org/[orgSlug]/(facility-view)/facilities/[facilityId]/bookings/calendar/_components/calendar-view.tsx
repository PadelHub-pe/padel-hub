"use client";

import { useState } from "react";
import {
  keepPreviousData,
  useQuery,
  useSuspenseQuery,
} from "@tanstack/react-query";

import { useFacilityContext } from "~/hooks";
import { useTRPC } from "~/trpc/react";
import { BookingDetailDrawer } from "../../_components/booking-detail-drawer";
import { CalendarDayGrid } from "./calendar-day-grid";
import { CalendarHeader } from "./calendar-header";
import { CalendarLegend } from "./calendar-legend";
import { getWeekStart } from "./calendar-utils";
import { CalendarWeekGrid } from "./calendar-week-grid";
import { MiniCalendar } from "./mini-calendar";
import { QuickBookingForm } from "./quick-booking-form";

interface QuickBookingSlot {
  courtId: string;
  courtName: string;
  date: Date;
  startTime: string;
}

export function CalendarView() {
  const trpc = useTRPC();
  const { facilityId } = useFacilityContext();

  // State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"day" | "week">("day");
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(
    null,
  );
  const [quickBookingSlot, setQuickBookingSlot] =
    useState<QuickBookingSlot | null>(null);
  const [showMiniCalendar, setShowMiniCalendar] = useState(true);

  // Fetch courts for quick booking form
  const { data: courts } = useSuspenseQuery(
    trpc.court.list.queryOptions({ facilityId }),
  );

  // Fetch day or week data based on view mode
  const { data: dayData, refetch: refetchDay } = useQuery({
    ...trpc.calendar.getDayView.queryOptions({ facilityId, date: currentDate }),
    enabled: viewMode === "day",
    placeholderData: keepPreviousData,
  });

  const weekStart = getWeekStart(currentDate);
  const { data: weekData, refetch: refetchWeek } = useQuery({
    ...trpc.calendar.getWeekView.queryOptions({ facilityId, weekStart }),
    enabled: viewMode === "week",
    placeholderData: keepPreviousData,
  });

  const handleDateChange = (date: Date) => {
    setCurrentDate(date);
  };

  const handleViewModeChange = (mode: "day" | "week") => {
    setViewMode(mode);
  };

  const handleBookingClick = (bookingId: string) => {
    setSelectedBookingId(bookingId);
  };

  const handleClosePopover = () => {
    setSelectedBookingId(null);
  };

  const handleBookingUpdated = () => {
    if (viewMode === "day") {
      void refetchDay();
    } else {
      void refetchWeek();
    }
  };

  const handleEmptySlotClick = (courtId: string, startTime: string) => {
    const court = courts.find((c) => c.id === courtId);
    if (court) {
      setQuickBookingSlot({
        courtId,
        courtName: court.name,
        date: currentDate,
        startTime,
      });
    }
  };

  const handleAddBooking = () => {
    // Open quick booking form with first court and current time or opening time
    const firstCourt = courts[0];
    if (firstCourt && dayData) {
      const now = new Date();
      const currentHour = now.getHours();
      const [openHour] = dayData.operatingHours.openTime.split(":").map(Number);

      // Use current hour if within operating hours, otherwise use opening time
      const startHour =
        currentHour >= (openHour ?? 8) ? currentHour : (openHour ?? 8);
      const startTime = `${startHour.toString().padStart(2, "0")}:00`;

      setQuickBookingSlot({
        courtId: firstCourt.id,
        courtName: firstCourt.name,
        date: currentDate,
        startTime,
      });
    }
  };

  const handleCloseQuickBooking = () => {
    setQuickBookingSlot(null);
  };

  const handleBookingCreated = () => {
    if (viewMode === "day") {
      void refetchDay();
    } else {
      void refetchWeek();
    }
  };

  const handleDayClickInWeekView = (date: Date) => {
    setCurrentDate(date);
    setViewMode("day");
  };

  // Get current stats
  const stats =
    viewMode === "day"
      ? (dayData?.stats ?? {
          totalBookings: 0,
          revenueInCents: 0,
          utilizationPercent: 0,
        })
      : {
          totalBookings: weekData?.stats.totalBookings ?? 0,
          revenueInCents: weekData?.stats.revenueInCents ?? 0,
          utilizationPercent: weekData?.stats.avgUtilizationPercent ?? 0,
        };

  return (
    <div className="flex h-full">
      {/* Sidebar with mini calendar */}
      {showMiniCalendar && (
        <div className="hidden w-64 shrink-0 flex-col border-r bg-gray-50 lg:flex">
          <div className="flex-1 p-4">
            <MiniCalendar
              selectedDate={currentDate}
              onDateSelect={handleDateChange}
            />
          </div>
          <button
            onClick={() => setShowMiniCalendar(false)}
            className="flex items-center justify-center gap-2 border-t bg-gray-100/50 px-4 py-2 text-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
          >
            <ChevronLeftDoubleIcon className="h-4 w-4" />
            <span>Ocultar calendario</span>
          </button>
        </div>
      )}

      {/* Toggle button when mini calendar is hidden */}
      {!showMiniCalendar && (
        <button
          onClick={() => setShowMiniCalendar(true)}
          className="hidden shrink-0 flex-col items-center justify-center gap-1 border-r bg-gray-50 px-2 py-4 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 lg:flex"
          title="Mostrar calendario"
        >
          <ChevronRightDoubleIcon className="h-4 w-4" />
          <span className="text-xs [writing-mode:vertical-lr]">Calendario</span>
        </button>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden p-6">
        <CalendarHeader
          currentDate={currentDate}
          onDateChange={handleDateChange}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          onAddBooking={handleAddBooking}
        />

        <div className="mt-4">
          <CalendarLegend stats={stats} />
        </div>

        <div className="mt-4 flex-1 overflow-auto">
          {viewMode === "day"
            ? dayData && (
                <CalendarDayGrid
                  currentDate={currentDate}
                  courts={dayData.courts}
                  bookings={dayData.bookings}
                  operatingHours={dayData.operatingHours}
                  peakPeriods={dayData.peakPeriods}
                  onBookingClick={handleBookingClick}
                  onEmptySlotClick={handleEmptySlotClick}
                />
              )
            : weekData && (
                <CalendarWeekGrid
                  weekStart={weekStart}
                  days={weekData.days}
                  bookings={weekData.bookings}
                  onBookingClick={handleBookingClick}
                  onDayClick={handleDayClickInWeekView}
                />
              )}
        </div>
      </div>

      {/* Booking detail drawer */}
      <BookingDetailDrawer
        bookingId={selectedBookingId}
        open={selectedBookingId !== null}
        onClose={handleClosePopover}
        onBookingUpdated={handleBookingUpdated}
      />

      {/* Quick booking form */}
      {quickBookingSlot && (
        <QuickBookingForm
          open={true}
          onClose={handleCloseQuickBooking}
          facilityId={facilityId}
          courtId={quickBookingSlot.courtId}
          courtName={quickBookingSlot.courtName}
          date={quickBookingSlot.date}
          startTime={quickBookingSlot.startTime}
          onBookingCreated={handleBookingCreated}
        />
      )}
    </div>
  );
}

function ChevronLeftDoubleIcon({ className }: { className?: string }) {
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
        d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5"
      />
    </svg>
  );
}

function ChevronRightDoubleIcon({ className }: { className?: string }) {
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
        d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5"
      />
    </svg>
  );
}
