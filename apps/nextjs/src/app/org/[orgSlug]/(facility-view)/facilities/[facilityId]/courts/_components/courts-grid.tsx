"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { Button } from "@wifo/ui/button";

import { CourtCard } from "./court-card";

interface CourtsGridProps {
  courts: {
    id: string;
    name: string;
    type: "indoor" | "outdoor";
    status: "active" | "maintenance" | "inactive";
    description: string | null;
    priceInCents: number | null;
    imageUrl: string | null;
    todayBookings: number;
  }[];
}

export function CourtsGrid({ courts }: CourtsGridProps) {
  if (courts.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {courts.map((court) => (
        <CourtCard key={court.id} court={court} />
      ))}
    </div>
  );
}

function EmptyState() {
  const params = useParams();
  const orgSlug = params.orgSlug as string;
  const facilityId = params.facilityId as string;

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 py-16">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
        <CourtIcon className="h-6 w-6 text-gray-400" />
      </div>
      <h3 className="mt-4 text-lg font-medium text-gray-900">No hay canchas</h3>
      <p className="mt-1 text-sm text-gray-500">
        Comienza agregando tu primera cancha de padel.
      </p>
      <Button asChild className="mt-4">
        <Link href={`/org/${orgSlug}/facilities/${facilityId}/courts/new`}>
          <PlusIcon className="h-4 w-4" />
          Agregar Cancha
        </Link>
      </Button>
    </div>
  );
}

function CourtIcon({ className }: { className?: string }) {
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
        d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
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
