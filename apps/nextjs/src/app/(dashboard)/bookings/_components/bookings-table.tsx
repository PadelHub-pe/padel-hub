"use client";

import { useMemo } from "react";

import { DataTable } from "~/components/ui/data-table";
import type { BookingRow } from "./bookings-columns";
import { getBookingsColumns } from "./bookings-columns";

interface BookingsTableProps {
  bookings: BookingRow[];
  onBookingClick: (bookingId: string) => void;
  onBookingUpdated: () => void;
}

export function BookingsTable({
  bookings,
  onBookingClick,
  onBookingUpdated,
}: BookingsTableProps) {
  // Create a map of court IDs to their index for consistent coloring
  const courtIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    let courtIndex = 0;
    bookings.forEach((booking) => {
      if (!map.has(booking.court.id)) {
        map.set(booking.court.id, courtIndex++);
      }
    });
    return map;
  }, [bookings]);

  const columns = useMemo(
    () => getBookingsColumns({ courtIndexMap, onBookingUpdated }),
    [courtIndexMap, onBookingUpdated],
  );

  if (bookings.length === 0) {
    return (
      <div className="rounded-lg border bg-white">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <CalendarIcon className="h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            No hay reservas
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            No se encontraron reservas con los filtros seleccionados.
          </p>
        </div>
      </div>
    );
  }

  return (
    <DataTable
      columns={columns}
      data={bookings}
      onRowClick={(row) => onBookingClick(row.id)}
    />
  );
}

function CalendarIcon({ className }: { className?: string }) {
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
        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
      />
    </svg>
  );
}
