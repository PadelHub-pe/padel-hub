import Link from "next/link";
import { useParams } from "next/navigation";

import { Button } from "@wifo/ui/button";

export function FacilityEmptyState() {
  const { orgSlug } = useParams<{ orgSlug: string }>();

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 py-20">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
        <FacilityIcon className="h-7 w-7 text-gray-400" />
      </div>
      <h3 className="mt-5 text-lg font-semibold text-gray-900">
        Aún no tienes locales
      </h3>
      <p className="mt-2 max-w-sm text-center text-sm text-gray-500">
        Agrega tu primer local para comenzar a gestionar canchas, reservas e
        ingresos.
      </p>
      <Button asChild className="mt-6">
        <Link href={`/org/${orgSlug}/facilities/new`}>
          <PlusIcon className="h-4 w-4" />
          Agregar mi primer local
        </Link>
      </Button>
    </div>
  );
}

function FacilityIcon({ className }: { className?: string }) {
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
        d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"
      />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
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
        d="M12 4.5v15m7.5-7.5h-15"
      />
    </svg>
  );
}
