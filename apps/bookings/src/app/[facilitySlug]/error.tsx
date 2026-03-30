"use client";

import { useParams } from "next/navigation";

export default function FacilityError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const params = useParams<{ facilitySlug: string }>();

  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="bg-primary/10 mb-4 flex h-12 w-12 items-center justify-center rounded-full">
        <svg
          width="24"
          height="24"
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
      <h1 className="text-xl font-bold">Algo salió mal</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        No pudimos cargar la información. Intenta nuevamente.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={reset}
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium transition-colors"
        >
          Reintentar
        </button>
        <a
          href={`/${params.facilitySlug}`}
          className="border-border text-muted-foreground hover:text-foreground inline-flex items-center rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
        >
          Volver
        </a>
      </div>
    </div>
  );
}
