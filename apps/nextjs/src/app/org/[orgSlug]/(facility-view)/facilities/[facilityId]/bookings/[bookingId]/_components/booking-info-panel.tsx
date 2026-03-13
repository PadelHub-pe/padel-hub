import { differenceInMinutes, format, parse } from "date-fns";
import { es } from "date-fns/locale";

import { Badge } from "@wifo/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@wifo/ui/card";

interface BookingInfoPanelProps {
  booking: {
    date: Date;
    startTime: string;
    endTime: string;
    code: string;
    priceInCents: number;
    isPeakRate: boolean;
    paymentMethod: string | null;
    isManualBooking: boolean;
    confirmedAt: Date | null;
    createdAt: Date;
    court: {
      name: string;
      type: "indoor" | "outdoor";
    };
    customerName: string | null;
    customerEmail: string | null;
    customerPhone: string | null;
    user: { name: string; email: string } | null;
    status: string;
    cancelledBy: string | null;
    cancellationReason: string | null;
    cancelledAt: Date | null;
    notes: string | null;
  };
}

const courtTypeLabels: Record<string, string> = {
  indoor: "Indoor",
  outdoor: "Outdoor",
};

const paymentMethodLabels: Record<string, string> = {
  cash: "Efectivo",
  card: "Tarjeta",
  app: "App",
};

const cancelledByLabels: Record<string, string> = {
  owner: "Propietario",
  user: "Cliente",
  system: "Sistema",
};

function formatDate(date: Date): string {
  return format(new Date(date), "EEEE, d 'de' MMMM 'de' yyyy", {
    locale: es,
  });
}

function formatTime(time: string): string {
  return time.substring(0, 5);
}

function formatDateTime(date: Date): string {
  return format(new Date(date), "d MMM yyyy, HH:mm", { locale: es });
}

function calculateDurationMinutes(startTime: string, endTime: string): number {
  const refDate = new Date(2000, 0, 1);
  const start = parse(startTime.substring(0, 5), "HH:mm", refDate);
  const end = parse(endTime.substring(0, 5), "HH:mm", refDate);
  return differenceInMinutes(end, start);
}

export function BookingInfoPanel({ booking }: BookingInfoPanelProps) {
  const durationMinutes = calculateDurationMinutes(
    booking.startTime,
    booking.endTime,
  );

  return (
    <div className="space-y-4">
      {/* Card 1: Detalles de reserva */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Detalles de reserva
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Código */}
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">Código</p>
              <p className="font-mono text-sm font-semibold text-blue-600">
                {booking.code}
              </p>
            </div>

            {/* Fecha */}
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">Fecha</p>
              <p className="text-sm text-gray-900">
                {formatDate(booking.date)}
              </p>
            </div>

            {/* Horario */}
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">Horario</p>
              <p className="text-sm text-gray-900">
                {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
              </p>
            </div>

            {/* Duración */}
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">Duración</p>
              <p className="text-sm text-gray-900">{durationMinutes} minutos</p>
            </div>

            {/* Cancha */}
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">Cancha</p>
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-900">{booking.court.name}</p>
                <Badge variant="secondary" className="text-xs">
                  {courtTypeLabels[booking.court.type] ?? booking.court.type}
                </Badge>
              </div>
            </div>

            {/* Reservado el */}
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">Reservado el</p>
              <p className="text-sm text-gray-900">
                {formatDateTime(booking.createdAt)}
              </p>
            </div>

            {/* Reserva manual */}
            {booking.isManualBooking && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Tipo</p>
                <Badge variant="secondary">Reserva manual</Badge>
              </div>
            )}

            {/* Confirmado el */}
            {booking.confirmedAt && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">
                  Confirmado el
                </p>
                <p className="text-sm text-gray-900">
                  {formatDateTime(booking.confirmedAt)}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Resumen de pago */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Resumen de pago
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-2xl font-semibold text-gray-900">
              S/ {(booking.priceInCents / 100).toFixed(2)}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              {booking.isPeakRate && (
                <Badge variant="warning">Hora punta</Badge>
              )}

              {booking.paymentMethod && (
                <Badge variant="secondary">
                  {paymentMethodLabels[booking.paymentMethod] ??
                    booking.paymentMethod}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cancellation info */}
      {booking.status === "cancelled" && (
        <div className="rounded-lg bg-red-50 p-4">
          <h3 className="text-sm font-medium text-red-800">
            Información de cancelación
          </h3>
          <div className="mt-2 space-y-1">
            {booking.cancelledBy && (
              <p className="text-sm text-red-700">
                Cancelado por:{" "}
                {cancelledByLabels[booking.cancelledBy] ?? booking.cancelledBy}
              </p>
            )}
            {booking.cancellationReason && (
              <p className="text-sm text-red-700">
                Motivo: {booking.cancellationReason}
              </p>
            )}
            {booking.cancelledAt && (
              <p className="text-sm text-red-600">
                {formatDateTime(booking.cancelledAt)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Notes */}
      {booking.notes && (
        <div className="rounded-lg bg-gray-50 p-4">
          <h3 className="text-sm font-medium text-gray-500">Notas</h3>
          <p className="mt-2 text-sm text-gray-900">{booking.notes}</p>
        </div>
      )}
    </div>
  );
}
