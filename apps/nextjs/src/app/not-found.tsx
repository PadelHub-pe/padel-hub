import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 px-4 text-center">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white">
        P
      </div>
      <h1 className="text-4xl font-bold text-white">404</h1>
      <p className="mt-2 text-lg text-gray-400">Página no encontrada</p>
      <p className="mt-1 text-sm text-gray-500">
        La página que buscas no existe o fue movida.
      </p>
      <Link
        href="/org"
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Volver al inicio
      </Link>
    </div>
  );
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
      />
    </svg>
  );
}
