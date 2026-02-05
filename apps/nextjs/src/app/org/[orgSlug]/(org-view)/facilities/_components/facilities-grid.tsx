import { FacilityCard } from "./facility-card";

interface Facility {
  id: string;
  name: string;
  address: string;
  district: string;
  phone: string;
  isActive: boolean;
  photos: string[];
  courtCount: number;
  indoorCount: number;
  outdoorCount: number;
  todayBookings: number;
  monthRevenue: number;
  utilization: number;
}

interface FacilitiesGridProps {
  facilities: Facility[];
  isLoading: boolean;
  addFacilityCard: React.ReactNode;
}

export function FacilitiesGrid({
  facilities,
  isLoading,
  addFacilityCard,
}: FacilitiesGridProps) {
  if (isLoading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-80 animate-pulse rounded-lg bg-gray-200"
          />
        ))}
      </div>
    );
  }

  if (facilities.length === 0) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {addFacilityCard}
        <div className="col-span-full flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 py-12 sm:col-span-1 lg:col-span-2">
          <EmptyIcon className="h-12 w-12 text-gray-300" />
          <p className="mt-4 text-sm text-gray-500">
            No se encontraron locales
          </p>
          <p className="text-xs text-gray-400">
            Intenta ajustar los filtros o agrega un nuevo local
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {facilities.map((facility) => (
        <FacilityCard key={facility.id} facility={facility} />
      ))}
      {addFacilityCard}
    </div>
  );
}

function EmptyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"
      />
    </svg>
  );
}
