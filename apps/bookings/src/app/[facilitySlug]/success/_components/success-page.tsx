"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { formatLimaDate, parseLimaDateParam } from "@wifo/api/datetime";
import { Badge } from "@wifo/ui/badge";
import { Button } from "@wifo/ui/button";
import { Separator } from "@wifo/ui/separator";

import { CalendarLink } from "./calendar-link";

interface BookingData {
  code: string;
  courtName: string;
  courtType: "indoor" | "outdoor";
  date: string;
  startTime: string;
  endTime: string;
  priceInCents: number;
  isPeakRate: boolean;
  facilityName: string;
  customerName: string;
}

function readBookingFromStorage(code: string): BookingData | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = sessionStorage.getItem(`booking-${code}`);
    if (stored) {
      sessionStorage.removeItem(`booking-${code}`);
      return JSON.parse(stored) as BookingData;
    }
  } catch {
    // sessionStorage may not be available
  }
  return null;
}

interface SuccessPageProps {
  facilitySlug: string;
}

export function SuccessPage({ facilitySlug }: SuccessPageProps) {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  // Read booking data from sessionStorage once on mount
  const [booking] = useState<BookingData | null>(() =>
    code ? readBookingFromStorage(code) : null,
  );

  if (!code) {
    return (
      <main className="container flex min-h-[60vh] flex-col items-center justify-center text-center">
        <p className="text-muted-foreground text-sm">
          No se encontró información de la reserva.
        </p>
        <Button asChild variant="outline" className="mt-4" size="sm">
          <Link href={`/${facilitySlug}`}>Volver al inicio</Link>
        </Button>
      </main>
    );
  }

  // booking.date is "YYYY-MM-DD" (Lima calendar day) — render in Lima TZ.
  const formattedDate =
    booking && /^\d{4}-\d{2}-\d{2}/.test(booking.date)
      ? formatLimaDate(
          parseLimaDateParam(booking.date.slice(0, 10)),
          "EEEE d 'de' MMMM",
        )
      : "";

  return (
    <main className="container pb-8">
      {/* Success icon */}
      <div className="mt-8 flex flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-green-600 dark:text-green-400"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h1 className="font-display mt-4 text-2xl font-bold">
          Reserva confirmada
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Tu cancha está reservada. Guarda el código de tu reserva.
        </p>
      </div>

      {/* Booking code */}
      <div className="bg-muted/50 mt-6 rounded-lg border p-4 text-center">
        <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
          Código de reserva
        </p>
        <p className="mt-1 font-mono text-2xl font-bold tracking-wider">
          {code}
        </p>
      </div>

      {/* Booking details */}
      {booking ? (
        <div className="mt-4 rounded-lg border p-4">
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Local</span>
              <span className="font-medium">{booking.facilityName}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Cancha</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">{booking.courtName}</span>
                <Badge variant="outline" className="text-xs capitalize">
                  {booking.courtType}
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Fecha</span>
              <span className="font-medium capitalize">{formattedDate}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Horario</span>
              <span className="font-medium">
                {booking.startTime} – {booking.endTime}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Jugador</span>
              <span className="font-medium">{booking.customerName}</span>
            </div>

            <Separator className="my-2" />

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total</span>
              <span className="text-base font-bold">
                S/ {(booking.priceInCents / 100).toFixed(0)}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-muted-foreground mt-4 text-center text-sm">
          Para ver los detalles de tu reserva, visita &quot;Mis Reservas&quot;.
        </p>
      )}

      {/* Actions */}
      <div className="mt-6 space-y-3">
        {booking && (
          <CalendarLink
            facilityName={booking.facilityName}
            courtName={booking.courtName}
            date={booking.date}
            startTime={booking.startTime}
            endTime={booking.endTime}
          />
        )}

        <Button asChild variant="outline" className="w-full">
          <Link href={`/${facilitySlug}/mis-reservas`}>Ver mis reservas</Link>
        </Button>

        <Button asChild variant="ghost" className="w-full">
          <Link href={`/${facilitySlug}`}>Hacer otra reserva</Link>
        </Button>
      </div>
    </main>
  );
}
