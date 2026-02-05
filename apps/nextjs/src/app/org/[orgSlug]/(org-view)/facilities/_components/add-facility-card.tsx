"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

export function AddFacilityCard() {
  const params = useParams();
  const orgSlug = params.orgSlug as string;

  return (
    <Link
      href={`/org/${orgSlug}/facilities/new`}
      className="flex min-h-80 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white p-6 transition-colors hover:border-blue-400 hover:bg-blue-50"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
        <PlusIcon className="h-6 w-6 text-blue-600" />
      </div>
      <p className="mt-4 text-sm font-medium text-gray-900">
        Agregar Nuevo Local
      </p>
      <p className="mt-1 text-center text-xs text-gray-500">
        Crea un nuevo local para tu organización
      </p>
    </Link>
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
