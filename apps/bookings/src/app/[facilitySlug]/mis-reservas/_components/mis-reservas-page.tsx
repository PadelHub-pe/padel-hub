"use client";

import type { TurnstileInstance } from "@marsidev/react-turnstile";
import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { Turnstile } from "@marsidev/react-turnstile";
import { useMutation, useQuery, useSuspenseQuery } from "@tanstack/react-query";

import { Button } from "@wifo/ui/button";
import { Input } from "@wifo/ui/input";
import { Label } from "@wifo/ui/label";

import { env } from "~/env";
import { useTRPC } from "~/trpc/react";
import { OtpInput } from "../../confirm/_components/otp-input";
import { BookingCard } from "./booking-card";

const STORAGE_KEY_PREFIX = "ph-verification-";

function getStoredToken(facilityId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(`${STORAGE_KEY_PREFIX}${facilityId}`);
  } catch {
    return null;
  }
}

function storeToken(facilityId: string, token: string) {
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${facilityId}`, token);
  } catch {
    // localStorage may not be available
  }
}

function clearToken(facilityId: string) {
  try {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${facilityId}`);
  } catch {
    // localStorage may not be available
  }
}

type Step = "contact" | "otp" | "verified";

interface MisReservasPageProps {
  facilitySlug: string;
}

