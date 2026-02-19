"use client";

import { useState } from "react";
import {
  keepPreviousData,
  useQuery,
  useSuspenseQuery,
} from "@tanstack/react-query";

import { useFacilityContext } from "~/hooks";
import { useTRPC } from "~/trpc/react";
import { BookingDetailDrawer } from "./booking-detail-drawer";
import { BookingsFilters } from "./bookings-filters";
import { BookingsHeader } from "./bookings-header";
import { BookingsPagination } from "./bookings-pagination";
import { BookingsTable } from "./bookings-table";
import { CreateBookingDialog } from "./create-booking-dialog";

export function BookingsView() {
  const trpc = useTRPC();
  const { facilityId, basePath } = useFacilityContext();

  // Filter state
  const [search, setSearch] = useState("");
  const [courtId, setCourtId] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [page, setPage] = useState(1);
  const limit = 10;

  // Selected booking for detail drawer
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(
    null,
  );

  // Create booking dialog
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: courts } = useSuspenseQuery(
    trpc.court.list.queryOptions({ facilityId }),
  );
  const {
    data: bookingsData,
    refetch,
    isFetching,
  } = useQuery({
    ...trpc.booking.list.queryOptions({
      facilityId,
      search: search || undefined,
      courtId,
      status: status as
        | "pending"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "open_match"
        | undefined,
      date,
      page,
      limit,
    }),
    placeholderData: keepPreviousData,
  });

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleCourtChange = (value: string | undefined) => {
    setCourtId(value);
    setPage(1);
  };

  const handleStatusChange = (value: string | undefined) => {
    setStatus(value);
    setPage(1);
  };

  const handleDateChange = (value: Date | undefined) => {
    setDate(value);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearch("");
    setCourtId(undefined);
    setStatus(undefined);
    setDate(undefined);
    setPage(1);
  };

  const handleBookingClick = (bookingId: string) => {
    setSelectedBookingId(bookingId);
  };

  const handleCloseDrawer = () => {
    setSelectedBookingId(null);
  };

  const handleBookingUpdated = () => {
    void refetch();
  };

  return (
    <div className="p-8">
      <BookingsHeader onAddBooking={() => setShowCreateDialog(true)} />

      <div className="mt-6">
        <BookingsFilters
          search={search}
          onSearchChange={handleSearchChange}
          courtId={courtId}
          onCourtChange={handleCourtChange}
          status={status}
          onStatusChange={handleStatusChange}
          date={date}
          onDateChange={handleDateChange}
          courts={courts}
          onClearFilters={handleClearFilters}
        />
      </div>

      <div className={`mt-6 ${isFetching && bookingsData ? "opacity-60" : ""}`}>
        <BookingsTable
          bookings={bookingsData?.bookings ?? []}
          onBookingClick={handleBookingClick}
          onBookingUpdated={handleBookingUpdated}
          basePath={basePath}
        />
      </div>

      <div className="mt-4">
        <BookingsPagination
          page={page}
          totalPages={bookingsData?.totalPages ?? 1}
          total={bookingsData?.total ?? 0}
          limit={limit}
          onPageChange={setPage}
        />
      </div>

      <BookingDetailDrawer
        bookingId={selectedBookingId}
        open={selectedBookingId !== null}
        onClose={handleCloseDrawer}
        onBookingUpdated={handleBookingUpdated}
      />

      <CreateBookingDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onBookingCreated={handleBookingUpdated}
      />
    </div>
  );
}
