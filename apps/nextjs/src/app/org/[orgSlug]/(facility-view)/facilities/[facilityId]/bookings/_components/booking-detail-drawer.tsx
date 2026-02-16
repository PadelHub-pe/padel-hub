"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@wifo/ui/button";
import { toast } from "@wifo/ui/toast";

import { useFacilityContext } from "~/hooks";
import { useTRPC } from "~/trpc/react";
import { BookingStatusBadge } from "./booking-status-badge";
import { CancelBookingDialog } from "./cancel-booking-dialog";
import { CourtBadge } from "./court-badge";
import { PlayerCountBadge } from "./player-count-badge";

interface BookingDetailDrawerProps {
  bookingId: string | null;
  open: boolean;
  onClose: () => void;
  onBookingUpdated: () => void;
}

export function BookingDetailDrawer({
  bookingId,
  open,
  onClose,
  onBookingUpdated,
}: BookingDetailDrawerProps) {
  const trpc = useTRPC();
  const { facilityId, basePath } = useFacilityContext();
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const { data: booking, isLoading } = useQuery({
    ...trpc.booking.getById.queryOptions({ facilityId, id: bookingId ?? "" }),
    enabled: !!bookingId && open,
  });

  const confirmMutation = useMutation(
    trpc.booking.confirm.mutationOptions({
      onSuccess: () => {
        toast.success("Reserva confirmada");
        onBookingUpdated();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  if (!open) return null;

  const handleConfirm = () => {
    if (bookingId) {
      confirmMutation.mutate({ facilityId, id: bookingId });
    }
  };

  const canConfirm = booking?.status === "pending";
  const canCancel = booking?.status === "pending" || booking?.status === "confirmed";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-y-auto bg-white shadow-xl">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b bg-white px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Detalles de reserva
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-gray-100"
          >
            <XIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="space-y-4">
              <div className="h-6 w-32 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-64 animate-pulse rounded bg-gray-200" />
            </div>
          ) : booking ? (
            <div className="space-y-6">
              {/* Booking code and status */}
              <div className="flex items-center justify-between">
                <span className="font-mono text-lg font-semibold text-blue-600">
                  {booking.code}
                </span>
                <BookingStatusBadge status={booking.status} />
              </div>

              {/* Player count */}
              {"playerCount" in booking && (
                <section>
                  <h3 className="text-sm font-medium text-gray-500">Jugadores</h3>
                  <div className="mt-2">
                    <PlayerCountBadge count={(booking as { playerCount: number }).playerCount} />
                  </div>
                </section>
              )}

              {/* Link to full detail page */}
              <Link
                href={`${basePath}/bookings/${booking.id}`}
                className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Ver detalle completo
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>

              {/* Customer info */}
              <section>
                <h3 className="text-sm font-medium text-gray-500">Cliente</h3>
                <div className="mt-2">
                  <p className="font-medium text-gray-900">
                    {booking.user?.name ?? booking.customerName ?? "-"}
                  </p>
                  {(booking.user?.email ?? booking.customerEmail) && (
                    <p className="text-sm text-gray-500">
                      {booking.user?.email ?? booking.customerEmail}
                    </p>
                  )}
                  {booking.customerPhone && (
                    <p className="text-sm text-gray-500">
                      {booking.customerPhone}
                    </p>
                  )}
                </div>
              </section>

              {/* Court */}
              <section>
                <h3 className="text-sm font-medium text-gray-500">Cancha</h3>
                <div className="mt-2">
                  <CourtBadge name={booking.court.name} />
                </div>
              </section>

              {/* Date and time */}
              <section>
                <h3 className="text-sm font-medium text-gray-500">
                  Fecha y hora
                </h3>
                <div className="mt-2">
                  <p className="font-medium text-gray-900">
                    {formatDate(booking.date)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                  </p>
                </div>
              </section>

              {/* Price */}
              <section>
                <h3 className="text-sm font-medium text-gray-500">Monto</h3>
                <div className="mt-2">
                  <p className="text-xl font-semibold text-gray-900">
                    S/ {(booking.priceInCents / 100).toFixed(2)}
                  </p>
                  {booking.isPeakRate && (
                    <p className="text-sm text-amber-600">Tarifa peak</p>
                  )}
                  {booking.paymentMethod && (
                    <p className="text-sm text-gray-500">
                      Metodo: {formatPaymentMethod(booking.paymentMethod)}
                    </p>
                  )}
                </div>
              </section>

              {/* Notes */}
              {booking.notes && (
                <section>
                  <h3 className="text-sm font-medium text-gray-500">Notas</h3>
                  <p className="mt-2 text-gray-900">{booking.notes}</p>
                </section>
              )}

              {/* Cancellation info */}
              {booking.status === "cancelled" && (
                <section className="rounded-lg bg-red-50 p-4">
                  <h3 className="text-sm font-medium text-red-800">
                    Informacion de cancelacion
                  </h3>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-red-700">
                      Cancelado por:{" "}
                      {booking.cancelledBy === "owner"
                        ? "Propietario"
                        : booking.cancelledBy === "user"
                          ? "Cliente"
                          : "Sistema"}
                    </p>
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
                </section>
              )}

              {/* Meta info */}
              <section className="border-t pt-4">
                <div className="space-y-1 text-xs text-gray-400">
                  {booking.isManualBooking && (
                    <p>Reserva manual (walk-in)</p>
                  )}
                  <p>Creado: {formatDateTime(booking.createdAt)}</p>
                  {booking.confirmedAt && (
                    <p>Confirmado: {formatDateTime(booking.confirmedAt)}</p>
                  )}
                </div>
              </section>
            </div>
          ) : (
            <p className="text-gray-500">Reserva no encontrada</p>
          )}
        </div>

        {/* Footer actions */}
        {booking && (canConfirm || canCancel) && (
          <div className="sticky bottom-0 border-t bg-white p-6">
            <div className="flex gap-3">
              {canConfirm && (
                <Button
                  className="flex-1"
                  onClick={handleConfirm}
                  disabled={confirmMutation.isPending}
                >
                  {confirmMutation.isPending ? "Confirmando..." : "Confirmar"}
                </Button>
              )}
              {canCancel && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowCancelDialog(true)}
                >
                  Cancelar reserva
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Cancel dialog */}
      {bookingId && (
        <CancelBookingDialog
          bookingId={bookingId}
          open={showCancelDialog}
          onClose={() => setShowCancelDialog(false)}
          onCancelled={() => {
            onBookingUpdated();
            setShowCancelDialog(false);
          }}
        />
      )}
    </>
  );
}

// Helper functions
function formatDate(date: Date): string {
  return format(new Date(date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
}

function formatTime(time: string): string {
  return time.substring(0, 5); // "HH:mm:ss" -> "HH:mm"
}

function formatDateTime(date: Date): string {
  return format(new Date(date), "d MMM yyyy, HH:mm", { locale: es });
}

function formatPaymentMethod(method: string): string {
  const methods: Record<string, string> = {
    cash: "Efectivo",
    card: "Tarjeta",
    app: "App",
  };
  return methods[method] ?? method;
}

function XIcon({ className }: { className?: string }) {
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
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}