export function MisReservasPage({ facilitySlug }: MisReservasPageProps) {
  const trpc = useTRPC();
  const { data: facility } = useSuspenseQuery(
    trpc.publicBooking.getFacility.queryOptions({ slug: facilitySlug }),
  );

  // OTP channel (from server config)
  const otpChannel = facility.otpChannel;
  const isEmailOtp = otpChannel === "email";

  // Check for existing token
  const [token, setToken] = useState<string | null>(() =>
    getStoredToken(facility.id),
  );
  const [step, setStep] = useState<Step>(() =>
    token ? "verified" : "contact",
  );
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState("");
  const [otpError, setOtpError] = useState("");

  // Turnstile
  const turnstileRef = useRef<TurnstileInstance>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileSiteKey = env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  const handleTurnstileSuccess = useCallback((token: string) => {
    setTurnstileToken(token);
  }, []);

  // Mutations
  const sendOtpMutation = useMutation(
    trpc.publicBooking.sendOtp.mutationOptions(),
  );
  const verifyOtpMutation = useMutation(
    trpc.publicBooking.verifyOtp.mutationOptions(),
  );

  async function handleSendOtp() {
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

      storeToken(facility.id, result.token);
      setToken(result.token);
      setStep("verified");
    } catch (e) {
      setOtpError(
        e instanceof Error ? e.message : "Error al verificar el código",
      );
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

  function handleLogout() {
    clearToken(facility.id);
    setToken(null);
    setStep("contact");
    setIdentifier("");
    setError("");
    setOtpError("");
  }

  function handleTokenExpired() {
    clearToken(facility.id);
    setToken(null);
    setStep("contact");
  }

  return (
    <main className="container pb-8">
      {/* Back link */}
      <Link
        href={`/${facilitySlug}`}
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
        {facility.name}
      </Link>

      <h1 className="font-display mt-4 text-xl font-bold">Mis Reservas</h1>

      {/* Contact verification */}
      {step === "contact" && (
        <div className="mt-6 space-y-4">
          <p className="text-muted-foreground text-sm">
            Ingresa tu{" "}
            {isEmailOtp ? "correo electrónico" : "número de teléfono"} para ver
            tus reservas en <span className="font-medium">{facility.name}</span>
            .
          </p>

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

      {/* OTP step */}
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
            disabled={verifyOtpMutation.isPending}
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

      {/* Verified — booking list */}
      {step === "verified" && token && (
        <VerifiedView
          facilitySlug={facilitySlug}
          facilityId={facility.id}
          facilityName={facility.name}
          token={token}
          isEmailOtp={isEmailOtp}
          onLogout={handleLogout}
          onTokenExpired={handleTokenExpired}
        />
      )}

      {/* Turnstile invisible widget */}
      {turnstileSiteKey && step !== "verified" && (
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

interface VerifiedViewProps {
  facilitySlug: string;
  facilityId: string;
  facilityName: string;
  token: string;
  isEmailOtp: boolean;
  onLogout: () => void;
  onTokenExpired: () => void;
}

function VerifiedView({
  facilitySlug,
  facilityId,
  facilityName,
  token,
  isEmailOtp,
  onLogout,
  onTokenExpired,
}: VerifiedViewProps) {
  const trpc = useTRPC();

  const bookingsQuery = useQuery(
    trpc.publicBooking.getMyBookings.queryOptions({
      facilityId,
      verificationToken: token,
    }),
  );

  const cancelMutation = useMutation(
    trpc.publicBooking.cancelBooking.mutationOptions({
      onSuccess: () => {
        void bookingsQuery.refetch();
      },
    }),
  );

  // Handle token expiry (UNAUTHORIZED error)
  if (bookingsQuery.error) {
    const errorMessage = bookingsQuery.error.message;
    if (errorMessage.includes("Verificación requerida")) {
      onTokenExpired();
      return null;
    }
  }

  // Loading
  if (bookingsQuery.isLoading) {
    return (
      <div className="mt-6 space-y-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div
            key={i}
            className="bg-muted/50 h-28 animate-pulse rounded-lg border"
          />
        ))}
      </div>
    );
  }

  // Error
  if (bookingsQuery.error) {
    return (
      <div className="mt-6 text-center">
        <p className="text-sm text-red-500">
          Error al cargar tus reservas. Intenta de nuevo.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => void bookingsQuery.refetch()}
        >
          Reintentar
        </Button>
      </div>
    );
  }

  const bookings = bookingsQuery.data?.bookings ?? [];

  // Split into upcoming and past
  const upcoming = bookings.filter(
    (b) => b.status === "confirmed" || b.status === "in_progress",
  );
  const past = bookings.filter(
    (b) => b.status !== "confirmed" && b.status !== "in_progress",
  );

  // Sort upcoming by date ASC (soonest first)
  upcoming.sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    if (dateA !== dateB) return dateA - dateB;
    return a.startTime.localeCompare(b.startTime);
  });

  async function handleCancel(bookingId: string) {
    await cancelMutation.mutateAsync({
      bookingId,
      verificationToken: token,
    });
  }

  return (
    <div className="mt-4">
      {/* Logout link */}
      <div className="flex items-center justify-end">
        <button
          onClick={onLogout}
          className="text-muted-foreground text-xs underline"
        >
          {isEmailOtp ? "Cambiar correo" : "Cambiar número"}
        </button>
      </div>

      {/* Empty state */}
      {bookings.length === 0 && (
        <div className="mt-8 flex flex-col items-center text-center">
          <div className="bg-muted/50 flex h-16 w-16 items-center justify-center rounded-full">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>

          <h2 className="font-display mt-4 text-lg font-semibold">
            Sin reservas
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Aún no tienes reservas en {facilityName}.
          </p>

          <Button asChild className="mt-6" size="lg">
            <Link href={`/${facilitySlug}`}>Reservar cancha</Link>
          </Button>
        </div>
      )}

      {/* Upcoming bookings */}
      {upcoming.length > 0 && (
        <div className="mt-4">
          <h2 className="text-sm font-semibold">Próximas</h2>
          <div className="mt-2 space-y-3">
            {upcoming.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                canCancel={booking.status === "confirmed"}
                onCancel={handleCancel}
                isCancelling={
                  cancelMutation.isPending &&
                  cancelMutation.variables.bookingId === booking.id
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* Past bookings */}
      {past.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold">Anteriores</h2>
          <div className="mt-2 space-y-3">
            {past.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                canCancel={false}
                onCancel={handleCancel}
                isCancelling={false}
              />
            ))}
          </div>
        </div>
      )}

      {/* CTA to book more */}
      {bookings.length > 0 && (
        <div className="mt-6">
          <Button asChild variant="outline" className="w-full">
            <Link href={`/${facilitySlug}`}>Hacer otra reserva</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
