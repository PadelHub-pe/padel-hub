"use client";

import Link from "next/link";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="bg-primary/10 mb-6 flex h-14 w-14 items-center justify-center rounded-full">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-primary"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold">Algo salió mal</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Ocurrió un error inesperado. Intenta nuevamente.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={reset}
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center rounded-lg px-5 py-2.5 text-sm font-medium transition-colors"
        >
          Reintentar
        </button>
        <Link
          href="/"
          className="border-border text-muted-foreground hover:text-foreground inline-flex items-center rounded-lg border px-5 py-2.5 text-sm font-medium transition-colors"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
