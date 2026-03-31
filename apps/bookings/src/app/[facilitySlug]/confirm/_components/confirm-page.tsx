"use client";

import type { TurnstileInstance } from "@marsidev/react-turnstile";
import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Turnstile } from "@marsidev/react-turnstile";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

import { Button } from "@wifo/ui/button";
import { Input } from "@wifo/ui/input";
import { Label } from "@wifo/ui/label";

import { env } from "~/env";
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
  const queryClient = useQueryClient();

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

  // Turnstile
  const turnstileRef = useRef<TurnstileInstance>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileSiteKey = env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  const handleTurnstileSuccess = useCallback((token: string) => {
    setTurnstileToken(token);
  }, []);

  // OTP channel (from server config)
  const otpChannel = facility.otpChannel;
  const isEmailOtp = otpChannel === "email";

  // Form state
  const [step, setStep] = useState<Step>("contact");
  const [customerName, setCustomerName] = useState("");
  const [identifier, setIdentifier] = useState("");
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

    // Validate identifier based on channel
    const cleanIdentifier = isEmailOtp
      ? identifier.trim()
      : identifier.replace(/\D/g, "");

    if (isEmailOtp) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanIdentifier)) {
        setError("Ingresa un correo electrónico válido");
        return;
      }
    } else {
      if (!/^\d{7,15}$/.test(cleanIdentifier)) {
        setError("Ingresa un número de teléfono válido");
        return;
      }
    }

    if (turnstileSiteKey && !turnstileToken) {
      setError("Espera a que se complete la verificación de seguridad");
      return;
    }

    setError("");
    try {
      await sendOtpMutation.mutateAsync({
        identifier: cleanIdentifier,
        turnstileToken: turnstileToken || "dev-bypass",
      });
      // Reset Turnstile for the next use (createBooking)
      turnstileRef.current?.reset();
      setTurnstileToken("");
      setStep("otp");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al enviar el código");
      turnstileRef.current?.reset();
      setTurnstileToken("");
    }
  }

  async function handleVerifyOtp(code: string) {
    setOtpError("");
    const cleanIdentifier = isEmailOtp
      ? identifier.trim()
      : identifier.replace(/\D/g, "");
    try {
      const result = await verifyOtpMutation.mutateAsync({
        identifier: cleanIdentifier,
        code,
      });

      if (!result.verified) {
        setOtpError("Código incorrecto. Intenta de nuevo.");
        return;
      }

      // Wait for Turnstile token if not ready yet
      if (turnstileSiteKey && !turnstileToken) {
        setOtpError(
          "Espera a que se complete la verificación de seguridad e intenta de nuevo.",
        );
        return;
      }

      // Re-validate slot availability before booking
      setStep("confirming");
      const freshSlots = await queryClient.fetchQuery(
        trpc.publicBooking.getAvailableSlots.queryOptions({
          slug: facilitySlug,
          date,
        }),
      );
      const slotStillAvailable = freshSlots.slots.some(
        (s) =>
          s.courtId === courtId &&
          s.startTime === startTime &&
          s.endTime === endTime,
      );
      if (!slotStillAvailable) {
        setOtpError("Este horario ya no está disponible. Selecciona otro.");
        setStep("otp");
        return;
      }

      // Create booking
      const booking = await createBookingMutation.mutateAsync({
        facilityId: facility.id,
        courtId,
        date,
        startTime,
        endTime,
        customerName: customerName.trim(),
        verificationToken: result.token,
        turnstileToken: turnstileToken || "dev-bypass",
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
      turnstileRef.current?.reset();
      setTurnstileToken("");
    }
  }

  async function handleResendOtp() {
    setOtpError("");
    const cleanIdentifier = isEmailOtp
      ? identifier.trim()
      : identifier.replace(/\D/g, "");
    try {
      await sendOtpMutation.mutateAsync({
        identifier: cleanIdentifier,
        turnstileToken: turnstileToken || "dev-bypass",
      });
      turnstileRef.current?.reset();
      setTurnstileToken("");
    } catch (e) {
      setOtpError(
        e instanceof Error ? e.message : "Error al reenviar el código",
      );
      turnstileRef.current?.reset();
      setTurnstileToken("");
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
            <Label htmlFor="identifier">
              {isEmailOtp ? "Correo electrónico" : "Teléfono (WhatsApp)"}
            </Label>
            <Input
              id="identifier"
              type={isEmailOtp ? "email" : "tel"}
              placeholder={isEmailOtp ? "tu@email.com" : "987654321"}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="mt-1"
              autoComplete={isEmailOtp ? "email" : "tel"}
              inputMode={isEmailOtp ? "email" : "tel"}
              maxLength={isEmailOtp ? 255 : 15}
            />
            <p className="text-muted-foreground mt-1 text-xs">
              {isEmailOtp
                ? "Te enviaremos un código de verificación por correo electrónico."
                : "Te enviaremos un código de verificación por WhatsApp."}
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
              : isEmailOtp
                ? "Verificar correo"
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
              <span className="font-medium">{identifier}</span>
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
              {isEmailOtp ? "Cambiar correo" : "Cambiar número"}
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

      {/* Turnstile invisible widget */}
      {turnstileSiteKey && (
        <Turnstile
          ref={turnstileRef}
          siteKey={turnstileSiteKey}
          onSuccess={handleTurnstileSuccess}
          options={{ size: "invisible" }}
        />
      )}
    </main>
  );
}
