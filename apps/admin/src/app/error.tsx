"use client";

import { useEffect } from "react";

import { Button } from "@wifo/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Algo salió mal</h1>
        <p className="mt-2 text-sm text-gray-600">
          Ocurrió un error inesperado.
        </p>
        <Button onClick={reset} className="mt-4">
          Intentar de nuevo
        </Button>
      </div>
    </div>
  );
}
