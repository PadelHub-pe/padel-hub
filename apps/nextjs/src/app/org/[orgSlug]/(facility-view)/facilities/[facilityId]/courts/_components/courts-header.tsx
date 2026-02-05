"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { Button } from "@wifo/ui/button";

export function CourtsHeader() {
  const params = useParams();
  const orgSlug = params.orgSlug as string;
  const facilityId = params.facilityId as string;

  return (
    <header className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Canchas</h1>
        <p className="mt-1 text-sm text-gray-500">
          Administra las canchas de padel de tu local
        </p>
      </div>
      <Button asChild>
        <Link href={`/org/${orgSlug}/facilities/${facilityId}/courts/new`}>
          <PlusIcon className="h-4 w-4" />
          Agregar Cancha
        </Link>
      </Button>
    </header>
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
