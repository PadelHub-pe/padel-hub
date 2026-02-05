"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { format, isToday, isTomorrow, isYesterday } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@wifo/ui";

import { BookingActionsMenu } from "./booking-actions-menu";
import { BookingStatusBadge } from "./booking-status-badge";
import { CourtBadge } from "./court-badge";

type BookingStatus =
  | "pending"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface BookingRow {
  id: string;
  code: string;
  date: Date;
  startTime: string;
  endTime: string;
  priceInCents: number;
  isPeakRate: boolean;
  status: BookingStatus;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  court: {
    id: string;
    name: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface ColumnsOptions {
  courtIndexMap: Map<string, number>;
  onBookingUpdated: () => void;
}

export function getBookingsColumns({
  courtIndexMap,
  onBookingUpdated,
}: ColumnsOptions): ColumnDef<BookingRow>[] {
  return [
    {
      accessorKey: "code",
      header: "RESERVA",
      cell: ({ row }) => {
        const isCancelled = row.original.status === "cancelled";
        return (
          <span
            className={cn(
              "font-mono text-sm text-blue-600",
              isCancelled && "line-through opacity-60",
            )}
          >
            {row.original.code}
          </span>
        );
      },
    },
    {
      accessorKey: "customer",
      header: "CLIENTE",
      cell: ({ row }) => {
        const booking = row.original;
        const customerName =
          booking.user?.name ?? booking.customerName ?? "-";
        const customerContact =
          booking.user?.email ??
          booking.customerEmail ??
          booking.customerPhone ??
          "";

        return (
          <div>
            <div className="font-medium text-gray-900">{customerName}</div>
            {customerContact && (
              <div className="text-sm text-gray-500">{customerContact}</div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "court",
      header: "CANCHA",
      cell: ({ row }) => {
        const courtIndex = courtIndexMap.get(row.original.court.id) ?? 0;
        return <CourtBadge name={row.original.court.name} index={courtIndex} />;
      },
    },
    {
      accessorKey: "date",
      header: "FECHA Y HORA",
      cell: ({ row }) => {
        const booking = row.original;
        const isCancelled = booking.status === "cancelled";
        const isStartingSoon = checkStartingSoon(booking);
        const dateFormatted = formatBookingDate(booking.date);
        const timeRange = `${formatTime(booking.startTime)} - ${formatTime(booking.endTime)}`;

        return (
          <div>
            {isStartingSoon && !isCancelled && (
              <div className="mb-0.5 text-xs font-medium text-amber-600">
                Comienza pronto
              </div>
            )}
            <div className="text-gray-900">{dateFormatted}</div>
            <div className="text-sm text-gray-500">{timeRange}</div>
          </div>
        );
      },
    },
    {
      accessorKey: "priceInCents",
      header: "MONTO",
      cell: ({ row }) => {
        const booking = row.original;
        const price = `S/ ${(booking.priceInCents / 100).toFixed(0)}`;

        return (
          <div>
            <div className="font-medium text-gray-900">{price}</div>
            {booking.isPeakRate && (
              <div className="text-xs text-gray-500">Peak rate</div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "ESTADO",
      cell: ({ row }) => <BookingStatusBadge status={row.original.status} />,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <BookingActionsMenu
          bookingId={row.original.id}
          status={row.original.status}
          onViewDetails={() => {
            // This will be handled by row click
          }}
          onBookingUpdated={onBookingUpdated}
        />
      ),
    },
  ];
}

// Helper functions
function checkStartingSoon(booking: BookingRow): boolean {
  const now = new Date();
  const bookingDate = new Date(booking.date);
  const [hours, minutes] = booking.startTime.split(":").map(Number);

  bookingDate.setHours(hours ?? 0, minutes ?? 0, 0, 0);

  const diffMs = bookingDate.getTime() - now.getTime();
  const diffMinutes = diffMs / (1000 * 60);

  return diffMinutes > 0 && diffMinutes <= 30;
}

function formatBookingDate(date: Date): string {
  const bookingDate = new Date(date);

  if (isToday(bookingDate)) {
    return "Hoy";
  } else if (isTomorrow(bookingDate)) {
    return "Mañana";
  } else if (isYesterday(bookingDate)) {
    return "Ayer";
  }

  return format(bookingDate, "MMM d", { locale: es });
}

function formatTime(time: string): string {
  return time.substring(0, 5);
}
