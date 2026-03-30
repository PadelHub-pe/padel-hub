"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";

import { Button } from "@wifo/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@wifo/ui/card";

import { useTRPC } from "~/trpc/react";

export default function RegisterCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="text-center">
            <LoadingSpinner className="mx-auto h-8 w-8 text-blue-600" />
            <p className="mt-4 text-sm text-gray-600">
              Procesando tu invitación...
            </p>
          </div>
        </div>
      }
    >
      <RegisterCallbackContent />
    </Suspense>
  );
}

function RegisterCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const trpc = useTRPC();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);
  const didRun = useRef(false);

  const acceptExisting = useMutation(
    trpc.invite.acceptExisting.mutationOptions({}),
  );

  useEffect(() => {
    // Prevent double-run in strict mode
    if (didRun.current) return;
    didRun.current = true;

    async function processInvite() {
      // Try sessionStorage first (Google OAuth flow), then URL param
      const token =
        sessionStorage.getItem("invite_token") ??
        searchParams.get("invite_token");

      if (!token) {
        setError("No se encontró el token de invitación.");
        setProcessing(false);
        return;
      }

      // Clean up sessionStorage
      sessionStorage.removeItem("invite_token");

      try {
        const result = await acceptExisting.mutateAsync({ token });
        if (result.success) {
          router.replace("/org");
        }
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Error al aceptar la invitación.";
        setError(message);
        setProcessing(false);
      }
    }

    void processInvite();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (processing && !error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner className="mx-auto h-8 w-8 text-blue-600" />
          <p className="mt-4 text-sm text-gray-600">
            Procesando tu invitación...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertIcon className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl">
            Error al procesar invitación
          </CardTitle>
          <CardDescription className="mt-2">{error}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">Ir a iniciar sesión</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
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
        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
      />
    </svg>
  );
}
