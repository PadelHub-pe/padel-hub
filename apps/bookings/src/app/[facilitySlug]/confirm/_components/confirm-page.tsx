"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

import { Button } from "@wifo/ui/button";
import { Input } from "@wifo/ui/input";
import { Label } from "@wifo/ui/label";

import { useTRPC } from "~/trpc/react";
import { BookingSummary } from "./booking-summary";
import { OtpInput } from "./otp-input";

type Step = "contact" | "otp" | "confirming";

interface ConfirmPageProps {
  facilitySlug: string;
}

export function ConfirmPage({ facilitySlug }: ConfirmPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const trpc = useTRPC();

  // Parse query params
  const courtId = searchParams.get("courtId") ?? "";
  const dateParam = searchParams.get("date") ?? "";
  const startTime = searchParams.get("start") ?? "";
  const endTime = searchParams.get("end") ?? "";

  const date = useMemo(() => {
    try {
      return parseISO(dateParam);
    } catch {
      return new Date();
    }
  }, [dateParam]);

  const formattedDate = format(date, "EEEE d 'de' MMMM", { locale: es });

  // Fetch facility for court info
  const { data: facility } = useSuspenseQuery(
    trpc.publicBooking.getFacility.queryOptions({ slug: facilitySlug }),
  );

  const court = facility.courts.find((c) => c.id === courtId);

  // Fetch price
  const { data: priceData } = useSuspenseQuery(
    trpc.publicBooking.calculatePrice.queryOptions({
      facilityId: facility.id,
      courtId,
      date,
      startTime,
      endTime,
    }),
  );

  // Form state
  const [step, setStep] = useState<Step>("contact");
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [otpError, setOtpError] = useState("");

  // Mutations
  const sendOtpMutation = useMutation(
    trpc.publicBooking.sendOtp.mutationOptions(),
  );

  const verifyOtpMutation = useMutation(
    trpc.publicBooking.verifyOtp.mutationOptions(),
  );

  const createBookingMutation = useMutation(
    trpc.publicBooking.createBooking.mutationOptions(),
  );

  async function handleSendOtp() {
    if (!customerName.trim()) {
      setError("Ingresa tu nombre");
      return;
    }
    if (!phone.trim() || phone.length < 9) {
      setError("Ingresa un número de teléfono válido");
      return;
    }

    setError("");
    try {
      await sendOtpMutation.mutateAsync({ phone: phone.replace(/\D/g, "") });
      setStep("otp");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al enviar el código");
    }
  }

  async function handleVerifyOtp(code: string) {
    setOtpError("");
    try {
      const result = await verifyOtpMutation.mutateAsync({
        phone: phone.replace(/\D/g, ""),
        code,
      });

      if (!result.verified) {
        setOtpError("Código incorrecto. Intenta de nuevo.");
        return;
      }

      // OTP verified — create booking
      setStep("confirming");

      const booking = await createBookingMutation.mutateAsync({
        facilityId: facility.id,
        courtId,
        date,
        startTime,
        endTime,
        customerName: customerName.trim(),
        verificationToken: result.token,
      });

      if (booking) {
        // Store booking data for success page
        try {
          sessionStorage.setItem(
            `booking-${booking.code}`,
            JSON.stringify({
              code: booking.code,
              courtName: court?.name ?? "",
              courtType: court?.type ?? "indoor",
              date: dateParam,
              startTime,
              endTime,
              priceInCents: booking.priceInCents,
              isPeakRate: booking.isPeakRate,
              facilityName: facility.name,
              customerName: customerName.trim(),
            }),
          );
        } catch {
          // sessionStorage may not be available
        }

        router.push(`/${facilitySlug}/success?code=${booking.code}`);
      }
    } catch (e) {
      setOtpError(e instanceof Error ? e.message : "Error al crear la reserva");
      setStep("otp");
    }
  }

  async function handleResendOtp() {
    setOtpError("");
    try {
      await sendOtpMutation.mutateAsync({ phone: phone.replace(/\D/g, "") });
    } catch (e) {
      setOtpError(
        e instanceof Error ? e.message : "Error al reenviar el código",
      );
    }
  }

  // Missing params → redirect back
  if (!courtId || !dateParam || !startTime || !endTime || !court) {
    return (
      <main className="container flex min-h-[60vh] flex-col items-center justify-center text-center">
        <p className="text-muted-foreground text-sm">
          Selecciona un horario primero.
        </p>
        <Button asChild variant="outline" className="mt-4" size="sm">
          <Link href={`/${facilitySlug}`}>Volver</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="container pb-8">
      {/* Back link */}
      <Link
        href={`/${facilitySlug}/book?date=${dateParam}`}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className="shrink-0"
        >
          <path
            d="M10 12L6 8l4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Volver
      </Link>

      <h1 className="font-display mt-4 text-xl font-bold">Confirmar reserva</h1>

      {/* Booking summary */}
      <div className="mt-4">
        <BookingSummary
          courtName={court.name}
          courtType={court.type}
          date={dateParam}
          startTime={startTime}
          endTime={endTime}
          priceInCents={priceData.priceInCents}
          isPeakRate={priceData.isPeakRate}
          formattedDate={formattedDate}
        />
      </div>

      {/* Contact form */}
      {step === "contact" && (
        <div className="mt-6 space-y-4">
          <div>
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              placeholder="Tu nombre completo"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="mt-1"
              autoComplete="name"
            />
          </div>

          <div>
            <Label htmlFor="phone">Teléfono (WhatsApp)</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="987654321"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1"
              autoComplete="tel"
              inputMode="tel"
            />
            <p className="text-muted-foreground mt-1 text-xs">
              Te enviaremos un código de verificación por WhatsApp.
            </p>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button
            className="w-full"
            size="lg"
            onClick={handleSendOtp}
            disabled={sendOtpMutation.isPending}
          >
            {sendOtpMutation.isPending
              ? "Enviando código..."
              : "Verificar teléfono"}
          </Button>
        </div>
      )}

      {/* OTP verification */}
      {step === "otp" && (
        <div className="mt-6 space-y-4">
          <div className="text-center">
            <p className="text-sm">
              Ingresa el código que enviamos a{" "}
              <span className="font-medium">{phone}</span>
            </p>
          </div>

          <OtpInput
            onComplete={handleVerifyOtp}
            disabled={
              verifyOtpMutation.isPending || createBookingMutation.isPending
            }
            error={!!otpError}
          />

          {otpError && (
            <p className="text-center text-sm text-red-500">{otpError}</p>
          )}

          <div className="flex flex-col items-center gap-2">
            <button
              onClick={handleResendOtp}
              disabled={sendOtpMutation.isPending}
              className="text-primary text-sm underline disabled:opacity-50"
            >
              {sendOtpMutation.isPending ? "Reenviando..." : "Reenviar código"}
            </button>

            <button
              onClick={() => setStep("contact")}
              className="text-muted-foreground text-xs underline"
            >
              Cambiar número
            </button>
          </div>
        </div>
      )}

      {/* Confirming state */}
      {step === "confirming" && (
        <div className="mt-6 flex flex-col items-center gap-3 py-8">
          <div className="border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
          <p className="text-muted-foreground text-sm">Creando tu reserva...</p>
        </div>
      )}
    </main>
  );
}
