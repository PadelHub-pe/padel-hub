"use client";

import Image from "next/image";
import Link from "next/link";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 px-4 text-center">
      <Image
        src="/images/logomark-reversed.svg"
        alt="PadelHub"
        width={56}
        height={56}
        className="mb-6 h-14 w-auto"
      />
      <h1 className="text-4xl font-bold text-white">Algo salió mal</h1>
      <p className="mt-2 text-lg text-gray-400">
        Ocurrió un error inesperado. Intenta nuevamente.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          Reintentar
        </button>
        <Link
          href="/org"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-600 px-5 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:border-gray-500 hover:text-white"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
